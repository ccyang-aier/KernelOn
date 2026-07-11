"""Database plugin and migration metadata."""

from __future__ import annotations

from typing import TYPE_CHECKING

from advanced_alchemy.config import AlembicAsyncConfig
from advanced_alchemy.extensions.litestar import SQLAlchemyAsyncConfig, SQLAlchemyInitPlugin
from sqlalchemy.orm import DeclarativeBase

if TYPE_CHECKING:
    from kernelon_api.config import Settings

from kernelon_api.config import API_ROOT


class OrmBase(DeclarativeBase):
    """Base for infrastructure-owned SQLAlchemy mappings."""


def create_database_config(settings: Settings) -> SQLAlchemyAsyncConfig:
    """Create the Advanced Alchemy configuration without implicit commits or create-all."""
    return SQLAlchemyAsyncConfig(
        connection_string=settings.sqlalchemy_url,
        metadata=OrmBase.metadata,
        create_all=False,
        alembic_config=AlembicAsyncConfig(
            script_config=str(API_ROOT / "alembic.ini"),
            script_location=str(API_ROOT / "migrations"),
        ),
    )


def create_database_plugin(settings: Settings) -> SQLAlchemyInitPlugin:
    """Create the engine/session lifecycle plugin without ORM serialization."""
    return SQLAlchemyInitPlugin(config=create_database_config(settings))
