"""REST contract for lifecycle management."""

from __future__ import annotations

from datetime import date, datetime  # noqa: TC003
from typing import Any, Literal
from uuid import UUID

from litestar import Controller, Request, get, patch, post, put
from litestar.di import NamedDependency  # noqa: TC002
from pydantic import BaseModel, ConfigDict, Field, model_validator

from kernelon_api.modules.identity.application.ports import IdentityService  # noqa: TC001
from kernelon_api.modules.lifecycle.application import LifecycleService  # noqa: TC001
from kernelon_api.modules.organizations.application.ports import (  # noqa: TC001
    OrganizationService,
)
from kernelon_api.modules.organizations.domain import Principal  # noqa: TC001
from kernelon_api.platform.application_errors import ApplicationError


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class CaseCreate(StrictModel):
    member_id: UUID | None = Field(default=None, alias="memberId")
    employee_name: str = Field(alias="employeeName", min_length=1, max_length=120)
    employee_no: str = Field(alias="employeeNo", min_length=1, max_length=80)
    department: str | None = Field(default=None, max_length=120)
    job_title: str = Field(alias="jobTitle", min_length=1, max_length=120)
    batch_name: str | None = Field(default=None, alias="batchName", max_length=120)
    joined_on: date = Field(alias="joinedOn")
    probation_end_on: date = Field(alias="probationEndOn")
    manager_member_id: UUID | None = Field(default=None, alias="managerMemberId")
    owner_member_id: UUID | None = Field(default=None, alias="ownerMemberId")
    template_id: UUID | None = Field(default=None, alias="templateId")
    summary: str | None = Field(default=None, max_length=4000)

    @model_validator(mode="after")
    def dates_are_ordered(self) -> CaseCreate:
        if self.probation_end_on <= self.joined_on:
            raise ValueError("probationEndOn must be later than joinedOn")
        return self


class TransitionRequest(StrictModel):
    target: Literal["active", "suspended", "completed", "cancelled", "terminated"]
    reason: str | None = Field(default=None, max_length=2000)


class TemplateTask(StrictModel):
    title: str = Field(min_length=1, max_length=240)
    description: str | None = None
    phase: str = Field(default="onboarding", max_length=80)
    due_days: int = Field(default=7, alias="dueDays", ge=0, le=365)
    assignee_role: str = Field(default="newcomer", alias="assigneeRole", max_length=40)


class TemplateCreate(StrictModel):
    name: str = Field(min_length=1, max_length=160)
    position_family: str | None = Field(default=None, alias="positionFamily", max_length=120)
    probation_days: int = Field(default=90, alias="probationDays", ge=1, le=730)
    tasks: list[TemplateTask] = Field(default_factory=list)
    assessment_schema: dict[str, Any] = Field(default_factory=dict, alias="assessmentSchema")


class MentorUpsert(StrictModel):
    member_id: UUID | None = Field(default=None, alias="memberId")
    display_name: str = Field(alias="displayName", min_length=1, max_length=120)
    job_title: str | None = Field(default=None, alias="jobTitle", max_length=120)
    skills: list[str] = Field(default_factory=list)
    capacity: int = Field(default=3, ge=1, le=20)
    status: Literal["available", "busy", "unavailable"] = "available"


class MentorAssign(StrictModel):
    mentor_member_id: UUID = Field(alias="mentorMemberId")
    mentor_name: str = Field(alias="mentorName", min_length=1, max_length=120)
    started_on: date | None = Field(default=None, alias="startedOn")
    reason: str | None = Field(default=None, max_length=2000)


class StatusUpdate(StrictModel):
    status: str = Field(min_length=1, max_length=32)
    completion_note: str | None = Field(default=None, alias="completionNote", max_length=4000)


class ActionCreate(StrictModel):
    title: str = Field(min_length=1, max_length=240)
    assignee_member_id: UUID | None = Field(default=None, alias="assigneeMemberId")
    assignee_name: str | None = Field(default=None, alias="assigneeName", max_length=120)
    due_on: date = Field(alias="dueOn")


class CheckinCreate(StrictModel):
    held_at: datetime = Field(alias="heldAt")
    kind: str = Field(default="regular", max_length=40)
    topic: str = Field(min_length=1, max_length=240)
    shared_notes: str | None = Field(default=None, alias="sharedNotes", max_length=10000)
    employee_reflection: str | None = Field(
        default=None, alias="employeeReflection", max_length=10000
    )
    mentor_notes: str | None = Field(default=None, alias="mentorNotes", max_length=10000)
    support_needed: str | None = Field(default=None, alias="supportNeeded", max_length=5000)
    next_checkin_on: date | None = Field(default=None, alias="nextCheckinOn")
    actions: list[ActionCreate] = Field(default_factory=list)


def _default_required_roles() -> list[Literal["newcomer", "mentor", "manager", "hr"]]:
    return ["newcomer", "mentor", "manager"]


class AssessmentCreate(StrictModel):
    kind: Literal["midterm", "probation", "extension"]
    planned_on: date = Field(alias="plannedOn")
    deadline_on: date = Field(alias="deadlineOn")
    required_roles: list[Literal["newcomer", "mentor", "manager", "hr"]] = Field(
        default_factory=_default_required_roles, alias="requiredRoles"
    )


class AssessmentSubmit(StrictModel):
    role: Literal["newcomer", "mentor", "manager", "hr"]
    content: dict[str, Any]
    score: float | None = Field(default=None, ge=0, le=100)


class AssessmentDecision(StrictModel):
    decision: Literal["passed", "extended", "failed"]
    decision_notes: str = Field(alias="decisionNotes", min_length=1, max_length=10000)
    extension_end_on: date | None = Field(default=None, alias="extensionEndOn")


class RiskUpdate(StrictModel):
    status: Literal["in_progress", "closed", "ignored"]
    resolution: str | None = Field(default=None, max_length=5000)


async def _principal(
    request: Request[Any, Any, Any],
    identity_service: IdentityService,
    organization_service: OrganizationService,
) -> Principal:
    user_id = await identity_service.authenticate(request.headers.get("Authorization"))
    profile = await organization_service.get_current_profile(user_id)
    organization_id = profile.get("organizationId")
    if not organization_id:
        raise ApplicationError("ORGANIZATION_REQUIRED", "Active organization is required.", 403)
    return await organization_service.principal(
        user_id, UUID(str(organization_id)), "organization.read"
    )


class LifecycleController(Controller):
    path = "/lifecycle"
    tags = ("lifecycle",)

    @get("/context", operation_id="lifecycle_context")
    async def context(
        self,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
    ) -> dict[str, Any]:
        principal = await _principal(request, identity_service, organization_service)
        return {
            "organizationId": str(principal.organization_id),
            "membershipId": str(principal.membership_id),
            "roleKeys": sorted(principal.role_keys),
            "permissions": sorted(principal.permissions),
        }

    @get("/dashboard", operation_id="lifecycle_dashboard")
    async def dashboard(
        self,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
        lifecycle_service: NamedDependency[LifecycleService],
    ) -> dict[str, Any]:
        return await lifecycle_service.dashboard(
            await _principal(request, identity_service, organization_service)
        )

    @get("/cases", operation_id="lifecycle_cases_list")
    async def cases(
        self,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
        lifecycle_service: NamedDependency[LifecycleService],
        search: str | None = None,
        status: str | None = None,
        risk: str | None = None,
    ) -> list[dict[str, Any]]:
        return await lifecycle_service.list_cases(
            await _principal(request, identity_service, organization_service), search, status, risk
        )

    @post("/cases", operation_id="lifecycle_cases_create")
    async def create_case(
        self,
        data: CaseCreate,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
        lifecycle_service: NamedDependency[LifecycleService],
    ) -> dict[str, Any]:
        return await lifecycle_service.create_case(
            await _principal(request, identity_service, organization_service),
            data.model_dump(by_alias=True),
        )

    @get("/cases/{case_id:uuid}", operation_id="lifecycle_cases_get")
    async def get_case(
        self,
        case_id: UUID,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
        lifecycle_service: NamedDependency[LifecycleService],
    ) -> dict[str, Any]:
        return await lifecycle_service.get_case(
            await _principal(request, identity_service, organization_service), case_id
        )

    @post("/cases/{case_id:uuid}/transition", operation_id="lifecycle_cases_transition")
    async def transition_case(
        self,
        case_id: UUID,
        data: TransitionRequest,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
        lifecycle_service: NamedDependency[LifecycleService],
    ) -> dict[str, Any]:
        return await lifecycle_service.transition_case(
            await _principal(request, identity_service, organization_service),
            case_id,
            data.target,
            data.reason,
        )

    @get("/templates", operation_id="lifecycle_templates_list")
    async def templates(
        self,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
        lifecycle_service: NamedDependency[LifecycleService],
    ) -> list[dict[str, Any]]:
        return await lifecycle_service.list_templates(
            await _principal(request, identity_service, organization_service)
        )

    @post("/templates", operation_id="lifecycle_templates_create")
    async def create_template(
        self,
        data: TemplateCreate,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
        lifecycle_service: NamedDependency[LifecycleService],
    ) -> dict[str, Any]:
        return await lifecycle_service.create_template(
            await _principal(request, identity_service, organization_service),
            data.model_dump(by_alias=True),
        )

    @get("/mentors", operation_id="lifecycle_mentors_list")
    async def mentors(
        self,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
        lifecycle_service: NamedDependency[LifecycleService],
    ) -> list[dict[str, Any]]:
        return await lifecycle_service.list_mentors(
            await _principal(request, identity_service, organization_service)
        )

    @put("/mentors", operation_id="lifecycle_mentors_upsert")
    async def upsert_mentor(
        self,
        data: MentorUpsert,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
        lifecycle_service: NamedDependency[LifecycleService],
    ) -> dict[str, Any]:
        return await lifecycle_service.upsert_mentor(
            await _principal(request, identity_service, organization_service),
            data.model_dump(by_alias=True),
        )

    @post("/cases/{case_id:uuid}/mentor", operation_id="lifecycle_mentor_assign")
    async def assign_mentor(
        self,
        case_id: UUID,
        data: MentorAssign,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
        lifecycle_service: NamedDependency[LifecycleService],
    ) -> dict[str, Any]:
        return await lifecycle_service.assign_mentor(
            await _principal(request, identity_service, organization_service),
            case_id,
            data.model_dump(by_alias=True),
        )

    @patch("/cases/{case_id:uuid}/tasks/{task_id:uuid}", operation_id="lifecycle_task_update")
    async def update_task(
        self,
        case_id: UUID,
        task_id: UUID,
        data: StatusUpdate,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
        lifecycle_service: NamedDependency[LifecycleService],
    ) -> dict[str, Any]:
        return await lifecycle_service.update_task(
            await _principal(request, identity_service, organization_service),
            case_id,
            task_id,
            data.model_dump(by_alias=True),
        )

    @post("/cases/{case_id:uuid}/checkins", operation_id="lifecycle_checkin_create")
    async def create_checkin(
        self,
        case_id: UUID,
        data: CheckinCreate,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
        lifecycle_service: NamedDependency[LifecycleService],
    ) -> dict[str, Any]:
        return await lifecycle_service.create_checkin(
            await _principal(request, identity_service, organization_service),
            case_id,
            data.model_dump(by_alias=True),
        )

    @patch("/cases/{case_id:uuid}/actions/{action_id:uuid}", operation_id="lifecycle_action_update")
    async def update_action(
        self,
        case_id: UUID,
        action_id: UUID,
        data: StatusUpdate,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
        lifecycle_service: NamedDependency[LifecycleService],
    ) -> dict[str, Any]:
        return await lifecycle_service.update_action(
            await _principal(request, identity_service, organization_service),
            case_id,
            action_id,
            data.model_dump(by_alias=True),
        )

    @post("/cases/{case_id:uuid}/assessments", operation_id="lifecycle_assessment_create")
    async def create_assessment(
        self,
        case_id: UUID,
        data: AssessmentCreate,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
        lifecycle_service: NamedDependency[LifecycleService],
    ) -> dict[str, Any]:
        return await lifecycle_service.create_assessment(
            await _principal(request, identity_service, organization_service),
            case_id,
            data.model_dump(by_alias=True),
        )

    @post(
        "/cases/{case_id:uuid}/assessments/{round_id:uuid}/submissions",
        operation_id="lifecycle_assessment_submit",
    )
    async def submit_assessment(
        self,
        case_id: UUID,
        round_id: UUID,
        data: AssessmentSubmit,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
        lifecycle_service: NamedDependency[LifecycleService],
    ) -> dict[str, Any]:
        return await lifecycle_service.submit_assessment(
            await _principal(request, identity_service, organization_service),
            case_id,
            round_id,
            data.model_dump(by_alias=True),
        )

    @post(
        "/cases/{case_id:uuid}/assessments/{round_id:uuid}/decision",
        operation_id="lifecycle_assessment_decide",
    )
    async def decide_assessment(
        self,
        case_id: UUID,
        round_id: UUID,
        data: AssessmentDecision,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
        lifecycle_service: NamedDependency[LifecycleService],
    ) -> dict[str, Any]:
        return await lifecycle_service.decide_assessment(
            await _principal(request, identity_service, organization_service),
            case_id,
            round_id,
            data.model_dump(by_alias=True),
        )

    @patch("/cases/{case_id:uuid}/risks/{risk_id:uuid}", operation_id="lifecycle_risk_update")
    async def resolve_risk(
        self,
        case_id: UUID,
        risk_id: UUID,
        data: RiskUpdate,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
        organization_service: NamedDependency[OrganizationService],
        lifecycle_service: NamedDependency[LifecycleService],
    ) -> dict[str, Any]:
        return await lifecycle_service.resolve_risk(
            await _principal(request, identity_service, organization_service),
            case_id,
            risk_id,
            data.model_dump(by_alias=True),
        )
