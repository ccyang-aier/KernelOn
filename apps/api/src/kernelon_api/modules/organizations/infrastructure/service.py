"""Transactional organization and RBAC service."""

from __future__ import annotations

from typing import Any
from uuid import UUID  # noqa: TC003

from sqlalchemy import delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession  # noqa: TC002

from kernelon_api.modules.identity.domain import normalize_email
from kernelon_api.modules.identity.infrastructure.models import UserModel
from kernelon_api.modules.identity.infrastructure.service import SQLAlchemyIdentityService
from kernelon_api.modules.organizations.domain import (
    ALL_PERMISSIONS,
    Principal,
    ensure_assignable_permissions,
)
from kernelon_api.modules.organizations.infrastructure.models import (
    GroupModel,
    GroupRoleModel,
    MembershipGroupModel,
    MembershipModel,
    MembershipRoleModel,
    OrganizationModel,
    RoleModel,
    RolePermissionModel,
)
from kernelon_api.platform.application_errors import ApplicationError


class SQLAlchemyOrganizationService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_current_profile(self, user_id: UUID) -> dict[str, Any]:
        result = await self.session.execute(
            select(MembershipModel, OrganizationModel)
            .join(
                OrganizationModel,
                OrganizationModel.id == MembershipModel.organization_id,
            )
            .where(MembershipModel.user_id == user_id, MembershipModel.status == "active")
            .order_by(MembershipModel.joined_at)
            .limit(1)
        )
        row = result.first()
        if row is None:
            return {
                "departmentName": None,
                "employeeNo": None,
                "jobTitle": None,
                "joinedAt": None,
                "mentorName": None,
                "organizationName": None,
            }

        membership, organization = row
        groups = (
            await self.session.scalars(
                select(GroupModel)
                .join(MembershipGroupModel, MembershipGroupModel.group_id == GroupModel.id)
                .where(
                    MembershipGroupModel.membership_id == membership.id,
                    GroupModel.status == "active",
                )
                .order_by(GroupModel.name)
            )
        ).all()
        department = next((group.name for group in groups if group.kind == "department"), None)
        return {
            "departmentName": department or organization.name,
            "employeeNo": membership.employee_no,
            "jobTitle": membership.job_title,
            "joinedAt": membership.joined_at,
            "mentorName": None,
            "organizationName": organization.name,
        }

    async def principal(self, user_id: UUID, organization_id: UUID, permission: str) -> Principal:
        membership = await self.session.scalar(
            select(MembershipModel).where(
                MembershipModel.user_id == user_id,
                MembershipModel.organization_id == organization_id,
                MembershipModel.status == "active",
            )
        )
        if membership is None:
            raise ApplicationError(
                "ORGANIZATION_ACCESS_DENIED", "Active organization membership is required.", 403
            )
        group_ids = set(
            (
                await self.session.scalars(
                    select(MembershipGroupModel.group_id).where(
                        MembershipGroupModel.membership_id == membership.id
                    )
                )
            ).all()
        )
        direct_roles = select(MembershipRoleModel.role_id).where(
            MembershipRoleModel.membership_id == membership.id
        )
        group_roles = select(GroupRoleModel.role_id).where(GroupRoleModel.group_id.in_(group_ids))
        role_ids = set((await self.session.scalars(direct_roles)).all()) | set(
            (await self.session.scalars(group_roles)).all()
        )
        permissions = (
            set(
                (
                    await self.session.scalars(
                        select(RolePermissionModel.permission).where(
                            RolePermissionModel.role_id.in_(role_ids)
                        )
                    )
                ).all()
            )
            if role_ids
            else set()
        )
        role_keys = (
            set(
                (
                    await self.session.scalars(
                        select(RoleModel.key).where(
                            RoleModel.id.in_(role_ids), RoleModel.status == "active"
                        )
                    )
                ).all()
            )
            if role_ids
            else set()
        )
        if permission not in permissions:
            raise ApplicationError(
                "PERMISSION_DENIED", f"Permission '{permission}' is required.", 403
            )
        return Principal(
            user_id,
            membership.id,
            organization_id,
            frozenset(group_ids),
            frozenset(permissions),
            frozenset(role_keys),
        )

    async def list_organizations(self, user_id: UUID) -> list[dict[str, Any]]:
        rows = (
            await self.session.execute(
                select(OrganizationModel, MembershipModel)
                .join(MembershipModel, MembershipModel.organization_id == OrganizationModel.id)
                .where(MembershipModel.user_id == user_id)
                .order_by(OrganizationModel.name)
            )
        ).all()
        return [
            {**self._org(o), "membershipId": m.id, "membershipStatus": m.status} for o, m in rows
        ]

    async def get_organization(self, principal: Principal) -> dict[str, Any]:
        org = await self._org_row(principal.organization_id)
        return self._org(org)

    async def update_organization(self, principal: Principal, name: str) -> dict[str, Any]:
        org = await self._org_row(principal.organization_id)
        org.name = name.strip()
        await self.session.commit()
        return self._org(org)

    async def list_members(
        self, principal: Principal, page: int, page_size: int, search: str | None
    ) -> dict[str, Any]:
        base = (
            select(MembershipModel, UserModel)
            .join(UserModel, UserModel.id == MembershipModel.user_id)
            .where(MembershipModel.organization_id == principal.organization_id)
        )
        count = (
            select(func.count())
            .select_from(MembershipModel)
            .join(UserModel, UserModel.id == MembershipModel.user_id)
            .where(MembershipModel.organization_id == principal.organization_id)
        )
        if search:
            predicate = or_(
                UserModel.display_name.ilike(f"%{search}%"),
                UserModel.normalized_email.ilike(
                    f"%{normalize_email(search) if '@' in search else search.casefold()}%"
                ),
            )
            base, count = base.where(predicate), count.where(predicate)
        total = int(await self.session.scalar(count) or 0)
        rows = (
            await self.session.execute(
                base.order_by(UserModel.display_name)
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        ).all()
        return {
            "items": [self._member(m, u) for m, u in rows],
            "total": total,
            "page": page,
            "pageSize": page_size,
        }

    async def get_member(self, principal: Principal, member_id: UUID) -> dict[str, Any]:
        membership, user = await self._member_row(principal.organization_id, member_id)
        result = self._member(membership, user)
        result["groupIds"] = list(
            (
                await self.session.scalars(
                    select(MembershipGroupModel.group_id).where(
                        MembershipGroupModel.membership_id == member_id
                    )
                )
            ).all()
        )
        result["roleIds"] = list(
            (
                await self.session.scalars(
                    select(MembershipRoleModel.role_id).where(
                        MembershipRoleModel.membership_id == member_id
                    )
                )
            ).all()
        )
        return result

    async def create_member(self, principal: Principal, values: dict[str, Any]) -> dict[str, Any]:
        normalized = normalize_email(values["email"])
        user = await self.session.scalar(
            select(UserModel).where(UserModel.normalized_email == normalized)
        )
        password = values.get("temporaryPassword")
        if user is None:
            if not password:
                raise ApplicationError(
                    "TEMPORARY_PASSWORD_REQUIRED",
                    "A temporary password is required for a new account.",
                )
            user = UserModel(
                email=values["email"].strip(),
                normalized_email=normalized,
                display_name=values["displayName"].strip(),
                password_hash=SQLAlchemyIdentityService.hash_password(password),
                must_change_password=True,
            )
            self.session.add(user)
            await self.session.flush()
        elif password:
            raise ApplicationError(
                "EXISTING_USER_PASSWORD_FORBIDDEN",
                "Do not provide a password when attaching an existing account.",
                409,
            )
        existing = await self.session.scalar(
            select(MembershipModel).where(
                MembershipModel.organization_id == principal.organization_id,
                MembershipModel.user_id == user.id,
            )
        )
        if existing:
            raise ApplicationError(
                "MEMBERSHIP_ALREADY_EXISTS", "User already belongs to this organization.", 409
            )
        member = MembershipModel(
            organization_id=principal.organization_id,
            user_id=user.id,
            employee_no=values.get("employeeNo"),
            job_title=values.get("jobTitle"),
        )
        self.session.add(member)
        await self.session.flush()
        await self._replace_member_roles(principal, member, values.get("roleIds", []))
        await self._replace_member_groups(principal, member, values.get("groupIds", []))
        await self.session.commit()
        return self._member(member, user)

    async def update_member(
        self, principal: Principal, member_id: UUID, values: dict[str, Any]
    ) -> dict[str, Any]:
        member, user = await self._member_row(principal.organization_id, member_id)
        if "employeeNo" in values:
            member.employee_no = values["employeeNo"]
        if "jobTitle" in values:
            member.job_title = values["jobTitle"]
        await self.session.commit()
        return self._member(member, user)

    async def set_member_status(
        self, principal: Principal, member_id: UUID, status: str
    ) -> dict[str, Any]:
        member, user = await self._member_row(principal.organization_id, member_id)
        if status != "active" and await self._is_owner(member.id):
            active_owners = await self._active_owner_count(principal.organization_id)
            if active_owners <= 1:
                raise ApplicationError(
                    "LAST_OWNER_REQUIRED",
                    "The last active owner cannot be suspended or removed.",
                    409,
                )
        member.status = status
        await self.session.commit()
        return self._member(member, user)

    async def replace_member_groups(
        self, principal: Principal, member_id: UUID, ids: list[UUID]
    ) -> dict[str, Any]:
        member, _ = await self._member_row(principal.organization_id, member_id)
        await self._replace_member_groups(principal, member, ids)
        await self.session.commit()
        return await self.get_member(principal, member_id)

    async def _replace_member_groups(
        self, principal: Principal, member: MembershipModel, ids: list[UUID]
    ) -> None:
        await self._validate_groups(principal.organization_id, ids)
        await self.session.execute(
            delete(MembershipGroupModel).where(MembershipGroupModel.membership_id == member.id)
        )
        self.session.add_all(
            MembershipGroupModel(membership_id=member.id, group_id=item) for item in ids
        )

    async def replace_member_roles(
        self, principal: Principal, member_id: UUID, ids: list[UUID]
    ) -> dict[str, Any]:
        member, _ = await self._member_row(principal.organization_id, member_id)
        await self._replace_member_roles(principal, member, ids)
        await self.session.commit()
        return await self.get_member(principal, member_id)

    async def _replace_member_roles(
        self, principal: Principal, member: MembershipModel, ids: list[UUID]
    ) -> None:
        roles = await self._validate_roles(principal.organization_id, ids)
        requested_permissions = await self._permissions_for_roles(ids)
        try:
            ensure_assignable_permissions(set(principal.permissions), requested_permissions)
        except PermissionError as exc:
            raise ApplicationError(
                "ROLE_ESCALATION_DENIED", "Cannot assign permissions you do not hold.", 403
            ) from exc
        owner_change = any(role.key == "owner" for role in roles) or await self._is_owner(member.id)
        if owner_change and "owner" not in principal.role_keys:
            raise ApplicationError(
                "ROLE_ESCALATION_DENIED", "Only an owner may change owner assignments.", 403
            )
        if (
            await self._is_owner(member.id)
            and not any(role.key == "owner" for role in roles)
            and await self._active_owner_count(principal.organization_id) <= 1
        ):
            raise ApplicationError(
                "LAST_OWNER_REQUIRED", "The organization must keep an active owner.", 409
            )
        await self.session.execute(
            delete(MembershipRoleModel).where(MembershipRoleModel.membership_id == member.id)
        )
        self.session.add_all(
            MembershipRoleModel(membership_id=member.id, role_id=item) for item in ids
        )

    async def list_groups(self, principal: Principal) -> list[dict[str, Any]]:
        rows = (
            await self.session.scalars(
                select(GroupModel)
                .where(GroupModel.organization_id == principal.organization_id)
                .order_by(GroupModel.name)
            )
        ).all()
        return [self._group(row) for row in rows]

    async def create_group(self, principal: Principal, values: dict[str, Any]) -> dict[str, Any]:
        row = GroupModel(organization_id=principal.organization_id, **values)
        self.session.add(row)
        await self.session.commit()
        return self._group(row)

    async def update_group(
        self, principal: Principal, group_id: UUID, values: dict[str, Any]
    ) -> dict[str, Any]:
        row = await self._group_row(principal.organization_id, group_id)
        for key, value in values.items():
            setattr(row, key, value)
        await self.session.commit()
        return self._group(row)

    async def replace_group_members(
        self, principal: Principal, group_id: UUID, ids: list[UUID]
    ) -> dict[str, Any]:
        await self._group_row(principal.organization_id, group_id)
        await self._validate_members(principal.organization_id, ids)
        await self.session.execute(
            delete(MembershipGroupModel).where(MembershipGroupModel.group_id == group_id)
        )
        self.session.add_all(
            MembershipGroupModel(group_id=group_id, membership_id=item) for item in ids
        )
        await self.session.commit()
        return {"id": group_id, "memberIds": ids}

    async def replace_group_roles(
        self, principal: Principal, group_id: UUID, ids: list[UUID]
    ) -> dict[str, Any]:
        await self._group_row(principal.organization_id, group_id)
        roles = await self._validate_roles(principal.organization_id, ids)
        if any(role.key == "owner" for role in roles):
            raise ApplicationError(
                "OWNER_GROUP_ASSIGNMENT_FORBIDDEN", "Owner role cannot be assigned to a group.", 409
            )
        try:
            ensure_assignable_permissions(
                set(principal.permissions), await self._permissions_for_roles(ids)
            )
        except PermissionError as exc:
            raise ApplicationError(
                "ROLE_ESCALATION_DENIED", "Cannot assign permissions you do not hold.", 403
            ) from exc
        await self.session.execute(
            delete(GroupRoleModel).where(GroupRoleModel.group_id == group_id)
        )
        self.session.add_all(GroupRoleModel(group_id=group_id, role_id=item) for item in ids)
        await self.session.commit()
        return {"id": group_id, "roleIds": ids}

    async def list_roles(self, principal: Principal) -> list[dict[str, Any]]:
        roles = (
            await self.session.scalars(
                select(RoleModel)
                .where(RoleModel.organization_id == principal.organization_id)
                .order_by(RoleModel.name)
            )
        ).all()
        return [await self._role(row) for row in roles]

    async def create_role(self, principal: Principal, values: dict[str, Any]) -> dict[str, Any]:
        permissions = set(values.pop("permissions", []))
        if not permissions <= ALL_PERMISSIONS:
            raise ApplicationError("UNKNOWN_PERMISSION", "Role contains an unknown permission.")
        try:
            ensure_assignable_permissions(set(principal.permissions), permissions)
        except PermissionError as exc:
            raise ApplicationError(
                "ROLE_ESCALATION_DENIED",
                "Cannot create a role with permissions you do not hold.",
                403,
            ) from exc
        row = RoleModel(organization_id=principal.organization_id, is_system=False, **values)
        self.session.add(row)
        await self.session.flush()
        self.session.add_all(
            RolePermissionModel(role_id=row.id, permission=item) for item in permissions
        )
        await self.session.commit()
        return await self._role(row)

    async def update_role(
        self, principal: Principal, role_id: UUID, values: dict[str, Any]
    ) -> dict[str, Any]:
        row = await self._role_row(principal.organization_id, role_id)
        if row.is_system:
            raise ApplicationError("SYSTEM_ROLE_IMMUTABLE", "System roles cannot be modified.", 409)
        permissions = set(values.pop("permissions", await self._permissions_for_roles([role_id])))
        if not permissions <= ALL_PERMISSIONS:
            raise ApplicationError("UNKNOWN_PERMISSION", "Role contains an unknown permission.")
        try:
            ensure_assignable_permissions(set(principal.permissions), permissions)
        except PermissionError as exc:
            raise ApplicationError(
                "ROLE_ESCALATION_DENIED", "Cannot grant permissions you do not hold.", 403
            ) from exc
        for key, value in values.items():
            setattr(row, key, value)
        await self.session.execute(
            delete(RolePermissionModel).where(RolePermissionModel.role_id == row.id)
        )
        self.session.add_all(
            RolePermissionModel(role_id=row.id, permission=item) for item in permissions
        )
        await self.session.commit()
        return await self._role(row)

    async def _org_row(self, org_id: UUID) -> OrganizationModel:
        row = await self.session.get(OrganizationModel, org_id)
        if row is None:
            raise ApplicationError("ORGANIZATION_NOT_FOUND", "Organization was not found.", 404)
        return row

    async def _member_row(self, org_id: UUID, member_id: UUID) -> tuple[MembershipModel, UserModel]:
        row = (
            await self.session.execute(
                select(MembershipModel, UserModel)
                .join(UserModel)
                .where(MembershipModel.id == member_id, MembershipModel.organization_id == org_id)
            )
        ).one_or_none()
        if row is None:
            raise ApplicationError("MEMBER_NOT_FOUND", "Member was not found.", 404)
        return row[0], row[1]

    async def _group_row(self, org_id: UUID, row_id: UUID) -> GroupModel:
        row = await self.session.scalar(
            select(GroupModel).where(GroupModel.id == row_id, GroupModel.organization_id == org_id)
        )
        if row is None:
            raise ApplicationError("GROUP_NOT_FOUND", "Group was not found.", 404)
        return row

    async def _role_row(self, org_id: UUID, row_id: UUID) -> RoleModel:
        row = await self.session.scalar(
            select(RoleModel).where(RoleModel.id == row_id, RoleModel.organization_id == org_id)
        )
        if row is None:
            raise ApplicationError("ROLE_NOT_FOUND", "Role was not found.", 404)
        return row

    async def _validate_groups(self, org_id: UUID, ids: list[UUID]) -> list[GroupModel]:
        rows = (
            list(
                (
                    await self.session.scalars(
                        select(GroupModel).where(
                            GroupModel.id.in_(ids), GroupModel.organization_id == org_id
                        )
                    )
                ).all()
            )
            if ids
            else []
        )
        if len(rows) != len(set(ids)):
            raise ApplicationError("GROUP_NOT_FOUND", "One or more groups were not found.", 404)
        return rows

    async def _validate_roles(self, org_id: UUID, ids: list[UUID]) -> list[RoleModel]:
        rows = (
            list(
                (
                    await self.session.scalars(
                        select(RoleModel).where(
                            RoleModel.id.in_(ids),
                            RoleModel.organization_id == org_id,
                            RoleModel.status == "active",
                        )
                    )
                ).all()
            )
            if ids
            else []
        )
        if len(rows) != len(set(ids)):
            raise ApplicationError("ROLE_NOT_FOUND", "One or more roles were not found.", 404)
        return rows

    async def _validate_members(self, org_id: UUID, ids: list[UUID]) -> None:
        count = (
            int(
                await self.session.scalar(
                    select(func.count())
                    .select_from(MembershipModel)
                    .where(MembershipModel.id.in_(ids), MembershipModel.organization_id == org_id)
                )
                or 0
            )
            if ids
            else 0
        )
        if count != len(set(ids)):
            raise ApplicationError("MEMBER_NOT_FOUND", "One or more members were not found.", 404)

    async def _permissions_for_roles(self, ids: list[UUID]) -> set[str]:
        return (
            set(
                (
                    await self.session.scalars(
                        select(RolePermissionModel.permission).where(
                            RolePermissionModel.role_id.in_(ids)
                        )
                    )
                ).all()
            )
            if ids
            else set()
        )

    async def _is_owner(self, member_id: UUID) -> bool:
        return bool(
            await self.session.scalar(
                select(func.count())
                .select_from(MembershipRoleModel)
                .join(RoleModel, RoleModel.id == MembershipRoleModel.role_id)
                .where(MembershipRoleModel.membership_id == member_id, RoleModel.key == "owner")
            )
        )

    async def _active_owner_count(self, org_id: UUID) -> int:
        return int(
            await self.session.scalar(
                select(func.count())
                .select_from(MembershipRoleModel)
                .join(MembershipModel)
                .join(RoleModel)
                .where(
                    MembershipModel.organization_id == org_id,
                    MembershipModel.status == "active",
                    RoleModel.key == "owner",
                )
            )
            or 0
        )

    @staticmethod
    def _org(row: OrganizationModel) -> dict[str, Any]:
        return {"id": row.id, "name": row.name, "code": row.code, "status": row.status}

    @staticmethod
    def _member(row: MembershipModel, user: UserModel) -> dict[str, Any]:
        return {
            "id": row.id,
            "userId": user.id,
            "email": user.email,
            "displayName": user.display_name,
            "employeeNo": row.employee_no,
            "jobTitle": row.job_title,
            "status": row.status,
            "joinedAt": row.joined_at,
        }

    @staticmethod
    def _group(row: GroupModel) -> dict[str, Any]:
        return {
            "id": row.id,
            "name": row.name,
            "code": row.code,
            "kind": row.kind,
            "description": row.description,
            "status": row.status,
        }

    async def _role(self, row: RoleModel) -> dict[str, Any]:
        return {
            "id": row.id,
            "key": row.key,
            "name": row.name,
            "description": row.description,
            "isSystem": row.is_system,
            "status": row.status,
            "permissions": sorted(await self._permissions_for_roles([row.id])),
        }
