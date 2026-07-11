"""Litestar application composition root."""

from __future__ import annotations

from typing import Any

from litestar import Litestar, Router
from litestar.config.allowed_hosts import AllowedHostsConfig
from litestar.config.cors import CORSConfig
from litestar.config.response_cache import ResponseCacheConfig
from litestar.di import NamedDependency, Provide
from litestar.logging.config import StructLoggingConfig
from litestar.openapi import OpenAPIConfig
from litestar.openapi.plugins import ScalarRenderPlugin
from litestar.plugins.structlog import StructlogConfig, StructlogPlugin

from kernelon_api import __version__
from kernelon_api.config import Settings, get_settings
from kernelon_api.infrastructure.database import create_database_plugin
from kernelon_api.modules.identity.application.ports import IdentityService  # noqa: TC001
from kernelon_api.modules.identity.infrastructure.service import SQLAlchemyIdentityService
from kernelon_api.modules.identity.presentation.auth import AuthController
from kernelon_api.modules.organizations.application.ports import OrganizationService  # noqa: TC001
from kernelon_api.modules.organizations.infrastructure.service import SQLAlchemyOrganizationService
from kernelon_api.modules.organizations.presentation.controllers import OrganizationController
from kernelon_api.modules.system.presentation.health import HealthController
from kernelon_api.platform.errors import create_exception_handlers
from kernelon_api.platform.request_id import create_request_context_middleware


def create_app(settings: Settings | None = None) -> Litestar:
    """Create a fully configured application, allowing test-time overrides."""
    resolved = settings or get_settings()
    resolved.validate_production_safety()

    async def provide_identity_service(
        db_session: NamedDependency[Any],
    ) -> IdentityService:
        return SQLAlchemyIdentityService(db_session, resolved)

    async def provide_organization_service(
        db_session: NamedDependency[Any],
    ) -> OrganizationService:
        return SQLAlchemyOrganizationService(db_session)

    api_router = Router(
        path="/api/v1",
        route_handlers=[AuthController, OrganizationController],
        dependencies={
            "identity_service": Provide(provide_identity_service),
            "organization_service": Provide(provide_organization_service),
        },
    )
    openapi_config = (
        OpenAPIConfig(
            title="KernelOn API",
            version=__version__,
            path="/schema",
            render_plugins=[ScalarRenderPlugin()],
            use_handler_docstrings=True,
        )
        if resolved.openapi_enabled and resolved.environment != "production"
        else None
    )
    structlog_logging_config = StructLoggingConfig(
        log_exceptions="always",
        pretty_print_tty=resolved.environment == "development",
    )
    if standard_logging := structlog_logging_config.standard_lib_logging_config:
        standard_logging.root["level"] = resolved.log_level
        for logger_config in standard_logging.loggers.values():
            logger_config["level"] = resolved.log_level

    return Litestar(
        route_handlers=[HealthController, api_router],
        plugins=[
            create_database_plugin(resolved),
            StructlogPlugin(
                StructlogConfig(
                    structlog_logging_config=structlog_logging_config,
                    enable_middleware_logging=False,
                )
            ),
        ],
        middleware=[create_request_context_middleware(resolved.environment)],
        exception_handlers=create_exception_handlers(resolved),
        cors_config=CORSConfig(
            allow_origins=resolved.allowed_origins,
            allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allow_headers=["Accept", "Authorization", "Content-Type", "X-Request-ID"],
            allow_credentials=True,
        ),
        allowed_hosts=AllowedHostsConfig(allowed_hosts=resolved.allowed_hosts),
        request_max_body_size=resolved.request_max_body_size,
        response_cache_config=ResponseCacheConfig(default_expiration=0),
        openapi_config=openapi_config,
        debug=resolved.environment == "development",
        pdb_on_exception=False,
    )


app = create_app()
