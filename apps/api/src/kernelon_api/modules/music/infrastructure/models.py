"""SQLAlchemy mappings for durable external music account credentials."""

from __future__ import annotations

from datetime import datetime  # noqa: TC003
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    LargeBinary,
    SmallInteger,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from kernelon_api.infrastructure.database import OrmBase


class MusicAccountCredentialModel(OrmBase):
    """One encrypted provider credential for one KernelOn user."""

    __tablename__ = "music_account_credentials"
    __table_args__ = (
        UniqueConstraint("user_id", "provider", name="uq_music_account_credential_user_provider"),
        CheckConstraint("provider IN ('netease', 'qq')", name="ck_music_account_provider"),
        CheckConstraint("encryption_version > 0", name="ck_music_account_encryption_version"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    provider: Mapped[str] = mapped_column(String(16), nullable=False)
    ciphertext: Mapped[bytes] = mapped_column(LargeBinary(), nullable=False)
    nonce: Mapped[bytes] = mapped_column(LargeBinary(), nullable=False)
    encryption_version: Mapped[int] = mapped_column(SmallInteger(), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
