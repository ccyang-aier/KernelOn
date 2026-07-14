"""Framework-independent values exposed by the first music application slice."""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from collections.abc import Mapping


@dataclass(frozen=True, slots=True)
class MusicUpdateInfo:
    """KernelOn host update capability represented in Mineradio's response shape."""

    provider: str
    configured: bool
    owner: str
    repo: str
    preview: bool
    manifest_override: bool


@dataclass(frozen=True, slots=True)
class MusicAppInfo:
    """Version information for the bundled Mineradio application asset."""

    name: str
    product_name: str
    version: str
    update: MusicUpdateInfo


@dataclass(frozen=True, slots=True)
class BeatMapCacheStatus:
    """Graceful server fallback when the device cache adapter is unavailable."""

    enabled: bool
    directory: str
    drive: str
    reason: str
    mode: str


@dataclass(frozen=True, slots=True)
class MusicDiscoverHome:
    """Mineradio home payload before a music-provider session is connected."""

    logged_in: bool
    user: Mapping[str, object] | None
    daily_songs: tuple[Mapping[str, object], ...]
    playlists: tuple[Mapping[str, object], ...]
    podcasts: tuple[Mapping[str, object], ...]
    mode: str | None
    updated_at: int
