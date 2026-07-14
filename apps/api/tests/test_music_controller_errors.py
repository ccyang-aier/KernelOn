"""HTTP error-shape contracts for every Mineradio-compatible controller family."""

from __future__ import annotations

from typing import Any
from uuid import uuid4

import pytest
from litestar import Litestar, Router
from litestar.di import Provide
from litestar.testing import AsyncTestClient

from kernelon_api.modules.music.application import MusicProviderError, UnsafeProxyUrlError
from kernelon_api.modules.music.presentation.controllers import MusicController


class FailingMusicService:
    """Expose every service port while failing with a route-specific provider message."""

    def __init__(self, message: str = "provider unavailable") -> None:
        self.message = message

    async def fail(self, *args: object, **kwargs: object) -> None:
        raise MusicProviderError(self.message)

    get_app_info = fail
    get_beat_map_cache_status = fail
    get_discover_home = fail
    search = fail
    get_song_url = fail
    import_cookie = fail
    create_qr_key = fail
    create_qr_code = fail
    check_qr_code = fail
    get_login_status = fail
    logout = fail
    get_user_playlists = fail
    check_song_likes = fail
    set_song_like = fail
    create_playlist = fail
    add_song_to_playlist = fail
    get_lyric = fail
    get_playlist_tracks = fail
    get_artist_detail = fail
    get_song_comments = fail
    get_weather_radio = fail
    get_weather_ip_location = fail
    song_url = fail
    lyric = fail
    login_status = fail
    user_playlists = fail
    playlist_tracks = fail
    artist_detail = fail
    song_comments = fail
    search_podcasts = fail
    get_hot_podcasts = fail
    get_podcast_detail = fail
    get_podcast_programs = fail
    collections = fail
    collection_items = fail
    proxy_cover = fail
    proxy_audio = fail


def build_music_error_app(service: object) -> Litestar:
    async def provide_user_id() -> Any:
        return uuid4()

    async def provide_music_service() -> Any:
        return service

    async def provide_account_service() -> Any:
        return service

    async def provide_qq_service() -> Any:
        return service

    async def provide_podcast_service() -> Any:
        return service

    router = Router(
        path="/api/v1",
        route_handlers=[MusicController],
        dependencies={
            "music_user_id": Provide(provide_user_id),
            "music_service": Provide(provide_music_service),
            "music_account_service": Provide(provide_account_service),
            "qq_music_service": Provide(provide_qq_service),
            "podcast_account_service": Provide(provide_podcast_service),
        },
    )
    return Litestar(route_handlers=[router])


@pytest.mark.parametrize(
    ("method", "path", "json_body", "expected_method", "empty_key"),
    [
        ("GET", "/search?keywords=x", None, "search", "songs"),
        ("GET", "/song/url?id=1", None, "get_song_url", None),
        ("POST", "/login/cookie", {"cookie": "MUSIC_U=x"}, "import_cookie", None),
        ("GET", "/login/qr/key", None, "create_qr_key", None),
        ("GET", "/login/qr/check?key=x", None, "check_qr_code", None),
        ("GET", "/user/playlists", None, "get_user_playlists", "playlists"),
        ("GET", "/song/like/check?id=1", None, "check_song_likes", None),
        ("POST", "/song/like", {"id": 1, "like": True}, "set_song_like", None),
        ("POST", "/playlist/create", {"name": "List"}, "create_playlist", None),
        (
            "POST",
            "/playlist/add-song",
            {"pid": 1, "ids": "2,3"},
            "add_song_to_playlist",
            None,
        ),
        ("GET", "/lyric?id=1", None, "get_lyric", "lyric"),
        ("GET", "/playlist/tracks?id=1", None, "get_playlist_tracks", "tracks"),
        ("GET", "/artist/detail?id=1", None, "get_artist_detail", "songs"),
        ("GET", "/song/comments?id=1", None, "get_song_comments", "comments"),
        ("GET", "/weather/radio?city=x", None, "get_weather_radio", "radio"),
        ("GET", "/weather/ip-location", None, "get_weather_ip_location", "location"),
        ("GET", "/qq/search?keywords=x", None, "search", "songs"),
        ("GET", "/qq/song/url?mid=x", None, "song_url", "url"),
        ("GET", "/qq/lyric?mid=x", None, "lyric", "lyric"),
        ("GET", "/qq/login/status", None, "login_status", None),
        ("POST", "/qq/login/cookie", {"cookie": "uin=1"}, "import_cookie", None),
        ("GET", "/qq/user/playlists", None, "user_playlists", "playlists"),
        ("GET", "/qq/playlist/tracks?id=x", None, "playlist_tracks", "tracks"),
        ("GET", "/qq/artist/detail?mid=x", None, "artist_detail", "songs"),
        ("GET", "/qq/song/comments?id=1", None, "song_comments", "comments"),
        ("GET", "/podcast/search?keywords=x", None, "search_podcasts", "podcasts"),
        ("GET", "/podcast/hot", None, "get_hot_podcasts", "podcasts"),
        ("GET", "/podcast/detail?id=x", None, "get_podcast_detail", None),
        ("GET", "/podcast/programs?id=x", None, "get_podcast_programs", "programs"),
        ("GET", "/podcast/my", None, "collections", "collections"),
        ("GET", "/podcast/my/items", None, "collection_items", "items"),
    ],
)
async def test_provider_failures_keep_route_specific_source_shapes(
    method: str,
    path: str,
    json_body: dict[str, object] | None,
    expected_method: str,
    empty_key: str | None,
) -> None:
    async with AsyncTestClient(
        build_music_error_app(FailingMusicService(f"{expected_method} unavailable"))
    ) as client:
        response = await client.request(
            method,
            f"/api/v1/music{path}",
            json=json_body,
        )

    payload = response.json()
    assert response.status_code == 500
    assert payload["error"] == f"{expected_method} unavailable"
    if empty_key == "radio":
        assert payload["ok"] is False
        assert payload["weather"] is None
        assert payload["radio"]["songs"] == []
    elif empty_key == "location":
        assert payload == {
            "ok": False,
            "error": "get_weather_ip_location unavailable",
            "location": None,
        }
    elif empty_key is not None:
        assert payload[empty_key] in ([], "")


class ProxyFailureService(FailingMusicService):
    def __init__(self, error: Exception) -> None:
        self.error = error

    async def proxy_cover(self, url: str, *, method: str) -> None:
        raise self.error

    async def proxy_audio(self, url: str, *, method: str, range_header: str) -> None:
        raise self.error


@pytest.mark.parametrize(
    ("route", "error", "status", "body"),
    [
        ("cover", UnsafeProxyUrlError("unsafe"), 400, "Invalid cover url"),
        ("cover", MusicProviderError("upstream"), 502, ""),
        ("audio", UnsafeProxyUrlError("unsafe"), 400, "Invalid audio url"),
        ("audio", ValueError("range"), 416, "Invalid Range header"),
        ("audio", MusicProviderError("upstream"), 502, ""),
    ],
)
async def test_proxy_failures_map_to_mineradio_http_statuses(
    route: str, error: Exception, status: int, body: str
) -> None:
    async with AsyncTestClient(build_music_error_app(ProxyFailureService(error))) as client:
        response = await client.get(f"/api/v1/music/{route}?url=https://8.8.8.8/media")

    assert response.status_code == status
    assert response.text == body
