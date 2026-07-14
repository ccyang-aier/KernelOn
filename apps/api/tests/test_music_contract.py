"""Mineradio source-route inventory and first backend slice contract tests."""

from __future__ import annotations

import asyncio
from time import time_ns
from typing import TYPE_CHECKING, Any
from uuid import uuid4

import httpx
import pytest
from litestar.testing import AsyncTestClient

from kernelon_api.asgi import create_app
from kernelon_api.config import Settings
from kernelon_api.modules.music.application.ports import (
    MusicAccountSession,
    MusicProviderError,
    MusicProviderHttpPort,
    MusicProviderResponse,
    MusicService,
    ProviderStream,
    UnsafeProxyUrlError,
)
from kernelon_api.modules.music.application.route_contract import (
    MINERADIO_ROUTE_CONTRACTS,
    MusicExecutionTarget,
    MusicHostBehavior,
    route_contract,
)
from kernelon_api.modules.music.application.source_logic import build_weather_mood
from kernelon_api.modules.music.infrastructure.account_session import (
    InMemoryMusicAccountSessionStore,
)
from kernelon_api.modules.music.infrastructure.http_provider import (
    HttpxMusicProvider,
    validate_public_http_url,
)
from kernelon_api.modules.music.infrastructure.service import BaselineMusicService

if TYPE_CHECKING:
    from collections.abc import AsyncIterator, Mapping, Sequence

    from litestar import Litestar


async def bytes_body(value: bytes) -> AsyncIterator[bytes]:
    yield value


class FakeMusicProvider:
    def __init__(self) -> None:
        self.search_body: Mapping[str, Any] = {"result": {"songs": []}}
        self.detail_body: Mapping[str, Any] = {"songs": []}
        self.lyric_new_body: Mapping[str, Any] = {}
        self.lyric_body: Mapping[str, Any] = {}
        self.playlist_all_body: Mapping[str, Any] = {"songs": []}
        self.playlist_detail_body: Mapping[str, Any] = {"playlist": {}}
        self.artist_detail_body: Mapping[str, Any] = {}
        self.artist_songs_body: Mapping[str, Any] = {"songs": []}
        self.artist_top_body: Mapping[str, Any] = {"songs": []}
        self.comments_body: Mapping[str, Any] = {"comments": []}
        self.weather_geocode_body: Mapping[str, Any] = {"results": []}
        self.weather_forecast_body: Mapping[str, Any] = {"current": {}}
        self.weather_ip_body: Mapping[str, Any] = {"status": "fail"}
        self.podcast_search_body: Mapping[str, Any] = {"result": {}}
        self.podcast_hot_body: Mapping[str, Any] = {}
        self.podcast_detail_body: Mapping[str, Any] = {}
        self.podcast_programs_body: Mapping[str, Any] = {}
        self.personalized_body: Mapping[str, Any] = {"result": []}
        self.recommend_resource_body: Mapping[str, Any] = {"recommend": []}
        self.recommend_songs_body: Mapping[str, Any] = {"data": {"dailySongs": []}}
        self.cookie_calls: list[tuple[str, str]] = []
        self.proxy_result = ProviderStream(
            status_code=200,
            headers={"content-type": "application/octet-stream"},
            body=bytes_body(b"payload"),
        )
        self.fail_lyric_new = False
        self.fail_playlist_all = False
        self.fail_artist_detail = False
        self.fail_artist_songs = False
        self.fail_weather_forecast = False
        self.proxy_calls: list[tuple[str, str, Mapping[str, str]]] = []

    async def cloud_search(self, keywords: str, limit: int, cookie: str = "") -> Mapping[str, Any]:
        self.cookie_calls.append(("cloud_search", cookie))
        assert isinstance(keywords, str)
        assert isinstance(limit, int)
        return self.search_body

    async def song_details(self, ids: Sequence[str], cookie: str = "") -> Mapping[str, Any]:
        self.cookie_calls.append(("song_details", cookie))
        assert ids
        return self.detail_body

    async def lyric_new(self, song_id: str, cookie: str = "") -> Mapping[str, Any]:
        self.cookie_calls.append(("lyric_new", cookie))
        if self.fail_lyric_new:
            raise MusicProviderError("new lyric unavailable")
        return self.lyric_new_body

    async def lyric(self, song_id: str, cookie: str = "") -> Mapping[str, Any]:
        self.cookie_calls.append(("lyric", cookie))
        return self.lyric_body

    async def playlist_tracks_all(
        self, playlist_id: str, limit: int, cookie: str = ""
    ) -> Mapping[str, Any]:
        self.cookie_calls.append(("playlist_tracks_all", cookie))
        if self.fail_playlist_all:
            raise MusicProviderError("track-all unavailable")
        return self.playlist_all_body

    async def playlist_detail(self, playlist_id: str, cookie: str = "") -> Mapping[str, Any]:
        self.cookie_calls.append(("playlist_detail", cookie))
        return self.playlist_detail_body

    async def artist_detail(self, artist_id: str, cookie: str = "") -> Mapping[str, Any]:
        self.cookie_calls.append(("artist_detail", cookie))
        if self.fail_artist_detail:
            raise MusicProviderError("artist detail unavailable")
        return self.artist_detail_body

    async def artist_songs(self, artist_id: str, limit: int, cookie: str = "") -> Mapping[str, Any]:
        self.cookie_calls.append(("artist_songs", cookie))
        if self.fail_artist_songs:
            raise MusicProviderError("artist songs unavailable")
        return self.artist_songs_body

    async def artist_top_songs(self, artist_id: str, cookie: str = "") -> Mapping[str, Any]:
        self.cookie_calls.append(("artist_top_songs", cookie))
        return self.artist_top_body

    async def song_comments(
        self, song_id: str, limit: int, offset: int, cookie: str = ""
    ) -> Mapping[str, Any]:
        self.cookie_calls.append(("song_comments", cookie))
        return self.comments_body

    async def weather_geocode(self, query: str) -> Mapping[str, Any]:
        return self.weather_geocode_body

    async def weather_forecast(
        self, latitude: float, longitude: float, timezone: str
    ) -> Mapping[str, Any]:
        if self.fail_weather_forecast:
            raise MusicProviderError("weather unavailable")
        return self.weather_forecast_body

    async def weather_ip_location(self) -> Mapping[str, Any]:
        return self.weather_ip_body

    async def podcast_search(
        self, keywords: str, limit: int, cookie: str = ""
    ) -> Mapping[str, Any]:
        self.cookie_calls.append(("podcast_search", cookie))
        return self.podcast_search_body

    async def podcast_hot(self, limit: int, offset: int, cookie: str = "") -> Mapping[str, Any]:
        self.cookie_calls.append(("podcast_hot", cookie))
        return self.podcast_hot_body

    async def podcast_detail(self, radio_id: str, cookie: str = "") -> Mapping[str, Any]:
        self.cookie_calls.append(("podcast_detail", cookie))
        return self.podcast_detail_body

    async def podcast_programs(
        self, radio_id: str, limit: int, offset: int, cookie: str = ""
    ) -> Mapping[str, Any]:
        self.cookie_calls.append(("podcast_programs", cookie))
        return self.podcast_programs_body

    async def personalized(self, limit: int, cookie: str) -> Mapping[str, Any]:
        self.cookie_calls.append(("personalized", cookie))
        return self.personalized_body

    async def recommend_resource(self, cookie: str) -> Mapping[str, Any]:
        self.cookie_calls.append(("recommend_resource", cookie))
        return self.recommend_resource_body

    async def recommend_songs(self, cookie: str) -> Mapping[str, Any]:
        self.cookie_calls.append(("recommend_songs", cookie))
        return self.recommend_songs_body

    async def login_status(self, cookie: str) -> MusicProviderResponse:
        self.cookie_calls.append(("login_status", cookie))
        return MusicProviderResponse(
            {
                "data": {
                    "profile": {"userId": 7, "nickname": "Miner", "avatarUrl": "avatar"},
                    "account": {"id": 7},
                }
            }
        )

    async def user_account(self, cookie: str) -> MusicProviderResponse:
        self.cookie_calls.append(("user_account", cookie))
        return MusicProviderResponse({})

    async def proxy_stream(
        self,
        url: str,
        *,
        method: str,
        headers: Mapping[str, str],
    ) -> ProviderStream:
        self.proxy_calls.append((url, method, headers))
        return self.proxy_result


EXPECTED_SOURCE_ROUTES = frozenset(
    {
        "/api/app/version",
        "/api/update/latest",
        "/api/update/download",
        "/api/update/download/status",
        "/api/update/patch",
        "/api/update/patch/status",
        "/api/beatmap/cache/status",
        "/api/beatmap/cache",
        "/api/discover/home",
        "/api/weather/radio",
        "/api/weather/ip-location",
        "/api/search",
        "/api/qq/search",
        "/api/qq/song/url",
        "/api/qq/lyric",
        "/api/qq/login/status",
        "/api/qq/login/cookie",
        "/api/qq/logout",
        "/api/qq/user/playlists",
        "/api/qq/playlist/tracks",
        "/api/qq/artist/detail",
        "/api/qq/song/comments",
        "/api/podcast/search",
        "/api/podcast/hot",
        "/api/podcast/detail",
        "/api/podcast/programs",
        "/api/podcast/my",
        "/api/podcast/my/items",
        "/api/song/url",
        "/api/login/cookie",
        "/api/podcast/dj-beatmap",
        "/api/login/qr/key",
        "/api/login/qr/create",
        "/api/login/qr/check",
        "/api/login/status",
        "/api/logout",
        "/api/user/playlists",
        "/api/song/like/check",
        "/api/song/like",
        "/api/playlist/create",
        "/api/playlist/add-song",
        "/api/lyric",
        "/api/song/comments",
        "/api/artist/detail",
        "/api/playlist/tracks",
        "/api/cover",
        "/api/audio",
    }
)


@pytest.fixture
async def client() -> AsyncIterator[AsyncTestClient[Litestar]]:
    settings = Settings(
        environment="test",
        database_url="postgresql+psycopg://kernelon:kernelon@127.0.0.1:1/kernelon",
        openapi_enabled=True,
        allowed_hosts=["testserver.local"],
    )
    async with AsyncTestClient(app=create_app(settings)) as test_client:
        yield test_client


@pytest.fixture
async def music_client(
    provider: FakeMusicProvider,
) -> AsyncIterator[AsyncTestClient[Litestar]]:
    settings = Settings(
        environment="test",
        database_url="postgresql+psycopg://kernelon:kernelon@127.0.0.1:1/kernelon",
        openapi_enabled=True,
        allowed_hosts=["testserver.local"],
    )
    async with AsyncTestClient(app=create_app(settings, music_provider=provider)) as test_client:
        yield test_client


@pytest.fixture
def provider() -> FakeMusicProvider:
    return FakeMusicProvider()


@pytest.fixture
def music_service(provider: FakeMusicProvider) -> BaselineMusicService:
    return BaselineMusicService(provider)


def test_music_service_port_is_satisfied_by_baseline_adapter() -> None:
    assert isinstance(BaselineMusicService(), MusicService)
    assert isinstance(HttpxMusicProvider(), MusicProviderHttpPort)


def test_all_47_source_routes_have_unique_explicit_targets() -> None:
    contracts = MINERADIO_ROUTE_CONTRACTS
    paths = [item.source_path for item in contracts]

    assert len(contracts) == 47
    assert len(paths) == len(set(paths))
    assert frozenset(paths) == EXPECTED_SOURCE_ROUTES
    assert all(item.source_ui_methods for item in contracts)
    assert all(item.canonical_methods for item in contracts)
    assert all(item.target_path for item in contracts)


def test_source_ui_consumes_45_of_the_47_server_routes() -> None:
    server_only = {
        item.source_path for item in MINERADIO_ROUTE_CONTRACTS if not item.consumed_by_source_ui
    }

    assert server_only == {"/api/app/version", "/api/podcast/detail"}
    assert sum(item.consumed_by_source_ui for item in MINERADIO_ROUTE_CONTRACTS) == 45


def test_device_and_worker_routes_do_not_become_remote_business_handlers() -> None:
    host_routes = {
        item.source_path
        for item in MINERADIO_ROUTE_CONTRACTS
        if item.execution_target is MusicExecutionTarget.HOST
    }
    worker_routes = {
        item.source_path
        for item in MINERADIO_ROUTE_CONTRACTS
        if item.execution_target is MusicExecutionTarget.WORKER
    }

    assert host_routes == {
        "/api/update/latest",
        "/api/update/download",
        "/api/update/download/status",
        "/api/update/patch",
        "/api/update/patch/status",
        "/api/beatmap/cache/status",
        "/api/beatmap/cache",
    }
    assert worker_routes == {"/api/podcast/dj-beatmap"}
    assert route_contract("/api/beatmap/cache/status").service_path == (
        "/api/v1/music/beatmap/cache/status"
    )
    assert route_contract("/api/beatmap/cache").service_path is None


def test_host_routes_distinguish_device_adaptation_from_disabled_self_update() -> None:
    updates = {
        item.source_path
        for item in MINERADIO_ROUTE_CONTRACTS
        if item.host_behavior is MusicHostBehavior.KERNELON_HOST_MANAGED_DISABLED
    }
    device_adapted = {
        item.source_path
        for item in MINERADIO_ROUTE_CONTRACTS
        if item.host_behavior is MusicHostBehavior.DEVICE_ADAPTED
    }

    assert updates == {
        "/api/update/latest",
        "/api/update/download",
        "/api/update/download/status",
        "/api/update/patch",
        "/api/update/patch/status",
    }
    assert device_adapted == {"/api/beatmap/cache/status", "/api/beatmap/cache"}
    assert all(
        not item.service_available and item.service_path is None
        for item in MINERADIO_ROUTE_CONTRACTS
        if item.host_behavior is MusicHostBehavior.KERNELON_HOST_MANAGED_DISABLED
    )
    assert route_contract("/api/beatmap/cache/status").service_available is True
    assert route_contract("/api/beatmap/cache").service_available is False
    assert all(
        item.host_behavior is None
        for item in MINERADIO_ROUTE_CONTRACTS
        if item.execution_target is not MusicExecutionTarget.HOST
    )


def test_mutating_legacy_gets_map_to_canonical_posts() -> None:
    for source_path in ("/api/qq/logout", "/api/logout", "/api/song/like", "/api/playlist/create"):
        contract = route_contract(source_path)
        assert contract.source_ui_methods == ("GET",)
        assert contract.canonical_methods == ("POST",)


def test_service_availability_tracks_only_completed_handlers() -> None:
    available = {item.service_path for item in MINERADIO_ROUTE_CONTRACTS if item.service_available}

    assert available == {
        "/api/v1/music/app/version",
        "/api/v1/music/beatmap/cache/status",
        "/api/v1/music/discover/home",
        "/api/v1/music/search",
        "/api/v1/music/lyric",
        "/api/v1/music/song/comments",
        "/api/v1/music/artist/detail",
        "/api/v1/music/playlist/tracks",
        "/api/v1/music/cover",
        "/api/v1/music/audio",
        "/api/v1/music/weather/radio",
        "/api/v1/music/weather/ip-location",
        "/api/v1/music/podcast/search",
        "/api/v1/music/podcast/hot",
        "/api/v1/music/podcast/detail",
        "/api/v1/music/podcast/programs",
        "/api/v1/music/podcast/my",
        "/api/v1/music/podcast/my/items",
        "/api/v1/music/qq/search",
        "/api/v1/music/qq/song/url",
        "/api/v1/music/qq/lyric",
        "/api/v1/music/qq/login/status",
        "/api/v1/music/qq/login/cookie",
        "/api/v1/music/qq/logout",
        "/api/v1/music/qq/user/playlists",
        "/api/v1/music/qq/playlist/tracks",
        "/api/v1/music/qq/artist/detail",
        "/api/v1/music/qq/song/comments",
        "/api/v1/music/song/url",
        "/api/v1/music/login/cookie",
        "/api/v1/music/login/qr/key",
        "/api/v1/music/login/qr/create",
        "/api/v1/music/login/qr/check",
        "/api/v1/music/login/status",
        "/api/v1/music/logout",
        "/api/v1/music/user/playlists",
        "/api/v1/music/song/like/check",
        "/api/v1/music/song/like",
        "/api/v1/music/playlist/create",
        "/api/v1/music/playlist/add-song",
    }


async def test_app_version_preserves_mineradio_shape(
    client: AsyncTestClient[Litestar],
) -> None:
    response = await client.get("/api/v1/music/app/version")

    assert response.status_code == 200
    assert response.headers["cache-control"] == (
        "no-store, no-cache, must-revalidate, proxy-revalidate"
    )
    assert response.json() == {
        "name": "mineradio",
        "productName": "Mineradio",
        "version": "1.1.1",
        "update": {
            "provider": "kernelon-host",
            "configured": False,
            "owner": "",
            "repo": "",
            "preview": False,
            "manifestOverride": False,
        },
    }


async def test_server_beat_cache_status_truthfully_falls_back_to_memory(
    client: AsyncTestClient[Litestar],
) -> None:
    response = await client.get("/api/v1/music/beatmap/cache/status")

    assert response.status_code == 200
    assert response.json() == {
        "enabled": False,
        "dir": "",
        "drive": "",
        "reason": "DEVICE_ADAPTER_REQUIRED",
        "mode": "memory-only",
    }


async def test_logged_out_discover_home_matches_mineradio_starter_semantics(
    music_service: BaselineMusicService,
) -> None:
    before = time_ns() // 1_000_000
    result = await music_service.get_discover_home(uuid4())
    after = time_ns() // 1_000_000

    assert result.logged_in is False
    assert result.user is None
    assert result.daily_songs == ()
    assert result.playlists == ()
    assert result.podcasts == ()
    assert result.mode == "starter"
    assert before <= result.updated_at <= after


class ParallelDiscoverProvider(FakeMusicProvider):
    def __init__(self) -> None:
        super().__init__()
        self._arrivals = 0
        self._all_started = asyncio.Event()

    async def _arrive(self, name: str, cookie: str) -> None:
        self.cookie_calls.append((name, cookie))
        self._arrivals += 1
        if self._arrivals == 4:
            self._all_started.set()
        await asyncio.wait_for(self._all_started.wait(), timeout=0.5)

    async def personalized(self, limit: int, cookie: str) -> Mapping[str, Any]:
        await self._arrive("personalized", cookie)
        return self.personalized_body

    async def podcast_hot(self, limit: int, offset: int, cookie: str = "") -> Mapping[str, Any]:
        await self._arrive("podcast_hot", cookie)
        return self.podcast_hot_body

    async def recommend_resource(self, cookie: str) -> Mapping[str, Any]:
        await self._arrive("recommend_resource", cookie)
        return self.recommend_resource_body

    async def recommend_songs(self, cookie: str) -> Mapping[str, Any]:
        await self._arrive("recommend_songs", cookie)
        return self.recommend_songs_body


async def test_logged_in_discover_home_matches_parallel_mineradio_aggregation() -> None:
    provider = ParallelDiscoverProvider()
    provider.personalized_body = {"result": [{"id": 1, "name": "Public", "picUrl": "public-cover"}]}
    provider.podcast_hot_body = {
        "djRadios": [
            {"id": 2, "name": "Radio", "picUrl": "radio-cover", "dj": {"nickname": "DJ"}},
            {"id": 3, "name": "付费精品", "picUrl": "ignored"},
        ]
    }
    provider.recommend_resource_body = {
        "recommend": [{"id": 4, "name": "Private", "coverImgUrl": "private-cover"}]
    }
    provider.recommend_songs_body = {
        "data": {
            "dailySongs": [
                {"id": 5, "name": "Daily", "ar": [{"id": 6, "name": "Artist"}], "al": {}}
            ]
        }
    }
    sessions = InMemoryMusicAccountSessionStore()
    user_id = uuid4()
    await sessions.save_provider(user_id, "netease", "MUSIC_U=user-one")
    service = BaselineMusicService(provider, sessions, provider)

    result = await service.get_discover_home(user_id)

    assert result.logged_in is True
    assert result.user == {"userId": 7, "nickname": "Miner", "avatar": "avatar"}
    assert [item["name"] for item in result.playlists] == ["Private", "Public"]
    assert [item["name"] for item in result.podcasts] == ["Radio"]
    assert [item["name"] for item in result.daily_songs] == ["Daily"]
    assert result.mode is None
    assert {name for name, _ in provider.cookie_calls[-4:]} == {
        "personalized",
        "podcast_hot",
        "recommend_resource",
        "recommend_songs",
    }
    assert {cookie for _, cookie in provider.cookie_calls} == {"MUSIC_U=user-one"}


async def test_discover_home_clears_source_recognized_expired_cookie() -> None:
    class ExpiredCookieProvider(FakeMusicProvider):
        async def login_status(self, cookie: str) -> MusicProviderResponse:
            self.cookie_calls.append(("login_status", cookie))
            return MusicProviderResponse({})

        async def user_account(self, cookie: str) -> MusicProviderResponse:
            self.cookie_calls.append(("user_account", cookie))
            return MusicProviderResponse({"code": 500, "msg": "请先登录"})

    provider = ExpiredCookieProvider()
    sessions = InMemoryMusicAccountSessionStore()
    user_id = uuid4()
    await sessions.save_provider(user_id, "netease", "MUSIC_U=expired")
    service = BaselineMusicService(provider, sessions, provider)

    result = await service.get_discover_home(user_id)

    assert result.logged_in is False
    assert result.mode == "starter"
    assert (await sessions.load(user_id)).cookie == ""


async def test_all_netease_read_routes_use_only_the_current_users_cookie() -> None:
    provider = FakeMusicProvider()
    provider.search_body = {"result": {"songs": [{"id": 1, "name": "Song", "ar": [], "al": {}}]}}
    provider.lyric_body = {"lrc": {"lyric": "line"}}
    sessions = InMemoryMusicAccountSessionStore()
    first_user = uuid4()
    second_user = uuid4()
    first_cookie = "MUSIC_U=first-user"
    second_cookie = "MUSIC_U=second-user"
    await sessions.save(first_user, MusicAccountSession(cookie=first_cookie, qq_cookie="qq=one"))
    await sessions.save(second_user, MusicAccountSession(cookie=second_cookie, qq_cookie="qq=two"))
    service = BaselineMusicService(provider, sessions, provider)

    await service.search(first_user, "query", 20)
    await service.get_lyric(first_user, "1")
    await service.get_playlist_tracks(first_user, "1")
    await service.get_artist_detail(first_user, "1", 30)
    await service.get_song_comments(first_user, "1", 20, 0)
    await service.get_weather_radio(
        first_user, city="上海", latitude="31.2", longitude="121.4", timezone="Asia/Shanghai"
    )
    await service.search_podcasts(first_user, "radio", 18)
    await service.get_hot_podcasts(first_user, 18, 0)
    await service.get_podcast_detail(first_user, "1")
    await service.get_podcast_programs(first_user, "1", 30, 0)

    expected_calls = {
        "cloud_search",
        "song_details",
        "lyric_new",
        "lyric",
        "playlist_tracks_all",
        "playlist_detail",
        "artist_detail",
        "artist_songs",
        "artist_top_songs",
        "song_comments",
        "podcast_search",
        "podcast_hot",
        "podcast_detail",
        "podcast_programs",
    }
    first_calls = list(provider.cookie_calls)
    assert expected_calls.issubset({name for name, _ in first_calls})
    assert {cookie for name, cookie in first_calls if name in expected_calls} == {first_cookie}

    first_call_count = len(provider.cookie_calls)
    await service.search(second_user, "query", 20)
    second_calls = provider.cookie_calls[first_call_count:]
    assert second_calls
    assert {cookie for _, cookie in second_calls} == {second_cookie}


async def test_search_maps_source_shape_and_backfills_only_missing_covers(
    music_service: BaselineMusicService, provider: FakeMusicProvider
) -> None:
    provider.search_body = {
        "result": {
            "songs": [
                {
                    "id": 11,
                    "name": "Alpha",
                    "ar": [{"id": 7, "name": "Artist"}],
                    "al": {"name": "Album", "picUrl": ""},
                    "dt": 1234,
                    "fee": 0,
                },
                {
                    "id": 12,
                    "name": "Beta",
                    "artists": [{"id": 8, "name": "Singer"}],
                    "album": {"name": "Record", "picUrl": "https://img/existing.jpg"},
                    "duration": 4321,
                },
            ]
        }
    }
    provider.detail_body = {"songs": [{"id": 11, "al": {"picUrl": "https://img/backfilled.jpg"}}]}

    result = await music_service.search(uuid4(), "query", 20)

    assert result.payload == {
        "songs": [
            {
                "provider": "netease",
                "source": "netease",
                "type": "song",
                "id": 11,
                "name": "Alpha",
                "artist": "Artist",
                "artists": [{"id": 7, "name": "Artist"}],
                "artistId": 7,
                "album": "Album",
                "cover": "https://img/backfilled.jpg",
                "duration": 1234,
                "fee": 0,
            },
            {
                "provider": "netease",
                "source": "netease",
                "type": "song",
                "id": 12,
                "name": "Beta",
                "artist": "Singer",
                "artists": [{"id": 8, "name": "Singer"}],
                "artistId": 8,
                "album": "Record",
                "cover": "https://img/existing.jpg",
                "duration": 4321,
                "fee": None,
            },
        ]
    }


async def test_lyric_new_falls_back_to_legacy_when_no_lrc_or_yrc(
    music_service: BaselineMusicService, provider: FakeMusicProvider
) -> None:
    provider.lyric_new_body = {"tlyric": {"lyric": "translation only"}}
    provider.lyric_body = {
        "lrc": {"lyric": "legacy"},
        "tlyric": {"lyric": "translated"},
    }

    result = await music_service.get_lyric(uuid4(), "88")

    assert result.payload == {
        "lyric": "legacy",
        "tlyric": "translated",
        "yrc": "",
        "source": "lyric",
    }


async def test_playlist_track_all_failure_uses_detail_metadata_and_tracks(
    music_service: BaselineMusicService, provider: FakeMusicProvider
) -> None:
    provider.fail_playlist_all = True
    provider.playlist_detail_body = {
        "playlist": {
            "id": 99,
            "name": "Fallback",
            "coverImgUrl": "https://img/list.jpg",
            "trackCount": 1,
            "tracks": [{"id": 1, "name": "Song", "ar": [], "al": {}}],
        }
    }

    result = await music_service.get_playlist_tracks(uuid4(), "99")

    assert result.payload["playlist"] == {
        "id": 99,
        "name": "Fallback",
        "cover": "https://img/list.jpg",
        "trackCount": 1,
    }
    assert result.payload["tracks"][0]["id"] == 1


async def test_artist_detail_uses_top_songs_fallback_and_preserves_raw_body(
    music_service: BaselineMusicService, provider: FakeMusicProvider
) -> None:
    provider.artist_detail_body = {
        "artist": {
            "id": 5,
            "name": "Artist",
            "picUrl": "https://img/artist.jpg",
            "briefDesc": "Bio",
            "musicSize": 42,
            "albumSize": 3,
        }
    }
    provider.fail_artist_songs = True
    provider.artist_top_body = {
        "songs": [{"id": 6, "name": "Top", "ar": [{"name": "Artist"}], "al": {}}]
    }

    result = await music_service.get_artist_detail(uuid4(), "5", 30)

    assert result.payload["artist"] == {
        "id": 5,
        "name": "Artist",
        "avatar": "https://img/artist.jpg",
        "brief": "Bio",
        "musicSize": 42,
        "albumSize": 3,
    }
    assert result.payload["songs"][0]["name"] == "Top"
    assert result.payload["body"] == provider.artist_detail_body


async def test_song_comments_prefers_hot_comments_only_on_first_page(
    music_service: BaselineMusicService, provider: FakeMusicProvider
) -> None:
    provider.comments_body = {
        "total": 10,
        "hotComments": [
            {
                "commentId": 4,
                "content": "Hot",
                "likedCount": 8,
                "time": 123,
                "user": {"userId": 2, "nickname": "User", "avatarUrl": "avatar"},
            }
        ],
        "comments": [{"commentId": 5, "content": "Normal"}],
    }

    result = await music_service.get_song_comments(uuid4(), "1", 20, 0)

    assert result.payload["hot"] is True
    assert result.payload["comments"] == [
        {
            "id": 4,
            "content": "Hot",
            "likedCount": 8,
            "time": 123,
            "user": {"id": 2, "nickname": "User", "avatar": "avatar"},
        }
    ]
    assert result.payload["body"] == provider.comments_body


async def test_cover_and_audio_proxy_preserve_source_headers_and_range(
    music_service: BaselineMusicService, provider: FakeMusicProvider
) -> None:
    provider.proxy_result = ProviderStream(
        status_code=206,
        headers={
            "content-type": "application/octet-stream",
            "content-length": "7",
            "content-range": "bytes 0-6/20",
        },
        body=bytes_body(b"payload"),
    )
    audio = await music_service.proxy_audio(
        "https://stream.qqmusic.qq.com/song.mp3",
        method="GET",
        range_header="bytes=0-6",
    )

    assert audio.status_code == 206
    assert audio.headers == {
        "Accept-Ranges": "bytes",
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "audio/mpeg",
        "Cross-Origin-Resource-Policy": "cross-origin",
        "Content-Length": "7",
        "Content-Range": "bytes 0-6/20",
    }
    assert b"".join([chunk async for chunk in audio.body]) == b"payload"
    assert provider.proxy_calls[-1][2]["Range"] == "bytes=0-6"
    assert provider.proxy_calls[-1][2]["Referer"] == "https://y.qq.com/"

    provider.proxy_result = ProviderStream(
        status_code=200,
        headers={"content-type": "image/png", "content-length": "3"},
        body=bytes_body(b"png"),
    )
    cover = await music_service.proxy_cover("https://music.126.net/a.png", method="HEAD")
    assert cover.headers["Cache-Control"] == "public, max-age=86400"
    assert cover.headers["Cross-Origin-Resource-Policy"] == "cross-origin"
    assert provider.proxy_calls[-1][1] == "HEAD"

    with pytest.raises(ValueError, match="Invalid Range"):
        await music_service.proxy_audio(
            "https://music.126.net/a.mp3",
            method="GET",
            range_header="bytes=0-1,4-5",
        )


def test_weather_mood_preserves_rain_day_source_values() -> None:
    mood = build_weather_mood(
        {
            "weatherCode": 61,
            "temperature": 18,
            "apparentTemperature": 17,
            "precipitation": 1,
            "humidity": 80,
            "windSpeed": 5,
            "isDay": 1,
        },
        hour=12,
    )

    assert mood == {
        "key": "rain",
        "title": "雨天电台",
        "tagline": "留一点潮湿的空间给旋律",
        "energy": 0.38,
        "warmth": 0.42,
        "focus": 0.64,
        "melancholy": 0.66,
        "keywords": ["雨天 R&B", "lofi rainy", "华语 慢歌", "dream pop", "雨夜 歌单"],
    }


async def test_weather_radio_maps_open_meteo_and_falls_back_without_failing_route(
    music_service: BaselineMusicService, provider: FakeMusicProvider
) -> None:
    provider.weather_forecast_body = {
        "timezone": "Asia/Shanghai",
        "current": {
            "weather_code": 61,
            "temperature_2m": 20,
            "apparent_temperature": 19,
            "relative_humidity_2m": 70,
            "precipitation": 1,
            "cloud_cover": 80,
            "wind_speed_10m": 8,
            "wind_gusts_10m": 12,
            "is_day": 1,
            "time": "2026-07-14T12:00",
        },
    }
    provider.search_body = {
        "result": {
            "songs": [
                {
                    "id": 1,
                    "name": "晴天",
                    "ar": [{"name": "周杰伦"}],
                    "al": {"picUrl": "cover"},
                    "dt": 100,
                }
            ]
        }
    }

    result = await music_service.get_weather_radio(
        uuid4(), city="上海", latitude="31.2", longitude="121.4", timezone="Asia/Shanghai"
    )

    assert result.payload["ok"] is True
    assert result.payload["weather"]["provider"] == "open-meteo"
    assert result.payload["weather"]["label"] == "雨"
    assert result.payload["weather"]["temperature"] == 20
    assert result.payload["radio"]["songs"][0]["name"] == "晴天"

    provider.fail_weather_forecast = True
    fallback = await music_service.get_weather_radio(
        uuid4(), city="杭州", latitude=None, longitude=None, timezone=""
    )
    assert fallback.payload["ok"] is True
    assert fallback.payload["weather"]["label"] == "天气暂不可用"
    assert fallback.payload["weather"]["location"]["fallback"] is True


async def test_ip_location_and_podcast_routes_preserve_source_mappings(
    music_service: BaselineMusicService, provider: FakeMusicProvider
) -> None:
    provider.weather_ip_body = {
        "status": "success",
        "city": "上海",
        "regionName": "上海",
        "country": "中国",
        "lat": 31.2,
        "lon": 121.4,
        "timezone": "Asia/Shanghai",
        "query": "203.0.113.1",
    }
    location = await music_service.get_weather_ip_location()
    assert location.payload == {
        "ok": True,
        "location": {
            "provider": "ip-api",
            "city": "上海",
            "region": "上海",
            "country": "中国",
            "latitude": 31.2,
            "longitude": 121.4,
            "timezone": "Asia/Shanghai",
            "ip": "203.0.113.1",
        },
    }

    radio = {
        "id": 9,
        "name": "Radio",
        "picUrl": "radio-cover",
        "dj": {"nickname": "DJ"},
        "programCount": 2,
    }
    provider.podcast_search_body = {"result": {"djRadios": [radio], "djRadiosCount": 1}}
    provider.podcast_hot_body = {"djRadios": [radio], "hasMore": True}
    provider.podcast_detail_body = {"data": radio}
    provider.podcast_programs_body = {
        "programs": [
            {
                "id": 3,
                "name": "Episode",
                "radio": radio,
                "mainSong": {"id": 4, "name": "Audio", "duration": 5000},
            }
        ],
        "more": False,
        "count": 1,
    }

    user_id = uuid4()
    search = await music_service.search_podcasts(user_id, "radio", 18)
    hot = await music_service.get_hot_podcasts(user_id, 18, 0)
    detail = await music_service.get_podcast_detail(user_id, "9")
    programs = await music_service.get_podcast_programs(user_id, "9", 30, 0)

    assert search.payload["total"] == 1
    assert search.payload["podcasts"][0]["djName"] == "DJ"
    assert hot.payload["more"] is True
    assert detail.payload["podcast"]["rid"] == 9
    assert programs.payload["programs"][0] == {
        "type": "podcast",
        "source": "podcast",
        "id": 4,
        "programId": 3,
        "radioId": 9,
        "name": "Episode",
        "artist": "Radio",
        "artists": [],
        "artistId": None,
        "album": "Radio",
        "cover": "radio-cover",
        "duration": 5000,
        "fee": None,
        "djName": "DJ",
        "radioName": "Radio",
        "desc": "",
        "createTime": 0,
        "serialNum": 0,
    }


async def test_provider_http_adapter_posts_netease_source_parameters() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.method == "POST"
        assert request.url.path == "/api/search/get/web"
        assert b"s=hello" in await request.aread()
        return httpx.Response(200, json={"result": {"songs": []}})

    adapter = HttpxMusicProvider(transport=httpx.MockTransport(handler))

    assert await adapter.cloud_search("hello", 20) == {"result": {"songs": []}}


async def test_proxy_revalidates_redirect_and_blocks_private_destination() -> None:
    requests: list[str] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requests.append(str(request.url))
        return httpx.Response(302, headers={"location": "http://127.0.0.1/private"})

    adapter = HttpxMusicProvider(transport=httpx.MockTransport(handler))

    with pytest.raises(UnsafeProxyUrlError, match="non-public"):
        await adapter.proxy_stream("https://8.8.8.8/media", method="GET", headers={})
    assert requests == ["https://8.8.8.8/media"]


async def test_proxy_rejects_dns_names_resolving_to_private_addresses() -> None:
    async def private_resolver(host: str, port: int) -> Sequence[str]:
        assert host == "media.example"
        assert port == 443
        return ["10.0.0.8"]

    with pytest.raises(UnsafeProxyUrlError, match="non-public"):
        await validate_public_http_url("https://media.example/song.mp3", private_resolver)


async def test_completed_http_routes_expose_success_and_source_error_shapes(
    music_client: AsyncTestClient[Litestar], provider: FakeMusicProvider
) -> None:
    user_scoped_paths = (
        "/api/v1/music/search?keywords=x",
        "/api/v1/music/lyric",
        "/api/v1/music/lyric?id=1",
        "/api/v1/music/playlist/tracks",
        "/api/v1/music/playlist/tracks?id=1",
        "/api/v1/music/artist/detail",
        "/api/v1/music/artist/detail?id=1",
        "/api/v1/music/song/comments",
        "/api/v1/music/song/comments?id=1",
        "/api/v1/music/weather/radio?city=上海",
        "/api/v1/music/podcast/search",
        "/api/v1/music/podcast/hot",
        "/api/v1/music/podcast/detail",
        "/api/v1/music/podcast/detail?id=1",
        "/api/v1/music/podcast/programs",
        "/api/v1/music/podcast/programs?id=1",
    )
    for path in user_scoped_paths:
        assert (await music_client.get(path)).status_code == 401
    assert (await music_client.get("/api/v1/music/weather/ip-location")).json() == {
        "ok": False,
        "error": "IP_LOCATION_FAILED",
        "location": None,
    }
    assert (await music_client.get("/api/v1/music/cover")).status_code == 400

    provider.proxy_result = ProviderStream(
        status_code=200,
        headers={"content-type": "image/png"},
        body=bytes_body(b"png"),
    )
    cover = await music_client.get("/api/v1/music/cover?url=https://8.8.8.8/a.png")
    assert cover.status_code == 200
    assert cover.content == b"png"
    assert (await music_client.get("/api/v1/music/audio")).status_code == 400
    assert (
        await music_client.get(
            "/api/v1/music/audio?url=https://8.8.8.8/a.mp3",
            headers={"Range": "bytes=0-1,4-5"},
        )
    ).status_code == 416
    provider.proxy_result = ProviderStream(
        status_code=206,
        headers={"content-type": "audio/mpeg", "content-range": "bytes 0-2/3"},
        body=bytes_body(b"mp3"),
    )
    audio = await music_client.get(
        "/api/v1/music/audio?url=https://8.8.8.8/a.mp3",
        headers={"Range": "bytes=0-2"},
    )
    assert audio.status_code == 206
    assert audio.content == b"mp3"


async def test_openapi_exposes_completed_music_handlers(
    client: AsyncTestClient[Litestar],
) -> None:
    document = (await client.get("/schema/openapi.json")).json()

    assert document["paths"]["/api/v1/music/app/version"]["get"]["operationId"] == (
        "music_app_version"
    )
    assert (
        document["paths"]["/api/v1/music/beatmap/cache/status"]["get"]["operationId"]
        == "music_beatmap_cache_status"
    )
    assert document["paths"]["/api/v1/music/discover/home"]["get"]["operationId"] == (
        "music_discover_home"
    )
    expected_operations = {
        "/api/v1/music/search": "music_search",
        "/api/v1/music/lyric": "music_lyric",
        "/api/v1/music/playlist/tracks": "music_playlist_tracks",
        "/api/v1/music/artist/detail": "music_artist_detail",
        "/api/v1/music/song/comments": "music_song_comments",
        "/api/v1/music/cover": "music_cover_proxy",
        "/api/v1/music/audio": "music_audio_proxy",
        "/api/v1/music/weather/radio": "music_weather_radio",
        "/api/v1/music/weather/ip-location": "music_weather_ip_location",
        "/api/v1/music/podcast/search": "music_podcast_search",
        "/api/v1/music/podcast/hot": "music_podcast_hot",
        "/api/v1/music/podcast/detail": "music_podcast_detail",
        "/api/v1/music/podcast/programs": "music_podcast_programs",
    }
    for path, operation_id in expected_operations.items():
        assert document["paths"][path]["get"]["operationId"] == operation_id
