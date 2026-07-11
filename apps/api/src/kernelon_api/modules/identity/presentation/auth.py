"""Authentication and current-profile endpoints."""

from __future__ import annotations

from typing import Any

from litestar import Controller, Request, get, patch, post
from litestar.di import NamedDependency  # noqa: TC002
from pydantic import BaseModel, ConfigDict, Field

from kernelon_api.modules.identity.application.ports import IdentityService  # noqa: TC001


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class LoginRequest(StrictModel):
    email: str
    password: str


class RefreshRequest(StrictModel):
    refresh_token: str = Field(alias="refreshToken")


class PasswordRequest(StrictModel):
    current_password: str = Field(alias="currentPassword")
    new_password: str = Field(alias="newPassword")


class ProfileRequest(StrictModel):
    display_name: str = Field(alias="displayName", min_length=1, max_length=120)
    avatar_url: str | None = Field(default=None, alias="avatarUrl")


class AuthController(Controller):
    path = "/auth"
    tags = ("identity",)

    @post("/login", operation_id="identity_login")
    async def login(
        self,
        data: LoginRequest,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
    ) -> dict[str, Any]:
        return await identity_service.login(
            data.email,
            data.password,
            request.headers.get("User-Agent"),
            request.client.host if request.client else None,
        )

    @post("/refresh", operation_id="identity_refresh")
    async def refresh(
        self,
        data: RefreshRequest,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
    ) -> dict[str, Any]:
        return await identity_service.refresh(
            data.refresh_token,
            request.headers.get("User-Agent"),
            request.client.host if request.client else None,
        )

    @post("/logout", operation_id="identity_logout", status_code=204)
    async def logout(
        self, data: RefreshRequest, identity_service: NamedDependency[IdentityService]
    ) -> None:
        await identity_service.logout(data.refresh_token)

    @get("/me", operation_id="identity_get_me")
    async def me(
        self, request: Request[Any, Any, Any], identity_service: NamedDependency[IdentityService]
    ) -> dict[str, Any]:
        user_id = await identity_service.authenticate(request.headers.get("Authorization"))
        return await identity_service.get_me(user_id)

    @patch("/me", operation_id="identity_update_me")
    async def update_me(
        self,
        data: ProfileRequest,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
    ) -> dict[str, Any]:
        user_id = await identity_service.authenticate(request.headers.get("Authorization"))
        return await identity_service.update_me(user_id, data.display_name, data.avatar_url)

    @post("/change-password", operation_id="identity_change_password", status_code=204)
    async def change_password(
        self,
        data: PasswordRequest,
        request: Request[Any, Any, Any],
        identity_service: NamedDependency[IdentityService],
    ) -> None:
        user_id = await identity_service.authenticate(request.headers.get("Authorization"))
        await identity_service.change_password(user_id, data.current_password, data.new_password)
