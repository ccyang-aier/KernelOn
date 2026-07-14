"""Add encrypted per-user music provider credentials."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create the encrypted credential table with provider isolation."""
    op.create_table(
        "music_account_credentials",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("provider", sa.String(length=16), nullable=False),
        sa.Column("ciphertext", sa.LargeBinary(), nullable=False),
        sa.Column("nonce", sa.LargeBinary(), nullable=False),
        sa.Column("encryption_version", sa.SmallInteger(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.CheckConstraint("encryption_version > 0", name="ck_music_account_encryption_version"),
        sa.CheckConstraint("provider IN ('netease', 'qq')", name="ck_music_account_provider"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id", "provider", name="uq_music_account_credential_user_provider"
        ),
    )
    op.create_index(
        "ix_music_account_credentials_user_id",
        "music_account_credentials",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    """Remove encrypted music provider credentials."""
    op.drop_index("ix_music_account_credentials_user_id", table_name="music_account_credentials")
    op.drop_table("music_account_credentials")
