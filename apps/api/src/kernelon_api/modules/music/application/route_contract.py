"""Authoritative routing ledger for Mineradio's 47 server API paths.

The ledger is not a collection of placeholder handlers. ``service_available``
is true only when ``apps/api`` currently serves a complete response for that
path. Host and worker targets make cross-platform ownership explicit.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum

MUSIC_API_PREFIX = "/api/v1/music"


class MusicExecutionTarget(StrEnum):
    API = "api"
    HOST = "host"
    WORKER = "worker"


class MusicHostBehavior(StrEnum):
    """Distinguish real device adaptation from intentionally disabled app self-management."""

    DEVICE_ADAPTED = "device-adapted"
    KERNELON_HOST_MANAGED_DISABLED = "kernelon-host-managed-disabled"


_DEVICE = MusicHostBehavior.DEVICE_ADAPTED
_DISABLED = MusicHostBehavior.KERNELON_HOST_MANAGED_DISABLED


@dataclass(frozen=True, slots=True)
class MusicRouteContract:
    source_path: str
    source_ui_methods: tuple[str, ...]
    canonical_methods: tuple[str, ...]
    consumed_by_source_ui: bool
    execution_target: MusicExecutionTarget
    target_path: str
    service_path: str | None
    service_available: bool
    host_behavior: MusicHostBehavior | None = None


def _canonical(source_path: str) -> str:
    return MUSIC_API_PREFIX + source_path.removeprefix("/api")


def _api(
    source_path: str,
    *methods: str,
    consumed: bool = True,
    available: bool = False,
    canonical_methods: tuple[str, ...] | None = None,
) -> MusicRouteContract:
    path = _canonical(source_path)
    return MusicRouteContract(
        source_path=source_path,
        source_ui_methods=methods,
        canonical_methods=canonical_methods or methods,
        consumed_by_source_ui=consumed,
        execution_target=MusicExecutionTarget.API,
        target_path=path,
        service_path=path,
        service_available=available,
        host_behavior=None,
    )


def _host(
    source_path: str,
    *methods: str,
    behavior: MusicHostBehavior,
    service_fallback: bool = False,
) -> MusicRouteContract:
    fallback = _canonical(source_path) if service_fallback else None
    return MusicRouteContract(
        source_path=source_path,
        source_ui_methods=methods,
        canonical_methods=methods,
        consumed_by_source_ui=True,
        execution_target=MusicExecutionTarget.HOST,
        target_path="host://music" + source_path.removeprefix("/api"),
        service_path=fallback,
        service_available=service_fallback,
        host_behavior=behavior,
    )


def _worker(source_path: str, *methods: str) -> MusicRouteContract:
    return MusicRouteContract(
        source_path=source_path,
        source_ui_methods=methods,
        canonical_methods=methods,
        consumed_by_source_ui=True,
        execution_target=MusicExecutionTarget.WORKER,
        target_path="worker://music" + source_path.removeprefix("/api"),
        service_path=None,
        service_available=False,
        host_behavior=None,
    )


MINERADIO_ROUTE_CONTRACTS: tuple[MusicRouteContract, ...] = (
    _api("/api/app/version", "GET", consumed=False, available=True),
    _host("/api/update/latest", "GET", behavior=_DISABLED),
    _host("/api/update/download", "POST", behavior=_DISABLED),
    _host("/api/update/download/status", "GET", behavior=_DISABLED),
    _host("/api/update/patch", "POST", behavior=_DISABLED),
    _host("/api/update/patch/status", "GET", behavior=_DISABLED),
    _host("/api/beatmap/cache/status", "GET", behavior=_DEVICE, service_fallback=True),
    _host("/api/beatmap/cache", "GET", "POST", behavior=_DEVICE),
    _api("/api/discover/home", "GET", available=True),
    _api("/api/weather/radio", "GET", available=True),
    _api("/api/weather/ip-location", "GET", available=True),
    _api("/api/search", "GET", available=True),
    _api("/api/qq/search", "GET", available=True),
    _api("/api/qq/song/url", "GET", available=True),
    _api("/api/qq/lyric", "GET", available=True),
    _api("/api/qq/login/status", "GET", available=True),
    _api("/api/qq/login/cookie", "POST", available=True),
    _api("/api/qq/logout", "GET", available=True, canonical_methods=("POST",)),
    _api("/api/qq/user/playlists", "GET", available=True),
    _api("/api/qq/playlist/tracks", "GET", available=True),
    _api("/api/qq/artist/detail", "GET", available=True),
    _api("/api/qq/song/comments", "GET", available=True),
    _api("/api/podcast/search", "GET", available=True),
    _api("/api/podcast/hot", "GET", available=True),
    _api("/api/podcast/detail", "GET", consumed=False, available=True),
    _api("/api/podcast/programs", "GET", available=True),
    _api("/api/podcast/my", "GET", available=True),
    _api("/api/podcast/my/items", "GET", available=True),
    _api("/api/song/url", "GET", available=True),
    _api("/api/login/cookie", "POST", available=True),
    _worker("/api/podcast/dj-beatmap", "GET"),
    _api("/api/login/qr/key", "GET", available=True),
    _api("/api/login/qr/create", "GET", available=True),
    _api("/api/login/qr/check", "GET", available=True),
    _api("/api/login/status", "GET", available=True),
    _api("/api/logout", "GET", available=True, canonical_methods=("POST",)),
    _api("/api/user/playlists", "GET", available=True),
    _api("/api/song/like/check", "GET", available=True),
    _api("/api/song/like", "GET", available=True, canonical_methods=("POST",)),
    _api("/api/playlist/create", "GET", available=True, canonical_methods=("POST",)),
    _api("/api/playlist/add-song", "POST", available=True),
    _api("/api/lyric", "GET", available=True),
    _api("/api/song/comments", "GET", available=True),
    _api("/api/artist/detail", "GET", available=True),
    _api("/api/playlist/tracks", "GET", available=True),
    _api("/api/cover", "GET", available=True),
    _api("/api/audio", "GET", available=True),
)


def route_contract(source_path: str) -> MusicRouteContract:
    """Resolve a source route without silently accepting unknown paths."""
    try:
        return next(item for item in MINERADIO_ROUTE_CONTRACTS if item.source_path == source_path)
    except StopIteration as exc:
        raise KeyError(source_path) from exc
