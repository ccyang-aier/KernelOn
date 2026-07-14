"""Music infrastructure adapters."""

from kernelon_api.modules.music.infrastructure.account_service import (
    BaselineNeteaseAccountService,
)
from kernelon_api.modules.music.infrastructure.account_session import (
    InMemoryMusicAccountSessionStore,
    SQLAlchemyMusicAccountSessionStore,
)
from kernelon_api.modules.music.infrastructure.http_provider import HttpxMusicProvider
from kernelon_api.modules.music.infrastructure.provider_services import (
    BaselinePodcastAccountService,
    BaselineQQMusicService,
)
from kernelon_api.modules.music.infrastructure.service import BaselineMusicService

__all__ = [
    "BaselineMusicService",
    "BaselineNeteaseAccountService",
    "BaselinePodcastAccountService",
    "BaselineQQMusicService",
    "HttpxMusicProvider",
    "InMemoryMusicAccountSessionStore",
    "SQLAlchemyMusicAccountSessionStore",
]
