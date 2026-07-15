"""End-to-end lifecycle contract against PostgreSQL."""

import os
from datetime import UTC, datetime, timedelta
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
async def test_complete_new_employee_lifecycle() -> None:
    database_url = os.getenv("KERNELON_TEST_DATABASE_URL")
    if not database_url:
        pytest.skip("KERNELON_TEST_DATABASE_URL is not configured")
    suffix = uuid4().hex[:10]
    email = f"lifecycle-owner-{suffix}@example.com"
    password = "Lifecycle-password-123"  # noqa: S105
    engine = create_async_engine(database_url)
    factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    async with factory() as session:
        user = UserModel(
            email=email,
            normalized_email=normalize_email(email),
            display_name="Lifecycle Owner",
            password_hash=SQLAlchemyIdentityService.hash_password(password),
            must_change_password=False,
        )
        organization = OrganizationModel(name="Lifecycle Org", code=f"lifecycle-{suffix}")
        session.add_all([user, organization])
        await session.flush()
        membership = MembershipModel(
            organization_id=organization.id,
            user_id=user.id,
            employee_no=f"OWNER-{suffix}",
            job_title="Operations Lead",
        )
        role = RoleModel(
            organization_id=organization.id,
            key="owner",
            name="所有者",
            is_system=True,
        )
        session.add_all([membership, role])
        await session.flush()
        session.add_all(
            RolePermissionModel(role_id=role.id, permission=value) for value in ALL_PERMISSIONS
        )
        session.add(MembershipRoleModel(membership_id=membership.id, role_id=role.id))
        await session.commit()
        membership_id = membership.id

    settings = Settings(
        environment="test",
        database_url=database_url,
        openapi_enabled=True,
        allowed_hosts=["testserver.local"],
        jwt_secret="lifecycle-test-secret-with-at-least-32-bytes",  # noqa: S106
    )
    async with AsyncTestClient(app=create_app(settings)) as client:
        login = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
        headers = {"Authorization": f"Bearer {login.json()['accessToken']}"}
        context = await client.get("/api/v1/lifecycle/context", headers=headers)
        assert context.status_code == 200
        assert context.json()["membershipId"] == str(membership_id)

        template = await client.post(
            "/api/v1/lifecycle/templates",
            headers=headers,
            json={
                "name": f"Engineer {suffix}",
                "positionFamily": "Engineering",
                "probationDays": 90,
                "tasks": [
                    {
                        "title": "完成首个业务任务",
                        "phase": "growth",
                        "dueDays": 7,
                        "assigneeRole": "newcomer",
                    }
                ],
                "assessmentSchema": {},
            },
        )
        assert template.status_code == 201
        mentor = await client.put(
            "/api/v1/lifecycle/mentors",
            headers=headers,
            json={
                "displayName": "Owner Mentor",
                "skills": ["业务辅导"],
                "capacity": 3,
                "status": "available",
            },
        )
        assert mentor.status_code == 200

        joined_on = datetime.now(UTC).date()
        case = await client.post(
            "/api/v1/lifecycle/cases",
            headers=headers,
            json={
                "employeeName": "New Engineer",
                "employeeNo": f"NEW-{suffix}",
                "jobTitle": "Engineer",
                "joinedOn": joined_on.isoformat(),
                "probationEndOn": (joined_on + timedelta(days=90)).isoformat(),
                "templateId": template.json()["id"],
            },
        )
        assert case.status_code == 201
        case_id = case.json()["id"]
        started = await client.post(
            f"/api/v1/lifecycle/cases/{case_id}/transition",
            headers=headers,
            json={"target": "active"},
        )
        assert started.status_code == 201
        task_id = started.json()["tasks"][0]["id"]
        assert (
            await client.patch(
                f"/api/v1/lifecycle/cases/{case_id}/tasks/{task_id}",
                headers=headers,
                json={"status": "completed", "completionNote": "Done"},
            )
        ).status_code == 200

        assigned = await client.post(
            f"/api/v1/lifecycle/cases/{case_id}/mentor",
            headers=headers,
            json={
                "mentorMemberId": str(membership_id),
                "mentorName": "Owner Mentor",
                "reason": "Best fit",
            },
        )
        assert assigned.status_code == 201
        checkin = await client.post(
            f"/api/v1/lifecycle/cases/{case_id}/checkins",
            headers=headers,
            json={
                "heldAt": datetime.now(UTC).isoformat(),
                "topic": "首周回顾",
                "sharedNotes": "环境准备完成，开始首个业务任务。",  # noqa: RUF001
                "actions": [
                    {
                        "title": "完成代码评审",
                        "dueOn": (joined_on + timedelta(days=10)).isoformat(),
                    }
                ],
            },
        )
        assert checkin.status_code == 201
        assessment = await client.post(
            f"/api/v1/lifecycle/cases/{case_id}/assessments",
            headers=headers,
            json={
                "kind": "probation",
                "plannedOn": (joined_on + timedelta(days=80)).isoformat(),
                "deadlineOn": (joined_on + timedelta(days=85)).isoformat(),
                "requiredRoles": ["newcomer", "mentor", "manager"],
            },
        )
        assert assessment.status_code == 201
        round_id = assessment.json()["id"]
        for role_name in ("newcomer", "mentor", "manager"):
            submission = await client.post(
                f"/api/v1/lifecycle/cases/{case_id}/assessments/{round_id}/submissions",
                headers=headers,
                json={
                    "role": role_name,
                    "content": {"summary": f"{role_name} assessment"},
                    "score": 90,
                },
            )
            assert submission.status_code == 201
        decided = await client.post(
            f"/api/v1/lifecycle/cases/{case_id}/assessments/{round_id}/decision",
            headers=headers,
            json={"decision": "passed", "decisionNotes": "培养目标全部达成。"},
        )
        assert decided.status_code == 201
        detail = await client.get(f"/api/v1/lifecycle/cases/{case_id}", headers=headers)
        assert detail.status_code == 200
        assert detail.json()["status"] == "completed"
        assert detail.json()["taskProgress"]["percent"] == 100
        assert len(detail.json()["checkins"]) == 1
        assert (await client.get("/api/v1/lifecycle/dashboard", headers=headers)).status_code == 200

    await engine.dispose()
