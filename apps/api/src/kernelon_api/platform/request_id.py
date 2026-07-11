"""Request correlation middleware."""

from __future__ import annotations

import re
from time import perf_counter
from typing import TYPE_CHECKING
from uuid import uuid4

import structlog
from litestar.enums import ScopeType
from structlog.contextvars import bind_contextvars, clear_contextvars

from kernelon_api import __version__

if TYPE_CHECKING:
    from collections.abc import Callable

    from litestar.types import ASGIApp, Message, Receive, Scope, Send

REQUEST_ID_HEADER = b"x-request-id"
REQUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9._:-]{1,64}$")


def normalize_request_id(candidate: str | None) -> str:
    """Return a safe upstream request id or generate a fresh UUID."""
    if candidate is not None and REQUEST_ID_PATTERN.fullmatch(candidate):
        return candidate
    return str(uuid4())


def create_request_context_middleware(environment: str) -> Callable[[ASGIApp], ASGIApp]:
    """Create middleware that correlates and logs one structured event per request."""

    def factory(app: ASGIApp) -> ASGIApp:
        async def middleware(scope: Scope, receive: Receive, send: Send) -> None:
            if scope["type"] != ScopeType.HTTP:
                await app(scope, receive, send)
                return
            headers = dict(scope.get("headers", []))
            raw_candidate = headers.get(REQUEST_ID_HEADER)
            candidate = raw_candidate.decode("ascii", errors="ignore") if raw_candidate else None
            request_id = normalize_request_id(candidate)
            scope.setdefault("state", {})["request_id"] = request_id
            status_code = 500
            started_at = perf_counter()
            clear_contextvars()
            bind_contextvars(
                request_id=request_id,
                service="kernelon-api",
                version=__version__,
                environment=environment,
            )

            async def send_with_request_id(message: Message) -> None:
                nonlocal status_code
                if message["type"] == "http.response.start":
                    status_code = message["status"]
                    response_headers = list(message.get("headers", []))
                    response_headers.append((REQUEST_ID_HEADER, request_id.encode("ascii")))
                    message["headers"] = response_headers
                await send(message)

            try:
                await app(scope, receive, send_with_request_id)
            finally:
                structlog.get_logger("kernelon.request").info(
                    "request_complete",
                    method=scope["method"],
                    path=scope["path"],
                    status_code=status_code,
                    duration_ms=round((perf_counter() - started_at) * 1000, 3),
                )
                clear_contextvars()

        return middleware

    return factory
