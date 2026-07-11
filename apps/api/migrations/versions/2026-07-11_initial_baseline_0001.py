"""Establish the migration baseline without business tables."""

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Establish the baseline revision."""


def downgrade() -> None:
    """Remove the baseline revision marker."""
