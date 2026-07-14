"""Add wallpaper catalog, preferences, uploads and outbox."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "wallpaper_sources",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("provider", sa.String(length=32), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("organization_id", "provider", name="uq_wallpaper_source_org_provider"),
    )
    op.create_index(
        "ix_wallpaper_sources_organization_id", "wallpaper_sources", ["organization_id"]
    )
    op.create_table(
        "wallpaper_assets",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("owner_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("provider", sa.String(length=32), nullable=False),
        sa.Column("external_id", sa.String(length=255), nullable=False),
        sa.Column("media_type", sa.String(length=16), nullable=False),
        sa.Column("title", sa.String(length=240), nullable=False),
        sa.Column("snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("storage_key", sa.Text(), nullable=True),
        sa.Column("size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "organization_id", "provider", "external_id", name="uq_wallpaper_asset_org_external"
        ),
    )
    op.create_index(
        "ix_wallpaper_asset_org_owner", "wallpaper_assets", ["organization_id", "owner_user_id"]
    )
    op.create_table(
        "wallpaper_favorites",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("asset_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["asset_id"], ["wallpaper_assets.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "asset_id"),
    )
    op.create_table(
        "wallpaper_assignments",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("asset_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["asset_id"], ["wallpaper_assets.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )
    op.create_index(
        "ix_wallpaper_assignments_organization_id", "wallpaper_assignments", ["organization_id"]
    )
    op.create_table(
        "wallpaper_user_source_preferences",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("provider", sa.String(length=32), nullable=False),
        sa.Column("visible", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "provider"),
    )
    op.create_table(
        "wallpaper_ingest_jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=240), nullable=False),
        sa.Column("media_type", sa.String(length=16), nullable=False),
        sa.Column("content_type", sa.String(length=120), nullable=False),
        sa.Column("declared_size", sa.BigInteger(), nullable=False),
        sa.Column("poster_url", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("storage_key", sa.Text(), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_wallpaper_ingest_jobs_organization_id", "wallpaper_ingest_jobs", ["organization_id"]
    )
    op.create_index("ix_wallpaper_ingest_jobs_user_id", "wallpaper_ingest_jobs", ["user_id"])
    op.create_table(
        "wallpaper_renditions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("asset_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("storage_key", sa.Text(), nullable=False),
        sa.Column("content_type", sa.String(length=120), nullable=False),
        sa.Column("size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("sha256", sa.String(length=64), nullable=False),
        sa.Column("width", sa.Integer(), nullable=False),
        sa.Column("height", sa.Integer(), nullable=False),
        sa.Column("replaced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["asset_id"], ["wallpaper_assets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("asset_id", "kind", name="uq_wallpaper_rendition_asset_kind"),
    )
    op.create_index("ix_wallpaper_renditions_asset_id", "wallpaper_renditions", ["asset_id"])
    op.create_table(
        "wallpaper_storage_usage",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("scope", sa.String(length=24), nullable=False),
        sa.Column("committed_bytes", sa.BigInteger(), nullable=False),
        sa.Column("reserved_bytes", sa.BigInteger(), nullable=False),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_wallpaper_storage_usage_organization_id",
        "wallpaper_storage_usage",
        ["organization_id"],
    )
    op.create_index("ix_wallpaper_storage_usage_user_id", "wallpaper_storage_usage", ["user_id"])
    op.create_index("ix_wallpaper_storage_usage_scope", "wallpaper_storage_usage", ["scope"])
    op.create_table(
        "wallpaper_outbox",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("kind", sa.String(length=80), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_wallpaper_outbox_created_at", "wallpaper_outbox", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_wallpaper_outbox_created_at", table_name="wallpaper_outbox")
    op.drop_table("wallpaper_outbox")
    op.drop_index("ix_wallpaper_storage_usage_scope", table_name="wallpaper_storage_usage")
    op.drop_index("ix_wallpaper_storage_usage_user_id", table_name="wallpaper_storage_usage")
    op.drop_index(
        "ix_wallpaper_storage_usage_organization_id", table_name="wallpaper_storage_usage"
    )
    op.drop_table("wallpaper_storage_usage")
    op.drop_index("ix_wallpaper_renditions_asset_id", table_name="wallpaper_renditions")
    op.drop_table("wallpaper_renditions")
    op.drop_index("ix_wallpaper_ingest_jobs_user_id", table_name="wallpaper_ingest_jobs")
    op.drop_index("ix_wallpaper_ingest_jobs_organization_id", table_name="wallpaper_ingest_jobs")
    op.drop_table("wallpaper_ingest_jobs")
    op.drop_table("wallpaper_user_source_preferences")
    op.drop_index("ix_wallpaper_assignments_organization_id", table_name="wallpaper_assignments")
    op.drop_table("wallpaper_assignments")
    op.drop_table("wallpaper_favorites")
    op.drop_index("ix_wallpaper_asset_org_owner", table_name="wallpaper_assets")
    op.drop_table("wallpaper_assets")
    op.drop_index("ix_wallpaper_sources_organization_id", table_name="wallpaper_sources")
    op.drop_table("wallpaper_sources")
