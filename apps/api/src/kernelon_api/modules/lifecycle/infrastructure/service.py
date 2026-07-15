"""Transactional lifecycle service."""

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession  # noqa: TC002

from kernelon_api.modules.lifecycle.domain import (
    CaseStatus,
    ReviewStatus,
    ensure_case_transition,
    ensure_review_transition,
)
from kernelon_api.modules.lifecycle.infrastructure.models import (
    ActionItemModel,
    AssessmentRoundModel,
    AssessmentSubmissionModel,
    CheckinModel,
    LifecycleAuditModel,
    LifecycleCaseModel,
    LifecycleRiskModel,
    LifecycleTaskModel,
    LifecycleTemplateModel,
    MentorAssignmentModel,
    MentorProfileModel,
)
from kernelon_api.modules.organizations.domain import Permission, Principal
from kernelon_api.platform.application_errors import ApplicationError

CASE_MANAGER_PERMISSIONS = {
    Permission.ONBOARDING_MANAGE.value,
    Permission.GROWTH_MANAGE.value,
    Permission.ASSESSMENT_MANAGE.value,
}


class SQLAlchemyLifecycleService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def dashboard(self, principal: Principal) -> dict[str, Any]:
        if principal.has(Permission.ONBOARDING_MANAGE.value):
            await self._sync_automatic_risks(principal)
        cases = await self.list_cases(principal, None, None, None)
        today = datetime.now(UTC).date()
        due_soon = sum(
            1
            for item in cases
            if item["status"] in {"active", "suspended"}
            and 0 <= (date.fromisoformat(item["probationEndOn"]) - today).days <= 30
        )
        case_ids = [UUID(item["id"]) for item in cases]
        overdue_tasks = (
            int(
                await self.session.scalar(
                    select(func.count(LifecycleTaskModel.id)).where(
                        LifecycleTaskModel.case_id.in_(case_ids),
                        LifecycleTaskModel.due_on < today,
                        LifecycleTaskModel.status.not_in(("completed", "cancelled")),
                    )
                )
                or 0
            )
            if case_ids
            else 0
        )
        open_risks = (
            int(
                await self.session.scalar(
                    select(func.count(LifecycleRiskModel.id)).where(
                        LifecycleRiskModel.case_id.in_(case_ids),
                        LifecycleRiskModel.status.in_(("open", "in_progress")),
                    )
                )
                or 0
            )
            if case_ids
            else 0
        )
        stages: dict[str, int] = {}
        for item in cases:
            stages[item["status"]] = stages.get(item["status"], 0) + 1
        return {
            "activeCount": sum(item["status"] in {"active", "suspended"} for item in cases),
            "dueSoonCount": due_soon,
            "overdueTaskCount": overdue_tasks,
            "openRiskCount": open_risks,
            "stages": stages,
            "priorityCases": sorted(
                cases,
                key=lambda item: (
                    {"high": 0, "attention": 1, "normal": 2}.get(item["riskLevel"], 3),
                    item["probationEndOn"],
                ),
            )[:8],
        }

    async def list_cases(
        self,
        principal: Principal,
        search: str | None,
        status: str | None,
        risk: str | None,
    ) -> list[dict[str, Any]]:
        statement = select(LifecycleCaseModel).where(
            LifecycleCaseModel.organization_id == principal.organization_id
        )
        if not self._can_manage_all(principal):
            related_case_ids = select(MentorAssignmentModel.case_id).where(
                MentorAssignmentModel.mentor_member_id == principal.membership_id,
                MentorAssignmentModel.ended_on.is_(None),
            )
            statement = statement.where(
                or_(
                    LifecycleCaseModel.member_id == principal.membership_id,
                    LifecycleCaseModel.manager_member_id == principal.membership_id,
                    LifecycleCaseModel.owner_member_id == principal.membership_id,
                    LifecycleCaseModel.id.in_(related_case_ids),
                )
            )
        if search:
            pattern = f"%{search.strip()}%"
            statement = statement.where(
                or_(
                    LifecycleCaseModel.employee_name.ilike(pattern),
                    LifecycleCaseModel.employee_no.ilike(pattern),
                    LifecycleCaseModel.job_title.ilike(pattern),
                )
            )
        if status:
            statement = statement.where(LifecycleCaseModel.status == status)
        if risk:
            statement = statement.where(LifecycleCaseModel.risk_level == risk)
        models = (
            await self.session.scalars(
                statement.order_by(
                    LifecycleCaseModel.probation_end_on, LifecycleCaseModel.created_at
                )
            )
        ).all()
        progress = await self._task_progress([model.id for model in models])
        mentors = await self._current_mentors([model.id for model in models])
        return [
            self._case_summary(model, progress.get(model.id, (0, 0)), mentors.get(model.id))
            for model in models
        ]

    async def get_case(self, principal: Principal, case_id: UUID) -> dict[str, Any]:
        model = await self._require_case(principal, case_id)
        tasks = (
            await self.session.scalars(
                select(LifecycleTaskModel)
                .where(LifecycleTaskModel.case_id == case_id)
                .order_by(LifecycleTaskModel.sort_order, LifecycleTaskModel.due_on)
            )
        ).all()
        checkins = (
            await self.session.scalars(
                select(CheckinModel)
                .where(CheckinModel.case_id == case_id)
                .order_by(CheckinModel.held_at.desc())
            )
        ).all()
        actions = (
            await self.session.scalars(
                select(ActionItemModel)
                .where(ActionItemModel.case_id == case_id)
                .order_by(ActionItemModel.due_on)
            )
        ).all()
        assessments = (
            await self.session.scalars(
                select(AssessmentRoundModel)
                .where(AssessmentRoundModel.case_id == case_id)
                .order_by(AssessmentRoundModel.created_at.desc())
            )
        ).all()
        round_ids = [item.id for item in assessments]
        submissions = (
            (
                await self.session.scalars(
                    select(AssessmentSubmissionModel).where(
                        AssessmentSubmissionModel.round_id.in_(round_ids)
                    )
                )
            ).all()
            if round_ids
            else []
        )
        risks = (
            await self.session.scalars(
                select(LifecycleRiskModel)
                .where(LifecycleRiskModel.case_id == case_id)
                .order_by(LifecycleRiskModel.created_at.desc())
            )
        ).all()
        assignments = (
            await self.session.scalars(
                select(MentorAssignmentModel)
                .where(MentorAssignmentModel.case_id == case_id)
                .order_by(MentorAssignmentModel.started_on.desc())
            )
        ).all()
        audits = (
            await self.session.scalars(
                select(LifecycleAuditModel)
                .where(LifecycleAuditModel.case_id == case_id)
                .order_by(LifecycleAuditModel.created_at.desc())
                .limit(50)
            )
        ).all()
        submissions_by_round: dict[UUID, list[dict[str, Any]]] = {}
        for submission in submissions:
            submissions_by_round.setdefault(submission.round_id, []).append(
                self._submission_dict(submission, principal)
            )
        current_mentor = next((item for item in assignments if item.ended_on is None), None)
        detail = self._case_summary(
            model,
            (sum(task.status == "completed" for task in tasks), len(tasks)),
            current_mentor,
        )
        detail.update(
            {
                "summary": model.summary,
                "memberId": str(model.member_id) if model.member_id else None,
                "managerMemberId": (
                    str(model.manager_member_id) if model.manager_member_id else None
                ),
                "ownerMemberId": str(model.owner_member_id),
                "templateId": str(model.template_id) if model.template_id else None,
                "tasks": [self._task_dict(item) for item in tasks],
                "checkins": [self._checkin_dict(item, principal, model) for item in checkins],
                "actions": [self._action_dict(item) for item in actions],
                "assessments": [
                    {
                        **self._assessment_dict(item),
                        "submissions": submissions_by_round.get(item.id, []),
                    }
                    for item in assessments
                ],
                "risks": [self._risk_dict(item) for item in risks],
                "mentorHistory": [self._mentor_assignment_dict(item) for item in assignments],
                "auditTrail": [
                    {
                        "id": str(item.id),
                        "actorMemberId": str(item.actor_member_id),
                        "eventType": item.event_type,
                        "payload": item.payload,
                        "createdAt": item.created_at.isoformat(),
                    }
                    for item in audits
                ],
            }
        )
        return detail

    async def create_case(self, principal: Principal, values: dict[str, Any]) -> dict[str, Any]:
        self._require_permission(principal, Permission.ONBOARDING_MANAGE)
        template_id = values.get("templateId")
        if template_id and not await self.session.scalar(
            select(LifecycleTemplateModel.id).where(
                LifecycleTemplateModel.id == template_id,
                LifecycleTemplateModel.organization_id == principal.organization_id,
                LifecycleTemplateModel.status == "active",
            )
        ):
            raise ApplicationError(
                "LIFECYCLE_TEMPLATE_NOT_FOUND", "Active lifecycle template was not found.", 404
            )
        model = LifecycleCaseModel(
            organization_id=principal.organization_id,
            member_id=values.get("memberId"),
            employee_name=values["employeeName"].strip(),
            employee_no=values["employeeNo"].strip(),
            department=values.get("department"),
            job_title=values["jobTitle"].strip(),
            batch_name=values.get("batchName"),
            joined_on=values["joinedOn"],
            probation_end_on=values["probationEndOn"],
            manager_member_id=values.get("managerMemberId"),
            owner_member_id=values.get("ownerMemberId") or principal.membership_id,
            template_id=template_id,
            summary=values.get("summary"),
            created_by=principal.membership_id,
        )
        self.session.add(model)
        await self.session.flush()
        self._audit(principal, model.id, "case.created", {"status": model.status})
        await self.session.commit()
        return await self.get_case(principal, model.id)

    async def transition_case(
        self,
        principal: Principal,
        case_id: UUID,
        target: str,
        reason: str | None,
    ) -> dict[str, Any]:
        self._require_permission(principal, Permission.ONBOARDING_MANAGE)
        model = await self._require_case(principal, case_id)
        try:
            ensure_case_transition(model.status, target)
        except (ValueError, KeyError) as exc:
            raise ApplicationError("INVALID_CASE_TRANSITION", str(exc), 409) from exc
        if target == CaseStatus.ACTIVE and model.status == CaseStatus.DRAFT:
            await self._instantiate_plan(model)
        previous = model.status
        model.status = target
        self._audit(
            principal,
            model.id,
            "case.transitioned",
            {"from": previous, "to": target, "reason": reason},
        )
        await self.session.commit()
        return await self.get_case(principal, case_id)

    async def list_templates(self, principal: Principal) -> list[dict[str, Any]]:
        models = (
            await self.session.scalars(
                select(LifecycleTemplateModel)
                .where(LifecycleTemplateModel.organization_id == principal.organization_id)
                .order_by(LifecycleTemplateModel.name, LifecycleTemplateModel.version.desc())
            )
        ).all()
        return [self._template_dict(item) for item in models]

    async def create_template(self, principal: Principal, values: dict[str, Any]) -> dict[str, Any]:
        self._require_permission(principal, Permission.ONBOARDING_MANAGE)
        latest = await self.session.scalar(
            select(func.max(LifecycleTemplateModel.version)).where(
                LifecycleTemplateModel.organization_id == principal.organization_id,
                LifecycleTemplateModel.name == values["name"],
            )
        )
        model = LifecycleTemplateModel(
            organization_id=principal.organization_id,
            name=values["name"],
            position_family=values.get("positionFamily"),
            probation_days=values.get("probationDays", 90),
            version=int(latest or 0) + 1,
            tasks=values.get("tasks", []),
            assessment_schema=values.get("assessmentSchema", {}),
            created_by=principal.membership_id,
        )
        self.session.add(model)
        await self.session.commit()
        return self._template_dict(model)

    async def list_mentors(self, principal: Principal) -> list[dict[str, Any]]:
        models = (
            await self.session.scalars(
                select(MentorProfileModel)
                .where(MentorProfileModel.organization_id == principal.organization_id)
                .order_by(MentorProfileModel.display_name)
            )
        ).all()
        member_ids = [item.member_id for item in models]
        loads: dict[UUID, int] = {}
        if member_ids:
            rows = (
                await self.session.execute(
                    select(
                        MentorAssignmentModel.mentor_member_id,
                        func.count(MentorAssignmentModel.id),
                    )
                    .join(
                        LifecycleCaseModel, LifecycleCaseModel.id == MentorAssignmentModel.case_id
                    )
                    .where(
                        LifecycleCaseModel.organization_id == principal.organization_id,
                        MentorAssignmentModel.mentor_member_id.in_(member_ids),
                        MentorAssignmentModel.ended_on.is_(None),
                    )
                    .group_by(MentorAssignmentModel.mentor_member_id)
                )
            ).all()
            loads = {member_id: int(count) for member_id, count in rows}
        return [self._mentor_dict(item, loads.get(item.member_id, 0)) for item in models]

    async def upsert_mentor(self, principal: Principal, values: dict[str, Any]) -> dict[str, Any]:
        self._require_permission(principal, Permission.ONBOARDING_MANAGE)
        member_id = values.get("memberId") or principal.membership_id
        if not self._can_manage_all(principal) and member_id != principal.membership_id:
            raise ApplicationError("MENTOR_ACCESS_DENIED", "Mentors may edit only themselves.", 403)
        model = await self.session.scalar(
            select(MentorProfileModel).where(
                MentorProfileModel.organization_id == principal.organization_id,
                MentorProfileModel.member_id == member_id,
            )
        )
        if model is None:
            model = MentorProfileModel(
                organization_id=principal.organization_id,
                member_id=member_id,
                display_name=values["displayName"],
            )
            self.session.add(model)
        model.display_name = values["displayName"]
        model.job_title = values.get("jobTitle")
        model.skills = values.get("skills", [])
        model.capacity = values.get("capacity", 3)
        model.status = values.get("status", "available")
        await self.session.commit()
        return self._mentor_dict(model, 0)

    async def assign_mentor(
        self,
        principal: Principal,
        case_id: UUID,
        values: dict[str, Any],
    ) -> dict[str, Any]:
        self._require_permission(principal, Permission.MENTORSHIP_MANAGE)
        model = await self._require_case(principal, case_id)
        active = await self.session.scalar(
            select(MentorAssignmentModel).where(
                MentorAssignmentModel.case_id == case_id,
                MentorAssignmentModel.ended_on.is_(None),
            )
        )
        started_on = values.get("startedOn") or datetime.now(UTC).date()
        if active:
            if active.mentor_member_id == values["mentorMemberId"]:
                return await self.get_case(principal, case_id)
            active.ended_on = started_on
        assignment = MentorAssignmentModel(
            case_id=case_id,
            mentor_member_id=values["mentorMemberId"],
            mentor_name=values["mentorName"],
            started_on=started_on,
            reason=values.get("reason"),
            assigned_by=principal.membership_id,
        )
        self.session.add(assignment)
        self._audit(
            principal,
            model.id,
            "mentor.assigned",
            {"mentorMemberId": str(assignment.mentor_member_id), "reason": assignment.reason},
        )
        await self.session.commit()
        return await self.get_case(principal, case_id)

    async def update_task(
        self,
        principal: Principal,
        case_id: UUID,
        task_id: UUID,
        values: dict[str, Any],
    ) -> dict[str, Any]:
        case = await self._require_case(principal, case_id)
        task = await self.session.scalar(
            select(LifecycleTaskModel).where(
                LifecycleTaskModel.id == task_id, LifecycleTaskModel.case_id == case_id
            )
        )
        if task is None:
            raise ApplicationError("TASK_NOT_FOUND", "Lifecycle task was not found.", 404)
        if not await self._can_contribute(principal, case):
            raise ApplicationError("TASK_ACCESS_DENIED", "Task update is not allowed.", 403)
        status = values.get("status")
        if status not in {"not_started", "in_progress", "pending_review", "completed", "cancelled"}:
            raise ApplicationError("INVALID_TASK_STATUS", "Task status is invalid.")
        task.status = status
        task.completion_note = values.get("completionNote")
        task.completed_at = datetime.now(UTC) if status == "completed" else None
        self._audit(principal, case.id, "task.updated", {"taskId": str(task.id), "status": status})
        await self._recalculate_risk(case)
        await self.session.commit()
        return self._task_dict(task)

    async def create_checkin(
        self,
        principal: Principal,
        case_id: UUID,
        values: dict[str, Any],
    ) -> dict[str, Any]:
        case = await self._require_case(principal, case_id)
        if not await self._can_contribute(principal, case):
            raise ApplicationError("CHECKIN_ACCESS_DENIED", "Check-in is not allowed.", 403)
        model = CheckinModel(
            case_id=case_id,
            held_at=values["heldAt"],
            kind=values.get("kind", "regular"),
            topic=values["topic"],
            shared_notes=values.get("sharedNotes"),
            employee_reflection=values.get("employeeReflection"),
            mentor_notes=values.get("mentorNotes"),
            support_needed=values.get("supportNeeded"),
            next_checkin_on=values.get("nextCheckinOn"),
            author_member_id=principal.membership_id,
            status="submitted",
            submitted_at=datetime.now(UTC),
        )
        if not model.shared_notes and not values.get("actions"):
            raise ApplicationError(
                "CHECKIN_CONTENT_REQUIRED", "Shared notes or at least one action is required."
            )
        self.session.add(model)
        await self.session.flush()
        for action in values.get("actions", []):
            self.session.add(
                ActionItemModel(
                    case_id=case_id,
                    checkin_id=model.id,
                    title=action["title"],
                    assignee_member_id=action.get("assigneeMemberId") or principal.membership_id,
                    assignee_name=action.get("assigneeName") or "当前负责人",
                    due_on=action["dueOn"],
                )
            )
        self._audit(principal, case.id, "checkin.submitted", {"checkinId": str(model.id)})
        await self.session.commit()
        return self._checkin_dict(model, principal, case)

    async def update_action(
        self,
        principal: Principal,
        case_id: UUID,
        action_id: UUID,
        values: dict[str, Any],
    ) -> dict[str, Any]:
        case = await self._require_case(principal, case_id)
        action = await self.session.scalar(
            select(ActionItemModel).where(
                ActionItemModel.id == action_id, ActionItemModel.case_id == case_id
            )
        )
        if action is None:
            raise ApplicationError("ACTION_NOT_FOUND", "Action item was not found.", 404)
        if action.assignee_member_id != principal.membership_id and not await self._can_contribute(
            principal, case
        ):
            raise ApplicationError("ACTION_ACCESS_DENIED", "Action update is not allowed.", 403)
        status = values.get("status")
        if status not in {"pending", "in_progress", "completed", "cancelled"}:
            raise ApplicationError("INVALID_ACTION_STATUS", "Action status is invalid.")
        action.status = status
        action.completion_note = values.get("completionNote")
        action.completed_at = datetime.now(UTC) if status == "completed" else None
        self._audit(
            principal, case.id, "action.updated", {"actionId": str(action.id), "status": status}
        )
        await self.session.commit()
        return self._action_dict(action)

    async def create_assessment(
        self,
        principal: Principal,
        case_id: UUID,
        values: dict[str, Any],
    ) -> dict[str, Any]:
        self._require_permission(principal, Permission.ASSESSMENT_MANAGE)
        case = await self._require_case(principal, case_id)
        model = AssessmentRoundModel(
            case_id=case_id,
            kind=values["kind"],
            status=ReviewStatus.COLLECTING,
            planned_on=values["plannedOn"],
            deadline_on=values["deadlineOn"],
            required_roles=values.get("requiredRoles", ["newcomer", "mentor", "manager"]),
            created_by=principal.membership_id,
        )
        self.session.add(model)
        self._audit(principal, case.id, "assessment.created", {"kind": model.kind})
        await self.session.commit()
        return self._assessment_dict(model)

    async def submit_assessment(
        self,
        principal: Principal,
        case_id: UUID,
        round_id: UUID,
        values: dict[str, Any],
    ) -> dict[str, Any]:
        case = await self._require_case(principal, case_id)
        if not await self._can_contribute(principal, case):
            raise ApplicationError("ASSESSMENT_ACCESS_DENIED", "Assessment is not allowed.", 403)
        round_model = await self._require_round(case_id, round_id)
        if round_model.status not in {ReviewStatus.COLLECTING, ReviewStatus.UNDER_REVIEW}:
            raise ApplicationError(
                "ASSESSMENT_CLOSED", "Assessment no longer accepts submissions.", 409
            )
        role = values["role"]
        if role not in round_model.required_roles:
            raise ApplicationError("ASSESSMENT_ROLE_INVALID", "Assessment role is not required.")
        submission = await self.session.scalar(
            select(AssessmentSubmissionModel).where(
                AssessmentSubmissionModel.round_id == round_id,
                AssessmentSubmissionModel.member_id == principal.membership_id,
                AssessmentSubmissionModel.role == role,
            )
        )
        if submission is None:
            submission = AssessmentSubmissionModel(
                round_id=round_id,
                member_id=principal.membership_id,
                role=role,
            )
            self.session.add(submission)
        submission.content = values["content"]
        submission.score = values.get("score")
        submission.status = "submitted"
        submission.submitted_at = datetime.now(UTC)
        await self.session.flush()
        submitted_roles = set(
            (
                await self.session.scalars(
                    select(AssessmentSubmissionModel.role).where(
                        AssessmentSubmissionModel.round_id == round_id,
                        AssessmentSubmissionModel.status == "submitted",
                    )
                )
            ).all()
        )
        if set(round_model.required_roles) <= submitted_roles:
            round_model.status = ReviewStatus.DECISION_PENDING
        else:
            round_model.status = ReviewStatus.UNDER_REVIEW
        self._audit(
            principal,
            case.id,
            "assessment.submitted",
            {"roundId": str(round_id), "role": role},
        )
        await self.session.commit()
        return self._submission_dict(submission, principal)

    async def decide_assessment(
        self,
        principal: Principal,
        case_id: UUID,
        round_id: UUID,
        values: dict[str, Any],
    ) -> dict[str, Any]:
        self._require_permission(principal, Permission.ASSESSMENT_MANAGE)
        case = await self._require_case(principal, case_id)
        model = await self._require_round(case_id, round_id)
        target = {
            "passed": ReviewStatus.PASSED,
            "extended": ReviewStatus.EXTENDED,
            "failed": ReviewStatus.FAILED,
        }.get(values["decision"])
        if target is None:
            raise ApplicationError("INVALID_ASSESSMENT_DECISION", "Decision is invalid.")
        try:
            ensure_review_transition(model.status, target)
        except ValueError as exc:
            raise ApplicationError("INVALID_ASSESSMENT_TRANSITION", str(exc), 409) from exc
        if target == ReviewStatus.EXTENDED and not values.get("extensionEndOn"):
            raise ApplicationError("EXTENSION_DATE_REQUIRED", "Extension end date is required.")
        model.status = target
        model.decision = values["decision"]
        model.decision_notes = values["decisionNotes"]
        model.extension_end_on = values.get("extensionEndOn")
        model.decided_by = principal.membership_id
        model.decided_at = datetime.now(UTC)
        if target == ReviewStatus.PASSED and model.kind in {"probation", "extension"}:
            case.status = CaseStatus.COMPLETED
        elif target == ReviewStatus.FAILED:
            case.status = CaseStatus.TERMINATED
        elif target == ReviewStatus.EXTENDED:
            case.probation_end_on = model.extension_end_on or case.probation_end_on
            follow_up = AssessmentRoundModel(
                case_id=case_id,
                kind="extension",
                status=ReviewStatus.COLLECTING,
                planned_on=case.probation_end_on,
                deadline_on=case.probation_end_on,
                required_roles=model.required_roles,
                created_by=principal.membership_id,
            )
            self.session.add(follow_up)
        self._audit(
            principal,
            case.id,
            "assessment.decided",
            {"roundId": str(round_id), "decision": model.decision},
        )
        await self.session.commit()
        return self._assessment_dict(model)

    async def resolve_risk(
        self,
        principal: Principal,
        case_id: UUID,
        risk_id: UUID,
        values: dict[str, Any],
    ) -> dict[str, Any]:
        self._require_permission(principal, Permission.ONBOARDING_MANAGE)
        case = await self._require_case(principal, case_id)
        risk = await self.session.scalar(
            select(LifecycleRiskModel).where(
                LifecycleRiskModel.id == risk_id, LifecycleRiskModel.case_id == case_id
            )
        )
        if risk is None:
            raise ApplicationError("RISK_NOT_FOUND", "Risk was not found.", 404)
        status = values["status"]
        if status not in {"in_progress", "closed", "ignored"}:
            raise ApplicationError("INVALID_RISK_STATUS", "Risk status is invalid.")
        if status in {"closed", "ignored"} and not values.get("resolution"):
            raise ApplicationError("RISK_RESOLUTION_REQUIRED", "Resolution is required.")
        risk.status = status
        risk.resolution = values.get("resolution")
        risk.closed_at = datetime.now(UTC) if status in {"closed", "ignored"} else None
        self._audit(principal, case.id, "risk.updated", {"riskId": str(risk.id), "status": status})
        await self.session.flush()
        await self._recalculate_risk(case)
        await self.session.commit()
        return self._risk_dict(risk)

    async def _require_case(self, principal: Principal, case_id: UUID) -> LifecycleCaseModel:
        model = await self.session.scalar(
            select(LifecycleCaseModel).where(
                LifecycleCaseModel.id == case_id,
                LifecycleCaseModel.organization_id == principal.organization_id,
            )
        )
        if model is None:
            raise ApplicationError("LIFECYCLE_CASE_NOT_FOUND", "Lifecycle case was not found.", 404)
        if self._can_manage_all(principal):
            return model
        if (
            model.member_id in {principal.membership_id, None}
            and model.member_id == principal.membership_id
        ):
            return model
        if (
            model.manager_member_id == principal.membership_id
            or model.owner_member_id == principal.membership_id
        ):
            return model
        assignment = await self.session.scalar(
            select(MentorAssignmentModel.id).where(
                MentorAssignmentModel.case_id == case_id,
                MentorAssignmentModel.mentor_member_id == principal.membership_id,
                MentorAssignmentModel.ended_on.is_(None),
            )
        )
        if assignment is None:
            raise ApplicationError("LIFECYCLE_ACCESS_DENIED", "Lifecycle case access denied.", 403)
        return model

    async def _require_round(self, case_id: UUID, round_id: UUID) -> AssessmentRoundModel:
        model = await self.session.scalar(
            select(AssessmentRoundModel).where(
                AssessmentRoundModel.id == round_id, AssessmentRoundModel.case_id == case_id
            )
        )
        if model is None:
            raise ApplicationError("ASSESSMENT_NOT_FOUND", "Assessment round was not found.", 404)
        return model

    async def _can_contribute(self, principal: Principal, case: LifecycleCaseModel) -> bool:
        if self._can_manage_all(principal):
            return True
        if principal.membership_id in {
            case.member_id,
            case.manager_member_id,
            case.owner_member_id,
        }:
            return True
        return bool(
            await self.session.scalar(
                select(MentorAssignmentModel.id).where(
                    MentorAssignmentModel.case_id == case.id,
                    MentorAssignmentModel.mentor_member_id == principal.membership_id,
                    MentorAssignmentModel.ended_on.is_(None),
                )
            )
        )

    async def _instantiate_plan(self, case: LifecycleCaseModel) -> None:
        count = int(
            await self.session.scalar(
                select(func.count(LifecycleTaskModel.id)).where(
                    LifecycleTaskModel.case_id == case.id
                )
            )
            or 0
        )
        if count:
            return
        template = (
            await self.session.get(LifecycleTemplateModel, case.template_id)
            if case.template_id
            else None
        )
        tasks = template.tasks if template else self._default_tasks()
        for index, task in enumerate(tasks):
            due_days = int(task.get("dueDays", 7))
            assignee_role = str(task.get("assigneeRole", "newcomer"))
            assignee_id = case.member_id if assignee_role == "newcomer" else None
            self.session.add(
                LifecycleTaskModel(
                    case_id=case.id,
                    title=str(task.get("title", "培养任务"))[:240],
                    description=task.get("description"),
                    phase=str(task.get("phase", "onboarding"))[:80],
                    assignee_role=assignee_role[:40],
                    assignee_member_id=assignee_id,
                    due_on=case.joined_on + timedelta(days=due_days),
                    sort_order=index,
                )
            )

    async def _task_progress(self, case_ids: list[UUID]) -> dict[UUID, tuple[int, int]]:
        if not case_ids:
            return {}
        rows = (
            await self.session.execute(
                select(
                    LifecycleTaskModel.case_id,
                    func.count(LifecycleTaskModel.id),
                    func.count(LifecycleTaskModel.id).filter(
                        LifecycleTaskModel.status == "completed"
                    ),
                )
                .where(
                    LifecycleTaskModel.case_id.in_(case_ids),
                    LifecycleTaskModel.status != "cancelled",
                )
                .group_by(LifecycleTaskModel.case_id)
            )
        ).all()
        return {case_id: (int(done), int(total)) for case_id, total, done in rows}

    async def _current_mentors(self, case_ids: list[UUID]) -> dict[UUID, MentorAssignmentModel]:
        if not case_ids:
            return {}
        models = (
            await self.session.scalars(
                select(MentorAssignmentModel).where(
                    MentorAssignmentModel.case_id.in_(case_ids),
                    MentorAssignmentModel.ended_on.is_(None),
                )
            )
        ).all()
        return {model.case_id: model for model in models}

    async def _recalculate_risk(self, case: LifecycleCaseModel) -> None:
        levels = (
            await self.session.scalars(
                select(LifecycleRiskModel.level).where(
                    LifecycleRiskModel.case_id == case.id,
                    LifecycleRiskModel.status.in_(("open", "in_progress")),
                )
            )
        ).all()
        if "high" in levels:
            case.risk_level = "high"
        elif levels:
            case.risk_level = "attention"
        else:
            overdue = bool(
                await self.session.scalar(
                    select(LifecycleTaskModel.id).where(
                        LifecycleTaskModel.case_id == case.id,
                        LifecycleTaskModel.due_on < datetime.now(UTC).date(),
                        LifecycleTaskModel.status.not_in(("completed", "cancelled")),
                    )
                )
            )
            case.risk_level = "attention" if overdue else "normal"

    async def _sync_automatic_risks(self, principal: Principal) -> None:
        cases = (
            await self.session.scalars(
                select(LifecycleCaseModel).where(
                    LifecycleCaseModel.organization_id == principal.organization_id,
                    LifecycleCaseModel.status == CaseStatus.ACTIVE,
                )
            )
        ).all()
        today = datetime.now(UTC).date()
        now = datetime.now(UTC)
        for case in cases:
            mentor_exists = bool(
                await self.session.scalar(
                    select(MentorAssignmentModel.id).where(
                        MentorAssignmentModel.case_id == case.id,
                        MentorAssignmentModel.ended_on.is_(None),
                    )
                )
            )
            await self._sync_rule(
                case,
                "mentor_missing",
                not mentor_exists,
                "high",
                "培养实例尚未分配有效导师",
                "启动培养后应保持一名有效主导师。",
            )
            oldest_overdue = await self.session.scalar(
                select(func.min(LifecycleTaskModel.due_on)).where(
                    LifecycleTaskModel.case_id == case.id,
                    LifecycleTaskModel.due_on < today,
                    LifecycleTaskModel.status.not_in(("completed", "cancelled")),
                )
            )
            overdue_count = int(
                await self.session.scalar(
                    select(func.count(LifecycleTaskModel.id)).where(
                        LifecycleTaskModel.case_id == case.id,
                        LifecycleTaskModel.due_on < today,
                        LifecycleTaskModel.status.not_in(("completed", "cancelled")),
                    )
                )
                or 0
            )
            maximum_days = (today - oldest_overdue).days if oldest_overdue else 0
            await self._sync_rule(
                case,
                "task_overdue",
                overdue_count > 0,
                "high" if maximum_days > 7 else "attention",
                f"存在 {overdue_count} 项逾期培养任务",
                f"最长已逾期 {maximum_days} 天。",
            )
            last_checkin = await self.session.scalar(
                select(func.max(CheckinModel.held_at)).where(
                    CheckinModel.case_id == case.id,
                    CheckinModel.status == "submitted",
                )
            )
            gap_days = (now - last_checkin).days if last_checkin else (today - case.joined_on).days
            await self._sync_rule(
                case,
                "checkin_gap",
                gap_days > 21,
                "attention",
                "正式沟通记录已超过 21 天未更新",
                f"距最近正式沟通或入职已 {gap_days} 天。",
            )
            has_probation_review = bool(
                await self.session.scalar(
                    select(AssessmentRoundModel.id).where(
                        AssessmentRoundModel.case_id == case.id,
                        AssessmentRoundModel.kind.in_(("probation", "extension")),
                        AssessmentRoundModel.status != ReviewStatus.CANCELLED,
                    )
                )
            )
            days_to_end = (case.probation_end_on - today).days
            await self._sync_rule(
                case,
                "probation_review_missing",
                days_to_end <= 21 and not has_probation_review,
                "high",
                "临近试用期截止但尚未发起转正评估",
                f"距离试用期截止还有 {days_to_end} 天。",
            )
            await self._recalculate_risk(case)
        await self.session.commit()

    async def _sync_rule(
        self,
        case: LifecycleCaseModel,
        rule_code: str,
        triggered: bool,
        level: str,
        summary: str,
        evidence: str,
    ) -> None:
        existing = await self.session.scalar(
            select(LifecycleRiskModel).where(
                LifecycleRiskModel.case_id == case.id,
                LifecycleRiskModel.source == "automatic",
                LifecycleRiskModel.rule_code == rule_code,
                LifecycleRiskModel.status.in_(("open", "in_progress")),
            )
        )
        if triggered:
            if existing is None:
                self.session.add(
                    LifecycleRiskModel(
                        case_id=case.id,
                        source="automatic",
                        level=level,
                        rule_code=rule_code,
                        summary=summary,
                        evidence=evidence,
                        owner_member_id=case.owner_member_id,
                    )
                )
            else:
                existing.level = level
                existing.summary = summary
                existing.evidence = evidence
            return
        if existing is not None:
            existing.status = "closed"
            existing.resolution = "触发条件已消失，系统自动关闭。"  # noqa: RUF001
            existing.closed_at = datetime.now(UTC)

    def _can_manage_all(self, principal: Principal) -> bool:
        return bool(principal.permissions.intersection(CASE_MANAGER_PERMISSIONS))

    def _require_permission(self, principal: Principal, permission: Permission) -> None:
        if not principal.has(permission.value):
            raise ApplicationError("LIFECYCLE_PERMISSION_DENIED", "Permission denied.", 403)

    def _audit(
        self,
        principal: Principal,
        case_id: UUID | None,
        event_type: str,
        payload: dict[str, Any],
    ) -> None:
        self.session.add(
            LifecycleAuditModel(
                organization_id=principal.organization_id,
                case_id=case_id,
                actor_member_id=principal.membership_id,
                event_type=event_type,
                payload=payload,
            )
        )

    @staticmethod
    def _default_tasks() -> list[dict[str, Any]]:
        return [
            {"title": "完成账号与设备准备", "phase": "onboarding", "dueDays": 1},
            {"title": "完成团队与业务介绍", "phase": "onboarding", "dueDays": 3},
            {"title": "与导师制定首月培养目标", "phase": "adaptation", "dueDays": 7},
            {"title": "完成首个业务任务", "phase": "growth", "dueDays": 30},
            {"title": "完成中期回顾", "phase": "review", "dueDays": 45},
        ]

    @staticmethod
    def _case_summary(
        model: LifecycleCaseModel,
        progress: tuple[int, int],
        mentor: MentorAssignmentModel | None,
    ) -> dict[str, Any]:
        done, total = progress
        return {
            "id": str(model.id),
            "employeeName": model.employee_name,
            "employeeNo": model.employee_no,
            "department": model.department,
            "jobTitle": model.job_title,
            "batchName": model.batch_name,
            "joinedOn": model.joined_on.isoformat(),
            "probationEndOn": model.probation_end_on.isoformat(),
            "status": model.status,
            "riskLevel": model.risk_level,
            "mentor": SQLAlchemyLifecycleService._mentor_assignment_dict(mentor)
            if mentor
            else None,
            "taskProgress": {
                "completed": done,
                "total": total,
                "percent": round(done / total * 100) if total else 0,
            },
        }

    @staticmethod
    def _template_dict(model: LifecycleTemplateModel) -> dict[str, Any]:
        return {
            "id": str(model.id),
            "name": model.name,
            "positionFamily": model.position_family,
            "probationDays": model.probation_days,
            "version": model.version,
            "status": model.status,
            "tasks": model.tasks,
            "assessmentSchema": model.assessment_schema,
        }

    @staticmethod
    def _mentor_dict(model: MentorProfileModel, load: int) -> dict[str, Any]:
        return {
            "id": str(model.id),
            "memberId": str(model.member_id),
            "displayName": model.display_name,
            "jobTitle": model.job_title,
            "skills": model.skills,
            "capacity": model.capacity,
            "currentLoad": load,
            "status": model.status,
        }

    @staticmethod
    def _mentor_assignment_dict(model: MentorAssignmentModel) -> dict[str, Any]:
        return {
            "id": str(model.id),
            "mentorMemberId": str(model.mentor_member_id),
            "mentorName": model.mentor_name,
            "startedOn": model.started_on.isoformat(),
            "endedOn": model.ended_on.isoformat() if model.ended_on else None,
            "reason": model.reason,
        }

    @staticmethod
    def _task_dict(model: LifecycleTaskModel) -> dict[str, Any]:
        return {
            "id": str(model.id),
            "title": model.title,
            "description": model.description,
            "phase": model.phase,
            "assigneeRole": model.assignee_role,
            "assigneeMemberId": str(model.assignee_member_id) if model.assignee_member_id else None,
            "dueOn": model.due_on.isoformat(),
            "status": model.status,
            "completionNote": model.completion_note,
            "completedAt": model.completed_at.isoformat() if model.completed_at else None,
        }

    @staticmethod
    def _checkin_dict(
        model: CheckinModel, principal: Principal, case: LifecycleCaseModel
    ) -> dict[str, Any]:
        can_see_private = principal.membership_id != case.member_id and bool(
            principal.permissions.intersection(
                CASE_MANAGER_PERMISSIONS | {Permission.MENTORSHIP_MANAGE.value}
            )
        )
        return {
            "id": str(model.id),
            "heldAt": model.held_at.isoformat(),
            "kind": model.kind,
            "topic": model.topic,
            "sharedNotes": model.shared_notes,
            "employeeReflection": model.employee_reflection,
            "mentorNotes": model.mentor_notes if can_see_private else None,
            "supportNeeded": model.support_needed,
            "nextCheckinOn": model.next_checkin_on.isoformat() if model.next_checkin_on else None,
            "status": model.status,
        }

    @staticmethod
    def _action_dict(model: ActionItemModel) -> dict[str, Any]:
        return {
            "id": str(model.id),
            "checkinId": str(model.checkin_id) if model.checkin_id else None,
            "title": model.title,
            "assigneeMemberId": str(model.assignee_member_id),
            "assigneeName": model.assignee_name,
            "dueOn": model.due_on.isoformat(),
            "status": model.status,
            "completionNote": model.completion_note,
            "completedAt": model.completed_at.isoformat() if model.completed_at else None,
        }

    @staticmethod
    def _assessment_dict(model: AssessmentRoundModel) -> dict[str, Any]:
        return {
            "id": str(model.id),
            "kind": model.kind,
            "status": model.status,
            "plannedOn": model.planned_on.isoformat(),
            "deadlineOn": model.deadline_on.isoformat(),
            "requiredRoles": model.required_roles,
            "decision": model.decision,
            "decisionNotes": model.decision_notes,
            "extensionEndOn": model.extension_end_on.isoformat()
            if model.extension_end_on
            else None,
            "decidedAt": model.decided_at.isoformat() if model.decided_at else None,
        }

    @staticmethod
    def _submission_dict(model: AssessmentSubmissionModel, principal: Principal) -> dict[str, Any]:
        can_read = model.member_id == principal.membership_id or bool(
            principal.permissions.intersection(CASE_MANAGER_PERMISSIONS)
        )
        return {
            "id": str(model.id),
            "memberId": str(model.member_id),
            "role": model.role,
            "content": model.content if can_read else {},
            "score": model.score if can_read else None,
            "status": model.status,
            "submittedAt": model.submitted_at.isoformat(),
        }

    @staticmethod
    def _risk_dict(model: LifecycleRiskModel) -> dict[str, Any]:
        return {
            "id": str(model.id),
            "source": model.source,
            "level": model.level,
            "ruleCode": model.rule_code,
            "summary": model.summary,
            "evidence": model.evidence,
            "status": model.status,
            "resolution": model.resolution,
            "createdAt": model.created_at.isoformat(),
            "closedAt": model.closed_at.isoformat() if model.closed_at else None,
        }
