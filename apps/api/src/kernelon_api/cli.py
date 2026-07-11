"""Safe operational commands for initial IAM provisioning."""

from __future__ import annotations

import argparse
import asyncio
import getpass
from collections.abc import Sequence  # noqa: TC003
from datetime import UTC, datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from kernelon_api.config import get_settings
from kernelon_api.infrastructure.database import load_mappings
from kernelon_api.modules.identity.domain import normalize_email
from kernelon_api.modules.identity.infrastructure.models import RefreshSessionModel, UserModel
from kernelon_api.modules.identity.infrastructure.service import SQLAlchemyIdentityService
from kernelon_api.modules.organizations.domain import ALL_PERMISSIONS
from kernelon_api.modules.organizations.infrastructure.models import (
    MembershipModel,
    MembershipRoleModel,
    OrganizationModel,
    RoleModel,
    RolePermissionModel,
)

PRESET_ROLES: dict[str, tuple[str, set[str]]] = {
    "owner": ("所有者", set(ALL_PERMISSIONS)),
    "admin": (
        "管理员",
        {
            "organization.read",
            "members.read",
            "members.manage",
            "groups.read",
            "groups.manage",
            "roles.read",
            "roles.manage",
        },
    ),
    "operations": ("运营负责人", set(ALL_PERMISSIONS) - {"organization.manage", "roles.manage"}),
    "mentor": (
        "导师",
        {
            "organization.read",
            "members.read",
            "mentorship.read",
            "mentorship.manage",
            "training.read",
            "growth.read",
            "assessment.read",
            "resources.read",
        },
    ),
    "newcomer": (
        "新员工",
        {
            "organization.read",
            "onboarding.read",
            "mentorship.read",
            "growth.read",
            "training.read",
            "assessment.read",
            "resources.read",
        },
    ),
}


async def bootstrap(args: argparse.Namespace) -> None:
    settings = get_settings()
    load_mappings()
    engine = create_async_engine(settings.sqlalchemy_url)
    factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    try:
        async with factory() as session:
            if await session.scalar(
                select(OrganizationModel).where(OrganizationModel.code == args.code)
            ):
                raise SystemExit(f"Organization code already exists: {args.code}")
            normalized = normalize_email(args.email)
            if await session.scalar(
                select(UserModel).where(UserModel.normalized_email == normalized)
            ):
                raise SystemExit(f"User email already exists: {args.email}")
            password = getpass.getpass("Initial owner password: ")
            confirmation = getpass.getpass("Confirm password: ")
            if password != confirmation:
                raise SystemExit("Passwords do not match")
            user = UserModel(
                email=args.email.strip(),
                normalized_email=normalized,
                display_name=args.display_name.strip(),
                password_hash=SQLAlchemyIdentityService.hash_password(password),
                must_change_password=True,
            )
            organization = OrganizationModel(name=args.organization_name.strip(), code=args.code)
            session.add_all([user, organization])
            await session.flush()
            member = MembershipModel(organization_id=organization.id, user_id=user.id)
            session.add(member)
            await session.flush()
            owner: RoleModel | None = None
            for key, (name, permissions) in PRESET_ROLES.items():
                role = RoleModel(
                    organization_id=organization.id, key=key, name=name, is_system=True
                )
                session.add(role)
                await session.flush()
                session.add_all(
                    RolePermissionModel(role_id=role.id, permission=item) for item in permissions
                )
                if key == "owner":
                    owner = role
            if owner is None:
                raise RuntimeError("owner role preset is missing")
            session.add(MembershipRoleModel(membership_id=member.id, role_id=owner.id))
            await session.commit()
            print(f"Created organization {organization.code} with owner {user.email}")  # noqa: T201
    finally:
        await engine.dispose()


async def set_account_status(args: argparse.Namespace) -> None:
    settings = get_settings()
    load_mappings()
    engine = create_async_engine(settings.sqlalchemy_url)
    factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    try:
        async with factory() as session:
            user = await session.scalar(
                select(UserModel).where(UserModel.normalized_email == normalize_email(args.email))
            )
            if user is None:
                raise SystemExit(f"User not found: {args.email}")
            user.status = args.status
            user.auth_version += 1
            if args.status == "disabled":
                await session.execute(
                    update(RefreshSessionModel)
                    .where(
                        RefreshSessionModel.user_id == user.id,
                        RefreshSessionModel.revoked_at.is_(None),
                    )
                    .values(revoked_at=datetime.now(UTC))
                )
            await session.commit()
            print(f"Account {user.email} is now {args.status}")  # noqa: T201
    finally:
        await engine.dispose()


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(prog="python -m kernelon_api.cli")
    commands = root.add_subparsers(dest="command", required=True)
    boot = commands.add_parser("bootstrap-organization")
    boot.add_argument("--organization-name", required=True)
    boot.add_argument("--code", required=True)
    boot.add_argument("--email", required=True)
    boot.add_argument("--display-name", required=True)
    for name, status in (("disable-account", "disabled"), ("enable-account", "active")):
        command = commands.add_parser(name)
        command.add_argument("--email", required=True)
        command.set_defaults(status=status)
    return root


async def run(argv: Sequence[str] | None = None) -> None:
    args = parser().parse_args(argv)
    if args.command == "bootstrap-organization":
        await bootstrap(args)
    else:
        await set_account_status(args)


if __name__ == "__main__":
    asyncio.run(run())
