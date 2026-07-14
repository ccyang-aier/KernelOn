"""HTTP implementation of Mineradio's Netease and media-provider boundary."""

from __future__ import annotations

import ipaddress
import json
import socket
from time import time_ns
from typing import TYPE_CHECKING, Any
from urllib.parse import urljoin, urlsplit

import httpx
from anyio import to_thread

from kernelon_api.modules.music.application import (
    MusicProviderError,
    MusicProviderResponse,
    ProviderStream,
    UnsafeProxyUrlError,
)

if TYPE_CHECKING:
    from collections.abc import AsyncIterator, Awaitable, Callable, Mapping, Sequence

    HostResolver = Callable[[str, int], Awaitable[Sequence[str]]]

NETEASE_WEB_ORIGIN = "https://music.163.com"
QQ_MUSICU_URL = "https://u.y.qq.com/cgi-bin/musicu.fcg"
OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"
WEATHER_IP_LOCATION_URL = "http://ip-api.com/json/"
NETEASE_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
MAX_PROXY_REDIRECTS = 5
MAX_PROXY_URL_LENGTH = 4096


class HttpxMusicProvider:
    """Call Netease's public web API and stream allowlisted public-network URLs."""

    def __init__(
        self,
        *,
        transport: httpx.AsyncBaseTransport | None = None,
        resolver: HostResolver | None = None,
    ) -> None:
        self._transport = transport
        self._resolver = resolver or resolve_host_addresses

    async def cloud_search(self, keywords: str, limit: int, cookie: str = "") -> Mapping[str, Any]:
        return await self._request_json(
            "/api/search/get/web",
            {"s": keywords, "type": 1, "limit": limit, "offset": 0, "total": "true"},
            cookie=cookie,
        )

    async def song_details(self, ids: Sequence[str], cookie: str = "") -> Mapping[str, Any]:
        song_ids = [int(song_id) if song_id.isdecimal() else song_id for song_id in ids]
        return await self._request_json(
            "/api/song/detail/",
            {"ids": json.dumps(song_ids, separators=(",", ":"), ensure_ascii=False)},
            cookie=cookie,
        )

    async def lyric_new(self, song_id: str, cookie: str = "") -> Mapping[str, Any]:
        return await self._request_json(
            "/api/song/lyric/v1",
            {"id": song_id, "cp": "false", "tv": 0, "lv": 0, "rv": 0, "kv": 0},
            cookie=cookie,
        )

    async def lyric(self, song_id: str, cookie: str = "") -> Mapping[str, Any]:
        return await self._request_json(
            "/api/song/lyric",
            {"id": song_id, "tv": -1, "lv": -1, "rv": -1, "kv": -1},
            cookie=cookie,
        )

    async def playlist_tracks_all(
        self, playlist_id: str, limit: int, cookie: str = ""
    ) -> Mapping[str, Any]:
        detail = await self.playlist_detail(playlist_id, cookie)
        playlist = as_mapping(detail.get("playlist"))
        raw_track_ids = playlist.get("trackIds")
        if not isinstance(raw_track_ids, list):
            return {"songs": []}
        track_ids = [
            str(item.get("id"))
            for item in raw_track_ids[:limit]
            if isinstance(item, dict) and item.get("id") is not None
        ]
        return await self.song_details(track_ids, cookie) if track_ids else {"songs": []}

    async def playlist_detail(self, playlist_id: str, cookie: str = "") -> Mapping[str, Any]:
        return await self._request_json(
            "/api/playlist/detail",
            {"id": playlist_id, "n": 100000, "s": 0},
            cookie=cookie,
        )

    async def artist_detail(self, artist_id: str, cookie: str = "") -> Mapping[str, Any]:
        return await self._request_json(f"/api/artist/{artist_id}", {}, cookie=cookie)

    async def artist_songs(self, artist_id: str, limit: int, cookie: str = "") -> Mapping[str, Any]:
        return await self._request_json(
            "/api/v1/artist/songs",
            {
                "id": artist_id,
                "private_cloud": "true",
                "work_type": 1,
                "order": "hot",
                "offset": 0,
                "limit": limit,
            },
            cookie=cookie,
        )

    async def artist_top_songs(self, artist_id: str, cookie: str = "") -> Mapping[str, Any]:
        detail = await self.artist_detail(artist_id, cookie)
        return {"songs": detail.get("hotSongs", [])}

    async def song_comments(
        self, song_id: str, limit: int, offset: int, cookie: str = ""
    ) -> Mapping[str, Any]:
        return await self._request_json(
            f"/api/v1/resource/comments/R_SO_4_{song_id}",
            {"rid": song_id, "limit": limit, "offset": offset, "beforeTime": 0},
            cookie=cookie,
        )

    async def weather_geocode(self, query: str) -> Mapping[str, Any]:
        return await self._get_external_json(
            OPEN_METEO_GEOCODE_URL,
            {"name": query, "count": 1, "language": "zh", "format": "json"},
        )

    async def weather_forecast(
        self, latitude: float, longitude: float, timezone: str
    ) -> Mapping[str, Any]:
        return await self._get_external_json(
            OPEN_METEO_FORECAST_URL,
            {
                "latitude": latitude,
                "longitude": longitude,
                "current": (
                    "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,"
                    "precipitation,rain,showers,snowfall,weather_code,cloud_cover,"
                    "wind_speed_10m,wind_gusts_10m"
                ),
                "hourly": "precipitation_probability,weather_code,temperature_2m",
                "forecast_days": 1,
                "timezone": timezone or "auto",
            },
        )

    async def weather_ip_location(self) -> Mapping[str, Any]:
        return await self._get_external_json(
            WEATHER_IP_LOCATION_URL,
            {
                "fields": "status,message,country,regionName,city,lat,lon,timezone,query",
                "lang": "zh-CN",
            },
        )

    async def podcast_search(
        self, keywords: str, limit: int, cookie: str = ""
    ) -> Mapping[str, Any]:
        return await self._request_json(
            "/api/search/get/web",
            {"s": keywords, "type": 1009, "limit": limit, "offset": 0, "total": "true"},
            cookie=cookie,
        )

    async def podcast_hot(self, limit: int, offset: int, cookie: str = "") -> Mapping[str, Any]:
        return await self._request_json(
            "/api/djradio/hot/v1", {"limit": limit, "offset": offset}, cookie=cookie
        )

    async def podcast_detail(self, radio_id: str, cookie: str = "") -> Mapping[str, Any]:
        return await self._request_json("/api/djradio/v2/get", {"id": radio_id}, cookie=cookie)

    async def podcast_programs(
        self, radio_id: str, limit: int, offset: int, cookie: str = ""
    ) -> Mapping[str, Any]:
        return await self._request_json(
            "/api/dj/program/byradio",
            {"radioId": radio_id, "limit": limit, "offset": offset, "asc": "false"},
            cookie=cookie,
        )

    async def personalized(self, limit: int, cookie: str) -> Mapping[str, Any]:
        return await self._request_json(
            "/api/personalized/playlist",
            {"limit": limit, "total": "true", "timestamp": timestamp_ms()},
            cookie=cookie,
        )

    async def recommend_resource(self, cookie: str) -> Mapping[str, Any]:
        return await self._request_json(
            "/api/v1/discovery/recommend/resource",
            {"timestamp": timestamp_ms()},
            cookie=cookie,
        )

    async def recommend_songs(self, cookie: str) -> Mapping[str, Any]:
        return await self._request_json(
            "/api/v3/discovery/recommend/songs",
            {"timestamp": timestamp_ms()},
            cookie=cookie,
        )

    async def login_qr_key(self) -> MusicProviderResponse:
        return await self._request_json_response(
            "/api/login/qrcode/unikey", {"timestamp": timestamp_ms()}
        )

    async def login_qr_check(self, key: str, *, cookie: str = "") -> MusicProviderResponse:
        return await self._request_json_response(
            "/api/login/qrcode/client/login",
            {"key": key, "type": 1, "timestamp": timestamp_ms()},
            cookie=cookie,
        )

    async def login_status(self, cookie: str) -> MusicProviderResponse:
        return await self._request_json_response(
            "/api/w/nuser/account/get", {"timestamp": timestamp_ms()}, cookie=cookie
        )

    async def user_account(self, cookie: str) -> MusicProviderResponse:
        return await self._request_json_response(
            "/api/nuser/account/get", {"timestamp": timestamp_ms()}, cookie=cookie
        )

    async def logout(self, cookie: str) -> MusicProviderResponse:
        return await self._request_json_response("/api/logout", {}, cookie=cookie)

    async def user_playlists(self, user_id: str, limit: int, cookie: str) -> MusicProviderResponse:
        return await self._request_json_response(
            "/api/user/playlist",
            {"uid": user_id, "limit": limit, "offset": 0, "timestamp": timestamp_ms()},
            cookie=cookie,
        )

    async def song_url_v1(self, song_id: str, level: str, cookie: str) -> MusicProviderResponse:
        return await self._request_json_response(
            "/api/song/enhance/player/url/v1",
            {"ids": f"[{song_id}]", "level": level, "encodeType": "flac"},
            cookie=cookie,
        )

    async def song_url(self, song_id: str, bitrate: int, cookie: str) -> MusicProviderResponse:
        return await self._request_json_response(
            "/api/song/enhance/player/url",
            {"ids": f"[{song_id}]", "br": bitrate},
            cookie=cookie,
        )

    async def song_like_check(self, song_ids: Sequence[str], cookie: str) -> MusicProviderResponse:
        return await self._request_json_response(
            "/api/song/like/check",
            {
                "ids": json.dumps([int(item) for item in song_ids if item.isdecimal()]),
                "timestamp": timestamp_ms(),
            },
            cookie=cookie,
        )

    async def like_list(self, user_id: str, cookie: str) -> MusicProviderResponse:
        return await self._request_json_response(
            "/api/song/like/get",
            {"uid": user_id, "timestamp": timestamp_ms()},
            cookie=cookie,
        )

    async def like_song(self, song_id: str, like: bool, cookie: str) -> MusicProviderResponse:
        return await self._request_json_response(
            "/api/radio/like",
            {
                "trackId": song_id,
                "like": str(like).lower(),
                "time": 25,
                "timestamp": timestamp_ms(),
            },
            cookie=cookie,
        )

    async def create_playlist(self, name: str, privacy: str, cookie: str) -> MusicProviderResponse:
        return await self._request_json_response(
            "/api/playlist/create",
            {"name": name, "privacy": privacy, "timestamp": timestamp_ms()},
            cookie=cookie,
        )

    async def add_playlist_tracks(
        self, playlist_id: str, song_ids: str, cookie: str
    ) -> MusicProviderResponse:
        return await self._request_json_response(
            "/api/playlist/manipulate/tracks",
            {
                "op": "add",
                "pid": playlist_id,
                "trackIds": f"[{song_ids}]",
                "timestamp": timestamp_ms(),
            },
            cookie=cookie,
        )

    async def add_playlist_tracks_fallback(
        self, playlist_id: str, song_ids: str, cookie: str
    ) -> MusicProviderResponse:
        return await self._request_json_response(
            "/api/playlist/track/add",
            {
                "pid": playlist_id,
                "ids": f"[{song_ids}]",
                "timestamp": timestamp_ms(),
            },
            cookie=cookie,
        )

    async def podcast_sublist(self, limit: int, offset: int, cookie: str) -> MusicProviderResponse:
        return await self._request_json_response(
            "/api/djradio/get/subed",
            {"limit": limit, "offset": offset, "timestamp": timestamp_ms()},
            cookie=cookie,
        )

    async def podcast_created(self, user_id: str, cookie: str) -> MusicProviderResponse:
        return await self._request_json_response(
            "/api/djradio/get/byuser",
            {"userId": user_id, "timestamp": timestamp_ms()},
            cookie=cookie,
        )

    async def podcast_paid(self, limit: int, offset: int, cookie: str) -> MusicProviderResponse:
        return await self._request_json_response(
            "/api/djradio/home/paygift/list",
            {"limit": limit, "offset": offset, "timestamp": timestamp_ms()},
            cookie=cookie,
        )

    async def podcast_liked(self, cookie: str) -> MusicProviderResponse:
        return await self._request_json_response(
            "/api/sati/resource/sub/list", {"timestamp": timestamp_ms()}, cookie=cookie
        )

    async def podcast_recent_voices(self, limit: int, cookie: str) -> MusicProviderResponse:
        return await self._request_json_response(
            "/api/play-record/voice/list",
            {"limit": limit, "timestamp": timestamp_ms()},
            cookie=cookie,
        )

    async def qq_get(
        self, url: str, params: Mapping[str, str | int], cookie: str = ""
    ) -> Mapping[str, Any]:
        headers = {
            "Accept": "application/json, text/plain, */*",
            "Referer": "https://y.qq.com/",
            "User-Agent": NETEASE_USER_AGENT,
        }
        if cookie:
            headers["Cookie"] = cookie
        try:
            async with self._client(follow_redirects=True) as client:
                response = await client.get(url, params=dict(params), headers=headers)
                response.raise_for_status()
                payload = parse_json_or_jsonp(response.text)
        except (httpx.HTTPError, ValueError, json.JSONDecodeError) as exc:
            raise MusicProviderError(str(exc)) from exc
        if not isinstance(payload, dict):
            raise MusicProviderError("Provider returned a non-object JSON response")
        return payload

    async def qq_musicu(self, payload: Mapping[str, Any], cookie: str = "") -> Mapping[str, Any]:
        headers = {
            "Accept": "application/json, text/plain, */*",
            "Referer": "https://y.qq.com/",
            "User-Agent": NETEASE_USER_AGENT,
            "Content-Type": "application/json;charset=UTF-8",
        }
        if cookie:
            headers["Cookie"] = cookie
        try:
            async with self._client(follow_redirects=True) as client:
                response = await client.post(QQ_MUSICU_URL, json=dict(payload), headers=headers)
                response.raise_for_status()
                body = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise MusicProviderError(str(exc)) from exc
        if not isinstance(body, dict):
            raise MusicProviderError("Provider returned a non-object JSON response")
        return body

    async def proxy_stream(
        self,
        url: str,
        *,
        method: str,
        headers: Mapping[str, str],
    ) -> ProviderStream:
        current_url = url
        client = self._client(follow_redirects=False)
        try:
            for redirect_count in range(MAX_PROXY_REDIRECTS + 1):
                await validate_public_http_url(current_url, self._resolver)
                request = client.build_request(method, current_url, headers=dict(headers))
                response = await client.send(request, stream=True)
                if response.status_code not in {301, 302, 303, 307, 308}:
                    if method == "HEAD":
                        response_headers = dict(response.headers)
                        response_status = response.status_code
                        await response.aclose()
                        await client.aclose()
                        return ProviderStream(
                            status_code=response_status,
                            headers=response_headers,
                            body=empty_stream(),
                        )
                    return ProviderStream(
                        status_code=response.status_code,
                        headers=dict(response.headers),
                        body=stream_response_body(response, client),
                    )

                location = response.headers.get("location")
                await response.aclose()
                if not location:
                    raise MusicProviderError("Upstream redirect is missing Location")
                if redirect_count == MAX_PROXY_REDIRECTS:
                    raise MusicProviderError("Too many upstream redirects")
                current_url = urljoin(current_url, location)
        except (httpx.HTTPError, OSError) as exc:
            await client.aclose()
            raise MusicProviderError(str(exc)) from exc
        except Exception:
            await client.aclose()
            raise
        await client.aclose()
        raise MusicProviderError("Too many upstream redirects")

    async def _request_json(
        self, path: str, params: Mapping[str, str | int], *, cookie: str = ""
    ) -> Mapping[str, Any]:
        return (await self._request_json_response(path, params, cookie=cookie)).payload

    async def _request_json_response(
        self,
        path: str,
        params: Mapping[str, str | int],
        *,
        cookie: str = "",
    ) -> MusicProviderResponse:
        try:
            async with self._client(follow_redirects=True) as client:
                headers = {
                    "Referer": f"{NETEASE_WEB_ORIGIN}/",
                    "User-Agent": NETEASE_USER_AGENT,
                }
                if cookie:
                    headers["Cookie"] = cookie
                response = await client.post(
                    f"{NETEASE_WEB_ORIGIN}{path}",
                    data=dict(params),
                    headers=headers,
                )
                response.raise_for_status()
                payload = response.json()
                response_cookie = normalize_set_cookie_headers(
                    response.headers.get_list("set-cookie")
                )
        except (httpx.HTTPError, ValueError) as exc:
            raise MusicProviderError(str(exc)) from exc
        if not isinstance(payload, dict):
            raise MusicProviderError("Provider returned a non-object JSON response")
        return MusicProviderResponse(payload=payload, cookie=response_cookie)

    async def _get_external_json(
        self, url: str, params: Mapping[str, str | int | float]
    ) -> Mapping[str, Any]:
        try:
            async with self._client(follow_redirects=True) as client:
                response = await client.get(
                    url,
                    params=dict(params),
                    headers={"User-Agent": NETEASE_USER_AGENT},
                )
                response.raise_for_status()
                payload = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise MusicProviderError(str(exc)) from exc
        if not isinstance(payload, dict):
            raise MusicProviderError("Provider returned a non-object JSON response")
        return payload

    def _client(self, *, follow_redirects: bool) -> httpx.AsyncClient:
        return httpx.AsyncClient(
            follow_redirects=follow_redirects,
            timeout=httpx.Timeout(15.0, connect=8.0),
            transport=self._transport,
        )


async def validate_public_http_url(url: str, resolver: HostResolver) -> None:
    """Reject credentials and every address that is not globally routable."""
    if not url or len(url) > MAX_PROXY_URL_LENGTH:
        raise UnsafeProxyUrlError("Invalid media URL")
    parsed = urlsplit(url)
    if parsed.scheme.lower() not in {"http", "https"} or not parsed.hostname:
        raise UnsafeProxyUrlError("Invalid media URL")
    if parsed.username is not None or parsed.password is not None:
        raise UnsafeProxyUrlError("Credentials are not allowed in media URLs")
    host = parsed.hostname.rstrip(".").lower()
    if host == "localhost" or host.endswith(".localhost"):
        raise UnsafeProxyUrlError("Local media hosts are not allowed")
    try:
        port = parsed.port or (443 if parsed.scheme.lower() == "https" else 80)
    except ValueError as exc:
        raise UnsafeProxyUrlError("Invalid media URL port") from exc

    try:
        literal = ipaddress.ip_address(host)
    except ValueError:
        addresses = await resolver(host, port)
    else:
        addresses = [str(literal)]
    if not addresses:
        raise UnsafeProxyUrlError("Media host did not resolve")
    for address in addresses:
        try:
            parsed_address = ipaddress.ip_address(address)
        except ValueError as exc:
            raise UnsafeProxyUrlError("Media host resolved to an invalid address") from exc
        if not parsed_address.is_global:
            raise UnsafeProxyUrlError("Media host resolved to a non-public address")


async def resolve_host_addresses(host: str, port: int) -> Sequence[str]:
    def resolve() -> list[str]:
        records = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
        return sorted({str(record[4][0]) for record in records})

    try:
        return await to_thread.run_sync(resolve)
    except socket.gaierror as exc:
        raise UnsafeProxyUrlError("Media host did not resolve") from exc


async def stream_response_body(
    response: httpx.Response, client: httpx.AsyncClient
) -> AsyncIterator[bytes]:
    try:
        async for chunk in response.aiter_bytes():
            if chunk:
                yield chunk
    finally:
        await response.aclose()
        await client.aclose()


async def empty_stream() -> AsyncIterator[bytes]:
    yield b""


def as_mapping(value: object) -> Mapping[str, Any]:
    return value if isinstance(value, dict) else {}


COOKIE_ATTRIBUTES = frozenset(
    {"path", "domain", "expires", "max-age", "samesite", "secure", "httponly"}
)


def normalize_set_cookie_headers(headers: Sequence[str]) -> str:
    """Keep cookie pairs while removing transport attributes, matching Mineradio."""
    pairs: dict[str, str] = {}
    for header in headers:
        first = header.split(";", 1)[0].strip()
        if "=" not in first:
            continue
        key, value = first.split("=", 1)
        key = key.strip()
        if key and key.lower() not in COOKIE_ATTRIBUTES and value.strip():
            pairs[key] = value.strip()
    return "; ".join(f"{key}={value}" for key, value in pairs.items())


def timestamp_ms() -> int:
    return time_ns() // 1_000_000


def parse_json_or_jsonp(value: str) -> Any:
    raw = value.strip()
    if raw.startswith("callback("):
        raw = raw[len("callback(") :]
        if raw.endswith(");"):
            raw = raw[:-2]
        elif raw.endswith(")"):
            raw = raw[:-1]
    return json.loads(raw)
