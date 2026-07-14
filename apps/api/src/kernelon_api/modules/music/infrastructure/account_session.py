"""KernelOn-user-scoped storage for external music account sessions."""

from __future__ import annotations

from asyncio import Lock
from typing import TYPE_CHECKING, cast

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert

from kernelon_api.modules.music.application import MusicAccountProvider, MusicAccountSession
from kernelon_api.modules.music.infrastructure.credential_crypto import (
    EncryptedMusicCredential,
    MusicCredentialCipher,
    MusicCredentialDecryptionError,
)
from kernelon_api.modules.music.infrastructure.models import MusicAccountCredentialModel

if TYPE_CHECKING:
    from uuid import UUID

    from sqlalchemy.ext.asyncio import AsyncSession


class InMemoryMusicAccountSessionStore:
    """Process-local test adapter; production uses the encrypted SQLAlchemy adapter."""

    def __init__(self) -> None:
        self._sessions: dict[UUID, MusicAccountSession] = {}
        self._lock = Lock()

    async def load(self, kernelon_user_id: UUID) -> MusicAccountSession:
        async with self._lock:
            return self._sessions.get(kernelon_user_id, MusicAccountSession())

    async def save(self, kernelon_user_id: UUID, session: MusicAccountSession) -> None:
        async with self._lock:
            self._sessions[kernelon_user_id] = session

    async def save_provider(
        self, kernelon_user_id: UUID, provider: MusicAccountProvider, cookie: str
    ) -> None:
        async with self._lock:
            current = self._sessions.get(kernelon_user_id, MusicAccountSession())
            self._sessions[kernelon_user_id] = (
                MusicAccountSession(cookie=cookie, qq_cookie=current.qq_cookie)
                if provider == "netease"
                else MusicAccountSession(cookie=current.cookie, qq_cookie=cookie)
            )

    async def clear(self, kernelon_user_id: UUID) -> None:
        async with self._lock:
            self._sessions.pop(kernelon_user_id, None)


class SQLAlchemyMusicAccountSessionStore:
    """Durable per-request adapter storing only authenticated encrypted credentials."""

    def __init__(self, session: AsyncSession, root_secret: str) -> None:
        self._session = session
        self._cipher = MusicCredentialCipher(root_secret)

    async def load(self, kernelon_user_id: UUID) -> MusicAccountSession:
        result = await self._session.execute(
            select(MusicAccountCredentialModel).where(
                MusicAccountCredentialModel.user_id == kernelon_user_id
            )
        )
        cookies: dict[str, str] = {}
        for row in result.scalars():
            if row.provider not in {"netease", "qq"}:
                continue
            provider = cast("MusicAccountProvider", row.provider)
            try:
                cookies[provider] = self._cipher.decrypt(
                    kernelon_user_id,
                    provider,
                    EncryptedMusicCredential(
                        ciphertext=row.ciphertext,
                        nonce=row.nonce,
                        version=row.encryption_version,
                    ),
                )
            except MusicCredentialDecryptionError:
                cookies[provider] = ""
        return MusicAccountSession(
            cookie=cookies.get("netease", ""),
            qq_cookie=cookies.get("qq", ""),
        )

    async def save(self, kernelon_user_id: UUID, session: MusicAccountSession) -> None:
        """Atomically replace the complete provider snapshot."""
        try:
            await self._write_provider(kernelon_user_id, "netease", session.cookie)
            await self._write_provider(kernelon_user_id, "qq", session.qq_cookie)
            await self._session.commit()
        except Exception:
            await self._session.rollback()
            raise

    async def save_provider(
        self, kernelon_user_id: UUID, provider: MusicAccountProvider, cookie: str
    ) -> None:
        """Atomically update one provider without touching another provider's row."""
        try:
            await self._write_provider(kernelon_user_id, provider, cookie)
            await self._session.commit()
        except Exception:
            await self._session.rollback()
            raise

    async def clear(self, kernelon_user_id: UUID) -> None:
        try:
            await self._session.execute(
                delete(MusicAccountCredentialModel).where(
                    MusicAccountCredentialModel.user_id == kernelon_user_id
                )
            )
            await self._session.commit()
        except Exception:
            await self._session.rollback()
            raise

    async def _write_provider(
        self, kernelon_user_id: UUID, provider: MusicAccountProvider, cookie: str
    ) -> None:
        if not cookie:
            await self._session.execute(
                delete(MusicAccountCredentialModel).where(
                    MusicAccountCredentialModel.user_id == kernelon_user_id,
                    MusicAccountCredentialModel.provider == provider,
                )
            )
            return
        encrypted = self._cipher.encrypt(kernelon_user_id, provider, cookie)
        statement = insert(MusicAccountCredentialModel).values(
            user_id=kernelon_user_id,
            provider=provider,
            ciphertext=encrypted.ciphertext,
            nonce=encrypted.nonce,
            encryption_version=encrypted.version,
        )
        await self._session.execute(
            statement.on_conflict_do_update(
                constraint="uq_music_account_credential_user_provider",
                set_={
                    "ciphertext": statement.excluded.ciphertext,
                    "nonce": statement.excluded.nonce,
                    "encryption_version": statement.excluded.encryption_version,
                    "updated_at": statement.excluded.updated_at,
                },
            )
        )
