"""Encrypted music account-session adapter tests."""

from __future__ import annotations

import os
from typing import Any, cast
from uuid import uuid4

import pytest
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from kernelon_api.modules.identity.domain import normalize_email
from kernelon_api.modules.identity.infrastructure.models import UserModel
from kernelon_api.modules.identity.infrastructure.service import SQLAlchemyIdentityService
from kernelon_api.modules.music.application import MusicAccountSession
from kernelon_api.modules.music.infrastructure.account_session import (
    SQLAlchemyMusicAccountSessionStore,
)
from kernelon_api.modules.music.infrastructure.credential_crypto import (
    EncryptedMusicCredential,
    MusicCredentialCipher,
    MusicCredentialDecryptionError,
)
from kernelon_api.modules.music.infrastructure.models import MusicAccountCredentialModel

ROOT_SECRET = "test-root-secret-with-more-than-thirty-two-bytes"  # noqa: S105


def test_ciphertext_is_authenticated_randomized_and_not_plaintext() -> None:
    cipher = MusicCredentialCipher(ROOT_SECRET)
    user_id = uuid4()
    cookie = "MUSIC_U=plaintext-secret"

    first = cipher.encrypt(user_id, "netease", cookie)
    second = cipher.encrypt(user_id, "netease", cookie)

    assert cookie.encode() not in first.ciphertext
    assert first.nonce != second.nonce
    assert first.ciphertext != second.ciphertext
    assert cipher.decrypt(user_id, "netease", first) == cookie


@pytest.mark.parametrize("mismatch", ["tamper", "user", "provider", "version"])
def test_cipher_rejects_tampering_and_wrong_aad(mismatch: str) -> None:
    cipher = MusicCredentialCipher(ROOT_SECRET)
    user_id = uuid4()
    encrypted = cipher.encrypt(user_id, "netease", "MUSIC_U=secret")
    decrypt_user = user_id
    decrypt_provider = "netease"
    decrypt_envelope = encrypted
    if mismatch == "tamper":
        decrypt_envelope = EncryptedMusicCredential(
            ciphertext=bytes([encrypted.ciphertext[0] ^ 1]) + encrypted.ciphertext[1:],
            nonce=encrypted.nonce,
            version=encrypted.version,
        )
    elif mismatch == "user":
        decrypt_user = uuid4()
    elif mismatch == "provider":
        decrypt_provider = "qq"
    else:
        decrypt_envelope = EncryptedMusicCredential(
            encrypted.ciphertext, encrypted.nonce, encrypted.version + 1
        )

    with pytest.raises(MusicCredentialDecryptionError):
        cipher.decrypt(decrypt_user, decrypt_provider, decrypt_envelope)  # type: ignore[arg-type]


class RecordingSession:
    def __init__(self, *, fail_execute: bool = False) -> None:
        self.fail_execute = fail_execute
        self.execute_count = 0
        self.commit_count = 0
        self.rollback_count = 0

    async def execute(self, statement: object) -> None:
        _ = statement
        self.execute_count += 1
        if self.fail_execute:
            raise RuntimeError("database write failed")

    async def commit(self) -> None:
        self.commit_count += 1

    async def rollback(self) -> None:
        self.rollback_count += 1


async def test_adapter_commits_successful_provider_write_and_clear() -> None:
    recording = RecordingSession()
    store = SQLAlchemyMusicAccountSessionStore(
        cast("AsyncSession", cast("Any", recording)), ROOT_SECRET
    )

    await store.save_provider(uuid4(), "qq", "uin=42; qm_keyst=secret")
    await store.clear(uuid4())

    assert recording.execute_count == 2
    assert recording.commit_count == 2
    assert recording.rollback_count == 0


async def test_adapter_rolls_back_failed_write() -> None:
    recording = RecordingSession(fail_execute=True)
    store = SQLAlchemyMusicAccountSessionStore(
        cast("AsyncSession", cast("Any", recording)), ROOT_SECRET
    )

    with pytest.raises(RuntimeError, match="database write failed"):
        await store.save_provider(uuid4(), "netease", "MUSIC_U=secret")

    assert recording.commit_count == 0
    assert recording.rollback_count == 1


@pytest.mark.integration
async def test_sql_adapter_persists_encrypted_provider_isolated_user_sessions() -> None:
    database_url = os.getenv("KERNELON_TEST_DATABASE_URL")
    if not database_url:
        pytest.skip("KERNELON_TEST_DATABASE_URL is not configured")
    suffix = uuid4().hex[:10]
    engine = create_async_engine(database_url)
    factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    user_ids = []
    try:
        async with factory() as session:
            users = [
                UserModel(
                    email=f"music-{suffix}-{index}@example.com",
                    normalized_email=normalize_email(f"music-{suffix}-{index}@example.com"),
                    display_name=f"Music User {index}",
                    password_hash=SQLAlchemyIdentityService.hash_password("Temporary-12345"),
                    must_change_password=False,
                )
                for index in range(2)
            ]
            session.add_all(users)
            await session.commit()
            user_ids = [user.id for user in users]

        netease_cookie = "MUSIC_U=netease-user-one"
        qq_cookie = "uin=10001; qm_keyst=qq-user-one"
        async with factory() as session:
            first_adapter = SQLAlchemyMusicAccountSessionStore(session, ROOT_SECRET)
            await first_adapter.save_provider(user_ids[0], "netease", netease_cookie)
            await first_adapter.save_provider(user_ids[0], "qq", qq_cookie)
            await first_adapter.save_provider(user_ids[1], "qq", "uin=20002; qm_keyst=qq-user-two")

        async with factory() as session:
            rows = list(
                (
                    await session.scalars(
                        select(MusicAccountCredentialModel).order_by(
                            MusicAccountCredentialModel.user_id,
                            MusicAccountCredentialModel.provider,
                        )
                    )
                ).all()
            )
            assert len(rows) == 3
            assert all(len(row.nonce) == 12 for row in rows)
            assert all(netease_cookie.encode() not in row.ciphertext for row in rows)
            assert all(qq_cookie.encode() not in row.ciphertext for row in rows)

            recreated = SQLAlchemyMusicAccountSessionStore(session, ROOT_SECRET)
            first = await recreated.load(user_ids[0])
            second = await recreated.load(user_ids[1])
            assert first == MusicAccountSession(cookie=netease_cookie, qq_cookie=qq_cookie)
            assert second.cookie == ""
            assert second.qq_cookie == "uin=20002; qm_keyst=qq-user-two"

        async with factory() as session:
            recreated = SQLAlchemyMusicAccountSessionStore(session, ROOT_SECRET)
            await recreated.save_provider(user_ids[0], "netease", "MUSIC_U=rotated")

        async with factory() as session:
            recreated = SQLAlchemyMusicAccountSessionStore(session, ROOT_SECRET)
            rotated = await recreated.load(user_ids[0])
            assert rotated.cookie == "MUSIC_U=rotated"
            assert rotated.qq_cookie == qq_cookie

            netease_row = await session.scalar(
                select(MusicAccountCredentialModel).where(
                    MusicAccountCredentialModel.user_id == user_ids[0],
                    MusicAccountCredentialModel.provider == "netease",
                )
            )
            assert netease_row is not None
            tampered = bytes([netease_row.ciphertext[0] ^ 1]) + netease_row.ciphertext[1:]
            await session.execute(
                update(MusicAccountCredentialModel)
                .where(MusicAccountCredentialModel.id == netease_row.id)
                .values(ciphertext=tampered)
            )
            await session.commit()

        async with factory() as session:
            recreated = SQLAlchemyMusicAccountSessionStore(session, ROOT_SECRET)
            after_tamper = await recreated.load(user_ids[0])
            assert after_tamper.cookie == ""
            assert after_tamper.qq_cookie == qq_cookie
            await recreated.save_provider(user_ids[0], "qq", "")

        async with factory() as session:
            recreated = SQLAlchemyMusicAccountSessionStore(session, ROOT_SECRET)
            assert await recreated.load(user_ids[0]) == MusicAccountSession()
            await recreated.clear(user_ids[0])
            await recreated.clear(user_ids[1])

        async with factory() as session:
            assert (
                await session.scalar(
                    select(MusicAccountCredentialModel).where(
                        MusicAccountCredentialModel.user_id.in_(user_ids)
                    )
                )
                is None
            )
    finally:
        if user_ids:
            async with factory() as session:
                await session.execute(delete(UserModel).where(UserModel.id.in_(user_ids)))
                await session.commit()
        await engine.dispose()
