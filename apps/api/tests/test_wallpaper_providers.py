from __future__ import annotations

import httpx
import pytest

from kernelon_api.modules.wallpapers.application import WallpaperService
from kernelon_api.modules.wallpapers.domain import WallpaperAsset
from kernelon_api.modules.wallpapers.infrastructure.providers import (
    BoundedProviderCache,
    HttpProvider,
    SteamWorkshopProvider,
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


def test_steam_workshop_is_catalog_only_and_never_importable() -> None:
    provider = SteamWorkshopProvider("test-key")
    value = provider._map(
        {
            "publishedfileid": "123",
            "title": "Anime night city",
            "preview_url": "https://steamuserimages-a.akamaihd.net/example.jpg",
            "tags": [{"tag": "Anime"}, {"tag": "Scene"}],
            "vote_data": {"votes_up": 42},
        }
    )
    assert value is not None
    assert value.can_apply is False
    assert value.can_import is False
    assert value.access_mode == "catalog-only"
    assert value.sources[0]["quality"] == "preview"
    assert value.open_external_url.endswith("?id=123")


@pytest.mark.asyncio
async def test_steam_workshop_stays_disabled_without_api_key() -> None:
    assert await SteamWorkshopProvider(None).search("anime", "image", 1, 20) == []


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
