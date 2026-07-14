from __future__ import annotations

import httpx
import pytest

from kernelon_api.modules.wallpapers.domain import WallpaperAsset
from kernelon_api.modules.wallpapers.infrastructure.providers import (
    BoundedProviderCache,
    NasaWallpaperProvider,
    WikimediaWallpaperProvider,
)


@pytest.mark.asyncio
async def test_nasa_search_normalizes_video_without_persisting_results() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.params["media_type"] == "video"
        return httpx.Response(
            200,
            json={
                "collection": {
                    "items": [
                        {
                            "data": [
                                {
                                    "nasa_id": "demo-video",
                                    "media_type": "video",
                                    "title": "Earth demo",
                                    "keywords": ["Earth", "loop"],
                                }
                            ],
                            "href": "https://images-api.nasa.gov/asset/demo-video",
                            "links": [{"href": "https://example.test/poster.jpg"}],
                        }
                    ]
                }
            },
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        values = await NasaWallpaperProvider(client).search("earth", "video", 1, 20)

    assert values[0].media_type == "video"
    assert values[0].poster_url == "https://example.test/poster.jpg"
    assert values[0].sources[0]["url"].endswith("demo-video~medium.mp4")


def test_wikimedia_rejects_unknown_license_and_keeps_attribution() -> None:
    provider = WikimediaWallpaperProvider()
    base = {
        "pageid": 42,
        "title": "File:Demo.webm",
        "imageinfo": [
            {
                "url": "https://upload.wikimedia.org/demo.webm",
                "thumburl": "https://upload.wikimedia.org/demo.jpg",
                "mime": "video/webm",
                "extmetadata": {
                    "LicenseShortName": {"value": "CC BY-SA"},
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


def test_provider_cache_is_bounded_by_result_count() -> None:
    cache = BoundedProviderCache(maximum=1, ttl_seconds=600)
    first = _asset("first")
    second = _asset("second")
    cache.put("one", [first])
    cache.put("two", [second])
    assert cache.get("one") is None
    assert cache.get("two") == [second]


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
