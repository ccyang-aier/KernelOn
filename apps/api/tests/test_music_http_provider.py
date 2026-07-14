"""Endpoint-level contracts for the Mineradio HTTP provider adapter."""

from __future__ import annotations

from typing import TYPE_CHECKING

import httpx
import pytest

from kernelon_api.modules.music.application import MusicProviderError, UnsafeProxyUrlError
from kernelon_api.modules.music.infrastructure.http_provider import (
    MAX_PROXY_REDIRECTS,
    HttpxMusicProvider,
    as_mapping,
    empty_stream,
    normalize_set_cookie_headers,
    parse_json_or_jsonp,
    validate_public_http_url,
)

if TYPE_CHECKING:
    from collections.abc import Sequence


async def test_netease_and_external_endpoint_parameters_match_mineradio() -> None:
    requests: list[tuple[str, str, str, str]] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        body = (await request.aread()).decode()
        requests.append(
            (
                request.method,
                request.url.path,
                body or request.url.query.decode(),
                request.headers.get("cookie", ""),
            )
        )
        if request.url.path == "/api/playlist/detail":
            return httpx.Response(
                200,
                json={"playlist": {"trackIds": [{"id": 7}, {"id": "song-mid"}]}},
            )
        if request.url.path == "/api/artist/artist-id":
            return httpx.Response(200, json={"hotSongs": [{"id": 8}]})
        return httpx.Response(
            200,
            json={"code": 200},
            headers=[
                ("set-cookie", "MUSIC_U=token; Path=/; HttpOnly"),
                ("set-cookie", "__csrf=csrf; Path=/"),
            ],
        )

    provider = HttpxMusicProvider(transport=httpx.MockTransport(handler))
    cookie = "MUSIC_U=current-user"

    await provider.cloud_search("hello", 20, cookie)
    await provider.song_details(["7", "song-mid"], cookie)
    await provider.lyric_new("7", cookie)
    await provider.lyric("7", cookie)
    tracks = await provider.playlist_tracks_all("playlist-id", 2, cookie)
    assert tracks == {"code": 200}
    await provider.playlist_detail("playlist-id", cookie)
    await provider.artist_detail("artist-id", cookie)
    top_songs = await provider.artist_top_songs("artist-id", cookie)
    assert top_songs == {"songs": [{"id": 8}]}
    await provider.artist_songs("artist-id", 30, cookie)
    await provider.song_comments("7", 20, 40, cookie)
    await provider.podcast_search("radio", 18, cookie)
    await provider.podcast_hot(18, 36, cookie)
    await provider.podcast_detail("radio-id", cookie)
    await provider.podcast_programs("radio-id", 30, 60, cookie)
    await provider.personalized(12, cookie)
    await provider.recommend_resource(cookie)
    await provider.recommend_songs(cookie)

    qr_key = await provider.login_qr_key()
    await provider.login_qr_check("qr-key", cookie=cookie)
    await provider.login_status(cookie)
    await provider.user_account(cookie)
    await provider.logout(cookie)
    await provider.user_playlists("user-id", 200, cookie)
    await provider.song_url_v1("7", "lossless", cookie)
    await provider.song_url("7", 320_000, cookie)
    await provider.song_like_check(["7", "not-a-number", "8"], cookie)
    await provider.like_list("user-id", cookie)
    await provider.like_song("7", False, cookie)
    await provider.create_playlist("My list", "10", cookie)
    await provider.add_playlist_tracks("playlist-id", "7,8", cookie)
    await provider.add_playlist_tracks_fallback("playlist-id", "7,8", cookie)
    await provider.podcast_sublist(100, 0, cookie)
    await provider.podcast_created("user-id", cookie)
    await provider.podcast_paid(100, 20, cookie)
    await provider.podcast_liked(cookie)
    await provider.podcast_recent_voices(100, cookie)

    await provider.weather_geocode("Shanghai")
    await provider.weather_forecast(31.2, 121.4, "")
    await provider.weather_ip_location()

    assert qr_key.cookie == "MUSIC_U=token; __csrf=csrf"
    calls_by_path = {
        path: (method, data, sent_cookie) for method, path, data, sent_cookie in requests
    }
    assert calls_by_path["/api/search/get/web"] == (
        "POST",
        "s=radio&type=1009&limit=18&offset=0&total=true",
        cookie,
    )
    assert "ids=%5B7%2C%22song-mid%22%5D" in calls_by_path["/api/song/detail/"][1]
    assert "private_cloud=true" in calls_by_path["/api/v1/artist/songs"][1]
    assert "beforeTime=0" in calls_by_path["/api/v1/resource/comments/R_SO_4_7"][1]
    assert "ids=%5B7%2C+8%5D" in calls_by_path["/api/song/like/check"][1]
    assert "like=false" in calls_by_path["/api/radio/like"][1]
    assert "timezone=auto" in calls_by_path["/v1/forecast"][1]
    assert calls_by_path["/v1/search"][0] == "GET"
    assert calls_by_path["/json/"][0] == "GET"


async def test_playlist_tracks_all_handles_missing_and_empty_track_ids() -> None:
    responses = iter(
        [
            httpx.Response(200, json={"playlist": {"trackIds": "invalid"}}),
            httpx.Response(200, json={"playlist": {"trackIds": []}}),
        ]
    )

    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/api/playlist/detail"
        return next(responses)

    provider = HttpxMusicProvider(transport=httpx.MockTransport(handler))
    assert await provider.playlist_tracks_all("1", 20) == {"songs": []}
    assert await provider.playlist_tracks_all("2", 20) == {"songs": []}


@pytest.mark.parametrize("response_kind", ["status", "non_object", "invalid_json"])
async def test_netease_json_errors_are_normalized(response_kind: str) -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        if response_kind == "status":
            return httpx.Response(503, text="unavailable")
        if response_kind == "non_object":
            return httpx.Response(200, json=["unexpected"])
        return httpx.Response(200, text="not json")

    provider = HttpxMusicProvider(transport=httpx.MockTransport(handler))
    with pytest.raises(MusicProviderError):
        await provider.cloud_search("hello", 20)


async def test_qq_get_and_musicu_preserve_headers_jsonp_and_error_shapes() -> None:
    captured: list[httpx.Request] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        captured.append(request)
        if request.method == "GET":
            return httpx.Response(200, text='callback({"code":0});')
        return httpx.Response(200, json={"req": {"code": 0}})

    provider = HttpxMusicProvider(transport=httpx.MockTransport(handler))
    assert await provider.qq_get("https://c.y.qq.com/query", {"songmid": "mid"}, "uin=1") == {
        "code": 0
    }
    assert await provider.qq_musicu({"req": {"module": "music"}}, "uin=1") == {"req": {"code": 0}}
    assert [request.method for request in captured] == ["GET", "POST"]
    assert all(request.headers["cookie"] == "uin=1" for request in captured)
    assert captured[0].headers["referer"] == "https://y.qq.com/"

    async def non_object_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=[1])

    invalid = HttpxMusicProvider(transport=httpx.MockTransport(non_object_handler))
    with pytest.raises(MusicProviderError, match="non-object"):
        await invalid.qq_get("https://c.y.qq.com/query", {})
    with pytest.raises(MusicProviderError, match="non-object"):
        await invalid.qq_musicu({})

    async def failed_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, text="failed")

    failed = HttpxMusicProvider(transport=httpx.MockTransport(failed_handler))
    with pytest.raises(MusicProviderError):
        await failed.qq_get("https://c.y.qq.com/query", {})
    with pytest.raises(MusicProviderError):
        await failed.qq_musicu({})


async def test_external_json_rejects_non_object_and_http_errors() -> None:
    async def non_object_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=[1])

    provider = HttpxMusicProvider(transport=httpx.MockTransport(non_object_handler))
    with pytest.raises(MusicProviderError, match="non-object"):
        await provider.weather_geocode("x")

    async def failed_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(502, text="failed")

    provider = HttpxMusicProvider(transport=httpx.MockTransport(failed_handler))
    with pytest.raises(MusicProviderError):
        await provider.weather_ip_location()


async def test_proxy_stream_get_head_and_redirect_contracts() -> None:
    requests: list[tuple[str, str]] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requests.append((request.method, str(request.url)))
        if request.url.path == "/redirect":
            return httpx.Response(302, headers={"location": "/media"})
        return httpx.Response(
            206,
            content=b"audio",
            headers={"content-type": "audio/mpeg", "content-range": "bytes 0-4/5"},
        )

    provider = HttpxMusicProvider(transport=httpx.MockTransport(handler))
    stream = await provider.proxy_stream(
        "https://8.8.8.8/redirect", method="GET", headers={"Range": "bytes=0-4"}
    )
    assert stream.status_code == 206
    assert b"".join([chunk async for chunk in stream.body]) == b"audio"

    head = await provider.proxy_stream("https://8.8.4.4/media", method="HEAD", headers={})
    assert head.status_code == 206
    assert [chunk async for chunk in head.body] == [b""]
    assert requests == [
        ("GET", "https://8.8.8.8/redirect"),
        ("GET", "https://8.8.8.8/media"),
        ("HEAD", "https://8.8.4.4/media"),
    ]


async def test_proxy_stream_rejects_broken_and_excessive_redirects() -> None:
    async def missing_location(request: httpx.Request) -> httpx.Response:
        return httpx.Response(302)

    provider = HttpxMusicProvider(transport=httpx.MockTransport(missing_location))
    with pytest.raises(MusicProviderError, match="missing Location"):
        await provider.proxy_stream("https://8.8.8.8/a", method="GET", headers={})

    calls = 0

    async def endless_redirect(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return httpx.Response(302, headers={"location": f"/redirect-{calls}"})

    provider = HttpxMusicProvider(transport=httpx.MockTransport(endless_redirect))
    with pytest.raises(MusicProviderError, match="Too many"):
        await provider.proxy_stream("https://8.8.8.8/a", method="GET", headers={})
    assert calls == MAX_PROXY_REDIRECTS + 1


@pytest.mark.parametrize(
    ("url", "message"),
    [
        ("", "Invalid media URL"),
        ("ftp://8.8.8.8/a", "Invalid media URL"),
        ("https://user:secret@8.8.8.8/a", "Credentials"),
        ("https://localhost/a", "Local"),
        ("https://example.localhost/a", "Local"),
        ("https://8.8.8.8:invalid/a", "port"),
        ("https://127.0.0.1/a", "non-public"),
    ],
)
async def test_public_media_url_validation_rejects_unsafe_inputs(url: str, message: str) -> None:
    async def resolver(host: str, port: int) -> Sequence[str]:
        return ["8.8.8.8"]

    with pytest.raises(UnsafeProxyUrlError, match=message):
        await validate_public_http_url(url, resolver)


async def test_public_media_url_validation_checks_dns_results() -> None:
    async def unresolved(host: str, port: int) -> Sequence[str]:
        return []

    with pytest.raises(UnsafeProxyUrlError, match="did not resolve"):
        await validate_public_http_url("https://media.example/a", unresolved)

    async def invalid(host: str, port: int) -> Sequence[str]:
        return ["not-an-address"]

    with pytest.raises(UnsafeProxyUrlError, match="invalid address"):
        await validate_public_http_url("https://media.example/a", invalid)

    async def public(host: str, port: int) -> Sequence[str]:
        assert (host, port) == ("media.example", 8443)
        return ["8.8.8.8", "2001:4860:4860::8888"]

    await validate_public_http_url("https://media.example:8443/a", public)


async def test_http_provider_small_normalizers_match_source_behavior() -> None:
    assert (
        normalize_set_cookie_headers(
            [
                "MUSIC_U=first; Path=/",
                "MUSIC_U=latest; HttpOnly",
                "Path=/ignored",
                "empty=; Secure",
                "malformed",
            ]
        )
        == "MUSIC_U=latest"
    )
    assert parse_json_or_jsonp('callback({"ok":true})') == {"ok": True}
    assert parse_json_or_jsonp('callback({"ok":true});') == {"ok": True}
    assert parse_json_or_jsonp('{"ok":true}') == {"ok": True}
    assert as_mapping({"ok": True}) == {"ok": True}
    assert as_mapping(["not", "mapping"]) == {}
    assert [chunk async for chunk in empty_stream()] == [b""]
