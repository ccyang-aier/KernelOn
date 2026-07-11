"""Add identity, organizations, groups and RBAC tables."""

from alembic import op

from kernelon_api.infrastructure.database import OrmBase, load_mappings

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create IAM tables from infrastructure-owned SQLAlchemy metadata."""
    load_mappings()
    bind = op.get_bind()
    for table in OrmBase.metadata.sorted_tables:
        table.create(bind=bind, checkfirst=False)


def downgrade() -> None:
    """Drop IAM tables in reverse dependency order."""
    load_mappings()
    bind = op.get_bind()
    for table in reversed(OrmBase.metadata.sorted_tables):
        table.drop(bind=bind, checkfirst=False)
