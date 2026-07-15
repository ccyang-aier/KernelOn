from __future__ import annotations

import httpx
import pytest

from kernelon_api.modules.wallpapers.application import WallpaperService
from kernelon_api.modules.wallpapers.domain import WallpaperAsset
from kernelon_api.modules.wallpapers.infrastructure.providers import (
    BoundedProviderCache,
    HttpProvider,
    WikimediaWallpaperProvider,
    gather_provider_results,
)


@pytest.mark.asyncio
async def test_provider_retries_transient_proxy_connect_errors() -> None:
    attempts = 0

    async def handler(request: httpx.Request) -> httpx.Response:
        nonlocal attempts
        attempts += 1
        if attempts < 3:
            raise httpx.ConnectError("transient proxy TLS failure", request=request)
        return httpx.Response(200, json={"collection": {"items": []}})

    class JsonProvider(HttpProvider):
        async def search(
            self, query: str, media_type: str, page: int, limit: int
        ) -> list[WallpaperAsset]:
            await self._json("https://example.test/search")
            return []

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        values = await JsonProvider(client).search("timelapse", "video", 1, 20)

    assert values == []
    assert attempts == 3


def test_wikimedia_rejects_unknown_license_and_keeps_attribution() -> None:
    provider = WikimediaWallpaperProvider()
    base = {
        "pageid": 42,
        "title": "File:Forest timelapse.webm",
        "imageinfo": [
            {
                "url": "https://upload.wikimedia.org/demo.webm",
                "thumburl": "https://upload.wikimedia.org/demo.jpg",
                "mime": "video/webm",
                "width": 1920,
                "height": 1080,
                "extmetadata": {
                    "LicenseShortName": {"value": "CC BY-SA 4.0"},
                    "LicenseUrl": {"value": "https://creativecommons.org/licenses/by-sa/4.0/"},
                    "Artist": {"value": "<b>Ada</b>"},
                },
            }
        ],
    }
    value = provider._map_page(base)
    assert value is not None
    assert value.media_type == "video"
    assert value.author == "Ada"
    base["imageinfo"][0]["extmetadata"]["LicenseShortName"]["value"] = "All rights reserved"
    assert provider._map_page(base) is None


def test_wikimedia_rejects_non_wallpaper_editorial_video() -> None:
    page = {
        "pageid": 43,
        "title": "File:Product briefing.webm",
        "imageinfo": [
            {
                "url": "https://upload.wikimedia.org/briefing.webm",
                "thumburl": "https://upload.wikimedia.org/briefing.jpg",
                "mime": "video/webm",
                "width": 1920,
                "height": 1080,
                "extmetadata": {"LicenseShortName": {"value": "CC0"}},
            }
        ],
    }

    assert WikimediaWallpaperProvider()._map_page(page) is None


def test_provider_cache_is_bounded_by_result_count() -> None:
    cache = BoundedProviderCache(maximum=1, ttl_seconds=600)
    first = _asset("first")
    second = _asset("second")
    cache.put("one", [first])
    cache.put("two", [second])
    assert cache.get("one") is None
    assert cache.get("two") == [second]


def test_wallpaper_service_port_supports_runtime_dependency_validation() -> None:
    assert not isinstance(object(), WallpaperService)


@pytest.mark.asyncio
async def test_provider_error_uses_exception_type_when_message_is_empty() -> None:
    class FailingProvider(HttpProvider):
        key = "test"

        async def search(
            self, query: str, media_type: str, page: int, limit: int
        ) -> list[WallpaperAsset]:
            raise httpx.ConnectError("")

    values, errors = await gather_provider_results([FailingProvider()], "timelapse", "video", 1, 20)

    assert values == []
    assert errors == [{"provider": "test", "message": "ConnectError"}]


def _asset(external_id: str) -> WallpaperAsset:
    return WallpaperAsset(
        provider="test",
        external_id=external_id,
        title=external_id,
        media_type="image",
        poster_url="https://example.test/poster.jpg",
        sources=({"url": "https://example.test/image.jpg", "mimeType": "image/jpeg"},),
        source_page_url="https://example.test",
    )
