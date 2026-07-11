"""Liveness and readiness endpoints."""

from __future__ import annotations

from typing import TYPE_CHECKING, Literal

from litestar import Controller, Response, get
from litestar.di import NamedDependency  # noqa: TC002 - Litestar resolves handler annotations
from litestar.status_codes import HTTP_503_SERVICE_UNAVAILABLE
from pydantic import BaseModel
from sqlalchemy import text

from kernelon_api import __version__

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncEngine


class HealthResponse(BaseModel):
    """Public health-check response."""

    status: Literal["ok", "unavailable"]
    service: str = "kernelon-api"
    version: str = __version__
    checks: dict[str, str] | None = None


class HealthController(Controller):
    """Operational health endpoints kept outside the versioned business API."""

    path = "/health"
    tags = ("system",)

    @get(path="/live", operation_id="system_liveness")
    async def live(self) -> HealthResponse:
        """Report process liveness without touching external dependencies."""
        return HealthResponse(status="ok")

    @get(path="/ready", operation_id="system_readiness")
    async def ready(
        self, db_engine: NamedDependency[AsyncEngine]
    ) -> HealthResponse | Response[HealthResponse]:
        """Report database readiness without leaking connection details."""
        try:
            async with db_engine.connect() as connection:
                await connection.execute(text("SELECT 1"))
        except Exception:
            return Response(
                content=HealthResponse(status="unavailable", checks={"database": "unavailable"}),
                status_code=HTTP_503_SERVICE_UNAVAILABLE,
            )
        return HealthResponse(status="ok", checks={"database": "ok"})
