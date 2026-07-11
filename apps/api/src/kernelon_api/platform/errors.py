"""RFC 9457 error response configuration."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from litestar import Request, Response
from litestar.exceptions import HTTPException
from litestar.status_codes import HTTP_500_INTERNAL_SERVER_ERROR

from kernelon_api.platform.request_id import normalize_request_id

if TYPE_CHECKING:
    from kernelon_api.config import Settings

PROBLEM_MEDIA_TYPE = "application/problem+json"


def problem_response(
    request: Request[Any, Any, Any],
    *,
    status: int,
    title: str,
    detail: str,
    error_code: str,
) -> Response[dict[str, Any]]:
    """Build a stable RFC 9457-compatible response."""
    request_id = request.scope.get("state", {}).get("request_id") or normalize_request_id(
        request.headers.get("X-Request-ID")
    )
    return Response(
        content={
            "type": f"https://kernelon.local/problems/{error_code.lower()}",
            "title": title,
            "status": status,
            "detail": detail,
            "instance": request.url.path,
            "errorCode": error_code,
            "requestId": request_id,
        },
        status_code=status,
        media_type=PROBLEM_MEDIA_TYPE,
        headers={"X-Request-ID": request_id},
    )


def create_exception_handlers(settings: Settings) -> dict[type[Exception] | int, Any]:
    """Create application-level handlers so router errors share one contract."""

    def handle_http_exception(
        request: Request[Any, Any, Any], exc: HTTPException
    ) -> Response[dict[str, Any]]:
        return problem_response(
            request,
            status=exc.status_code,
            title=exc.detail or exc.__class__.__name__,
            detail=exc.detail or "The request could not be completed.",
            error_code=f"HTTP_{exc.status_code}",
        )

    def handle_unknown_exception(
        request: Request[Any, Any, Any], exc: Exception
    ) -> Response[dict[str, Any]]:
        detail = str(exc) if settings.environment != "production" else "Internal server error."
        return problem_response(
            request,
            status=HTTP_500_INTERNAL_SERVER_ERROR,
            title="Internal Server Error",
            detail=detail,
            error_code="INTERNAL_ERROR",
        )

    return {HTTPException: handle_http_exception, Exception: handle_unknown_exception}
