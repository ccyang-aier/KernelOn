"""Add identity, organizations, groups and RBAC tables."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from kernelon_api.infrastructure.database import OrmBase, load_mappings

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

IAM_TABLE_NAMES = frozenset(
    {
        "groups",
        "group_roles",
        "membership_groups",
        "membership_roles",
        "organization_memberships",
        "organizations",
        "refresh_sessions",
        "role_permissions",
        "roles",
        "users",
    }
)


def _create_users_table() -> None:
    """Create the historical 0002 users shape, before presence_status existed."""
    op.create_table(
        "users",
        sa.Column("id", PGUUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("normalized_email", sa.String(length=320), nullable=False),
        sa.Column("display_name", sa.String(length=120), nullable=False),
        sa.Column("avatar_url", sa.Text(), nullable=True),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("must_change_password", sa.Boolean(), nullable=False),
        sa.Column("auth_version", sa.Integer(), nullable=False),
        sa.Column("failed_login_count", sa.Integer(), nullable=False),
        sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_normalized_email", "users", ["normalized_email"], unique=True)
    op.create_index("ix_users_status", "users", ["status"], unique=False)


def upgrade() -> None:
    """Create IAM tables from infrastructure-owned SQLAlchemy metadata."""
    load_mappings()
    bind = op.get_bind()
    for table in OrmBase.metadata.sorted_tables:
        if table.name not in IAM_TABLE_NAMES:
            continue
        if table.name == "users":
            _create_users_table()
            continue
        table.create(bind=bind, checkfirst=False)


def downgrade() -> None:
    """Drop IAM tables in reverse dependency order."""
    load_mappings()
    bind = op.get_bind()
    for table in reversed(OrmBase.metadata.sorted_tables):
        if table.name not in IAM_TABLE_NAMES:
            continue
        table.drop(bind=bind, checkfirst=False)
