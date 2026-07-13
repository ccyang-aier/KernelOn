"""Public identity application interface."""

from typing import Any, Protocol, runtime_checkable
from uuid import UUID


@runtime_checkable
class IdentityService(Protocol):
    async def login(
        self, email: str, password: str, user_agent: str | None, ip: str | None
    ) -> dict[str, Any]: ...
    async def refresh(
        self, token: str, user_agent: str | None, ip: str | None
    ) -> dict[str, Any]: ...
    async def logout(self, token: str) -> None: ...
    async def authenticate(self, authorization: str | None) -> UUID: ...
    async def get_me(self, user_id: UUID) -> dict[str, Any]: ...
    async def update_me(
        self,
        user_id: UUID,
        display_name: str,
        avatar_url: str | None,
        presence_status: str | None,
    ) -> dict[str, Any]: ...
    async def change_password(self, user_id: UUID, current: str, new: str) -> None: ...
