"""Golden contracts for Mineradio QQ and authenticated podcast routes."""

from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING, Any
from uuid import uuid4

import pytest
from litestar import Litestar, Router
from litestar.di import Provide
from litestar.testing import AsyncTestClient

from kernelon_api.modules.music.application import (
    MusicAccountSession,
    MusicProviderError,
    MusicProviderResponse,
    PodcastAccountProviderPort,
    PodcastAccountService,
    QQMusicProviderPort,
    QQMusicService,
)
from kernelon_api.modules.music.infrastructure.account_session import (
    InMemoryMusicAccountSessionStore,
)
from kernelon_api.modules.music.infrastructure.provider_services import (
    BaselinePodcastAccountService,
    BaselineQQMusicService,
)
from kernelon_api.modules.music.presentation.controllers import MusicController

if TYPE_CHECKING:
    from collections.abc import Mapping


class FakeQQProvider:
    def __init__(self) -> None:
        self.gets: list[tuple[str, Mapping[str, str | int], str]] = []
        self.posts: list[tuple[Mapping[str, Any], str]] = []

    async def qq_get(
        self, url: str, params: Mapping[str, str | int], cookie: str = ""
    ) -> Mapping[str, Any]:
        self.gets.append((url, params, cookie))
        if "smartbox" in url:
            return {
                "data": {
                    "song": {"itemlist": [{"mid": "song-mid", "name": "Song", "singer": "Singer"}]}
                }
            }
        if "profile_homepage" in url:
            return {"data": {"creator": {"nick": "QQ User", "headpic": "avatar"}}}
        if "lyric" in url:
            return {"lyric": "[00:00]legacy"}
        return {}

    async def qq_musicu(self, payload: Mapping[str, Any], cookie: str = "") -> Mapping[str, Any]:
        self.posts.append((payload, cookie))
        if "songinfo" in payload:
            return {
                "songinfo": {
                    "data": {
                        "track_info": {
                            "id": 7,
                            "mid": "song-mid",
                            "name": "Song",
                            "interval": 180,
                            "singer": [{"id": 8, "mid": "singer-mid", "name": "Singer"}],
                            "album": {"mid": "album-mid", "name": "Album"},
                            "file": {"media_mid": "media-mid"},
                        }
                    }
                }
            }
        if "lyric" in payload:
            return {"lyric": {"data": {}}}
        return {}


class FakePodcastProvider:
    async def login_status(self, cookie: str) -> MusicProviderResponse:
        return MusicProviderResponse({"data": {"profile": {"userId": 9, "nickname": "User"}}})

    async def user_account(self, cookie: str) -> MusicProviderResponse:
        return MusicProviderResponse({})

    async def podcast_sublist(self, limit: int, offset: int, cookie: str) -> MusicProviderResponse:
        return MusicProviderResponse(
            {"djRadios": [{"id": 1, "name": "Collected", "picUrl": "cover"}]}
        )

    async def podcast_created(self, user_id: str, cookie: str) -> MusicProviderResponse:
        return MusicProviderResponse({"data": [{"id": 2, "name": "Created"}]})

    async def podcast_paid(self, limit: int, offset: int, cookie: str) -> MusicProviderResponse:
        return MusicProviderResponse({"data": []})

    async def podcast_liked(self, cookie: str) -> MusicProviderResponse:
        raise MusicProviderError("primary unavailable")

    async def podcast_recent_voices(self, limit: int, cookie: str) -> MusicProviderResponse:
        return MusicProviderResponse(
            {"data": {"list": [{"resource": {"id": 3, "name": "Voice", "mainSong": {"id": 4}}}]}}
        )


def test_provider_services_satisfy_explicit_ports() -> None:
    sessions = InMemoryMusicAccountSessionStore()
    qq_provider = FakeQQProvider()
    podcast_provider = FakePodcastProvider()
    assert isinstance(qq_provider, QQMusicProviderPort)
    assert isinstance(podcast_provider, PodcastAccountProviderPort)
    assert isinstance(BaselineQQMusicService(qq_provider, sessions), QQMusicService)
    assert isinstance(
        BaselinePodcastAccountService(podcast_provider, sessions), PodcastAccountService
    )


async def test_qq_cookie_is_provider_isolated_and_search_mapping_matches_source() -> None:
    user_id = uuid4()
    sessions = InMemoryMusicAccountSessionStore()
    await sessions.save(user_id, MusicAccountSession(cookie="MUSIC_U=netease"))
    provider = FakeQQProvider()
    service = BaselineQQMusicService(provider, sessions)

    imported = await service.import_cookie(user_id, "uin=o00123; qm_keyst=secret")
    searched = await service.search(user_id, "Song", 8)

    session = await sessions.load(user_id)
    assert session.cookie == "MUSIC_U=netease"
    assert session.qq_cookie == "uin=123; qm_keyst=secret"
    assert imported.payload["loggedIn"] is True
    assert searched.payload["songs"][0] == {
        "provider": "qq",
        "source": "qq",
        "type": "qq",
        "id": "song-mid",
        "qqId": 7,
        "mid": "song-mid",
        "songmid": "song-mid",
        "mediaMid": "media-mid",
        "name": "Song",
        "artist": "Singer",
        "artists": [{"id": 8, "mid": "singer-mid", "name": "Singer"}],
        "artistId": 8,
        "artistMid": "singer-mid",
        "album": "Album",
        "albumMid": "album-mid",
        "cover": "https://y.qq.com/music/photo_new/T002R300x300M000album-mid.jpg?max_age=2592000",
        "duration": 180000,
        "fee": 0,
        "playable": False,
    }

    await service.logout(user_id)
    session = await sessions.load(user_id)
    assert session.cookie == "MUSIC_U=netease"
    assert session.qq_cookie == ""


async def test_qq_lyric_uses_mineradio_legacy_fallback() -> None:
    user_id = uuid4()
    sessions = InMemoryMusicAccountSessionStore()
    provider = FakeQQProvider()
    result = await BaselineQQMusicService(provider, sessions).lyric(user_id, "song-mid", "7")
    assert result.payload == {
        "provider": "qq",
        "id": 7,
        "mid": "song-mid",
        "lyric": "[00:00]legacy",
        "tlyric": "",
        "yrc": "",
        "qrc": "",
        "roma": "",
        "source": "qq-legacy",
    }


async def test_qq_user_playlists_are_parallel_independently_settled_filtered_and_sorted() -> None:
    class PlaylistProvider(FakeQQProvider):
        def __init__(self) -> None:
            super().__init__()
            self.arrivals = 0
            self.both_started = asyncio.Event()

        async def qq_get(
            self, url: str, params: Mapping[str, str | int], cookie: str = ""
        ) -> Mapping[str, Any]:
            self.gets.append((url, params, cookie))
            if "profile_homepage" in url:
                return {"data": {"creator": {"nick": "User"}}}
            if "user_created" in url or "profile_order_asset" in url:
                self.arrivals += 1
                if self.arrivals % 2 == 0:
                    self.both_started.set()
                await asyncio.wait_for(self.both_started.wait(), timeout=0.2)
            if "user_created" in url:
                return {
                    "data": {
                        "disslist": [
                            {"dissid": "normal", "diss_name": "普通歌单"},
                            {"dissid": "space", "diss_name": "QQ空间背景音乐"},
                        ]
                    }
                }
            if "profile_order_asset" in url:
                return {"data": {"cdlist": [{"dissid": "favorite", "diss_name": "我喜欢"}]}}
            return {}

    user_id = uuid4()
    sessions = InMemoryMusicAccountSessionStore()
    await sessions.save_provider(user_id, "qq", "uin=123; qm_keyst=secret")
    provider = PlaylistProvider()
    service = BaselineQQMusicService(provider, sessions)

    result = await service.user_playlists(user_id)

    assert [item["id"] for item in result.payload["playlists"]] == ["favorite", "normal"]
    created_params = next(params for url, params, _ in provider.gets if "user_created" in url)
    assert created_params["hostUin"] == 0
    assert created_params["hostuin"] == "123"
    assert created_params["loginUin"] == "123"


async def test_qq_user_playlists_keep_fulfilled_side_when_peer_request_fails() -> None:
    class PartialProvider(FakeQQProvider):
        async def qq_get(
            self, url: str, params: Mapping[str, str | int], cookie: str = ""
        ) -> Mapping[str, Any]:
            if "profile_homepage" in url:
                return {"data": {"creator": {"nick": "User"}}}
            if "user_created" in url:
                return {"data": {"disslist": [{"dissid": "kept", "diss_name": "保留"}]}}
            if "profile_order_asset" in url:
                raise MusicProviderError("collected unavailable")
            return {}

    user_id = uuid4()
    sessions = InMemoryMusicAccountSessionStore()
    await sessions.save_provider(user_id, "qq", "uin=123; qm_keyst=secret")

    result = await BaselineQQMusicService(PartialProvider(), sessions).user_playlists(user_id)

    assert [item["id"] for item in result.payload["playlists"]] == ["kept"]


async def test_qq_playlist_legacy_fields_and_artist_name_backfill_match_source() -> None:
    class LegacyProvider(FakeQQProvider):
        async def qq_get(
            self, url: str, params: Mapping[str, str | int], cookie: str = ""
        ) -> Mapping[str, Any]:
            if "profile_homepage" in url:
                return {"data": {"creator": {"nick": "User"}}}
            if "ucc_getcdinfo" in url:
                return {
                    "cdlist": [
                        {
                            "dissname": "Legacy",
                            "songlist": [
                                {
                                    "songid": 7,
                                    "songmid": "song-mid",
                                    "songname": "Old Song",
                                    "singername": "Old Singer",
                                    "albumname": "Old Album",
                                    "albummid": "album-mid",
                                    "strMediaMid": "media-mid",
                                    "interval": 180,
                                }
                            ],
                        }
                    ]
                }
            return {}

        async def qq_musicu(
            self, payload: Mapping[str, Any], cookie: str = ""
        ) -> Mapping[str, Any]:
            if "singer" in payload:
                return {
                    "singer": {
                        "code": 0,
                        "data": {
                            "singer_info": {},
                            "songlist": [
                                {
                                    "track_info": {
                                        "mid": "song-mid",
                                        "name": "Song",
                                        "singer": [
                                            {"id": 8, "mid": "singer-mid", "name": "Singer"}
                                        ],
                                    }
                                }
                            ],
                        },
                    }
                }
            return {}

    user_id = uuid4()
    sessions = InMemoryMusicAccountSessionStore()
    await sessions.save_provider(user_id, "qq", "uin=123; qm_keyst=secret")
    service = BaselineQQMusicService(LegacyProvider(), sessions)

    playlist = await service.playlist_tracks(user_id, "playlist-id")
    artist = await service.artist_detail(user_id, "singer-mid", 36)

    track = playlist.payload["tracks"][0]
    assert track["name"] == "Old Song"
    assert track["artist"] == "Old Singer"
    assert track["album"] == "Old Album"
    assert track["albumMid"] == "album-mid"
    assert track["mediaMid"] == "media-mid"
    assert track["duration"] == 180000
    assert artist.payload["artist"]["name"] == "Singer"


async def test_qq_login_profile_supports_source_cookie_and_homepage_field_variants() -> None:
    class UnavailableProfileProvider(FakeQQProvider):
        async def qq_get(
            self, url: str, params: Mapping[str, str | int], cookie: str = ""
        ) -> Mapping[str, Any]:
            if "profile_homepage" in url:
                return {"code": 1000}
            return {}

    user_id = uuid4()
    sessions = InMemoryMusicAccountSessionStore()
    fallback = await BaselineQQMusicService(UnavailableProfileProvider(), sessions).import_cookie(
        user_id,
        "uin=123; qm_keyst=secret; ptnick_0123=Cookie+Nick; "
        "qqmusic_avatar=https%3A%2F%2Favatar; vip_type=2",
    )
    assert fallback.payload["nickname"] == "Cookie Nick"
    assert fallback.payload["avatar"] == "https://avatar"
    assert fallback.payload["vipType"] == 2
    assert fallback.payload["profileUnavailable"] is True

    await sessions.save_provider(user_id, "qq", "uin=123; qm_keyst=secret")

    class HomepageVariantProvider(FakeQQProvider):
        async def qq_get(
            self, url: str, params: Mapping[str, str | int], cookie: str = ""
        ) -> Mapping[str, Any]:
            if "profile_homepage" in url:
                return {
                    "data": {
                        "creator": {"hostname": "Home Name", "logo": "home-avatar"},
                        "vipinfo": {"green_vip_level": 3},
                    }
                }
            return {}

    current = await BaselineQQMusicService(HomepageVariantProvider(), sessions).login_status(
        user_id
    )
    assert current.payload["nickname"] == "Home Name"
    assert current.payload["avatar"] == "home-avatar"
    assert current.payload["vipType"] == 3
    assert current.payload["profileSource"] == "qq-profile"


async def test_qq_song_url_preserves_source_raw_message_edge_shapes() -> None:
    class UrlProvider(FakeQQProvider):
        def __init__(self, info: Mapping[str, Any] | None) -> None:
            super().__init__()
            self.info = info

        async def qq_musicu(
            self, payload: Mapping[str, Any], cookie: str = ""
        ) -> Mapping[str, Any]:
            infos = [] if self.info is None else [self.info]
            return {"req_0": {"data": {"midurlinfo": infos}}}

    user_id = uuid4()
    empty = await BaselineQQMusicService(
        UrlProvider(None), InMemoryMusicAccountSessionStore()
    ).song_url(user_id, "song-mid", "", "standard")
    assert "qqCode" not in empty.payload
    assert "rawMessage" not in empty.payload
    assert empty.payload["restriction"]["rawMessage"] == ""

    sessions = InMemoryMusicAccountSessionStore()
    await sessions.save_provider(user_id, "qq", "uin=123; qm_keyst=secret")
    edge_message = {"nested": "shape"}
    edge = await BaselineQQMusicService(
        UrlProvider({"result": 104003, "msg": edge_message}), sessions
    ).song_url(user_id, "song-mid", "", "standard")
    assert edge.payload["qqCode"] == 104003
    assert edge.payload["rawMessage"] == edge_message
    assert edge.payload["restriction"]["rawMessage"] == "[object Object]"

    message_only = await BaselineQQMusicService(
        UrlProvider({"message": "fallback only"}), sessions
    ).song_url(user_id, "song-mid", "", "standard")
    assert "qqCode" not in message_only.payload
    assert message_only.payload["rawMessage"] == ""
    assert message_only.payload["restriction"]["rawMessage"] == "fallback only"


async def test_podcast_collections_and_liked_fallback_match_source() -> None:
    user_id = uuid4()
    sessions = InMemoryMusicAccountSessionStore()
    await sessions.save(user_id, MusicAccountSession(cookie="MUSIC_U=netease"))
    service = BaselinePodcastAccountService(FakePodcastProvider(), sessions)

    collections = await service.collections(user_id)
    liked = await service.collection_items(user_id, "liked", 36, 0)

    assert collections.payload["loggedIn"] is True
    assert [(item["key"], item["count"]) for item in collections.payload["collections"]] == [
        ("collect", 1),
        ("created", 1),
        ("liked", 1),
    ]
    assert liked.payload["itemType"] == "voice"
    assert liked.payload["items"][0]["id"] == 4
    assert liked.payload["items"][0]["programId"] == 3


@pytest.mark.parametrize("key", ["collect", "created", "liked"])
async def test_podcast_logged_out_shape_does_not_call_provider(key: str) -> None:
    result = await BaselinePodcastAccountService(
        FakePodcastProvider(), InMemoryMusicAccountSessionStore()
    ).collection_items(uuid4(), key, 36, 0)
    assert result.payload == {"loggedIn": False, "items": []}


async def test_qq_and_podcast_http_validation_shapes_match_source() -> None:
    user_id = uuid4()
    sessions = InMemoryMusicAccountSessionStore()
    qq_service = BaselineQQMusicService(FakeQQProvider(), sessions)
    podcast_service = BaselinePodcastAccountService(FakePodcastProvider(), sessions)

    async def provide_user_id() -> Any:
        return user_id

    async def provide_qq_service() -> Any:
        return qq_service

    async def provide_podcast_service() -> Any:
        return podcast_service

    async def provide_music_service() -> Any:
        return object()

    async def provide_account_service() -> Any:
        return object()

    router = Router(
        path="/api/v1",
        route_handlers=[MusicController],
        dependencies={
            "music_user_id": Provide(provide_user_id),
            "qq_music_service": Provide(provide_qq_service),
            "podcast_account_service": Provide(provide_podcast_service),
            "music_service": Provide(provide_music_service),
            "music_account_service": Provide(provide_account_service),
        },
    )
    async with AsyncTestClient(Litestar(route_handlers=[router])) as client:
        lyric = await client.get("/api/v1/music/qq/lyric")
        artist = await client.get("/api/v1/music/qq/artist/detail")
        invalid_cookie = await client.post(
            "/api/v1/music/qq/login/cookie", json={"cookie": "uin=1"}
        )
        playlists = await client.get("/api/v1/music/qq/user/playlists")
        podcasts = await client.get("/api/v1/music/podcast/my")

    assert lyric.status_code == 400
    assert lyric.json() == {
        "provider": "qq",
        "error": "Missing QQ song mid or id",
        "lyric": "",
    }
    assert artist.status_code == 400
    assert artist.json() == {
        "provider": "qq",
        "error": "MISSING_SINGER_MID",
        "artist": None,
        "songs": [],
    }
    assert invalid_cookie.status_code == 400
    assert invalid_cookie.json()["error"] == "INVALID_QQ_COOKIE"
    assert playlists.json() == {"loggedIn": False, "provider": "qq", "playlists": []}
    assert podcasts.json()["loggedIn"] is False
    assert [item["key"] for item in podcasts.json()["collections"]] == [
        "collect",
        "created",
        "liked",
    ]
