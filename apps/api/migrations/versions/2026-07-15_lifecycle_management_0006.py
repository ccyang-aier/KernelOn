"""Add new employee lifecycle management domain."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def timestamps() -> list[sa.Column[object]]:
    return [
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    ]


def upgrade() -> None:
    op.create_table(
        "lifecycle_templates",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("position_family", sa.String(length=120), nullable=True),
        sa.Column("probation_days", sa.Integer(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("tasks", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("assessment_schema", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=False),
        *timestamps(),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "organization_id", "name", "version", name="uq_lifecycle_template_version"
        ),
    )
    op.create_index(
        "ix_lifecycle_templates_organization_id", "lifecycle_templates", ["organization_id"]
    )
    op.create_table(
        "lifecycle_cases",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("member_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("employee_name", sa.String(length=120), nullable=False),
        sa.Column("employee_no", sa.String(length=80), nullable=False),
        sa.Column("department", sa.String(length=120), nullable=True),
        sa.Column("job_title", sa.String(length=120), nullable=False),
        sa.Column("batch_name", sa.String(length=120), nullable=True),
        sa.Column("joined_on", sa.Date(), nullable=False),
        sa.Column("probation_end_on", sa.Date(), nullable=False),
        sa.Column("manager_member_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("owner_member_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("template_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("risk_level", sa.String(length=24), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=False),
        *timestamps(),
        sa.ForeignKeyConstraint(["template_id"], ["lifecycle_templates.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "organization_id", "employee_no", "joined_on", name="uq_lifecycle_case_employee_joined"
        ),
    )
    op.create_index(
        "ix_lifecycle_case_org_status", "lifecycle_cases", ["organization_id", "status"]
    )
    op.create_index(
        "ix_lifecycle_case_org_risk", "lifecycle_cases", ["organization_id", "risk_level"]
    )
    op.create_table(
        "mentor_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("member_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("display_name", sa.String(length=120), nullable=False),
        sa.Column("job_title", sa.String(length=120), nullable=True),
        sa.Column("skills", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("capacity", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        *timestamps(),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("organization_id", "member_id", name="uq_mentor_profile_org_member"),
    )
    op.create_index("ix_mentor_profiles_organization_id", "mentor_profiles", ["organization_id"])
    op.create_table(
        "mentor_assignments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("case_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("mentor_member_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("mentor_name", sa.String(length=120), nullable=False),
        sa.Column("started_on", sa.Date(), nullable=False),
        sa.Column("ended_on", sa.Date(), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("assigned_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["case_id"], ["lifecycle_cases.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_mentor_assignments_mentor_member_id", "mentor_assignments", ["mentor_member_id"]
    )
    op.create_index(
        "ix_mentor_assignment_case_current", "mentor_assignments", ["case_id", "ended_on"]
    )
    op.create_table(
        "lifecycle_tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("case_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=240), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("phase", sa.String(length=80), nullable=False),
        sa.Column("assignee_role", sa.String(length=40), nullable=False),
        sa.Column("assignee_member_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("reviewer_member_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("due_on", sa.Date(), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("completion_note", sa.Text(), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        *timestamps(),
        sa.ForeignKeyConstraint(["case_id"], ["lifecycle_cases.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_lifecycle_task_case_status", "lifecycle_tasks", ["case_id", "status"])
    op.create_table(
        "lifecycle_checkins",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("case_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("held_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("kind", sa.String(length=40), nullable=False),
        sa.Column("topic", sa.String(length=240), nullable=False),
        sa.Column("shared_notes", sa.Text(), nullable=True),
        sa.Column("employee_reflection", sa.Text(), nullable=True),
        sa.Column("mentor_notes", sa.Text(), nullable=True),
        sa.Column("support_needed", sa.Text(), nullable=True),
        sa.Column("next_checkin_on", sa.Date(), nullable=True),
        sa.Column("author_member_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        *timestamps(),
        sa.ForeignKeyConstraint(["case_id"], ["lifecycle_cases.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_lifecycle_checkin_case_held", "lifecycle_checkins", ["case_id", "held_at"])
    op.create_table(
        "lifecycle_action_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("case_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("checkin_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(length=240), nullable=False),
        sa.Column("assignee_member_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assignee_name", sa.String(length=120), nullable=False),
        sa.Column("due_on", sa.Date(), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("completion_note", sa.Text(), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        *timestamps(),
        sa.ForeignKeyConstraint(["case_id"], ["lifecycle_cases.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["checkin_id"], ["lifecycle_checkins.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_action_case_status", "lifecycle_action_items", ["case_id", "status"])
    op.create_table(
        "assessment_rounds",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("case_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("kind", sa.String(length=40), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("planned_on", sa.Date(), nullable=False),
        sa.Column("deadline_on", sa.Date(), nullable=False),
        sa.Column("template_version", sa.Integer(), nullable=False),
        sa.Column("required_roles", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("decision", sa.String(length=24), nullable=True),
        sa.Column("decision_notes", sa.Text(), nullable=True),
        sa.Column("decided_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("extension_end_on", sa.Date(), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["case_id"], ["lifecycle_cases.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_assessment_case_status", "assessment_rounds", ["case_id", "status"])
    op.create_table(
        "assessment_submissions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("round_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("member_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("role", sa.String(length=40), nullable=False),
        sa.Column("content", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column(
            "submitted_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["round_id"], ["assessment_rounds.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "round_id", "member_id", "role", name="uq_assessment_submission_actor_role"
        ),
    )
    op.create_table(
        "lifecycle_risks",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("case_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source", sa.String(length=40), nullable=False),
        sa.Column("level", sa.String(length=24), nullable=False),
        sa.Column("rule_code", sa.String(length=80), nullable=True),
        sa.Column("summary", sa.String(length=240), nullable=False),
        sa.Column("evidence", sa.Text(), nullable=True),
        sa.Column("owner_member_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("resolution", sa.Text(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["case_id"], ["lifecycle_cases.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_lifecycle_risk_case_status", "lifecycle_risks", ["case_id", "status"])
    op.create_table(
        "lifecycle_audit_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("case_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("actor_member_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_type", sa.String(length=100), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["case_id"], ["lifecycle_cases.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_lifecycle_audit_case_created", "lifecycle_audit_events", ["case_id", "created_at"]
    )


def downgrade() -> None:
    op.drop_index("ix_lifecycle_audit_case_created", table_name="lifecycle_audit_events")
    op.drop_table("lifecycle_audit_events")
    op.drop_index("ix_lifecycle_risk_case_status", table_name="lifecycle_risks")
    op.drop_table("lifecycle_risks")
    op.drop_table("assessment_submissions")
    op.drop_index("ix_assessment_case_status", table_name="assessment_rounds")
    op.drop_table("assessment_rounds")
    op.drop_index("ix_action_case_status", table_name="lifecycle_action_items")
    op.drop_table("lifecycle_action_items")
    op.drop_index("ix_lifecycle_checkin_case_held", table_name="lifecycle_checkins")
    op.drop_table("lifecycle_checkins")
    op.drop_index("ix_lifecycle_task_case_status", table_name="lifecycle_tasks")
    op.drop_table("lifecycle_tasks")
    op.drop_index("ix_mentor_assignment_case_current", table_name="mentor_assignments")
    op.drop_index("ix_mentor_assignments_mentor_member_id", table_name="mentor_assignments")
    op.drop_table("mentor_assignments")
    op.drop_index("ix_mentor_profiles_organization_id", table_name="mentor_profiles")
    op.drop_table("mentor_profiles")
    op.drop_index("ix_lifecycle_case_org_risk", table_name="lifecycle_cases")
    op.drop_index("ix_lifecycle_case_org_status", table_name="lifecycle_cases")
    op.drop_table("lifecycle_cases")
    op.drop_index("ix_lifecycle_templates_organization_id", table_name="lifecycle_templates")
    op.drop_table("lifecycle_templates")
