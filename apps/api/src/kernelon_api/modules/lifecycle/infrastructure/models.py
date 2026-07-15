"""SQLAlchemy mappings for new employee lifecycle management."""

from __future__ import annotations

from datetime import date, datetime  # noqa: TC003
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import (
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from kernelon_api.infrastructure.database import OrmBase


class LifecycleTemplateModel(OrmBase):
    __tablename__ = "lifecycle_templates"
    __table_args__ = (
        UniqueConstraint(
            "organization_id", "name", "version", name="uq_lifecycle_template_version"
        ),
    )
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), index=True)
    name: Mapped[str] = mapped_column(String(160))
    position_family: Mapped[str | None] = mapped_column(String(120))
    probation_days: Mapped[int] = mapped_column(Integer(), default=90)
    version: Mapped[int] = mapped_column(Integer(), default=1)
    status: Mapped[str] = mapped_column(String(24), default="active")
    tasks: Mapped[list[dict[str, Any]]] = mapped_column(JSONB(), default=list)
    assessment_schema: Mapped[dict[str, Any]] = mapped_column(JSONB(), default=dict)
    created_by: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class LifecycleCaseModel(OrmBase):
    __tablename__ = "lifecycle_cases"
    __table_args__ = (
        UniqueConstraint(
            "organization_id", "employee_no", "joined_on", name="uq_lifecycle_case_employee_joined"
        ),
        Index("ix_lifecycle_case_org_status", "organization_id", "status"),
        Index("ix_lifecycle_case_org_risk", "organization_id", "risk_level"),
    )
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True))
    member_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True))
    employee_name: Mapped[str] = mapped_column(String(120))
    employee_no: Mapped[str] = mapped_column(String(80))
    department: Mapped[str | None] = mapped_column(String(120))
    job_title: Mapped[str] = mapped_column(String(120))
    batch_name: Mapped[str | None] = mapped_column(String(120))
    joined_on: Mapped[date] = mapped_column(Date())
    probation_end_on: Mapped[date] = mapped_column(Date())
    manager_member_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True))
    owner_member_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True))
    template_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("lifecycle_templates.id", ondelete="SET NULL")
    )
    status: Mapped[str] = mapped_column(String(24), default="draft")
    risk_level: Mapped[str] = mapped_column(String(24), default="normal")
    summary: Mapped[str | None] = mapped_column(Text())
    created_by: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class MentorProfileModel(OrmBase):
    __tablename__ = "mentor_profiles"
    __table_args__ = (
        UniqueConstraint("organization_id", "member_id", name="uq_mentor_profile_org_member"),
    )
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), index=True)
    member_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True))
    display_name: Mapped[str] = mapped_column(String(120))
    job_title: Mapped[str | None] = mapped_column(String(120))
    skills: Mapped[list[str]] = mapped_column(JSONB(), default=list)
    capacity: Mapped[int] = mapped_column(Integer(), default=3)
    status: Mapped[str] = mapped_column(String(24), default="available")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class MentorAssignmentModel(OrmBase):
    __tablename__ = "mentor_assignments"
    __table_args__ = (Index("ix_mentor_assignment_case_current", "case_id", "ended_on"),)
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    case_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("lifecycle_cases.id", ondelete="CASCADE")
    )
    mentor_member_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), index=True)
    mentor_name: Mapped[str] = mapped_column(String(120))
    started_on: Mapped[date] = mapped_column(Date())
    ended_on: Mapped[date | None] = mapped_column(Date())
    reason: Mapped[str | None] = mapped_column(Text())
    assigned_by: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class LifecycleTaskModel(OrmBase):
    __tablename__ = "lifecycle_tasks"
    __table_args__ = (Index("ix_lifecycle_task_case_status", "case_id", "status"),)
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    case_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("lifecycle_cases.id", ondelete="CASCADE")
    )
    title: Mapped[str] = mapped_column(String(240))
    description: Mapped[str | None] = mapped_column(Text())
    phase: Mapped[str] = mapped_column(String(80), default="onboarding")
    assignee_role: Mapped[str] = mapped_column(String(40), default="newcomer")
    assignee_member_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True))
    reviewer_member_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True))
    due_on: Mapped[date] = mapped_column(Date())
    status: Mapped[str] = mapped_column(String(24), default="not_started")
    completion_note: Mapped[str | None] = mapped_column(Text())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    sort_order: Mapped[int] = mapped_column(Integer(), default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CheckinModel(OrmBase):
    __tablename__ = "lifecycle_checkins"
    __table_args__ = (Index("ix_lifecycle_checkin_case_held", "case_id", "held_at"),)
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    case_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("lifecycle_cases.id", ondelete="CASCADE")
    )
    held_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    kind: Mapped[str] = mapped_column(String(40), default="regular")
    topic: Mapped[str] = mapped_column(String(240))
    shared_notes: Mapped[str | None] = mapped_column(Text())
    employee_reflection: Mapped[str | None] = mapped_column(Text())
    mentor_notes: Mapped[str | None] = mapped_column(Text())
    support_needed: Mapped[str | None] = mapped_column(Text())
    next_checkin_on: Mapped[date | None] = mapped_column(Date())
    author_member_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True))
    status: Mapped[str] = mapped_column(String(24), default="submitted")
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ActionItemModel(OrmBase):
    __tablename__ = "lifecycle_action_items"
    __table_args__ = (Index("ix_action_case_status", "case_id", "status"),)
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    case_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("lifecycle_cases.id", ondelete="CASCADE")
    )
    checkin_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("lifecycle_checkins.id", ondelete="SET NULL")
    )
    title: Mapped[str] = mapped_column(String(240))
    assignee_member_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True))
    assignee_name: Mapped[str] = mapped_column(String(120))
    due_on: Mapped[date] = mapped_column(Date())
    status: Mapped[str] = mapped_column(String(24), default="pending")
    completion_note: Mapped[str | None] = mapped_column(Text())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AssessmentRoundModel(OrmBase):
    __tablename__ = "assessment_rounds"
    __table_args__ = (Index("ix_assessment_case_status", "case_id", "status"),)
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    case_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("lifecycle_cases.id", ondelete="CASCADE")
    )
    kind: Mapped[str] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(32), default="collecting")
    planned_on: Mapped[date] = mapped_column(Date())
    deadline_on: Mapped[date] = mapped_column(Date())
    template_version: Mapped[int] = mapped_column(Integer(), default=1)
    required_roles: Mapped[list[str]] = mapped_column(JSONB(), default=list)
    decision: Mapped[str | None] = mapped_column(String(24))
    decision_notes: Mapped[str | None] = mapped_column(Text())
    decided_by: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True))
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    extension_end_on: Mapped[date | None] = mapped_column(Date())
    created_by: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AssessmentSubmissionModel(OrmBase):
    __tablename__ = "assessment_submissions"
    __table_args__ = (
        UniqueConstraint(
            "round_id", "member_id", "role", name="uq_assessment_submission_actor_role"
        ),
    )
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    round_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("assessment_rounds.id", ondelete="CASCADE")
    )
    member_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True))
    role: Mapped[str] = mapped_column(String(40))
    content: Mapped[dict[str, Any]] = mapped_column(JSONB(), default=dict)
    score: Mapped[float | None] = mapped_column(Float())
    status: Mapped[str] = mapped_column(String(24), default="submitted")
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class LifecycleRiskModel(OrmBase):
    __tablename__ = "lifecycle_risks"
    __table_args__ = (Index("ix_lifecycle_risk_case_status", "case_id", "status"),)
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    case_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("lifecycle_cases.id", ondelete="CASCADE")
    )
    source: Mapped[str] = mapped_column(String(40), default="manual")
    level: Mapped[str] = mapped_column(String(24))
    rule_code: Mapped[str | None] = mapped_column(String(80))
    summary: Mapped[str] = mapped_column(String(240))
    evidence: Mapped[str | None] = mapped_column(Text())
    owner_member_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True))
    status: Mapped[str] = mapped_column(String(24), default="open")
    resolution: Mapped[str | None] = mapped_column(Text())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class LifecycleAuditModel(OrmBase):
    __tablename__ = "lifecycle_audit_events"
    __table_args__ = (Index("ix_lifecycle_audit_case_created", "case_id", "created_at"),)
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True))
    case_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("lifecycle_cases.id", ondelete="CASCADE")
    )
    actor_member_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True))
    event_type: Mapped[str] = mapped_column(String(100))
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB(), default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
