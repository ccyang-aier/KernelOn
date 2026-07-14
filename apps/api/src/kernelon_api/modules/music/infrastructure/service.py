"""Mineradio music use cases backed by an explicit provider HTTP port."""

from __future__ import annotations

import asyncio
import re
from contextlib import suppress
from math import isfinite
from time import time_ns
from typing import TYPE_CHECKING, Any
from urllib.parse import urlsplit

from kernelon_api.modules.music.application import (
    MusicJsonResult,
    MusicProviderError,
    MusicProviderHttpPort,
    MusicProxyResult,
)
from kernelon_api.modules.music.application.source_logic import (
    build_weather_mood,
    map_podcast_program,
    map_podcast_radio,
    open_meteo_weather_label,
    order_weather_songs,
    weather_radio_seed_queries,
)
from kernelon_api.modules.music.domain import (
    BeatMapCacheStatus,
    MusicAppInfo,
    MusicDiscoverHome,
    MusicUpdateInfo,
)
from kernelon_api.modules.music.infrastructure.account_service import (
    is_netease_auth_invalid_payload,
    normalize_login_info,
)
from kernelon_api.modules.music.infrastructure.http_provider import (
    NETEASE_USER_AGENT,
    HttpxMusicProvider,
)

if TYPE_CHECKING:
    from collections.abc import AsyncIterator, Mapping
    from uuid import UUID

    from kernelon_api.modules.music.application import (
        MusicAccountSessionPort,
        NeteaseAccountProviderPort,
    )

MINERADIO_SOURCE_VERSION = "1.1.1"
SINGLE_BYTE_RANGE = re.compile(r"^bytes=(?:\d+-\d*|-\d+)$")
WEATHER_DEFAULT_LOCATION: dict[str, Any] = {
    "name": "上海",
    "country": "China",
    "latitude": 31.2304,
    "longitude": 121.4737,
    "timezone": "Asia/Shanghai",
}


class BaselineMusicService:
    """Preserve Mineradio's provider mappings without coupling them to HTTP presentation."""

    def __init__(
        self,
        provider: MusicProviderHttpPort | None = None,
        sessions: MusicAccountSessionPort | None = None,
        account_provider: NeteaseAccountProviderPort | None = None,
    ) -> None:
        self._provider = provider or HttpxMusicProvider()
        self._sessions = sessions
        self._account_provider = account_provider

    async def get_app_info(self) -> MusicAppInfo:
        return MusicAppInfo(
            name="mineradio",
            product_name="Mineradio",
            version=MINERADIO_SOURCE_VERSION,
            update=MusicUpdateInfo(
                provider="kernelon-host",
                configured=False,
                owner="",
                repo="",
                preview=False,
                manifest_override=False,
            ),
        )

    async def get_beat_map_cache_status(self) -> BeatMapCacheStatus:
        return BeatMapCacheStatus(
            enabled=False,
            directory="",
            drive="",
            reason="DEVICE_ADAPTER_REQUIRED",
            mode="memory-only",
        )

    async def get_discover_home(self, user_id: UUID) -> MusicDiscoverHome:
        cookie = await self._cookie(user_id)
        info = await self._login_info(user_id, cookie)
        if not info.get("loggedIn"):
            return MusicDiscoverHome(
                logged_in=False,
                user=None,
                daily_songs=(),
                playlists=(),
                podcasts=(),
                mode="starter",
                updated_at=time_ns() // 1_000_000,
            )
        results = await asyncio.gather(
            self._provider.personalized(8, cookie),
            self._provider.podcast_hot(6, 0, cookie),
            self._provider.recommend_resource(cookie),
            self._provider.recommend_songs(cookie),
            return_exceptions=True,
        )
        personalized_body = settled_mapping(results[0])
        public_playlists = [
            mapped
            for raw in as_mapping_list(
                personalized_body.get("result") or personalized_body.get("data")
            )
            if (mapped := map_discover_playlist(raw, "推荐歌单"))["id"] and mapped["name"]
        ][:8]
        podcast_body = settled_mapping(results[1])
        podcast_raw = (
            podcast_body.get("djRadios")
            or podcast_body.get("djradios")
            or podcast_body.get("radios")
            or podcast_body.get("data")
        )
        podcasts = [
            mapped
            for raw in as_mapping_list(podcast_raw)
            if (mapped := map_podcast_radio(raw))["id"] and not is_low_signal_podcast_item(mapped)
        ][:6]
        resource_body = settled_mapping(results[2])
        private_playlists = [
            mapped
            for raw in as_mapping_list(resource_body.get("recommend") or resource_body.get("data"))
            if (mapped := map_discover_playlist(raw, "私人推荐"))["id"] and mapped["name"]
        ][:6]
        songs_body = settled_mapping(results[3])
        songs_data = as_mapping(songs_body.get("data"))
        daily_raw = (
            songs_data.get("dailySongs")
            or songs_data.get("recommend")
            or songs_body.get("recommend")
        )
        daily_songs = [
            mapped
            for raw in as_mapping_list(daily_raw)
            if (mapped := map_song_record(raw))["id"] and mapped["name"]
        ][:12]
        return MusicDiscoverHome(
            logged_in=True,
            user={
                "userId": info.get("userId"),
                "nickname": info.get("nickname") or "",
                "avatar": info.get("avatar") or "",
            },
            daily_songs=tuple(daily_songs),
            playlists=tuple((private_playlists + public_playlists)[:10]),
            podcasts=tuple(podcasts),
            mode=None,
            updated_at=time_ns() // 1_000_000,
        )

    async def search(self, user_id: UUID, keywords: str, limit: int) -> MusicJsonResult:
        cookie = await self._cookie(user_id)
        body = await self._provider.cloud_search(keywords, limit, cookie)
        result = as_mapping(body.get("result"))
        songs = as_mapping_list(result.get("songs"))
        mapped = [map_song_record(song) for song in songs]
        missing = [str(song["id"]) for song in mapped if not song["cover"] and song["id"]]
        if missing:
            try:
                details = await self._provider.song_details(missing, cookie)
                pictures = {
                    str(song.get("id")): song_cover(song)
                    for song in as_mapping_list(details.get("songs"))
                    if song.get("id") is not None and song_cover(song)
                }
                mapped = [
                    {**song, "cover": pictures.get(str(song["id"]), "")}
                    if not song["cover"]
                    else song
                    for song in mapped
                ]
            except MusicProviderError:
                pass
        return MusicJsonResult(payload={"songs": mapped})

    async def get_lyric(self, user_id: UUID, song_id: str) -> MusicJsonResult:
        cookie = await self._cookie(user_id)
        body: Mapping[str, Any] = {}
        source = "lyric"
        try:
            body = await self._provider.lyric_new(song_id, cookie)
            source = "lyric_new"
        except MusicProviderError:
            pass
        if not lyric_value(body, "lrc") and not lyric_value(body, "yrc"):
            fallback = await self._provider.lyric(song_id, cookie)
            body = fallback or body
            source = "lyric"
        return MusicJsonResult(
            payload={
                "lyric": lyric_value(body, "lrc"),
                "tlyric": lyric_value(body, "tlyric"),
                "yrc": lyric_value(body, "yrc"),
                "source": source,
            }
        )

    async def get_playlist_tracks(self, user_id: UUID, playlist_id: str) -> MusicJsonResult:
        cookie = await self._cookie(user_id)
        playlist: dict[str, Any] = {
            "id": playlist_id,
            "name": "",
            "cover": "",
            "trackCount": 0,
        }
        raw_tracks: list[Mapping[str, Any]] = []
        try:
            all_tracks = await self._provider.playlist_tracks_all(playlist_id, 500, cookie)
            raw_tracks = as_mapping_list(all_tracks.get("songs") or all_tracks.get("tracks"))
        except MusicProviderError:
            pass
        if not raw_tracks:
            detail = await self._provider.playlist_detail(playlist_id, cookie)
            raw_playlist = as_mapping(detail.get("playlist"))
            playlist = {
                "id": raw_playlist.get("id") or playlist_id,
                "name": raw_playlist.get("name") or "",
                "cover": raw_playlist.get("coverImgUrl") or "",
                "trackCount": raw_playlist.get("trackCount") or 0,
            }
            raw_tracks = as_mapping_list(raw_playlist.get("tracks"))
        tracks = [mapped for song in raw_tracks if (mapped := map_song_record(song))["id"]]
        if not playlist["trackCount"]:
            playlist["trackCount"] = len(tracks)
        return MusicJsonResult(payload={"playlist": playlist, "tracks": tracks})

    async def get_artist_detail(self, user_id: UUID, artist_id: str, limit: int) -> MusicJsonResult:
        cookie = await self._cookie(user_id)
        detail_body: Mapping[str, Any] = {}
        with suppress(MusicProviderError):
            detail_body = await self._provider.artist_detail(artist_id, cookie)
        raw_songs: list[Mapping[str, Any]] = []
        try:
            songs_body = await self._provider.artist_songs(artist_id, limit, cookie)
            data = as_mapping(songs_body.get("data"))
            raw_songs = as_mapping_list(songs_body.get("songs") or data.get("songs"))
        except MusicProviderError:
            pass
        if not raw_songs:
            top = await self._provider.artist_top_songs(artist_id, cookie)
            raw_songs = as_mapping_list(top.get("songs"))

        detail_data = as_mapping(detail_body.get("data"))
        artist = as_mapping(detail_body.get("artist") or detail_data.get("artist") or detail_data)
        songs = [mapped for song in raw_songs if (mapped := map_song_record(song))["id"]][:limit]
        return MusicJsonResult(
            payload={
                "id": artist_id,
                "artist": {
                    "id": artist.get("id") or artist_id,
                    "name": artist.get("name") or artist.get("artistName") or "",
                    "avatar": (
                        artist.get("avatar")
                        or artist.get("cover")
                        or artist.get("picUrl")
                        or artist.get("img1v1Url")
                        or ""
                    ),
                    "brief": (
                        artist.get("briefDesc")
                        or artist.get("description")
                        or artist.get("desc")
                        or ""
                    ),
                    "musicSize": artist.get("musicSize") or artist.get("songSize") or 0,
                    "albumSize": artist.get("albumSize") or 0,
                },
                "songs": songs,
                "body": dict(detail_body),
            }
        )

    async def get_song_comments(
        self, user_id: UUID, song_id: str, limit: int, offset: int
    ) -> MusicJsonResult:
        cookie = await self._cookie(user_id)
        body = await self._provider.song_comments(song_id, limit, offset, cookie)
        hot = isinstance(body.get("hotComments"), list) and offset == 0
        raw = body.get("hotComments") if hot else body.get("comments")
        comments = []
        for comment in as_mapping_list(raw):
            content = comment.get("content") or ""
            if not content:
                continue
            user = as_mapping(comment.get("user"))
            comments.append(
                {
                    "id": comment.get("commentId"),
                    "content": content,
                    "likedCount": comment.get("likedCount") or 0,
                    "time": comment.get("time") or 0,
                    "user": (
                        {
                            "id": user.get("userId"),
                            "nickname": user.get("nickname") or "",
                            "avatar": user.get("avatarUrl") or "",
                        }
                        if user
                        else None
                    ),
                }
            )
        return MusicJsonResult(
            payload={
                "id": song_id,
                "total": body.get("total") or 0,
                "comments": comments,
                "hot": hot,
                "body": dict(body),
            }
        )

    async def get_weather_radio(
        self,
        user_id: UUID,
        *,
        city: str,
        latitude: str | None,
        longitude: str | None,
        timezone: str,
    ) -> MusicJsonResult:
        params = {"city": city, "lat": latitude, "lon": longitude, "timezone": timezone}
        try:
            weather = await self._fetch_weather(
                city=city, lat=latitude, lon=longitude, timezone=timezone
            )
        except MusicProviderError as exc:
            weather = fallback_weather(params, exc)
        mood = as_mapping(weather.get("mood"))
        queries = weather_radio_seed_queries(mood)
        songs: list[Mapping[str, Any]] = []
        settled = await asyncio.gather(
            *(self.search(user_id, query, 6) for query in queries[:4]), return_exceptions=True
        )
        for result in settled:
            if isinstance(result, MusicJsonResult):
                songs.extend(as_mapping_list(result.payload.get("songs")))
        if len(songs) < 10:
            more = await asyncio.gather(
                *(
                    self.search(user_id, str(keyword), 6)
                    for keyword in list(mood.get("keywords") or [])[:2]
                ),
                return_exceptions=True,
            )
            for result in more:
                if isinstance(result, MusicJsonResult):
                    songs.extend(as_mapping_list(result.payload.get("songs")))
        ordered = order_weather_songs(songs, mood)
        return MusicJsonResult(
            payload={
                "ok": True,
                "weather": weather,
                "radio": {
                    "title": mood.get("title"),
                    "subtitle": mood.get("tagline"),
                    "seedQueries": queries[:4],
                    "songs": ordered[:18],
                    "updatedAt": time_ns() // 1_000_000,
                },
            }
        )

    async def get_weather_ip_location(self) -> MusicJsonResult:
        body = await self._provider.weather_ip_location()
        latitude = optional_number(body.get("lat"))
        longitude = optional_number(body.get("lon"))
        if body.get("status") != "success" or latitude is None or longitude is None:
            raise MusicProviderError(str(body.get("message") or "IP_LOCATION_FAILED"))
        return MusicJsonResult(
            payload={
                "ok": True,
                "location": {
                    "provider": "ip-api",
                    "city": body.get("city") or WEATHER_DEFAULT_LOCATION["name"],
                    "region": body.get("regionName") or "",
                    "country": body.get("country") or "",
                    "latitude": latitude,
                    "longitude": longitude,
                    "timezone": body.get("timezone") or "auto",
                    "ip": body.get("query") or "",
                },
            }
        )

    async def search_podcasts(self, user_id: UUID, keywords: str, limit: int) -> MusicJsonResult:
        if not keywords.strip():
            return MusicJsonResult(payload={"podcasts": []})
        body = await self._provider.podcast_search(
            keywords.strip(), limit, await self._cookie(user_id)
        )
        result = as_mapping(body.get("result"))
        raw = result.get("djRadios") or result.get("djradios") or result.get("radios")
        podcasts = [
            mapped for radio in as_mapping_list(raw) if (mapped := map_podcast_radio(radio))["id"]
        ]
        return MusicJsonResult(
            payload={
                "podcasts": podcasts,
                "total": result.get("djRadiosCount")
                or result.get("djradiosCount")
                or len(podcasts),
            }
        )

    async def get_hot_podcasts(self, user_id: UUID, limit: int, offset: int) -> MusicJsonResult:
        body = await self._provider.podcast_hot(limit, offset, await self._cookie(user_id))
        raw = body.get("djRadios") or body.get("djradios") or body.get("radios") or body.get("data")
        podcasts = [
            mapped for radio in as_mapping_list(raw) if (mapped := map_podcast_radio(radio))["id"]
        ]
        return MusicJsonResult(payload={"podcasts": podcasts, "more": bool(body.get("hasMore"))})

    async def get_podcast_detail(self, user_id: UUID, radio_id: str) -> MusicJsonResult:
        body = await self._provider.podcast_detail(radio_id, await self._cookie(user_id))
        raw = as_mapping(body.get("data") or body.get("djRadio") or body.get("radio") or body)
        return MusicJsonResult(payload={"podcast": map_podcast_radio(raw)})

    async def get_podcast_programs(
        self, user_id: UUID, radio_id: str, limit: int, offset: int
    ) -> MusicJsonResult:
        body = await self._provider.podcast_programs(
            radio_id, limit, offset, await self._cookie(user_id)
        )
        data = as_mapping(body.get("data"))
        raw = as_mapping_list(body.get("programs") or data.get("list") or data.get("programs"))
        fallback_radio = (
            as_mapping(raw[0].get("radio")) if raw else {"id": radio_id, "rid": radio_id}
        )
        radio = map_podcast_radio(fallback_radio)
        programs = [
            mapped
            for program in raw
            if (mapped := map_podcast_program(program, fallback_radio))["id"] and mapped["name"]
        ]
        return MusicJsonResult(
            payload={
                "radio": radio,
                "programs": programs,
                "more": bool(body.get("more")),
                "total": body.get("count") or len(programs),
            }
        )

    async def _cookie(self, user_id: UUID) -> str:
        if self._sessions is None:
            return ""
        return (await self._sessions.load(user_id)).cookie

    async def _login_info(self, user_id: UUID, cookie: str) -> dict[str, Any]:
        if not cookie or self._account_provider is None:
            return {"loggedIn": False}
        with suppress(MusicProviderError):
            body = (await self._account_provider.login_status(cookie)).payload
            data = as_mapping(body.get("data") or body)
            info = normalize_login_info(
                as_mapping(data.get("profile") or body.get("profile")),
                as_mapping(data.get("account") or body.get("account")),
                data,
            )
            if info.get("loggedIn"):
                return info
        with suppress(MusicProviderError):
            body = (await self._account_provider.user_account(cookie)).payload
            info = normalize_login_info(
                as_mapping(body.get("profile")),
                as_mapping(body.get("account")),
                body,
            )
            if info.get("loggedIn"):
                return info
            if is_netease_auth_invalid_payload(body) and self._sessions is not None:
                await self._sessions.save_provider(user_id, "netease", "")
        return {"loggedIn": False}

    async def _fetch_weather(
        self,
        *,
        city: str,
        lat: str | None,
        lon: str | None,
        timezone: str,
    ) -> dict[str, Any]:
        latitude = bounded_number(lat, -90, 90)
        longitude = bounded_number(lon, -180, 180)
        if latitude is not None and longitude is not None:
            location: dict[str, Any] = {
                "name": city.strip() or "当前位置",
                "country": "",
                "latitude": latitude,
                "longitude": longitude,
                "timezone": timezone or "auto",
            }
        elif city.strip():
            geocode = await self._provider.weather_geocode(city.strip())
            results = as_mapping_list(geocode.get("results"))
            if results:
                first = results[0]
                location = {
                    "name": first.get("name") or city.strip(),
                    "country": first.get("country") or "",
                    "admin1": first.get("admin1") or "",
                    "latitude": first.get("latitude"),
                    "longitude": first.get("longitude"),
                    "timezone": first.get("timezone") or "auto",
                }
            else:
                location = {
                    **WEATHER_DEFAULT_LOCATION,
                    "query": city.strip(),
                    "fallback": True,
                }
        else:
            location = dict(WEATHER_DEFAULT_LOCATION)
        location_latitude = optional_number(location.get("latitude"))
        location_longitude = optional_number(location.get("longitude"))
        if location_latitude is None or location_longitude is None:
            raise MusicProviderError("Invalid weather location")
        body = await self._provider.weather_forecast(
            location_latitude,
            location_longitude,
            str(location.get("timezone") or "auto"),
        )
        current = as_mapping(body.get("current"))
        weather_code = optional_number(current.get("weather_code"))
        weather: dict[str, Any] = {
            "provider": "open-meteo",
            "location": {
                "name": location.get("name"),
                "country": location.get("country") or "",
                "admin1": location.get("admin1") or "",
                "latitude": location_latitude,
                "longitude": location_longitude,
                "timezone": body.get("timezone") or location.get("timezone") or "",
                "fallback": bool(location.get("fallback")),
            },
            "label": open_meteo_weather_label(int(weather_code or 0)),
            "weatherCode": weather_code,
            "temperature": optional_number(current.get("temperature_2m")),
            "apparentTemperature": optional_number(current.get("apparent_temperature")),
            "humidity": optional_number(current.get("relative_humidity_2m")),
            "precipitation": optional_number(
                current.get("precipitation")
                or current.get("rain")
                or current.get("showers")
                or current.get("snowfall")
                or 0
            ),
            "cloudCover": optional_number(current.get("cloud_cover")),
            "windSpeed": optional_number(current.get("wind_speed_10m")),
            "windGusts": optional_number(current.get("wind_gusts_10m")),
            "isDay": optional_number(current.get("is_day")),
            "time": current.get("time") or "",
            "updatedAt": time_ns() // 1_000_000,
        }
        weather["mood"] = build_weather_mood(weather)
        return weather

    async def proxy_cover(self, url: str, *, method: str) -> MusicProxyResult:
        upstream = await self._provider.proxy_stream(
            url,
            method=method,
            headers={"Referer": "https://music.163.com/", "User-Agent": NETEASE_USER_AGENT},
        )
        content_type = upstream.headers.get("content-type") or "image/jpeg"
        if 200 <= upstream.status_code < 300 and not (
            content_type.lower().startswith("image/")
            or content_type.lower().startswith("application/octet-stream")
        ):
            await drain(upstream.body)
            raise MusicProviderError("Upstream cover response is not an image")
        headers = {
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=86400",
            "Content-Type": content_type,
            "Cross-Origin-Resource-Policy": "cross-origin",
        }
        copy_header(upstream.headers, headers, "content-length")
        return MusicProxyResult(upstream.status_code, headers, upstream.body)

    async def proxy_audio(self, url: str, *, method: str, range_header: str) -> MusicProxyResult:
        if range_header and not SINGLE_BYTE_RANGE.fullmatch(range_header.strip()):
            raise ValueError("Invalid Range header")
        request_headers = audio_proxy_headers(url, range_header)
        upstream = await self._provider.proxy_stream(url, method=method, headers=request_headers)
        content_type = audio_content_type(url, upstream.headers.get("content-type"))
        if 200 <= upstream.status_code < 300 and not (
            content_type.lower().startswith("audio/")
            or content_type.lower() == "application/octet-stream"
        ):
            await drain(upstream.body)
            raise MusicProviderError("Upstream audio response is not audio")
        headers = {
            "Accept-Ranges": "bytes",
            "Access-Control-Allow-Origin": "*",
            "Content-Type": content_type,
            "Cross-Origin-Resource-Policy": "cross-origin",
        }
        copy_header(upstream.headers, headers, "content-length")
        copy_header(upstream.headers, headers, "content-range")
        return MusicProxyResult(upstream.status_code, headers, upstream.body)


def map_song_record(song: Mapping[str, Any]) -> dict[str, Any]:
    artists = [
        {"id": artist.get("id"), "name": artist.get("name") or ""}
        for artist in as_mapping_list(song.get("ar") or song.get("artists"))
        if artist.get("name")
    ]
    album = as_mapping(song.get("al") or song.get("album"))
    return {
        "provider": "netease",
        "source": "netease",
        "type": "song",
        "id": song.get("id"),
        "name": song.get("name"),
        "artist": " / ".join(str(artist["name"]) for artist in artists),
        "artists": artists,
        "artistId": artists[0]["id"] if artists else None,
        "album": album.get("name") or "",
        "cover": album.get("picUrl") or album.get("coverUrl") or "",
        "duration": song.get("dt") or song.get("duration") or 0,
        "fee": song.get("fee"),
    }


def map_discover_playlist(playlist: Mapping[str, Any], tag: str) -> dict[str, Any]:
    creator = as_mapping(playlist.get("creator") or playlist.get("user"))
    ui_element = as_mapping(playlist.get("uiElement"))
    image = as_mapping(ui_element.get("image"))
    return {
        "provider": "netease",
        "source": "netease",
        "type": "playlist",
        "id": playlist.get("id") or playlist.get("resourceId") or playlist.get("creativeId"),
        "name": playlist.get("name") or playlist.get("title") or "",
        "cover": (
            playlist.get("picUrl")
            or playlist.get("coverImgUrl")
            or playlist.get("coverUrl")
            or image.get("imageUrl")
            or ""
        ),
        "trackCount": (
            playlist.get("trackCount")
            or playlist.get("songCount")
            or playlist.get("programCount")
            or 0
        ),
        "playCount": playlist.get("playCount") or playlist.get("playcount") or 0,
        "creator": creator.get("nickname") or creator.get("name") or "",
        "tag": tag or playlist.get("alg") or "",
    }


def is_low_signal_podcast_item(item: Mapping[str, Any]) -> bool:
    name = str(item.get("name") or item.get("title") or item.get("radioName") or "").lower()
    sub = str(
        item.get("djName") or item.get("category") or item.get("desc") or item.get("sub") or ""
    ).lower()
    low_signal = r"购买播客|付费精品|qzone|空间背景音乐|背景音乐|四只烤翅|试纸烤翅"
    return bool(re.search(low_signal, f"{name} {sub}"))


def settled_mapping(value: object) -> Mapping[str, Any]:
    return {} if isinstance(value, BaseException) else as_mapping(value)


def song_cover(song: Mapping[str, Any]) -> str:
    album = as_mapping(song.get("al") or song.get("album"))
    value = album.get("picUrl") or album.get("coverUrl") or ""
    return str(value)


def lyric_value(body: Mapping[str, Any], key: str) -> str:
    value = as_mapping(body.get(key)).get("lyric") or ""
    return str(value)


def audio_proxy_headers(audio_url: str, range_header: str) -> dict[str, str]:
    host = (urlsplit(audio_url).hostname or "").lower()
    referer = (
        "https://y.qq.com/" if "qq.com" in host or "qpic.cn" in host else "https://music.163.com/"
    )
    headers = {"Referer": referer, "User-Agent": NETEASE_USER_AGENT}
    if range_header:
        headers["Range"] = range_header
    return headers


def audio_content_type(audio_url: str, upstream_type: str | None) -> str:
    path = urlsplit(audio_url).path.lower()
    for suffix, content_type in (
        (".flac", "audio/flac"),
        (".mp3", "audio/mpeg"),
        (".m4a", "audio/mp4"),
        (".mp4", "audio/mp4"),
        (".ogg", "audio/ogg"),
        (".wav", "audio/wav"),
    ):
        if path.endswith(suffix):
            return content_type
    return upstream_type or "audio/mpeg"


def as_mapping(value: object) -> Mapping[str, Any]:
    return value if isinstance(value, dict) else {}


def as_mapping_list(value: object) -> list[Mapping[str, Any]]:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, dict)]


def optional_number(value: object) -> float | None:
    if not isinstance(value, (str, int, float)) or value == "":
        return None
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None
    return parsed if isfinite(parsed) else None


def bounded_number(value: object, minimum: float, maximum: float) -> float | None:
    parsed = optional_number(value)
    return max(minimum, min(maximum, parsed)) if parsed is not None else None


def fallback_weather(params: Mapping[str, object], error: Exception) -> dict[str, Any]:
    name = str(
        params.get("city")
        or params.get("q")
        or params.get("location")
        or WEATHER_DEFAULT_LOCATION["name"]
    ).strip() or str(WEATHER_DEFAULT_LOCATION["name"])
    return {
        "provider": "open-meteo",
        "location": {
            "name": name,
            "country": "",
            "admin1": "",
            "latitude": None,
            "longitude": None,
            "timezone": params.get("timezone") or WEATHER_DEFAULT_LOCATION["timezone"],
            "fallback": True,
        },
        "label": "天气暂不可用",
        "weatherCode": None,
        "temperature": None,
        "apparentTemperature": None,
        "humidity": None,
        "precipitation": None,
        "cloudCover": None,
        "windSpeed": None,
        "windGusts": None,
        "isDay": None,
        "time": "",
        "updatedAt": time_ns() // 1_000_000,
        "error": str(error),
        "mood": {
            "key": "fallback",
            "title": "临时电台",
            "tagline": "天气暂时没有回来，先放一组稳妥的歌",
            "energy": 0.54,
            "warmth": 0.55,
            "focus": 0.55,
            "melancholy": 0.35,
            "keywords": ["华语 流行", "indie pop", "city pop", "轻快 歌单", "chill pop"],
        },
    }


def copy_header(source: Mapping[str, str], target: dict[str, str], name: str) -> None:
    if value := source.get(name):
        target["-".join(part.title() for part in name.split("-"))] = value


async def drain(body: AsyncIterator[bytes]) -> None:
    async for _ in body:
        pass
