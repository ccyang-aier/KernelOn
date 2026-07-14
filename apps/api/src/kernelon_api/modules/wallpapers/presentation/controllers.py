"""Wallpaper REST endpoints."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from litestar import Controller, Request, Response, delete, get, patch, post, put
from litestar.di import NamedDependency
from pydantic import BaseModel, ConfigDict, Field

from kernelon_api.modules.identity.application.ports import IdentityService
from kernelon_api.modules.wallpapers.application import WallpaperService


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class AssetRequest(StrictModel):
    asset: dict[str, Any]


class ToggleRequest(StrictModel):
    enabled: bool


class VisibilityRequest(StrictModel):
    visible: bool


class UploadRequest(StrictModel):
    title: str = Field(min_length=1, max_length=240)
    media_type: str = Field(alias="mediaType")
    content_type: str = Field(alias="contentType")
    size_bytes: int = Field(alias="sizeBytes", gt=0)
    poster_url: str = Field(default="", alias="posterUrl", max_length=4096)


async def _user(request: Request[Any, Any, Any], identity: IdentityService) -> UUID:
    return await identity.authenticate(request.headers.get("Authorization"))


class WallpaperController(Controller):
    path = ""
    tags = ("wallpapers",)

    @get("/wallpapers", operation_id="wallpapers_search")
    async def search(self, request: Request[Any, Any, Any], identity_service: NamedDependency[IdentityService], wallpaper_service: NamedDependency[WallpaperService], q: str = "", media_type: str = "all", page: int = 1, limit: int = 24) -> dict[str, Any]:
        return await wallpaper_service.search(await _user(request, identity_service), q, media_type, page, limit)

    @get("/wallpapers/{asset_id:str}", operation_id="wallpapers_get")
    async def get_asset(self, asset_id: str, request: Request[Any, Any, Any], identity_service: NamedDependency[IdentityService], wallpaper_service: NamedDependency[WallpaperService]) -> dict[str, Any]:
        return await wallpaper_service.get_asset(await _user(request, identity_service), asset_id)

    @get("/wallpaper-sources", operation_id="wallpaper_sources_list")
    async def sources(self, request: Request[Any, Any, Any], identity_service: NamedDependency[IdentityService], wallpaper_service: NamedDependency[WallpaperService]) -> list[dict[str, Any]]:
        return await wallpaper_service.sources(await _user(request, identity_service))

    @patch("/wallpaper-sources/{source_id:str}", operation_id="wallpaper_sources_update")
    async def update_source(self, source_id: str, data: ToggleRequest, request: Request[Any, Any, Any], identity_service: NamedDependency[IdentityService], wallpaper_service: NamedDependency[WallpaperService]) -> dict[str, Any]:
        return await wallpaper_service.update_source(await _user(request, identity_service), source_id, data.enabled)

    @patch("/me/wallpaper-source-preferences/{source_id:str}", operation_id="wallpaper_source_preference_update")
    async def preference(self, source_id: str, data: VisibilityRequest, request: Request[Any, Any, Any], identity_service: NamedDependency[IdentityService], wallpaper_service: NamedDependency[WallpaperService]) -> dict[str, Any]:
        return await wallpaper_service.set_source_preference(await _user(request, identity_service), source_id, data.visible)

    @get("/me/wallpaper", operation_id="wallpaper_current_get")
    async def current(self, request: Request[Any, Any, Any], identity_service: NamedDependency[IdentityService], wallpaper_service: NamedDependency[WallpaperService]) -> dict[str, Any] | None:
        return await wallpaper_service.current(await _user(request, identity_service))

    @put("/me/wallpaper", operation_id="wallpaper_current_apply")
    async def apply(self, data: AssetRequest, request: Request[Any, Any, Any], identity_service: NamedDependency[IdentityService], wallpaper_service: NamedDependency[WallpaperService]) -> dict[str, Any]:
        return await wallpaper_service.apply(await _user(request, identity_service), data.asset)

    @put("/wallpapers/{asset_id:str}/favorite", operation_id="wallpaper_favorite_set")
    async def favorite(self, asset_id: str, data: AssetRequest, request: Request[Any, Any, Any], identity_service: NamedDependency[IdentityService], wallpaper_service: NamedDependency[WallpaperService]) -> dict[str, Any]:
        data.asset["id"] = asset_id
        return await wallpaper_service.favorite(await _user(request, identity_service), data.asset, True)

    @delete("/wallpapers/{asset_id:str}/favorite", operation_id="wallpaper_favorite_delete", status_code=200)
    async def unfavorite(self, asset_id: str, data: AssetRequest, request: Request[Any, Any, Any], identity_service: NamedDependency[IdentityService], wallpaper_service: NamedDependency[WallpaperService]) -> dict[str, Any]:
        data.asset["id"] = asset_id
        return await wallpaper_service.favorite(await _user(request, identity_service), data.asset, False)

    @get("/me/wallpaper-storage", operation_id="wallpaper_storage_get")
    async def storage(self, request: Request[Any, Any, Any], identity_service: NamedDependency[IdentityService], wallpaper_service: NamedDependency[WallpaperService]) -> dict[str, Any]:
        return await wallpaper_service.storage(await _user(request, identity_service))

    @post("/wallpaper-uploads", operation_id="wallpaper_upload_create")
    async def create_upload(self, data: UploadRequest, request: Request[Any, Any, Any], identity_service: NamedDependency[IdentityService], wallpaper_service: NamedDependency[WallpaperService]) -> dict[str, Any]:
        return await wallpaper_service.create_upload(await _user(request, identity_service), data.model_dump(by_alias=True))

    @put("/wallpaper-uploads/{upload_id:uuid}/content", operation_id="wallpaper_upload_content")
    async def upload_content(self, upload_id: UUID, request: Request[Any, Any, Any], identity_service: NamedDependency[IdentityService], wallpaper_service: NamedDependency[WallpaperService]) -> dict[str, Any]:
        return await wallpaper_service.write_upload(await _user(request, identity_service), upload_id, await request.body())

    @delete("/wallpaper-uploads/{upload_id:uuid}", operation_id="wallpaper_upload_delete", status_code=204)
    async def delete_upload(self, upload_id: UUID, request: Request[Any, Any, Any], identity_service: NamedDependency[IdentityService], wallpaper_service: NamedDependency[WallpaperService]) -> None:
        await wallpaper_service.delete_upload(await _user(request, identity_service), upload_id)

    @get("/wallpaper-media/{asset_id:uuid}", operation_id="wallpaper_media_get")
    async def media(self, asset_id: UUID, request: Request[Any, Any, Any], identity_service: NamedDependency[IdentityService], wallpaper_service: NamedDependency[WallpaperService]) -> Response[bytes]:
        body, content_type = await wallpaper_service.media(await _user(request, identity_service), asset_id)  # type: ignore[attr-defined]
        start, end = _range(request.headers.get("range"), len(body))
        status = 206 if start != 0 or end != len(body) - 1 else 200
        headers = {"Accept-Ranges": "bytes", "Content-Length": str(end - start + 1), "Cache-Control": "private, max-age=3600"}
        if status == 206:
            headers["Content-Range"] = f"bytes {start}-{end}/{len(body)}"
        return Response(content=body[start : end + 1], media_type=content_type, headers=headers, status_code=status)


def _range(value: str | None, total: int) -> tuple[int, int]:
    if not value or not value.startswith("bytes="):
        return 0, total - 1
    start_value, _, end_value = value.removeprefix("bytes=").partition("-")
    start = int(start_value or 0)
    end = min(int(end_value) if end_value else total - 1, total - 1)
    return max(0, start), max(start, end)
