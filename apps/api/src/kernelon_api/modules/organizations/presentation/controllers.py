"""Organization, member, group and role endpoints."""

from __future__ import annotations

from typing import Any, Literal
from uuid import UUID  # noqa: TC003

from litestar import Controller, Request, get, patch, post, put
from litestar.di import NamedDependency  # noqa: TC002
from pydantic import BaseModel, ConfigDict, Field

from kernelon_api.modules.identity.application.ports import IdentityService  # noqa: TC001
from kernelon_api.modules.organizations.application.ports import OrganizationService  # noqa: TC001
from kernelon_api.modules.organizations.domain import ALL_PERMISSIONS


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class NameRequest(StrictModel):
    name: str = Field(min_length=1, max_length=160)


class MemberCreate(StrictModel):
    email: str
    display_name: str = Field(alias="displayName", min_length=1, max_length=120)
    temporary_password: str | None = Field(default=None, alias="temporaryPassword")
    employee_no: str | None = Field(default=None, alias="employeeNo", max_length=80)
    job_title: str | None = Field(default=None, alias="jobTitle", max_length=120)
    group_ids: list[UUID] = Field(default_factory=list, alias="groupIds")
    role_ids: list[UUID] = Field(default_factory=list, alias="roleIds")


class MemberUpdate(StrictModel):
    employee_no: str | None = Field(default=None, alias="employeeNo", max_length=80)
    job_title: str | None = Field(default=None, alias="jobTitle", max_length=120)


class IdsRequest(StrictModel):
    ids: list[UUID]


class GroupRequest(StrictModel):
    name: str = Field(min_length=1, max_length=120)
    code: str = Field(min_length=1, max_length=80, pattern=r"^[a-z0-9][a-z0-9_-]*$")
    kind: Literal["department", "project", "cohort", "custom"] = "custom"
    description: str | None = None
    status: Literal["active", "archived"] = "active"


class RoleRequest(StrictModel):
    key: str = Field(min_length=1, max_length=80, pattern=r"^[a-z0-9][a-z0-9_.-]*$")
    name: str = Field(min_length=1, max_length=120)
    description: str | None = None
    status: Literal["active", "archived"] = "active"
    permissions: list[str]


async def _user(request: Request[Any, Any, Any], identity: IdentityService) -> UUID:
    return await identity.authenticate(request.headers.get("Authorization"))


class OrganizationController(Controller):
    path = "/organizations"
    tags = ("organizations",)

    @get(operation_id="organizations_list_mine")
    async def list_mine(
        self,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
    ) -> list[dict[str, Any]]:
        return await organization_service.list_organizations(await _user(request, identity_service))

    @get("/{organization_id:uuid}", operation_id="organizations_get")
    async def get_org(
        self,
        organization_id: UUID,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
    ) -> dict[str, Any]:
        p = await organization_service.principal(
            await _user(request, identity_service), organization_id, "organization.read"
        )
        return await organization_service.get_organization(p)

    @patch("/{organization_id:uuid}", operation_id="organizations_update")
    async def update_org(
        self,
        organization_id: UUID,
        data: NameRequest,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
    ) -> dict[str, Any]:
        p = await organization_service.principal(
            await _user(request, identity_service), organization_id, "organization.manage"
        )
        return await organization_service.update_organization(p, data.name)

    @get("/{organization_id:uuid}/members", operation_id="members_list")
    async def members(
        self,
        organization_id: UUID,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
        page: int = 1,
        page_size: int = 20,
        search: str | None = None,
    ) -> dict[str, Any]:
        p = await organization_service.principal(
            await _user(request, identity_service), organization_id, "members.read"
        )
        return await organization_service.list_members(
            p, max(page, 1), min(max(page_size, 1), 100), search
        )

    @post("/{organization_id:uuid}/members", operation_id="members_create")
    async def create_member(
        self,
        organization_id: UUID,
        data: MemberCreate,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
    ) -> dict[str, Any]:
        p = await organization_service.principal(
            await _user(request, identity_service), organization_id, "members.manage"
        )
        return await organization_service.create_member(p, data.model_dump(by_alias=True))

    @get("/{organization_id:uuid}/members/{member_id:uuid}", operation_id="members_get")
    async def get_member(
        self,
        organization_id: UUID,
        member_id: UUID,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
    ) -> dict[str, Any]:
        p = await organization_service.principal(
            await _user(request, identity_service), organization_id, "members.read"
        )
        return await organization_service.get_member(p, member_id)

    @patch("/{organization_id:uuid}/members/{member_id:uuid}", operation_id="members_update")
    async def update_member(
        self,
        organization_id: UUID,
        member_id: UUID,
        data: MemberUpdate,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
    ) -> dict[str, Any]:
        p = await organization_service.principal(
            await _user(request, identity_service), organization_id, "members.manage"
        )
        return await organization_service.update_member(
            p, member_id, data.model_dump(by_alias=True, exclude_unset=True)
        )

    @post(
        "/{organization_id:uuid}/members/{member_id:uuid}/{action:str}",
        operation_id="members_change_status",
    )
    async def member_status(
        self,
        organization_id: UUID,
        member_id: UUID,
        action: str,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
    ) -> dict[str, Any]:
        status = {"suspend": "suspended", "resume": "active", "remove": "removed"}.get(action)
        if not status:
            from kernelon_api.platform.application_errors import ApplicationError

            raise ApplicationError(
                "INVALID_MEMBER_ACTION", "Action must be suspend, resume or remove."
            )
        p = await organization_service.principal(
            await _user(request, identity_service), organization_id, "members.manage"
        )
        return await organization_service.set_member_status(p, member_id, status)

    @put(
        "/{organization_id:uuid}/members/{member_id:uuid}/groups",
        operation_id="members_replace_groups",
    )
    async def member_groups(
        self,
        organization_id: UUID,
        member_id: UUID,
        data: IdsRequest,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
    ) -> dict[str, Any]:
        p = await organization_service.principal(
            await _user(request, identity_service), organization_id, "members.manage"
        )
        return await organization_service.replace_member_groups(p, member_id, data.ids)

    @put(
        "/{organization_id:uuid}/members/{member_id:uuid}/roles",
        operation_id="members_replace_roles",
    )
    async def member_roles(
        self,
        organization_id: UUID,
        member_id: UUID,
        data: IdsRequest,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
    ) -> dict[str, Any]:
        p = await organization_service.principal(
            await _user(request, identity_service), organization_id, "roles.manage"
        )
        return await organization_service.replace_member_roles(p, member_id, data.ids)

    @get("/{organization_id:uuid}/groups", operation_id="groups_list")
    async def groups(
        self,
        organization_id: UUID,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
    ) -> list[dict[str, Any]]:
        p = await organization_service.principal(
            await _user(request, identity_service), organization_id, "groups.read"
        )
        return await organization_service.list_groups(p)

    @post("/{organization_id:uuid}/groups", operation_id="groups_create")
    async def create_group(
        self,
        organization_id: UUID,
        data: GroupRequest,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
    ) -> dict[str, Any]:
        p = await organization_service.principal(
            await _user(request, identity_service), organization_id, "groups.manage"
        )
        return await organization_service.create_group(p, data.model_dump())

    @patch("/{organization_id:uuid}/groups/{group_id:uuid}", operation_id="groups_update")
    async def update_group(
        self,
        organization_id: UUID,
        group_id: UUID,
        data: GroupRequest,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
    ) -> dict[str, Any]:
        p = await organization_service.principal(
            await _user(request, identity_service), organization_id, "groups.manage"
        )
        return await organization_service.update_group(
            p, group_id, data.model_dump(exclude_unset=True)
        )

    @put(
        "/{organization_id:uuid}/groups/{group_id:uuid}/members",
        operation_id="groups_replace_members",
    )
    async def group_members(
        self,
        organization_id: UUID,
        group_id: UUID,
        data: IdsRequest,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
    ) -> dict[str, Any]:
        p = await organization_service.principal(
            await _user(request, identity_service), organization_id, "groups.manage"
        )
        return await organization_service.replace_group_members(p, group_id, data.ids)

    @put(
        "/{organization_id:uuid}/groups/{group_id:uuid}/roles", operation_id="groups_replace_roles"
    )
    async def group_roles(
        self,
        organization_id: UUID,
        group_id: UUID,
        data: IdsRequest,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
    ) -> dict[str, Any]:
        p = await organization_service.principal(
            await _user(request, identity_service), organization_id, "roles.manage"
        )
        return await organization_service.replace_group_roles(p, group_id, data.ids)

    @get("/{organization_id:uuid}/roles", operation_id="roles_list")
    async def roles(
        self,
        organization_id: UUID,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
    ) -> list[dict[str, Any]]:
        p = await organization_service.principal(
            await _user(request, identity_service), organization_id, "roles.read"
        )
        return await organization_service.list_roles(p)

    @post("/{organization_id:uuid}/roles", operation_id="roles_create")
    async def create_role(
        self,
        organization_id: UUID,
        data: RoleRequest,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
    ) -> dict[str, Any]:
        p = await organization_service.principal(
            await _user(request, identity_service), organization_id, "roles.manage"
        )
        return await organization_service.create_role(p, data.model_dump())

    @patch("/{organization_id:uuid}/roles/{role_id:uuid}", operation_id="roles_update")
    async def update_role(
        self,
        organization_id: UUID,
        role_id: UUID,
        data: RoleRequest,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
    ) -> dict[str, Any]:
        p = await organization_service.principal(
            await _user(request, identity_service), organization_id, "roles.manage"
        )
        return await organization_service.update_role(
            p, role_id, data.model_dump(exclude_unset=True)
        )

    @get("/{organization_id:uuid}/permissions", operation_id="permissions_list")
    async def permissions(
        self,
        organization_id: UUID,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
    ) -> list[str]:
        await organization_service.principal(
            await _user(request, identity_service), organization_id, "roles.read"
        )
        return sorted(ALL_PERMISSIONS)
