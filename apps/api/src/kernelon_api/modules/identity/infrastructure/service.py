"""Transactional identity service."""

from __future__ import annotations

import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID, uuid4

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession  # noqa: TC002

from kernelon_api.config import Settings  # noqa: TC001
from kernelon_api.modules.identity.domain import normalize_email
from kernelon_api.modules.identity.infrastructure.models import RefreshSessionModel, UserModel
from kernelon_api.platform.application_errors import ApplicationError

_PASSWORD = PasswordHasher()


class SQLAlchemyIdentityService:
    def __init__(self, session: AsyncSession, settings: Settings) -> None:
        self.session = session
        self.settings = settings

    @staticmethod
    def hash_password(password: str) -> str:
        if len(password) < 10:
            raise ApplicationError("WEAK_PASSWORD", "Password must contain at least 10 characters.")
        return _PASSWORD.hash(password)

    @staticmethod
    def _verify(encoded: str, password: str) -> bool:
        try:
            return _PASSWORD.verify(encoded, password)
        except VerifyMismatchError:
            return False

    @staticmethod
    def _token_hash(token: str) -> str:
        return hashlib.sha256(token.encode()).hexdigest()

    def _access_token(self, user: UserModel, session_id: UUID) -> tuple[str, int]:
        now = datetime.now(UTC)
        lifetime = timedelta(minutes=self.settings.access_token_minutes)
        encoded = jwt.encode(
            {
                "sub": str(user.id),
                "sid": str(session_id),
                "ver": user.auth_version,
                "iat": now,
                "nbf": now,
                "exp": now + lifetime,
                "iss": self.settings.jwt_issuer,
                "aud": self.settings.jwt_audience,
            },
            self.settings.jwt_secret,
            algorithm="HS256",
        )
        return encoded, int(lifetime.total_seconds())

    async def _new_session(
        self, user: UserModel, user_agent: str | None, ip: str | None, family_id: UUID | None = None
    ) -> tuple[str, RefreshSessionModel]:
        raw = secrets.token_urlsafe(48)
        row = RefreshSessionModel(
            user_id=user.id,
            family_id=family_id or uuid4(),
            token_hash=self._token_hash(raw),
            expires_at=datetime.now(UTC) + timedelta(days=self.settings.refresh_token_days),
            user_agent=user_agent,
            ip_address=ip,
        )
        self.session.add(row)
        await self.session.flush()
        return raw, row

    async def login(
        self, email: str, password: str, user_agent: str | None, ip: str | None
    ) -> dict[str, Any]:
        now = datetime.now(UTC)
        user = await self.session.scalar(
            select(UserModel).where(UserModel.normalized_email == normalize_email(email))
        )
        if (
            user is None
            or user.status != "active"
            or (user.locked_until and user.locked_until > now)
        ):
            raise ApplicationError("INVALID_CREDENTIALS", "Email or password is incorrect.", 401)
        if not self._verify(user.password_hash, password):
            user.failed_login_count += 1
            if user.failed_login_count >= 5:
                user.locked_until = now + timedelta(minutes=15)
                user.failed_login_count = 0
            await self.session.commit()
            raise ApplicationError("INVALID_CREDENTIALS", "Email or password is incorrect.", 401)
        user.failed_login_count = 0
        user.locked_until = None
        user.last_login_at = now
        refresh, session = await self._new_session(user, user_agent, ip)
        access, expires = self._access_token(user, session.id)
        await self.session.commit()
        return {
            "accessToken": access,
            "refreshToken": refresh,
            "expiresIn": expires,
            "mustChangePassword": user.must_change_password,
        }

    async def refresh(self, token: str, user_agent: str | None, ip: str | None) -> dict[str, Any]:
        now = datetime.now(UTC)
        row = await self.session.scalar(
            select(RefreshSessionModel).where(
                RefreshSessionModel.token_hash == self._token_hash(token)
            )
        )
        if row is None:
            raise ApplicationError("INVALID_REFRESH_TOKEN", "Refresh token is invalid.", 401)
        if row.revoked_at is not None:
            await self.session.execute(
                update(RefreshSessionModel)
                .where(RefreshSessionModel.family_id == row.family_id)
                .values(revoked_at=now)
            )
            await self.session.commit()
            raise ApplicationError("REFRESH_TOKEN_REUSED", "Refresh token reuse was detected.", 401)
        if row.expires_at <= now:
            raise ApplicationError("INVALID_REFRESH_TOKEN", "Refresh token has expired.", 401)
        user = await self.session.get(UserModel, row.user_id)
        if user is None or user.status != "active":
            raise ApplicationError("ACCOUNT_DISABLED", "Account is disabled.", 401)
        new_raw, replacement = await self._new_session(user, user_agent, ip, row.family_id)
        row.revoked_at = now
        row.replaced_by_id = replacement.id
        access, expires = self._access_token(user, replacement.id)
        await self.session.commit()
        return {
            "accessToken": access,
            "refreshToken": new_raw,
            "expiresIn": expires,
            "mustChangePassword": user.must_change_password,
        }

    async def logout(self, token: str) -> None:
        row = await self.session.scalar(
            select(RefreshSessionModel).where(
                RefreshSessionModel.token_hash == self._token_hash(token)
            )
        )
        if row and row.revoked_at is None:
            row.revoked_at = datetime.now(UTC)
            await self.session.commit()

    async def authenticate(self, authorization: str | None) -> UUID:
        if not authorization or not authorization.startswith("Bearer "):
            raise ApplicationError(
                "AUTHENTICATION_REQUIRED", "Bearer authentication is required.", 401
            )
        try:
            payload = jwt.decode(
                authorization[7:],
                self.settings.jwt_secret,
                algorithms=["HS256"],
                audience=self.settings.jwt_audience,
                issuer=self.settings.jwt_issuer,
                options={"require": ["sub", "sid", "ver", "exp", "iat", "nbf"]},
            )
            user_id = UUID(payload["sub"])
        except (jwt.PyJWTError, ValueError, KeyError) as exc:
            raise ApplicationError("INVALID_ACCESS_TOKEN", "Access token is invalid.", 401) from exc
        user = await self.session.get(UserModel, user_id)
        if user is None or user.status != "active" or user.auth_version != payload["ver"]:
            raise ApplicationError("INVALID_ACCESS_TOKEN", "Access token is no longer valid.", 401)
        return user_id

    async def get_me(self, user_id: UUID) -> dict[str, Any]:
        user = await self.session.get(UserModel, user_id)
        if user is None:
            raise ApplicationError("USER_NOT_FOUND", "User was not found.", 404)
        return self._user_dict(user)

    async def update_me(
        self,
        user_id: UUID,
        display_name: str,
        avatar_url: str | None,
        presence_status: str | None,
    ) -> dict[str, Any]:
        user = await self.session.get(UserModel, user_id)
        if user is None:
            raise ApplicationError("USER_NOT_FOUND", "User was not found.", 404)
        user.display_name = display_name.strip()
        user.avatar_url = avatar_url
        if presence_status is not None:
            user.presence_status = presence_status
        await self.session.commit()
        return self._user_dict(user)

    async def change_password(self, user_id: UUID, current: str, new: str) -> None:
        user = await self.session.get(UserModel, user_id)
        if user is None or not self._verify(user.password_hash, current):
            raise ApplicationError("INVALID_CREDENTIALS", "Current password is incorrect.", 401)
        user.password_hash = self.hash_password(new)
        user.must_change_password = False
        user.auth_version += 1
        await self.session.execute(
            update(RefreshSessionModel)
            .where(RefreshSessionModel.user_id == user.id, RefreshSessionModel.revoked_at.is_(None))
            .values(revoked_at=datetime.now(UTC))
        )
        await self.session.commit()

    @staticmethod
    def _user_dict(user: UserModel) -> dict[str, Any]:
        return {
            "id": user.id,
            "email": user.email,
            "displayName": user.display_name,
            "avatarUrl": user.avatar_url,
            "presenceStatus": user.presence_status,
            "status": user.status,
            "mustChangePassword": user.must_change_password,
            "lastLoginAt": user.last_login_at,
        }
