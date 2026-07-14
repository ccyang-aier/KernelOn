"""Database plugin and migration metadata."""

from __future__ import annotations

from typing import TYPE_CHECKING

from advanced_alchemy.config import AlembicAsyncConfig, AsyncSessionConfig
from advanced_alchemy.extensions.litestar import SQLAlchemyAsyncConfig, SQLAlchemyInitPlugin
from sqlalchemy.orm import DeclarativeBase

if TYPE_CHECKING:
    from kernelon_api.config import Settings

from kernelon_api.config import API_ROOT


class OrmBase(DeclarativeBase):
    """Base for infrastructure-owned SQLAlchemy mappings."""


def load_mappings() -> None:
    """Import business mappings exactly at the composition boundary."""
    from kernelon_api.modules.identity.infrastructure import models as identity_models  # noqa: F401
    from kernelon_api.modules.music.infrastructure import models as music_models  # noqa: F401
    from kernelon_api.modules.organizations.infrastructure import (
        models as organization_models,  # noqa: F401
    )
    from kernelon_api.modules.wallpapers.infrastructure import (
        models as wallpaper_models,  # noqa: F401
    )


def create_database_config(settings: Settings) -> SQLAlchemyAsyncConfig:
    """Create the Advanced Alchemy configuration without implicit commits or create-all."""
    load_mappings()
    return SQLAlchemyAsyncConfig(
        connection_string=settings.sqlalchemy_url,
        metadata=OrmBase.metadata,
        create_all=False,
        session_config=AsyncSessionConfig(expire_on_commit=False),
        alembic_config=AlembicAsyncConfig(
            script_config=str(API_ROOT / "alembic.ini"),
            script_location=str(API_ROOT / "migrations"),
        ),
    )


def create_database_plugin(settings: Settings) -> SQLAlchemyInitPlugin:
    """Create the engine/session lifecycle plugin without ORM serialization."""
    return SQLAlchemyInitPlugin(config=create_database_config(settings))
