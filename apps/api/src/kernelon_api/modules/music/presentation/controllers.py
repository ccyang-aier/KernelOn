"""Implemented Mineradio-compatible music HTTP endpoints."""

from __future__ import annotations

from typing import Any
from uuid import UUID  # noqa: TC003 - Litestar resolves handler annotations at runtime

from litestar import Controller, Request, Response, get, post
from litestar.di import NamedDependency  # noqa: TC002
from litestar.response import Stream

from kernelon_api.modules.music.application import (
    MusicJsonResult,
    MusicProviderError,
    MusicProxyResult,
    MusicService,
    NeteaseAccountService,
    PodcastAccountService,
    QQMusicService,
    UnsafeProxyUrlError,
)
from kernelon_api.modules.music.presentation.dto import (
    BeatMapCacheStatusResponse,
    MusicAppVersionResponse,
    MusicCookieImportRequest,
    MusicDiscoverHomeResponse,
    MusicPlaylistAddSongRequest,
    MusicPlaylistCreateRequest,
    MusicSongLikeRequest,
)

NO_STORE_HEADERS = {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
}


def response_dict(
    model: MusicAppVersionResponse | BeatMapCacheStatusResponse | MusicDiscoverHomeResponse,
) -> dict[str, Any]:
    return model.model_dump(by_alias=True, exclude_none=True)


def music_response(
    model: MusicAppVersionResponse | BeatMapCacheStatusResponse | MusicDiscoverHomeResponse,
) -> Response[dict[str, Any]]:
    return Response(content=response_dict(model), headers=NO_STORE_HEADERS)


def music_json_response(result: MusicJsonResult) -> Response[dict[str, Any]]:
    return Response(
        content=dict(result.payload),
        headers=NO_STORE_HEADERS,
        status_code=result.status_code,
    )


def proxy_response(result: MusicProxyResult) -> Stream:
    return Stream(
        content=result.body,
        headers=dict(result.headers),
        status_code=result.status_code,
    )


class MusicController(Controller):
    path = "/music"
    tags = ("music",)

    @get("/app/version", operation_id="music_app_version")
    async def app_version(
        self, music_service: NamedDependency[MusicService]
    ) -> Response[dict[str, Any]]:
        return music_response(
            MusicAppVersionResponse.from_domain(await music_service.get_app_info())
        )

    @get("/beatmap/cache/status", operation_id="music_beatmap_cache_status")
    async def beat_map_cache_status(
        self, music_service: NamedDependency[MusicService]
    ) -> Response[dict[str, Any]]:
        """Return the truthful server fallback; device adapters own persistent cache."""
        return music_response(
            BeatMapCacheStatusResponse.from_domain(await music_service.get_beat_map_cache_status())
        )

    @get("/discover/home", operation_id="music_discover_home")
    async def discover_home(
        self,
        music_service: NamedDependency[MusicService],
        music_user_id: NamedDependency[UUID],
    ) -> Response[dict[str, Any]]:
        """Preserve Mineradio's empty starter home before provider login."""
        return music_response(
            MusicDiscoverHomeResponse.from_domain(
                await music_service.get_discover_home(music_user_id)
            )
        )

    @get("/search", operation_id="music_search")
    async def search(
        self,
        music_service: NamedDependency[MusicService],
        music_user_id: NamedDependency[UUID],
        keywords: str = "",
        limit: int = 20,
    ) -> Response[dict[str, Any]]:
        try:
            return music_json_response(await music_service.search(music_user_id, keywords, limit))
        except MusicProviderError as exc:
            return music_json_response(
                MusicJsonResult(payload={"error": str(exc), "songs": []}, status_code=500)
            )

    @get("/song/url", operation_id="music_song_url")
    async def song_url(
        self,
        music_account_service: NamedDependency[NeteaseAccountService],
        music_user_id: NamedDependency[UUID],
        id: str = "",  # noqa: A002
        quality: str = "",
    ) -> Response[dict[str, Any]]:
        try:
            return music_json_response(
                await music_account_service.get_song_url(music_user_id, id, quality)
            )
        except MusicProviderError as exc:
            return music_json_response(
                MusicJsonResult(payload={"error": str(exc)}, status_code=500)
            )

    @post("/login/cookie", operation_id="music_login_cookie")
    async def login_cookie(
        self,
        data: MusicCookieImportRequest,
        music_account_service: NamedDependency[NeteaseAccountService],
        music_user_id: NamedDependency[UUID],
    ) -> Response[dict[str, Any]]:
        try:
            return music_json_response(
                await music_account_service.import_cookie(music_user_id, data.raw_cookie)
            )
        except MusicProviderError as exc:
            return music_json_response(
                MusicJsonResult(payload={"loggedIn": False, "error": str(exc)}, status_code=500)
            )

    @get("/login/qr/key", operation_id="music_login_qr_key")
    async def login_qr_key(
        self,
        music_account_service: NamedDependency[NeteaseAccountService],
        music_user_id: NamedDependency[UUID],
    ) -> Response[dict[str, Any]]:
        try:
            return music_json_response(await music_account_service.create_qr_key(music_user_id))
        except MusicProviderError as exc:
            return music_json_response(
                MusicJsonResult(payload={"error": str(exc)}, status_code=500)
            )

    @get("/login/qr/create", operation_id="music_login_qr_create")
    async def login_qr_create(
        self,
        music_account_service: NamedDependency[NeteaseAccountService],
        music_user_id: NamedDependency[UUID],
        key: str = "",
    ) -> Response[dict[str, Any]]:
        return music_json_response(await music_account_service.create_qr_code(music_user_id, key))

    @get("/login/qr/check", operation_id="music_login_qr_check")
    async def login_qr_check(
        self,
        music_account_service: NamedDependency[NeteaseAccountService],
        music_user_id: NamedDependency[UUID],
        key: str = "",
    ) -> Response[dict[str, Any]]:
        try:
            return music_json_response(
                await music_account_service.check_qr_code(music_user_id, key)
            )
        except MusicProviderError as exc:
            return music_json_response(
                MusicJsonResult(payload={"error": str(exc)}, status_code=500)
            )

    @get("/login/status", operation_id="music_login_status")
    async def login_status(
        self,
        music_account_service: NamedDependency[NeteaseAccountService],
        music_user_id: NamedDependency[UUID],
    ) -> Response[dict[str, Any]]:
        return music_json_response(await music_account_service.get_login_status(music_user_id))

    @post("/logout", operation_id="music_logout")
    async def logout(
        self,
        music_account_service: NamedDependency[NeteaseAccountService],
        music_user_id: NamedDependency[UUID],
    ) -> Response[dict[str, Any]]:
        return music_json_response(await music_account_service.logout(music_user_id))

    @get("/user/playlists", operation_id="music_user_playlists")
    async def user_playlists(
        self,
        music_account_service: NamedDependency[NeteaseAccountService],
        music_user_id: NamedDependency[UUID],
        limit: int = 60,
    ) -> Response[dict[str, Any]]:
        try:
            return music_json_response(
                await music_account_service.get_user_playlists(
                    music_user_id, max(12, min(100, limit))
                )
            )
        except MusicProviderError as exc:
            return music_json_response(
                MusicJsonResult(
                    payload={"error": str(exc), "loggedIn": False, "playlists": []},
                    status_code=500,
                )
            )

    @get("/song/like/check", operation_id="music_song_like_check")
    async def song_like_check(
        self,
        music_account_service: NamedDependency[NeteaseAccountService],
        music_user_id: NamedDependency[UUID],
        ids: str = "",
        id: str = "",  # noqa: A002
    ) -> Response[dict[str, Any]]:
        song_ids = [item.strip() for item in (ids or id).split(",") if item.strip()]
        try:
            return music_json_response(
                await music_account_service.check_song_likes(music_user_id, song_ids)
            )
        except MusicProviderError as exc:
            return music_json_response(
                MusicJsonResult(payload={"error": str(exc)}, status_code=500)
            )

    @post("/song/like", operation_id="music_song_like")
    async def song_like(
        self,
        data: MusicSongLikeRequest,
        music_account_service: NamedDependency[NeteaseAccountService],
        music_user_id: NamedDependency[UUID],
    ) -> Response[dict[str, Any]]:
        try:
            return music_json_response(
                await music_account_service.set_song_like(music_user_id, str(data.id), data.like)
            )
        except MusicProviderError as exc:
            return music_json_response(
                MusicJsonResult(payload={"error": str(exc)}, status_code=500)
            )

    @post("/playlist/create", operation_id="music_playlist_create")
    async def playlist_create(
        self,
        data: MusicPlaylistCreateRequest,
        music_account_service: NamedDependency[NeteaseAccountService],
        music_user_id: NamedDependency[UUID],
    ) -> Response[dict[str, Any]]:
        name = data.name.strip()
        try:
            return music_json_response(
                await music_account_service.create_playlist(music_user_id, name, str(data.privacy))
            )
        except MusicProviderError as exc:
            return music_json_response(
                MusicJsonResult(payload={"error": str(exc)}, status_code=500)
            )

    @post("/playlist/add-song", operation_id="music_playlist_add_song")
    async def playlist_add_song(
        self,
        data: MusicPlaylistAddSongRequest,
        music_account_service: NamedDependency[NeteaseAccountService],
        music_user_id: NamedDependency[UUID],
    ) -> Response[dict[str, Any]]:
        song_ids = str(data.id or data.ids)
        try:
            return music_json_response(
                await music_account_service.add_song_to_playlist(
                    music_user_id, str(data.pid), song_ids
                )
            )
        except MusicProviderError as exc:
            return music_json_response(
                MusicJsonResult(payload={"error": str(exc)}, status_code=500)
            )

    @get("/lyric", operation_id="music_lyric")
    async def lyric(
        self,
        music_service: NamedDependency[MusicService],
        music_user_id: NamedDependency[UUID],
        id: str = "",  # noqa: A002
    ) -> Response[dict[str, Any]]:
        if not id:
            return music_json_response(
                MusicJsonResult(payload={"error": "Missing song id", "lyric": ""}, status_code=400)
            )
        try:
            return music_json_response(await music_service.get_lyric(music_user_id, id))
        except MusicProviderError as exc:
            return music_json_response(
                MusicJsonResult(payload={"error": str(exc), "lyric": ""}, status_code=500)
            )

    @get("/playlist/tracks", operation_id="music_playlist_tracks")
    async def playlist_tracks(
        self,
        music_service: NamedDependency[MusicService],
        music_user_id: NamedDependency[UUID],
        id: str = "",  # noqa: A002
    ) -> Response[dict[str, Any]]:
        if not id:
            return music_json_response(
                MusicJsonResult(
                    payload={"error": "Missing playlist id", "tracks": []}, status_code=400
                )
            )
        try:
            return music_json_response(await music_service.get_playlist_tracks(music_user_id, id))
        except MusicProviderError as exc:
            return music_json_response(
                MusicJsonResult(payload={"error": str(exc), "tracks": []}, status_code=500)
            )

    @get("/artist/detail", operation_id="music_artist_detail")
    async def artist_detail(
        self,
        music_service: NamedDependency[MusicService],
        music_user_id: NamedDependency[UUID],
        id: str = "",  # noqa: A002
        limit: int = 30,
    ) -> Response[dict[str, Any]]:
        if not id:
            return music_json_response(
                MusicJsonResult(
                    payload={"error": "Missing artist id", "songs": []}, status_code=400
                )
            )
        try:
            return music_json_response(
                await music_service.get_artist_detail(music_user_id, id, max(10, min(80, limit)))
            )
        except MusicProviderError as exc:
            return music_json_response(
                MusicJsonResult(payload={"error": str(exc), "songs": []}, status_code=500)
            )

    @get("/song/comments", operation_id="music_song_comments")
    async def song_comments(
        self,
        music_service: NamedDependency[MusicService],
        music_user_id: NamedDependency[UUID],
        id: str = "",  # noqa: A002
        limit: int = 20,
        offset: int = 0,
    ) -> Response[dict[str, Any]]:
        if not id:
            return music_json_response(
                MusicJsonResult(
                    payload={"error": "Missing song id", "comments": []}, status_code=400
                )
            )
        try:
            return music_json_response(
                await music_service.get_song_comments(
                    music_user_id, id, max(6, min(50, limit)), max(0, offset)
                )
            )
        except MusicProviderError as exc:
            return music_json_response(
                MusicJsonResult(payload={"error": str(exc), "comments": []}, status_code=500)
            )

    @get("/weather/radio", operation_id="music_weather_radio")
    async def weather_radio(
        self,
        music_service: NamedDependency[MusicService],
        music_user_id: NamedDependency[UUID],
        city: str = "",
        q: str = "",
        lat: str | None = None,
        lon: str | None = None,
        timezone: str = "",
    ) -> Response[dict[str, Any]]:
        try:
            return music_json_response(
                await music_service.get_weather_radio(
                    music_user_id,
                    city=city or q,
                    latitude=lat,
                    longitude=lon,
                    timezone=timezone,
                )
            )
        except MusicProviderError as exc:
            return music_json_response(
                MusicJsonResult(
                    payload={
                        "ok": False,
                        "error": str(exc),
                        "weather": None,
                        "radio": {
                            "title": "天气电台",
                            "subtitle": "天气暂时没有回来，可以先听今日推荐。",
                            "seedQueries": [],
                            "songs": [],
                        },
                    },
                    status_code=500,
                )
            )

    @get("/weather/ip-location", operation_id="music_weather_ip_location")
    async def weather_ip_location(
        self, music_service: NamedDependency[MusicService]
    ) -> Response[dict[str, Any]]:
        try:
            return music_json_response(await music_service.get_weather_ip_location())
        except MusicProviderError as exc:
            return music_json_response(
                MusicJsonResult(
                    payload={"ok": False, "error": str(exc), "location": None},
                    status_code=500,
                )
            )

    @get("/qq/search", operation_id="music_qq_search")
    async def qq_search(
        self,
        qq_music_service: NamedDependency[QQMusicService],
        music_user_id: NamedDependency[UUID],
        keywords: str = "",
        limit: int = 8,
    ) -> Response[dict[str, Any]]:
        try:
            return music_json_response(
                await qq_music_service.search(music_user_id, keywords, max(4, min(12, limit)))
            )
        except MusicProviderError as exc:
            return music_json_response(
                MusicJsonResult({"provider": "qq", "error": str(exc), "songs": []}, 500)
            )

    @get("/qq/song/url", operation_id="music_qq_song_url")
    async def qq_song_url(
        self,
        qq_music_service: NamedDependency[QQMusicService],
        music_user_id: NamedDependency[UUID],
        mid: str = "",
        id: str = "",  # noqa: A002
        mediaMid: str = "",  # noqa: N803
        media_mid: str = "",
        quality: str = "",
    ) -> Response[dict[str, Any]]:
        try:
            return music_json_response(
                await qq_music_service.song_url(
                    music_user_id, mid or id, mediaMid or media_mid, quality
                )
            )
        except MusicProviderError as exc:
            return music_json_response(
                MusicJsonResult(
                    {"provider": "qq", "url": "", "playable": False, "error": str(exc)}, 500
                )
            )

    @get("/qq/lyric", operation_id="music_qq_lyric")
    async def qq_lyric(
        self,
        qq_music_service: NamedDependency[QQMusicService],
        music_user_id: NamedDependency[UUID],
        mid: str = "",
        songmid: str = "",
        id: str = "",  # noqa: A002
        qqId: str = "",  # noqa: N803
    ) -> Response[dict[str, Any]]:
        song_mid, song_id = mid or songmid, id or qqId
        if not song_mid and not song_id:
            return music_json_response(
                MusicJsonResult(
                    {"provider": "qq", "error": "Missing QQ song mid or id", "lyric": ""}, 400
                )
            )
        try:
            return music_json_response(
                await qq_music_service.lyric(music_user_id, song_mid, song_id)
            )
        except MusicProviderError as exc:
            return music_json_response(
                MusicJsonResult({"provider": "qq", "error": str(exc), "lyric": ""}, 500)
            )

    @get("/qq/login/status", operation_id="music_qq_login_status")
    async def qq_login_status(
        self,
        qq_music_service: NamedDependency[QQMusicService],
        music_user_id: NamedDependency[UUID],
    ) -> Response[dict[str, Any]]:
        try:
            return music_json_response(await qq_music_service.login_status(music_user_id))
        except MusicProviderError as exc:
            return music_json_response(
                MusicJsonResult({"provider": "qq", "loggedIn": False, "error": str(exc)}, 500)
            )

    @post("/qq/login/cookie", operation_id="music_qq_login_cookie")
    async def qq_login_cookie(
        self,
        data: MusicCookieImportRequest,
        qq_music_service: NamedDependency[QQMusicService],
        music_user_id: NamedDependency[UUID],
    ) -> Response[dict[str, Any]]:
        try:
            return music_json_response(
                await qq_music_service.import_cookie(music_user_id, data.raw_cookie)
            )
        except MusicProviderError as exc:
            return music_json_response(
                MusicJsonResult({"provider": "qq", "loggedIn": False, "error": str(exc)}, 500)
            )

    @post("/qq/logout", operation_id="music_qq_logout")
    async def qq_logout(
        self,
        qq_music_service: NamedDependency[QQMusicService],
        music_user_id: NamedDependency[UUID],
    ) -> Response[dict[str, Any]]:
        return music_json_response(await qq_music_service.logout(music_user_id))

    @get("/qq/user/playlists", operation_id="music_qq_user_playlists")
    async def qq_user_playlists(
        self,
        qq_music_service: NamedDependency[QQMusicService],
        music_user_id: NamedDependency[UUID],
    ) -> Response[dict[str, Any]]:
        try:
            return music_json_response(await qq_music_service.user_playlists(music_user_id))
        except MusicProviderError as exc:
            return music_json_response(
                MusicJsonResult(
                    {"provider": "qq", "loggedIn": False, "error": str(exc), "playlists": []}, 500
                )
            )

    @get("/qq/playlist/tracks", operation_id="music_qq_playlist_tracks")
    async def qq_playlist_tracks(
        self,
        qq_music_service: NamedDependency[QQMusicService],
        music_user_id: NamedDependency[UUID],
        id: str = "",  # noqa: A002
        disstid: str = "",
    ) -> Response[dict[str, Any]]:
        try:
            return music_json_response(
                await qq_music_service.playlist_tracks(music_user_id, id or disstid)
            )
        except MusicProviderError as exc:
            return music_json_response(
                MusicJsonResult({"provider": "qq", "error": str(exc), "tracks": []}, 500)
            )

    @get("/qq/artist/detail", operation_id="music_qq_artist_detail")
    async def qq_artist_detail(
        self,
        qq_music_service: NamedDependency[QQMusicService],
        music_user_id: NamedDependency[UUID],
        mid: str = "",
        singermid: str = "",
        limit: int = 36,
    ) -> Response[dict[str, Any]]:
        singer_mid = mid or singermid
        if not singer_mid:
            return music_json_response(
                MusicJsonResult(
                    {"provider": "qq", "error": "MISSING_SINGER_MID", "artist": None, "songs": []},
                    400,
                )
            )
        try:
            return music_json_response(
                await qq_music_service.artist_detail(
                    music_user_id, singer_mid, max(10, min(80, limit))
                )
            )
        except MusicProviderError as exc:
            return music_json_response(
                MusicJsonResult(
                    {"provider": "qq", "error": str(exc), "artist": None, "songs": []}, 500
                )
            )

    @get("/qq/song/comments", operation_id="music_qq_song_comments")
    async def qq_song_comments(
        self,
        qq_music_service: NamedDependency[QQMusicService],
        music_user_id: NamedDependency[UUID],
        id: str = "",  # noqa: A002
        qqId: str = "",  # noqa: N803
        mid: str = "",
        songmid: str = "",
        limit: int = 20,
        offset: int = 0,
    ) -> Response[dict[str, Any]]:
        try:
            return music_json_response(
                await qq_music_service.song_comments(
                    music_user_id,
                    id or qqId,
                    mid or songmid,
                    max(6, min(50, limit)),
                    max(0, offset),
                )
            )
        except MusicProviderError as exc:
            return music_json_response(
                MusicJsonResult({"provider": "qq", "error": str(exc), "comments": []}, 500)
            )

    @get("/podcast/search", operation_id="music_podcast_search")
    async def podcast_search(
        self,
        music_service: NamedDependency[MusicService],
        music_user_id: NamedDependency[UUID],
        keywords: str = "",
        limit: int = 18,
    ) -> Response[dict[str, Any]]:
        try:
            return music_json_response(
                await music_service.search_podcasts(music_user_id, keywords, max(6, min(30, limit)))
            )
        except MusicProviderError as exc:
            return music_json_response(
                MusicJsonResult(payload={"error": str(exc), "podcasts": []}, status_code=500)
            )

    @get("/podcast/hot", operation_id="music_podcast_hot")
    async def podcast_hot(
        self,
        music_service: NamedDependency[MusicService],
        music_user_id: NamedDependency[UUID],
        limit: int = 18,
        offset: int = 0,
    ) -> Response[dict[str, Any]]:
        try:
            return music_json_response(
                await music_service.get_hot_podcasts(
                    music_user_id, max(6, min(30, limit)), max(0, offset)
                )
            )
        except MusicProviderError as exc:
            return music_json_response(
                MusicJsonResult(payload={"error": str(exc), "podcasts": []}, status_code=500)
            )

    @get("/podcast/detail", operation_id="music_podcast_detail")
    async def podcast_detail(
        self,
        music_service: NamedDependency[MusicService],
        music_user_id: NamedDependency[UUID],
        id: str = "",  # noqa: A002
        rid: str = "",
    ) -> Response[dict[str, Any]]:
        radio_id = id or rid
        if not radio_id:
            return music_json_response(
                MusicJsonResult(payload={"error": "Missing podcast id"}, status_code=400)
            )
        try:
            return music_json_response(
                await music_service.get_podcast_detail(music_user_id, radio_id)
            )
        except MusicProviderError as exc:
            return music_json_response(
                MusicJsonResult(payload={"error": str(exc)}, status_code=500)
            )

    @get("/podcast/programs", operation_id="music_podcast_programs")
    async def podcast_programs(
        self,
        music_service: NamedDependency[MusicService],
        music_user_id: NamedDependency[UUID],
        id: str = "",  # noqa: A002
        rid: str = "",
        limit: int = 30,
        offset: int = 0,
    ) -> Response[dict[str, Any]]:
        radio_id = id or rid
        if not radio_id:
            return music_json_response(
                MusicJsonResult(
                    payload={"error": "Missing podcast id", "programs": []},
                    status_code=400,
                )
            )
        try:
            return music_json_response(
                await music_service.get_podcast_programs(
                    music_user_id,
                    radio_id,
                    max(10, min(60, limit)),
                    max(0, offset),
                )
            )
        except MusicProviderError as exc:
            return music_json_response(
                MusicJsonResult(payload={"error": str(exc), "programs": []}, status_code=500)
            )

    @get("/podcast/my", operation_id="music_podcast_my")
    async def podcast_my(
        self,
        podcast_account_service: NamedDependency[PodcastAccountService],
        music_user_id: NamedDependency[UUID],
    ) -> Response[dict[str, Any]]:
        try:
            return music_json_response(await podcast_account_service.collections(music_user_id))
        except MusicProviderError as exc:
            return music_json_response(MusicJsonResult({"error": str(exc), "collections": []}, 500))

    @get("/podcast/my/items", operation_id="music_podcast_my_items")
    async def podcast_my_items(
        self,
        podcast_account_service: NamedDependency[PodcastAccountService],
        music_user_id: NamedDependency[UUID],
        key: str = "collect",
        limit: int = 36,
        offset: int = 0,
    ) -> Response[dict[str, Any]]:
        try:
            return music_json_response(
                await podcast_account_service.collection_items(
                    music_user_id, key, limit or 36, offset or 0
                )
            )
        except MusicProviderError as exc:
            return music_json_response(MusicJsonResult({"error": str(exc), "items": []}, 500))

    @get("/cover", operation_id="music_cover_proxy")
    async def cover(
        self,
        request: Request[Any, Any, Any],
        music_service: NamedDependency[MusicService],
        url: str = "",
    ) -> Stream | Response[str]:
        if not url:
            return Response(
                content="Invalid cover url",
                headers={"Access-Control-Allow-Origin": "*"},
                media_type="text/plain",
                status_code=400,
            )
        try:
            return proxy_response(
                await music_service.proxy_cover(url, method=request.method.upper())
            )
        except UnsafeProxyUrlError:
            return Response(
                content="Invalid cover url",
                headers={"Access-Control-Allow-Origin": "*"},
                media_type="text/plain",
                status_code=400,
            )
        except MusicProviderError:
            return Response(content="", status_code=502)

    @get("/audio", operation_id="music_audio_proxy")
    async def audio(
        self,
        request: Request[Any, Any, Any],
        music_service: NamedDependency[MusicService],
        url: str = "",
    ) -> Stream | Response[str]:
        if not url:
            return Response(content="Missing url", media_type="text/plain", status_code=400)
        try:
            return proxy_response(
                await music_service.proxy_audio(
                    url,
                    method=request.method.upper(),
                    range_header=request.headers.get("range", ""),
                )
            )
        except UnsafeProxyUrlError:
            return Response(content="Invalid audio url", media_type="text/plain", status_code=400)
        except ValueError:
            return Response(
                content="Invalid Range header", media_type="text/plain", status_code=416
            )
        except MusicProviderError:
            return Response(content="", status_code=502)
