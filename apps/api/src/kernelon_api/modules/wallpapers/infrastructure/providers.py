"""Low-storage wallpaper providers: results are normalized in memory only."""

from __future__ import annotations

import asyncio
import html
import re
import time
from collections import OrderedDict
from typing import TYPE_CHECKING, Any, cast
from urllib.parse import quote

import httpx

from kernelon_api.modules.wallpapers.domain import WallpaperAsset

if TYPE_CHECKING:
    from collections.abc import Mapping, Sequence

ALLOWED_COMMONS_LICENSES = {"CC0", "CC BY", "CC BY-SA", "Public domain"}
WALLPAPER_REJECT_TERMS = {
    "briefing",
    "conference",
    "coverage",
    "experiment",
    "eating",
    "gorilla",
    "interview",
    "lecture",
    "presentation",
    "restoration",
    "speech",
    "tutorial",
    "wildlife",
}
WALLPAPER_REQUIRED_TERMS = {
    "aerial",
    "aurora",
    "cityscape",
    "cloud",
    "drone",
    "hyperlapse",
    "landscape",
    "night sky",
    "sunset",
    "time lapse",
    "timelapse",
    "waterfall",
}
PROVIDER_REQUEST_HEADERS = {
    "Accept": "application/json",
    "User-Agent": "KernelOn/0.1 (https://github.com/ccyang-aier/KernelOn; wallpaper-provider)",
}
PROVIDER_RETRYABLE_ERRORS = (
    httpx.ConnectError,
    httpx.ConnectTimeout,
    httpx.ReadError,
    httpx.RemoteProtocolError,
)


class BoundedProviderCache:
    def __init__(self, *, maximum: int = 5_000, ttl_seconds: int = 600) -> None:
        self.maximum = maximum
        self.ttl_seconds = ttl_seconds
        self._values: OrderedDict[str, tuple[float, list[WallpaperAsset]]] = OrderedDict()

    def get(self, key: str) -> list[WallpaperAsset] | None:
        item = self._values.get(key)
        if not item or item[0] <= time.monotonic():
            self._values.pop(key, None)
            return None
        self._values.move_to_end(key)
        return item[1]

    def put(self, key: str, values: list[WallpaperAsset]) -> None:
        self._values[key] = (time.monotonic() + self.ttl_seconds, values)
        self._values.move_to_end(key)
        while sum(len(value[1]) for value in self._values.values()) > self.maximum:
            self._values.popitem(last=False)


class HttpProvider:
    key = ""

    def __init__(self, client: httpx.AsyncClient | None = None) -> None:
        self._client = client
        self._cache = BoundedProviderCache()

    async def search(
        self, query: str, media_type: str, page: int, limit: int
    ) -> list[WallpaperAsset]:
        raise NotImplementedError

    async def get(self, external_id: str) -> WallpaperAsset | None:
        raise NotImplementedError

    async def _json(
        self,
        url: str,
        params: Mapping[
            str, str | int | float | bool | None | Sequence[str | int | float | bool | None]
        ]
        | None = None,
    ) -> dict[str, Any]:
        response: httpx.Response | None = None
        for attempt in range(3):
            try:
                if self._client is not None:
                    response = await self._client.get(
                        url,
                        params=params,
                        headers=PROVIDER_REQUEST_HEADERS,
                    )
                else:
                    async with httpx.AsyncClient(
                        headers=PROVIDER_REQUEST_HEADERS,
                        timeout=httpx.Timeout(12.0, connect=5.0),
                        follow_redirects=True,
                    ) as client:
                        response = await client.get(url, params=params)
                break
            except PROVIDER_RETRYABLE_ERRORS:
                if attempt == 2:
                    raise
                await asyncio.sleep(0.2 * (attempt + 1))
        if response is None:  # pragma: no cover - the loop either succeeds or raises
            raise httpx.ConnectError("Wallpaper provider did not return a response")
        response.raise_for_status()
        result = response.json()
        return cast("dict[str, Any]", result) if isinstance(result, dict) else {"items": result}


class WikimediaWallpaperProvider(HttpProvider):
    key = "wikimedia"
    api_url = "https://commons.wikimedia.org/w/api.php"

    async def search(
        self, query: str, media_type: str, page: int, limit: int
    ) -> list[WallpaperAsset]:
        cache_key = f"{query}:{media_type}:{page}:{limit}"
        if cached := self._cache.get(cache_key):
            return cached
        file_type = "video" if media_type in {"all", "video"} else "bitmap"
        file_filter = f"filetype:{file_type}" if file_type else ""
        search = f'incategory:"Featured media" {query or "timelapse"} {file_filter}'.strip()
        payload = await self._json(
            self.api_url,
            {
                "action": "query",
                "generator": "search",
                "gsrsearch": search,
                "gsrnamespace": 6,
                "gsroffset": max(0, (page - 1) * limit),
                "gsrlimit": limit,
                "prop": "imageinfo",
                "iiprop": "url|mime|size|extmetadata",
                "iiurlwidth": 640,
                "format": "json",
                "origin": "*",
            },
        )
        pages = payload.get("query", {}).get("pages", {})
        assets = [asset for value in pages.values() if (asset := self._map_page(value))]
        self._cache.put(cache_key, assets)
        return assets

    async def get(self, external_id: str) -> WallpaperAsset | None:
        payload = await self._json(
            self.api_url,
            {
                "action": "query",
                "pageids": external_id,
                "prop": "imageinfo",
                "iiprop": "url|mime|size|extmetadata",
                "iiurlwidth": 640,
                "format": "json",
                "origin": "*",
            },
        )
        page = payload.get("query", {}).get("pages", {}).get(str(external_id))
        return self._map_page(page) if page else None

    def _map_page(self, page: dict[str, Any]) -> WallpaperAsset | None:
        info = (page.get("imageinfo") or [{}])[0]
        metadata = info.get("extmetadata") or {}
        license_name = _metadata(metadata, "LicenseShortName")
        if not _is_allowed_commons_license(license_name):
            return None
        mime = str(info.get("mime") or "")
        kind = (
            "video" if mime.startswith("video/") else "image" if mime.startswith("image/") else ""
        )
        if not kind:
            return None
        width = int(info.get("width") or 0)
        height = int(info.get("height") or 0)
        title = str(page.get("title") or "").removeprefix("File:")
        normalized_title = title.casefold()
        if kind == "video" and (
            width < 1280
            or height < 720
            or not 1.5 <= width / max(height, 1) <= 2.5
            or any(term in normalized_title for term in WALLPAPER_REJECT_TERMS)
            or not any(term in normalized_title for term in WALLPAPER_REQUIRED_TERMS)
        ):
            return None
        url = str(info.get("url") or "")
        thumb = str(info.get("thumburl") or url)
        return WallpaperAsset(
            provider=self.key,
            external_id=str(page.get("pageid")),
            title=title,
            media_type=kind,  # type: ignore[arg-type]
            poster_url=thumb
            if kind == "image"
            else str(info.get("responsiveUrls", {}).get("2") or thumb),
            sources=({"url": url, "mimeType": mime, "quality": "source"},),
            source_page_url=str(
                info.get("descriptionurl")
                or f"https://commons.wikimedia.org/wiki/{quote(str(page.get('title') or ''))}"
            ),
            author=_plain(_metadata(metadata, "Artist")) or "Wikimedia Commons contributor",
            category="Other",
            width=width,
            height=height,
            size_bytes=int(info.get("size") or 0) or None,
            license_name=license_name,
            license_url=_metadata(metadata, "LicenseUrl"),
            attribution=_plain(_metadata(metadata, "Credit")) or f"{title} via Wikimedia Commons",
            can_import=True,
        )


class CoverrWallpaperProvider(HttpProvider):
    key = "coverr"

    def __init__(self, api_key: str | None, client: httpx.AsyncClient | None = None) -> None:
        super().__init__(client)
        self.api_key = api_key

    async def search(
        self, query: str, media_type: str, page: int, limit: int
    ) -> list[WallpaperAsset]:
        if not self.api_key or media_type == "image":
            return []
        payload = await self._json(
            "https://api.coverr.co/videos",
            {
                "query": query,
                "page": page - 1,
                "page_size": limit,
                "urls": "true",
                "api_key": self.api_key,
            },
        )
        return [asset for item in payload.get("hits", []) if (asset := self._map(item))]

    async def get(self, external_id: str) -> WallpaperAsset | None:
        if not self.api_key:
            return None
        return self._map(
            await self._json(
                f"https://api.coverr.co/videos/{quote(external_id, safe='')}",
                {"api_key": self.api_key},
            )
        )

    def _map(self, value: dict[str, Any]) -> WallpaperAsset | None:
        external_id = str(value.get("id") or "")
        urls = value.get("urls") or {}
        video_url = str(urls.get("mp4") or urls.get("mp4_preview") or "")
        if not external_id or not video_url:
            return None
        return WallpaperAsset(
            provider=self.key,
            external_id=external_id,
            title=str(value.get("title") or "Coverr video"),
            media_type="video",
            poster_url=str(value.get("poster") or value.get("thumbnail") or ""),
            sources=({"url": video_url, "mimeType": "video/mp4", "quality": "source"},),
            source_page_url=str(value.get("url") or "https://coverr.co/"),
            author=str(value.get("author") or "Coverr"),
            category="Other",
            duration_seconds=int(value.get("duration") or 0),
            license_name="Coverr License",
            license_url="https://coverr.co/license",
            attribution="Video via Coverr",
            can_import=False,
        )


async def gather_provider_results(
    providers: list[HttpProvider], query: str, media_type: str, page: int, limit: int
) -> tuple[list[WallpaperAsset], list[dict[str, str]]]:
    results = await asyncio.gather(
        *(provider.search(query, media_type, page, limit) for provider in providers),
        return_exceptions=True,
    )
    items: list[WallpaperAsset] = []
    errors: list[dict[str, str]] = []
    for provider, result in zip(providers, results, strict=True):
        if isinstance(result, BaseException):
            message = str(result).strip() or type(result).__name__
            errors.append({"provider": provider.key, "message": message})
        else:
            items.extend(result)
    items.sort(key=lambda item: (item.media_type != "video", item.provider, item.title))
    return items[:limit], errors


def _is_allowed_commons_license(value: str) -> bool:
    normalized = value.strip()
    return normalized in ALLOWED_COMMONS_LICENSES or normalized.startswith(("CC BY ", "CC BY-SA "))


def _metadata(metadata: dict[str, Any], name: str) -> str:
    value = metadata.get(name) or {}
    return str(value.get("value") or "")


def _plain(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html.unescape(value))).strip()
