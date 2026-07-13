"""Add the persisted user presence preference."""

import sqlalchemy as sa
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Persist a user's selected control-panel presence."""
    op.add_column(
        "users",
        sa.Column("presence_status", sa.String(length=20), server_default="online", nullable=False),
    )


def downgrade() -> None:
    """Remove the persisted presence preference."""
    op.drop_column("users", "presence_status")
