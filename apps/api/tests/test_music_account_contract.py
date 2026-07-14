"""Golden contracts for Mineradio's Netease account and write routes."""

from __future__ import annotations

import base64
from typing import TYPE_CHECKING, Any
from uuid import UUID, uuid4

import httpx
import pytest
from litestar import Litestar, Router
from litestar.di import Provide
from litestar.testing import AsyncTestClient

from kernelon_api.modules.music.application import (
    MusicAccountSession,
    MusicAccountSessionPort,
    MusicProviderResponse,
    NeteaseAccountProviderPort,
    NeteaseAccountService,
)
from kernelon_api.modules.music.application.route_contract import route_contract
from kernelon_api.modules.music.infrastructure.account_service import (
    BaselineNeteaseAccountService,
)
from kernelon_api.modules.music.infrastructure.account_session import (
    InMemoryMusicAccountSessionStore,
)
from kernelon_api.modules.music.infrastructure.http_provider import HttpxMusicProvider
from kernelon_api.modules.music.presentation.controllers import MusicController

if TYPE_CHECKING:
    from collections.abc import AsyncIterator, Mapping, Sequence


class FakeNeteaseAccountProvider:
    def __init__(self) -> None:
        self.qr_key = MusicProviderResponse({"data": {"unikey": "qr-key"}})
        self.qr_check = MusicProviderResponse({"code": 801, "message": "waiting"})
        self.status_by_cookie: dict[str, Mapping[str, Any]] = {}
        self.account_by_cookie: dict[str, Mapping[str, Any]] = {}
        self.user_playlist_body: Mapping[str, Any] = {"playlist": []}
        self.song_url_responses: list[MusicProviderResponse] = []
        self.like_check_body: Mapping[str, Any] = {"data": {}}
        self.like_list_body: Mapping[str, Any] = {"ids": []}
        self.like_body: Mapping[str, Any] = {"code": 200}
        self.create_body: Mapping[str, Any] = {"code": 200, "playlist": {"id": 9}}
        self.add_body: Mapping[str, Any] = {"code": 200}
        self.add_fallback_body: Mapping[str, Any] = {"code": 200}
        self.calls: list[tuple[str, tuple[object, ...]]] = []

    async def login_qr_key(self) -> MusicProviderResponse:
        self.calls.append(("login_qr_key", ()))
        return self.qr_key

    async def login_qr_check(self, key: str, *, cookie: str = "") -> MusicProviderResponse:
        self.calls.append(("login_qr_check", (key, cookie)))
        return self.qr_check

    async def login_status(self, cookie: str) -> MusicProviderResponse:
        self.calls.append(("login_status", (cookie,)))
        return MusicProviderResponse(self.status_by_cookie.get(cookie, {}))

    async def user_account(self, cookie: str) -> MusicProviderResponse:
        self.calls.append(("user_account", (cookie,)))
        return MusicProviderResponse(self.account_by_cookie.get(cookie, {}))

    async def logout(self, cookie: str) -> MusicProviderResponse:
        self.calls.append(("logout", (cookie,)))
        return MusicProviderResponse({"code": 200})

    async def user_playlists(self, user_id: str, limit: int, cookie: str) -> MusicProviderResponse:
        self.calls.append(("user_playlists", (user_id, limit, cookie)))
        return MusicProviderResponse(self.user_playlist_body)

    async def song_url_v1(self, song_id: str, level: str, cookie: str) -> MusicProviderResponse:
        self.calls.append(("song_url_v1", (song_id, level, cookie)))
        if self.song_url_responses:
            return self.song_url_responses.pop(0)
        return MusicProviderResponse({"data": [{}]})

    async def song_url(self, song_id: str, bitrate: int, cookie: str) -> MusicProviderResponse:
        self.calls.append(("song_url", (song_id, bitrate, cookie)))
        return MusicProviderResponse({"data": [{}]})

    async def song_like_check(self, song_ids: Sequence[str], cookie: str) -> MusicProviderResponse:
        self.calls.append(("song_like_check", (tuple(song_ids), cookie)))
        return MusicProviderResponse(self.like_check_body)

    async def like_list(self, user_id: str, cookie: str) -> MusicProviderResponse:
        self.calls.append(("like_list", (user_id, cookie)))
        return MusicProviderResponse(self.like_list_body)

    async def like_song(self, song_id: str, like: bool, cookie: str) -> MusicProviderResponse:
        self.calls.append(("like_song", (song_id, like, cookie)))
        return MusicProviderResponse(self.like_body)

    async def create_playlist(self, name: str, privacy: str, cookie: str) -> MusicProviderResponse:
        self.calls.append(("create_playlist", (name, privacy, cookie)))
        return MusicProviderResponse(self.create_body)

    async def add_playlist_tracks(
        self, playlist_id: str, song_ids: str, cookie: str
    ) -> MusicProviderResponse:
        self.calls.append(("add_playlist_tracks", (playlist_id, song_ids, cookie)))
        return MusicProviderResponse(self.add_body)

    async def add_playlist_tracks_fallback(
        self, playlist_id: str, song_ids: str, cookie: str
    ) -> MusicProviderResponse:
        self.calls.append(("add_playlist_tracks_fallback", (playlist_id, song_ids, cookie)))
        return MusicProviderResponse(self.add_fallback_body)


@pytest.fixture
def account_provider() -> FakeNeteaseAccountProvider:
    return FakeNeteaseAccountProvider()


@pytest.fixture
def account_sessions() -> InMemoryMusicAccountSessionStore:
    return InMemoryMusicAccountSessionStore()


@pytest.fixture
def account_service(
    account_provider: FakeNeteaseAccountProvider,
    account_sessions: InMemoryMusicAccountSessionStore,
) -> BaselineNeteaseAccountService:
    return BaselineNeteaseAccountService(account_provider, account_sessions)


def test_account_adapters_satisfy_explicit_ports(
    account_provider: FakeNeteaseAccountProvider,
    account_sessions: InMemoryMusicAccountSessionStore,
    account_service: BaselineNeteaseAccountService,
) -> None:
    assert isinstance(account_provider, NeteaseAccountProviderPort)
    assert isinstance(account_sessions, MusicAccountSessionPort)
    assert isinstance(account_service, NeteaseAccountService)


async def test_cookie_sessions_are_isolated_by_authenticated_kernelon_user(
    account_provider: FakeNeteaseAccountProvider,
    account_sessions: InMemoryMusicAccountSessionStore,
    account_service: BaselineNeteaseAccountService,
) -> None:
    first_user, second_user = uuid4(), uuid4()
    account_provider.status_by_cookie = {
        "MUSIC_U=first": {"data": {"profile": {"userId": 1, "nickname": "First"}}},
        "MUSIC_U=second": {"data": {"profile": {"userId": 2, "nickname": "Second"}}},
    }

    first = await account_service.import_cookie(first_user, "MUSIC_U=first; Path=/")
    second = await account_service.import_cookie(second_user, {"MUSIC_U": "second"})

    assert first.payload["nickname"] == "First"
    assert second.payload["nickname"] == "Second"
    assert (await account_sessions.load(first_user)).cookie == "MUSIC_U=first"
    assert (await account_sessions.load(second_user)).cookie == "MUSIC_U=second"
    await account_service.logout(first_user)
    assert (await account_sessions.load(first_user)).cookie == ""
    assert (await account_sessions.load(second_user)).cookie == "MUSIC_U=second"


async def test_qr_and_cookie_fallback_shapes_match_source(
    account_provider: FakeNeteaseAccountProvider,
    account_sessions: InMemoryMusicAccountSessionStore,
    account_service: BaselineNeteaseAccountService,
) -> None:
    user_id = uuid4()
    invalid = await account_service.import_cookie(user_id, "__csrf=x")
    assert invalid.status_code == 400
    assert invalid.payload["error"] == "INVALID_NETEASE_COOKIE"

    key = await account_service.create_qr_key(user_id)
    image = await account_service.create_qr_code(user_id, "qr-key")
    assert key.payload == {"key": "qr-key"}
    assert image.payload["url"] == "https://music.163.com/login?codekey=qr-key"
    image_data = str(image.payload["img"])
    assert image_data.startswith("data:image/png;base64,")
    png = base64.b64decode(image_data.partition(",")[2])
    assert png.startswith(b"\x89PNG\r\n\x1a\n")
    assert b"api.qrserver.com" not in png

    account_provider.qr_check = MusicProviderResponse(
        {"code": 803, "message": "ok", "nickname": "QR User"},
        cookie="MUSIC_U=qr-cookie",
    )
    checked = await account_service.check_qr_code(user_id, "qr-key")
    assert checked.payload == {
        "code": 803,
        "message": "ok",
        "loggedIn": True,
        "pendingProfile": True,
        "nickname": "QR User",
        "avatar": "",
        "vipType": 0,
        "vipLevel": "none",
        "isVip": False,
        "isSvip": False,
        "vipLabel": "无VIP",
        "hasCookie": True,
    }
    assert (await account_sessions.load(user_id)).cookie == "MUSIC_U=qr-cookie"


async def test_user_song_and_write_use_cases_preserve_source_fallbacks(
    account_provider: FakeNeteaseAccountProvider,
    account_sessions: InMemoryMusicAccountSessionStore,
    account_service: BaselineNeteaseAccountService,
) -> None:
    user_id = uuid4()
    await account_sessions.save(user_id, MusicAccountSession(cookie="MUSIC_U=session"))
    account_provider.status_by_cookie["MUSIC_U=session"] = {
        "data": {"profile": {"userId": 7, "nickname": "User"}}
    }
    account_provider.user_playlist_body = {
        "playlist": [
            {
                "id": 8,
                "name": "Mine",
                "coverImgUrl": "cover",
                "trackCount": 2,
                "playCount": 3,
                "creator": {"nickname": "User"},
                "subscribed": True,
                "specialType": 5,
            }
        ]
    }
    account_provider.song_url_responses = [
        MusicProviderResponse({"data": [{"url": None, "fee": 1}]}),
        MusicProviderResponse(
            {"data": [{"url": "https://audio", "br": 1_411_000, "freeTrialInfo": None}]}
        ),
    ]
    account_provider.like_list_body = {"ids": ["11"]}
    account_provider.add_body = {"code": 500, "message": "primary failed"}
    account_provider.add_fallback_body = {"code": 200}

    playlists = await account_service.get_user_playlists(user_id, 60)
    song = await account_service.get_song_url(user_id, "11", "hires")
    likes = await account_service.check_song_likes(user_id, ["11", "12"])
    liked = await account_service.set_song_like(user_id, "11", True)
    created = await account_service.create_playlist(user_id, "New", "0")
    added = await account_service.add_song_to_playlist(user_id, "8", "11")

    assert playlists.payload["playlists"][0]["creator"] == "User"
    assert song.payload["url"] == "https://audio"
    assert song.payload["level"] == "lossless"
    assert song.payload["loggedIn"] is True
    assert likes.payload["liked"] == {"11": True, "12": False}
    assert liked.payload["body"] == {"code": 200}
    assert created.payload["playlist"] == {"id": 9}
    assert added.status_code == 200
    assert added.payload["success"] is True
    assert [attempt["api"] for attempt in added.payload["attempts"]] == [
        "playlist_tracks",
        "playlist_track_add",
    ]


async def test_invalid_netease_cookie_message_is_cleared_in_the_same_status_response(
    account_provider: FakeNeteaseAccountProvider,
    account_sessions: InMemoryMusicAccountSessionStore,
    account_service: BaselineNeteaseAccountService,
) -> None:
    user_id = uuid4()
    cookie = "MUSIC_U=expired"
    await account_sessions.save_provider(user_id, "netease", cookie)
    account_provider.account_by_cookie[cookie] = {"code": 500, "message": "需要登录后操作"}

    result = await account_service.get_login_status(user_id)

    assert result.payload == {
        "loggedIn": False,
        "vipType": 0,
        "vipLevel": "none",
        "isVip": False,
        "isSvip": False,
        "vipLabel": "无VIP",
        "hasCookie": False,
    }
    assert (await account_sessions.load(user_id)).cookie == ""

    imported_user = uuid4()
    imported_cookie = "MUSIC_U=expired-import"
    account_provider.account_by_cookie[imported_cookie] = {
        "code": 500,
        "error": "login required",
    }
    imported = await account_service.import_cookie(imported_user, imported_cookie)
    assert imported.payload["loggedIn"] is False
    assert imported.payload["saved"] is True
    assert imported.payload["hasCookie"] is False
    assert (await account_sessions.load(imported_user)).cookie == ""


@pytest.fixture
async def account_client(
    account_service: BaselineNeteaseAccountService,
) -> AsyncIterator[AsyncTestClient[Litestar]]:
    user_id = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")

    async def provide_account_service() -> NeteaseAccountService:
        return account_service

    async def provide_user_id() -> UUID:
        return user_id

    async def provide_music_service() -> Any:
        return object()

    async def provide_qq_service() -> Any:
        return object()

    async def provide_podcast_service() -> Any:
        return object()

    router = Router(
        path="/api/v1",
        route_handlers=[MusicController],
        dependencies={
            "music_account_service": Provide(provide_account_service),
            "music_user_id": Provide(provide_user_id),
            "music_service": Provide(provide_music_service),
            "qq_music_service": Provide(provide_qq_service),
            "podcast_account_service": Provide(provide_podcast_service),
        },
    )
    async with AsyncTestClient(Litestar(route_handlers=[router])) as client:
        yield client


async def test_http_routes_expose_golden_validation_and_logged_out_shapes(
    account_client: AsyncTestClient[Litestar],
) -> None:
    assert (await account_client.post("/api/v1/music/login/cookie", json={})).status_code == 400
    assert (await account_client.get("/api/v1/music/login/qr/key")).json() == {"key": "qr-key"}
    qr = (await account_client.get("/api/v1/music/login/qr/create?key=x")).json()
    assert qr["url"] == "https://music.163.com/login?codekey=x"
    assert qr["img"].startswith("data:image/png;base64,")
    assert (await account_client.get("/api/v1/music/login/qr/check?key=x")).json() == {
        "code": 801,
        "message": "waiting",
        "nickname": None,
        "avatar": None,
    }
    assert (await account_client.get("/api/v1/music/login/status")).json()["loggedIn"] is False
    assert (await account_client.post("/api/v1/music/logout")).json() == {"ok": True}
    assert (await account_client.get("/api/v1/music/user/playlists")).json() == {
        "loggedIn": False,
        "playlists": [],
    }
    assert (await account_client.get("/api/v1/music/song/url?id=1")).status_code == 200
    assert (await account_client.get("/api/v1/music/song/like/check")).status_code == 401
    assert (await account_client.get("/api/v1/music/song/like/check?id=1")).status_code == 401
    assert (await account_client.post("/api/v1/music/song/like", json={})).status_code == 401
    assert (await account_client.post("/api/v1/music/song/like", json={"id": 1})).status_code == 401
    assert (await account_client.post("/api/v1/music/playlist/create", json={})).status_code == 401
    assert (
        await account_client.post("/api/v1/music/playlist/add-song", json={})
    ).status_code == 401
    assert (
        await account_client.post("/api/v1/music/playlist/add-song", json={"pid": 1, "id": 2})
    ).status_code == 401


async def test_qr_key_accepts_current_netease_top_level_unikey_shape() -> None:
    class TopLevelKeyProvider(FakeNeteaseAccountProvider):
        async def login_qr_key(self) -> MusicProviderResponse:
            return MusicProviderResponse(payload={"code": 200, "unikey": "top-level-key"})

    service = BaselineNeteaseAccountService(
        TopLevelKeyProvider(), InMemoryMusicAccountSessionStore()
    )

    result = await service.create_qr_key(UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"))

    assert result.payload == {"key": "top-level-key"}


async def test_netease_write_routes_validate_parameters_only_after_login(
    account_client: AsyncTestClient[Litestar],
    account_provider: FakeNeteaseAccountProvider,
    account_sessions: InMemoryMusicAccountSessionStore,
) -> None:
    user_id = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
    cookie = "MUSIC_U=valid"
    await account_sessions.save_provider(user_id, "netease", cookie)
    account_provider.status_by_cookie[cookie] = {
        "data": {"profile": {"userId": 7, "nickname": "User"}}
    }

    assert (await account_client.get("/api/v1/music/song/like/check")).status_code == 400
    assert (await account_client.post("/api/v1/music/song/like", json={})).status_code == 400
    assert (await account_client.post("/api/v1/music/playlist/create", json={})).status_code == 400
    assert (
        await account_client.post("/api/v1/music/playlist/add-song", json={})
    ).status_code == 400


async def test_provider_posts_account_parameters_and_extracts_cookie() -> None:
    calls: list[httpx.Request] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request)
        return httpx.Response(
            200,
            json={"code": 803},
            headers=[
                ("set-cookie", "MUSIC_U=secret; Path=/; HttpOnly"),
                ("set-cookie", "__csrf=token; Path=/"),
            ],
        )

    provider = HttpxMusicProvider(transport=httpx.MockTransport(handler))
    checked = await provider.login_qr_check("key", cookie="MUSIC_U=old")

    assert calls[0].url.path == "/api/login/qrcode/client/login"
    assert calls[0].headers["cookie"] == "MUSIC_U=old"
    assert b"key=key" in await calls[0].aread()
    assert checked.cookie == "MUSIC_U=secret; __csrf=token"


def test_route_ledger_marks_only_completed_account_routes_available() -> None:
    paths = {
        "/api/login/cookie",
        "/api/login/qr/key",
        "/api/login/qr/create",
        "/api/login/qr/check",
        "/api/login/status",
        "/api/logout",
        "/api/user/playlists",
        "/api/song/url",
        "/api/song/like/check",
        "/api/song/like",
        "/api/playlist/create",
        "/api/playlist/add-song",
    }
    assert all(route_contract(path).service_available for path in paths)
