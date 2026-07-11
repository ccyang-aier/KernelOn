"""End-to-end IAM contract tests against PostgreSQL."""

import os
from uuid import uuid4

import pytest
from litestar.testing import AsyncTestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from kernelon_api.asgi import create_app
from kernelon_api.config import Settings
from kernelon_api.modules.identity.domain import normalize_email
from kernelon_api.modules.identity.infrastructure.models import UserModel
from kernelon_api.modules.identity.infrastructure.service import SQLAlchemyIdentityService
from kernelon_api.modules.organizations.domain import ALL_PERMISSIONS
from kernelon_api.modules.organizations.infrastructure.models import (
    MembershipModel,
    MembershipRoleModel,
    OrganizationModel,
    RoleModel,
    RolePermissionModel,
)


@pytest.mark.integration
async def test_complete_identity_and_organization_management_flow() -> None:
    database_url = os.getenv("KERNELON_TEST_DATABASE_URL")
    if not database_url:
        pytest.skip("KERNELON_TEST_DATABASE_URL is not configured")
    suffix = uuid4().hex[:10]
    owner_email = f"owner-{suffix}@example.com"
    owner_password = "Owner-password-123"  # noqa: S105
    engine = create_async_engine(database_url)
    factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    async with factory() as session:
        user = UserModel(
            email=owner_email,
            normalized_email=normalize_email(owner_email),
            display_name="Owner",
            password_hash=SQLAlchemyIdentityService.hash_password(owner_password),
            must_change_password=False,
        )
        organization = OrganizationModel(name="Integration Organization", code=f"org-{suffix}")
        session.add_all([user, organization])
        await session.flush()
        membership = MembershipModel(organization_id=organization.id, user_id=user.id)
        owner_role = RoleModel(
            organization_id=organization.id,
            key="owner",
            name="所有者",
            is_system=True,
        )
        session.add_all([membership, owner_role])
        await session.flush()
        session.add_all(
            RolePermissionModel(role_id=owner_role.id, permission=value)
            for value in ALL_PERMISSIONS
        )
        session.add(MembershipRoleModel(membership_id=membership.id, role_id=owner_role.id))
        await session.commit()
        organization_id = organization.id

    settings = Settings(
        environment="test",
        database_url=database_url,
        openapi_enabled=True,
        allowed_hosts=["testserver.local"],
        jwt_secret="integration-test-secret-with-at-least-32-bytes",  # noqa: S106
    )
    async with AsyncTestClient(app=create_app(settings)) as client:
        bad = await client.post(
            "/api/v1/auth/login", json={"email": owner_email, "password": "wrong-password"}
        )
        assert bad.status_code == 401
        login = await client.post(
            "/api/v1/auth/login", json={"email": owner_email, "password": owner_password}
        )
        assert login.status_code == 201
        tokens = login.json()
        headers = {"Authorization": f"Bearer {tokens['accessToken']}"}

        me = await client.get("/api/v1/auth/me", headers=headers)
        assert me.status_code == 200 and me.json()["email"] == owner_email
        profile = await client.patch(
            "/api/v1/auth/me",
            headers=headers,
            json={"displayName": "Owner Updated", "avatarUrl": "https://example.com/avatar.png"},
        )
        assert profile.status_code == 200

        organizations = await client.get("/api/v1/organizations", headers=headers)
        assert organizations.status_code == 200 and len(organizations.json()) == 1
        base = f"/api/v1/organizations/{organization_id}"
        assert (await client.get(base, headers=headers)).status_code == 200
        assert (
            await client.patch(base, headers=headers, json={"name": "Updated Organization"})
        ).json()["name"] == "Updated Organization"
        permissions = await client.get(f"{base}/permissions", headers=headers)
        assert permissions.status_code == 200 and "members.manage" in permissions.json()

        group = await client.post(
            f"{base}/groups",
            headers=headers,
            json={
                "name": "Cohort A",
                "code": f"cohort-{suffix}",
                "kind": "cohort",
                "description": "New hires",
                "status": "active",
            },
        )
        assert group.status_code == 201
        group_id = group.json()["id"]
        assert (await client.get(f"{base}/groups", headers=headers)).status_code == 200
        assert (
            await client.patch(
                f"{base}/groups/{group_id}",
                headers=headers,
                json={
                    "name": "Cohort Alpha",
                    "code": f"cohort-{suffix}",
                    "kind": "cohort",
                    "description": "Updated",
                    "status": "active",
                },
            )
        ).status_code == 200

        role_body = {
            "key": f"coordinator-{suffix}",
            "name": "Coordinator",
            "description": "Custom role",
            "status": "active",
            "permissions": ["members.read", "groups.read"],
        }
        role = await client.post(f"{base}/roles", headers=headers, json=role_body)
        assert role.status_code == 201
        role_id = role.json()["id"]
        role_body["name"] = "Senior Coordinator"
        role_body["permissions"].append("groups.manage")
        assert (
            await client.patch(f"{base}/roles/{role_id}", headers=headers, json=role_body)
        ).status_code == 200
        assert (await client.get(f"{base}/roles", headers=headers)).status_code == 200

        member_email = f"member-{suffix}@example.com"
        member = await client.post(
            f"{base}/members",
            headers=headers,
            json={
                "email": member_email,
                "displayName": "New Member",
                "temporaryPassword": "Temporary-12345",
                "employeeNo": f"E-{suffix}",
                "jobTitle": "Engineer",
                "groupIds": [group_id],
                "roleIds": [role_id],
            },
        )
        assert member.status_code == 201
        member_id = member.json()["id"]
        listing = await client.get(
            f"{base}/members?page=1&page_size=10&search=New", headers=headers
        )
        assert listing.status_code == 200 and listing.json()["total"] == 1
        details = await client.get(f"{base}/members/{member_id}", headers=headers)
        assert details.status_code == 200 and group_id in details.json()["groupIds"]
        assert (
            await client.patch(
                f"{base}/members/{member_id}",
                headers=headers,
                json={"employeeNo": f"E2-{suffix}", "jobTitle": "Senior Engineer"},
            )
        ).status_code == 200
        assert (
            await client.put(
                f"{base}/members/{member_id}/groups", headers=headers, json={"ids": [group_id]}
            )
        ).status_code == 200
        assert (
            await client.put(
                f"{base}/members/{member_id}/roles", headers=headers, json={"ids": [role_id]}
            )
        ).status_code == 200
        assert (
            await client.put(
                f"{base}/groups/{group_id}/members", headers=headers, json={"ids": [member_id]}
            )
        ).status_code == 200
        assert (
            await client.put(
                f"{base}/groups/{group_id}/roles", headers=headers, json={"ids": [role_id]}
            )
        ).status_code == 200
        for action in ("suspend", "resume", "remove"):
            assert (
                await client.post(f"{base}/members/{member_id}/{action}", headers=headers)
            ).status_code == 201

        refreshed = await client.post(
            "/api/v1/auth/refresh", json={"refreshToken": tokens["refreshToken"]}
        )
        assert refreshed.status_code == 201
        reuse = await client.post(
            "/api/v1/auth/refresh", json={"refreshToken": tokens["refreshToken"]}
        )
        assert reuse.status_code == 401 and reuse.json()["errorCode"] == "REFRESH_TOKEN_REUSED"
        second_login = await client.post(
            "/api/v1/auth/login", json={"email": owner_email, "password": owner_password}
        )
        second_tokens = second_login.json()
        second_headers = {"Authorization": f"Bearer {second_tokens['accessToken']}"}
        changed = await client.post(
            "/api/v1/auth/change-password",
            headers=second_headers,
            json={"currentPassword": owner_password, "newPassword": "Changed-password-456"},
        )
        assert changed.status_code == 204
        assert (await client.get("/api/v1/auth/me", headers=second_headers)).status_code == 401
        await client.post(
            "/api/v1/auth/logout", json={"refreshToken": second_tokens["refreshToken"]}
        )

    await engine.dispose()
