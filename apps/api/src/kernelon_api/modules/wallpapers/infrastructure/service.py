"""SQLAlchemy-backed wallpaper service with bounded provider aggregation."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any
from urllib.parse import urlparse
from uuid import UUID, uuid4

import httpx
from sqlalchemy import delete, func, select

from kernelon_api.modules.organizations.infrastructure.models import MembershipModel
from kernelon_api.modules.wallpapers.infrastructure.models import (
    WallpaperAssetModel,
    WallpaperAssignmentModel,
    WallpaperFavoriteModel,
    WallpaperIngestJobModel,
    WallpaperSourceModel,
    WallpaperSourcePreferenceModel,
)
from kernelon_api.modules.wallpapers.infrastructure.providers import (
    CoverrWallpaperProvider,
    HttpProvider,
    WikimediaWallpaperProvider,
    gather_provider_results,
)
from kernelon_api.modules.wallpapers.infrastructure.storage import (
    LocalWallpaperStorage,
    S3WallpaperStorage,
    WallpaperStorage,
)
from kernelon_api.platform.application_errors import ApplicationError

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

    from kernelon_api.config import Settings
    from kernelon_api.modules.organizations.application.ports import OrganizationService

SOURCE_DEFINITIONS = {
    "system": {
        "name": "KernelOn 系统壁纸库",
        "description": "KernelOn 自有或已授权的静态与动态壁纸。",
        "mediaTypes": ["image", "video"],
        "system": True,
        "enabled": True,
    },
    "wikimedia": {
        "name": "Wikimedia Commons",
        "description": "仅展示允许再利用的 Public Domain、CC0、CC BY 与 CC BY-SA 媒体。",
        "mediaTypes": ["image", "video"],
        "system": True,
        "enabled": True,
    },
    "coverr": {
        "name": "Coverr",
        "description": "需要生产 API 套餐和壁纸场景授权, 未配置时保持禁用。",
        "mediaTypes": ["video"],
        "system": True,
        "enabled": False,
    },
}


class SQLAlchemyWallpaperService:
    def __init__(
        self,
        session: AsyncSession,
        settings: Settings,
        providers: dict[str, HttpProvider] | None = None,
        organization_service: OrganizationService | None = None,
    ) -> None:
        self.session = session
        self.settings = settings
        self.storage_adapter: WallpaperStorage
        if settings.wallpaper_storage_backend == "s3":
            self.storage_adapter = S3WallpaperStorage(
                str(settings.wallpaper_storage_path),
                settings.wallpaper_media_limit_bytes,
                settings.wallpaper_committed_limit_bytes,
            )
        else:
            self.storage_adapter = LocalWallpaperStorage(
                settings.wallpaper_storage_path,
                settings.wallpaper_media_limit_bytes,
                settings.wallpaper_committed_limit_bytes,
            )
        self.providers: dict[str, HttpProvider] = providers or {
            "wikimedia": WikimediaWallpaperProvider(),
            "coverr": CoverrWallpaperProvider(settings.wallpaper_coverr_api_key),
        }
        self.organization_service = organization_service

    async def _organization_id(self, user_id: UUID) -> UUID:
        organization_id = await self.session.scalar(
            select(MembershipModel.organization_id)
            .where(MembershipModel.user_id == user_id, MembershipModel.status == "active")
            .order_by(MembershipModel.joined_at)
            .limit(1)
        )
        if not organization_id:
            raise ApplicationError(
                "ORGANIZATION_REQUIRED", "An active organization is required.", 403
            )
        return organization_id

    async def _ensure_sources(self, organization_id: UUID) -> dict[str, WallpaperSourceModel]:
        rows = list(
            (
                await self.session.scalars(
                    select(WallpaperSourceModel).where(
                        WallpaperSourceModel.organization_id == organization_id
                    )
                )
            ).all()
        )
        by_provider = {row.provider: row for row in rows}
        for provider, definition in SOURCE_DEFINITIONS.items():
            if provider not in by_provider:
                row = WallpaperSourceModel(
                    organization_id=organization_id,
                    provider=provider,
                    enabled=bool(
                        definition["enabled"]
                        and (provider != "coverr" or self.settings.wallpaper_coverr_api_key)
                    ),
                )
                self.session.add(row)
                by_provider[provider] = row
        await self.session.commit()
        return by_provider

    async def search(
        self, user_id: UUID, query: str, media_type: str, page: int, limit: int
    ) -> dict[str, Any]:
        organization_id = await self._organization_id(user_id)
        sources = await self._ensure_sources(organization_id)
        preferences = {
            row.provider: row.visible
            for row in (
                await self.session.scalars(
                    select(WallpaperSourcePreferenceModel).where(
                        WallpaperSourcePreferenceModel.user_id == user_id
                    )
                )
            ).all()
        }
        providers = [
            provider
            for key, provider in self.providers.items()
            if sources[key].enabled and preferences.get(key, True)
        ]
        items, errors = await gather_provider_results(
            providers,
            query[:100],
            media_type if media_type in {"all", "image", "video"} else "all",
            max(1, page),
            min(max(1, limit), 50),
        )
        favorite_ids = set(
            (
                await self.session.execute(
                    select(WallpaperAssetModel.provider, WallpaperAssetModel.external_id)
                    .join(
                        WallpaperFavoriteModel,
                        WallpaperFavoriteModel.asset_id == WallpaperAssetModel.id,
                    )
                    .where(WallpaperFavoriteModel.user_id == user_id)
                )
            ).all()
        )
        values = []
        for item in items:
            value = item.to_dict()
            value["liked"] = (item.provider, item.external_id) in favorite_ids
            values.append(value)
        return {
            "items": values,
            "page": max(1, page),
            "providerErrors": errors,
            "persistedResults": False,
        }

    async def _provider_asset(self, asset_id: str) -> dict[str, Any]:
        provider_key, separator, external_id = asset_id.partition(":")
        provider = self.providers.get(provider_key)
        if not separator or not provider:
            raise ApplicationError("WALLPAPER_NOT_FOUND", "Wallpaper was not found.", 404)
        value = await provider.get(external_id)
        if not value:
            raise ApplicationError(
                "WALLPAPER_NOT_FOUND", "Wallpaper source no longer provides this asset.", 404
            )
        return value.to_dict()

    async def get_asset(self, user_id: UUID, asset_id: str) -> dict[str, Any]:
        organization_id = await self._organization_id(user_id)
        stored_provider, separator, external_id = asset_id.partition(":")
        if separator and stored_provider in {"upload", "import"}:
            try:
                upload_uuid = UUID(external_id)
            except ValueError as exc:
                raise ApplicationError(
                    "WALLPAPER_NOT_FOUND", "Wallpaper was not found.", 404
                ) from exc
            model = await self.session.scalar(
                select(WallpaperAssetModel).where(
                    WallpaperAssetModel.id == upload_uuid,
                    WallpaperAssetModel.organization_id == organization_id,
                    WallpaperAssetModel.deleted_at.is_(None),
                )
            )
            if not model:
                raise ApplicationError("WALLPAPER_NOT_FOUND", "Wallpaper was not found.", 404)
            return self._asset_dict(model)
        return await self._provider_asset(asset_id)

    async def import_asset(self, user_id: UUID, asset_id: str, confirm: bool) -> dict[str, Any]:
        canonical = await self._provider_asset(asset_id)
        if not canonical.get("canImport"):
            raise ApplicationError(
                "WALLPAPER_IMPORT_LICENSE_DENIED",
                "This wallpaper source does not allow KernelOn imports.",
                409,
            )
        sources = canonical.get("sources")
        source = sources[0] if isinstance(sources, list) and sources else None
        if not isinstance(source, dict) or not source.get("url"):
            raise ApplicationError(
                "WALLPAPER_IMPORT_UNAVAILABLE", "No importable media rendition is available.", 409
            )
        content_type = str(source.get("mimeType") or "application/octet-stream")
        if (
            canonical.get("mediaType") == "video"
            and self.settings.wallpaper_processing_mode == "passthrough"
            and content_type != "video/mp4"
        ):
            raise ApplicationError(
                "WALLPAPER_TRANSCODE_REQUIRED",
                "This video requires the production transcoding worker before import.",
                415,
            )
        estimated_bytes = min(int(canonical.get("sizeBytes") or 60 * 1024**2), 60 * 1024**2)
        preview: dict[str, Any] = {
            "assetId": asset_id,
            "licenseName": canonical.get("licenseName"),
            "licenseUrl": canonical.get("licenseUrl"),
            "attribution": canonical.get("attribution"),
            "estimatedBytes": estimated_bytes,
            "confirmed": confirm,
        }
        if not confirm:
            return preview

        usage = await self.storage(user_id)
        if usage["user"]["usedBytes"] + estimated_bytes > usage["user"]["limitBytes"]:
            raise ApplicationError(
                "WALLPAPER_USER_QUOTA_EXCEEDED", "Personal wallpaper quota would be exceeded.", 507
            )
        if (
            usage["organization"]["usedBytes"] + estimated_bytes
            > usage["organization"]["limitBytes"]
        ):
            raise ApplicationError(
                "WALLPAPER_ORG_QUOTA_EXCEEDED",
                "Organization wallpaper quota would be exceeded.",
                507,
            )
        organization_id = await self._organization_id(user_id)
        body = await _download_import(str(source["url"]), content_type)
        imported_id = uuid4()
        extension = _extension(content_type)
        key = f"imports/{organization_id}/{user_id}/{imported_id}/wallpaper.{extension}"
        storage_key, digest = self.storage_adapter.write(key, body)
        snapshot = {
            **canonical,
            "id": f"import:{imported_id}",
            "provider": "import",
            "externalId": str(imported_id),
            "sources": [
                {
                    "mediaPath": f"/wallpaper-media/{imported_id}",
                    "mimeType": content_type,
                    "quality": "stored",
                }
            ],
            "sizeBytes": len(body),
            "sha256": digest,
            "importedFrom": asset_id,
            "canImport": False,
        }
        self.session.add(
            WallpaperAssetModel(
                id=imported_id,
                organization_id=organization_id,
                owner_user_id=user_id,
                provider="import",
                external_id=str(imported_id),
                media_type=str(canonical["mediaType"]),
                title=str(canonical["title"]),
                storage_key=storage_key,
                size_bytes=len(body),
                snapshot=snapshot,
            )
        )
        await self.session.commit()
        return {**preview, "asset": snapshot}

    async def sources(self, user_id: UUID) -> list[dict[str, Any]]:
        organization_id = await self._organization_id(user_id)
        rows = await self._ensure_sources(organization_id)
        preferences = {
            row.provider: row.visible
            for row in (
                await self.session.scalars(
                    select(WallpaperSourcePreferenceModel).where(
                        WallpaperSourcePreferenceModel.user_id == user_id
                    )
                )
            ).all()
        }
        return [
            {
                "id": provider,
                **definition,
                "enabled": rows[provider].enabled,
                "visible": preferences.get(provider, True),
                "configured": provider != "coverr" or bool(self.settings.wallpaper_coverr_api_key),
                "delivery": "stored" if provider == "system" else "hotlink",
            }
            for provider, definition in SOURCE_DEFINITIONS.items()
        ]

    async def update_source(self, user_id: UUID, source_id: str, enabled: bool) -> dict[str, Any]:
        organization_id = await self._organization_id(user_id)
        if self.organization_service is None:
            raise ApplicationError(
                "WALLPAPER_SOURCE_ADMIN_UNAVAILABLE",
                "Organization authorization is unavailable.",
                503,
            )
        await self.organization_service.principal(user_id, organization_id, "organization.manage")
        rows = await self._ensure_sources(organization_id)
        row = rows.get(source_id)
        if not row:
            raise ApplicationError(
                "WALLPAPER_SOURCE_NOT_FOUND", "Wallpaper source was not found.", 404
            )
        if source_id == "coverr" and enabled and not self.settings.wallpaper_coverr_api_key:
            raise ApplicationError(
                "WALLPAPER_SOURCE_NOT_CONFIGURED", "Coverr API key and approval are required.", 409
            )
        row.enabled = enabled
        await self.session.commit()
        return {"id": source_id, "enabled": row.enabled}

    async def set_source_preference(
        self, user_id: UUID, source_id: str, visible: bool
    ) -> dict[str, Any]:
        if source_id not in SOURCE_DEFINITIONS:
            raise ApplicationError(
                "WALLPAPER_SOURCE_NOT_FOUND", "Wallpaper source was not found.", 404
            )
        row = await self.session.get(WallpaperSourcePreferenceModel, (user_id, source_id))
        if row:
            row.visible = visible
        else:
            self.session.add(
                WallpaperSourcePreferenceModel(user_id=user_id, provider=source_id, visible=visible)
            )
        await self.session.commit()
        return {"id": source_id, "visible": visible}

    async def _persist_snapshot(self, user_id: UUID, asset: dict[str, Any]) -> WallpaperAssetModel:
        organization_id = await self._organization_id(user_id)
        provider = str(asset.get("provider") or "")
        external_id = str(asset.get("externalId") or "")
        if provider not in self.providers or not external_id:
            raise ApplicationError("INVALID_WALLPAPER", "Wallpaper provider identity is invalid.")
        canonical = await self._provider_asset(f"{provider}:{external_id}")
        model = await self.session.scalar(
            select(WallpaperAssetModel).where(
                WallpaperAssetModel.organization_id == organization_id,
                WallpaperAssetModel.provider == provider,
                WallpaperAssetModel.external_id == external_id,
            )
        )
        if not model:
            model = WallpaperAssetModel(
                organization_id=organization_id,
                provider=provider,
                external_id=external_id,
                media_type=str(canonical["mediaType"]),
                title=str(canonical["title"]),
                snapshot=canonical,
            )
            self.session.add(model)
            await self.session.flush()
        else:
            model.snapshot = canonical
            model.updated_at = datetime.now(UTC)
        return model

    async def current(self, user_id: UUID) -> dict[str, Any] | None:
        assignment = await self.session.get(WallpaperAssignmentModel, user_id)
        if not assignment:
            return None
        model = await self.session.get(WallpaperAssetModel, assignment.asset_id)
        if not model or model.deleted_at:
            return None
        if model.provider in self.providers:
            try:
                return await self._provider_asset(f"{model.provider}:{model.external_id}")
            except ApplicationError:
                pass
        return self._asset_dict(model)

    async def apply(self, user_id: UUID, asset: dict[str, Any]) -> dict[str, Any]:
        if str(asset.get("id", "")).startswith(("upload:", "import:")):
            value = await self.get_asset(user_id, str(asset["id"]))
            model = await self.session.get(WallpaperAssetModel, UUID(str(value["externalId"])))
            if not model:
                raise ApplicationError("WALLPAPER_NOT_FOUND", "Wallpaper was not found.", 404)
        else:
            model = await self._persist_snapshot(user_id, asset)
            value = dict(model.snapshot)
        organization_id = await self._organization_id(user_id)
        assignment = await self.session.get(WallpaperAssignmentModel, user_id)
        if assignment:
            assignment.asset_id = model.id
            assignment.organization_id = organization_id
        else:
            self.session.add(
                WallpaperAssignmentModel(
                    user_id=user_id, organization_id=organization_id, asset_id=model.id
                )
            )
        await self.session.commit()
        return value

    async def favorite(self, user_id: UUID, asset: dict[str, Any], liked: bool) -> dict[str, Any]:
        if str(asset.get("id", "")).startswith(("upload:", "import:")):
            value = await self.get_asset(user_id, str(asset["id"]))
            model = await self.session.get(WallpaperAssetModel, UUID(str(value["externalId"])))
            if not model:
                raise ApplicationError("WALLPAPER_NOT_FOUND", "Wallpaper was not found.", 404)
        else:
            model = await self._persist_snapshot(user_id, asset)
        favorite = await self.session.get(WallpaperFavoriteModel, (user_id, model.id))
        if liked and not favorite:
            self.session.add(WallpaperFavoriteModel(user_id=user_id, asset_id=model.id))
        if not liked and favorite:
            await self.session.delete(favorite)
        await self.session.commit()
        return {"id": str(asset.get("id")), "liked": liked}

    async def storage(self, user_id: UUID) -> dict[str, Any]:
        organization_id = await self._organization_id(user_id)
        user_used = int(
            await self.session.scalar(
                select(func.coalesce(func.sum(WallpaperAssetModel.size_bytes), 0)).where(
                    WallpaperAssetModel.owner_user_id == user_id,
                )
            )
            or 0
        )
        org_used = int(
            await self.session.scalar(
                select(func.coalesce(func.sum(WallpaperAssetModel.size_bytes), 0)).where(
                    WallpaperAssetModel.organization_id == organization_id,
                )
            )
            or 0
        )
        platform_used = self.storage_adapter.usage()
        return {
            "user": {
                "usedBytes": user_used,
                "limitBytes": self.settings.wallpaper_user_quota_bytes,
            },
            "organization": {
                "usedBytes": org_used,
                "limitBytes": self.settings.wallpaper_org_quota_bytes,
            },
            "platform": {
                "usedBytes": platform_used,
                "limitBytes": self.settings.wallpaper_media_limit_bytes,
            },
            "temporaryLimitBytes": self.settings.wallpaper_temp_limit_bytes,
            "backend": self.settings.wallpaper_storage_backend,
            "processingMode": self.settings.wallpaper_processing_mode,
        }

    async def create_upload(self, user_id: UUID, values: dict[str, Any]) -> dict[str, Any]:
        organization_id = await self._organization_id(user_id)
        declared_size = int(values.get("sizeBytes") or 0)
        media_type = str(values.get("mediaType") or "")
        content_type = str(values.get("contentType") or "")
        maximum = 40 * 1024**2 if media_type == "image" else 150 * 1024**2
        if media_type not in {"image", "video"} or declared_size <= 0 or declared_size > maximum:
            raise ApplicationError(
                "INVALID_WALLPAPER_UPLOAD", "Wallpaper file size or media type is invalid.", 413
            )
        if (
            media_type == "video"
            and self.settings.wallpaper_processing_mode == "passthrough"
            and content_type != "video/mp4"
        ):
            raise ApplicationError(
                "WALLPAPER_TRANSCODE_REQUIRED",
                "Development passthrough mode accepts H.264 MP4 only.",
                415,
            )
        usage = await self.storage(user_id)
        estimated_final = min(declared_size, 60 * 1024**2)
        temporary_reserved = int(
            await self.session.scalar(
                select(func.coalesce(func.sum(WallpaperIngestJobModel.declared_size), 0)).where(
                    WallpaperIngestJobModel.status == "pending"
                )
            )
            or 0
        )
        if temporary_reserved + declared_size > self.settings.wallpaper_temp_limit_bytes:
            raise ApplicationError(
                "WALLPAPER_TEMP_QUOTA_EXCEEDED",
                "Wallpaper upload processing space is full.",
                507,
            )
        if usage["platform"]["usedBytes"] + estimated_final > min(
            usage["platform"]["limitBytes"], self.settings.wallpaper_committed_limit_bytes
        ):
            raise ApplicationError(
                "WALLPAPER_PLATFORM_QUOTA_EXCEEDED",
                "Wallpaper media storage is full.",
                507,
            )
        if usage["user"]["usedBytes"] + estimated_final > usage["user"]["limitBytes"]:
            raise ApplicationError(
                "WALLPAPER_USER_QUOTA_EXCEEDED",
                "The 100 MiB personal wallpaper quota would be exceeded.",
                507,
            )
        if (
            usage["organization"]["usedBytes"] + estimated_final
            > usage["organization"]["limitBytes"]
        ):
            raise ApplicationError(
                "WALLPAPER_ORG_QUOTA_EXCEEDED",
                "Organization wallpaper quota would be exceeded.",
                507,
            )
        job = WallpaperIngestJobModel(
            organization_id=organization_id,
            user_id=user_id,
            title=str(values.get("title") or "Untitled wallpaper")[:240],
            media_type=media_type,
            content_type=content_type,
            declared_size=declared_size,
            poster_url=str(values.get("posterUrl") or "")[:4096],
        )
        self.session.add(job)
        await self.session.commit()
        return {
            "id": str(job.id),
            "status": job.status,
            "uploadUrl": f"/wallpaper-uploads/{job.id}/content",
            "estimatedFinalBytes": estimated_final,
        }

    async def write_upload(self, user_id: UUID, upload_id: UUID, body: bytes) -> dict[str, Any]:
        job = await self.session.get(WallpaperIngestJobModel, upload_id)
        if not job or job.user_id != user_id:
            raise ApplicationError(
                "WALLPAPER_UPLOAD_NOT_FOUND", "Wallpaper upload was not found.", 404
            )
        if job.status != "pending":
            raise ApplicationError(
                "WALLPAPER_UPLOAD_ALREADY_COMPLETED", "Wallpaper upload is already completed.", 409
            )
        if len(body) != job.declared_size:
            raise ApplicationError(
                "WALLPAPER_UPLOAD_SIZE_MISMATCH", "Uploaded bytes do not match the declared size."
            )
        if job.media_type == "video" and not _looks_like_mp4(body):
            raise ApplicationError(
                "WALLPAPER_UNSUPPORTED_MEDIA",
                "Passthrough upload must be a valid MP4 container.",
                415,
            )
        if job.media_type == "image" and not _looks_like_image(body):
            raise ApplicationError(
                "WALLPAPER_UNSUPPORTED_MEDIA", "Unsupported wallpaper image.", 415
            )
        extension = _extension(job.content_type)
        key = f"uploads/{job.organization_id}/{user_id}/{job.id}/wallpaper.{extension}"
        storage_key, digest = self.storage_adapter.write(key, body)
        asset = WallpaperAssetModel(
            id=job.id,
            organization_id=job.organization_id,
            owner_user_id=user_id,
            provider="upload",
            external_id=str(job.id),
            media_type=job.media_type,
            title=job.title,
            storage_key=storage_key,
            size_bytes=len(body),
            snapshot={},
        )
        snapshot = {
            "id": f"upload:{job.id}",
            "provider": "upload",
            "externalId": str(job.id),
            "title": job.title,
            "mediaType": job.media_type,
            "posterUrl": (
                job.poster_url if job.media_type == "video" else f"/wallpaper-media/{job.id}"
            ),
            "sources": [
                {
                    "mediaPath": f"/wallpaper-media/{job.id}",
                    "mimeType": job.content_type,
                    "quality": "stored",
                }
            ],
            "sourcePageUrl": "",
            "author": "KernelOn user",
            "category": "Other",
            "tags": ["Upload"],
            "width": 0,
            "height": 0,
            "durationSeconds": 0,
            "likes": 0,
            "licenseName": "User supplied",
            "licenseUrl": "",
            "attribution": "User supplied",
            "canImport": False,
            "sizeBytes": len(body),
            "sha256": digest,
        }
        asset.snapshot = snapshot
        self.session.add(asset)
        job.status = "ready"
        job.storage_key = storage_key
        await self.session.commit()
        return snapshot

    async def delete_upload(self, user_id: UUID, upload_id: UUID) -> None:
        model = await self.session.get(WallpaperAssetModel, upload_id)
        if not model or model.owner_user_id != user_id:
            raise ApplicationError(
                "WALLPAPER_UPLOAD_NOT_FOUND", "Wallpaper upload was not found.", 404
            )
        assigned = await self.session.scalar(
            select(WallpaperAssignmentModel.user_id)
            .where(WallpaperAssignmentModel.asset_id == model.id)
            .limit(1)
        )
        if assigned:
            raise ApplicationError(
                "WALLPAPER_IN_USE", "Apply another wallpaper before deleting this upload.", 409
            )
        await self.session.execute(
            delete(WallpaperFavoriteModel).where(WallpaperFavoriteModel.asset_id == model.id)
        )
        model.deleted_at = datetime.now(UTC)
        model.status = "soft_deleted"
        await self.session.commit()

    async def media(self, user_id: UUID, asset_id: UUID) -> tuple[bytes, str]:
        organization_id = await self._organization_id(user_id)
        model = await self.session.scalar(
            select(WallpaperAssetModel).where(
                WallpaperAssetModel.id == asset_id,
                WallpaperAssetModel.organization_id == organization_id,
                WallpaperAssetModel.deleted_at.is_(None),
            )
        )
        if not model or not model.storage_key:
            raise ApplicationError(
                "WALLPAPER_MEDIA_NOT_FOUND", "Wallpaper media was not found.", 404
            )
        sources = model.snapshot.get("sources")
        first_source = sources[0] if isinstance(sources, list) and sources else {}
        content_type = (
            first_source.get("mimeType")
            if isinstance(first_source, dict)
            else "application/octet-stream"
        )
        return self.storage_adapter.read(model.storage_key), str(
            content_type or "application/octet-stream"
        )

    def _asset_dict(self, model: WallpaperAssetModel) -> dict[str, Any]:
        value = dict(model.snapshot)
        value["id"] = (
            f"{model.provider}:{model.id}"
            if model.provider in {"upload", "import"}
            else f"{model.provider}:{model.external_id}"
        )
        if model.storage_key and (media_url := self.storage_adapter.media_url(model.storage_key)):
            sources = value.get("sources")
            if isinstance(sources, list) and sources and isinstance(sources[0], dict):
                value["sources"] = [{**sources[0], "url": media_url, "mediaPath": None}]
        return value


def _looks_like_mp4(body: bytes) -> bool:
    return len(body) >= 12 and body[4:8] == b"ftyp"


def _looks_like_image(body: bytes) -> bool:
    return body.startswith((b"\xff\xd8\xff", b"\x89PNG\r\n\x1a\n", b"RIFF"))


def _extension(content_type: str) -> str:
    return {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "video/mp4": "mp4"}.get(
        content_type, "bin"
    )


async def _download_import(url: str, content_type: str) -> bytes:
    allowed_hosts = {"upload.wikimedia.org"}
    if urlparse(url).hostname not in allowed_hosts:
        raise ApplicationError("WALLPAPER_IMPORT_HOST_DENIED", "Import host is not allowed.", 409)
    chunks: list[bytes] = []
    total = 0
    async with (
        httpx.AsyncClient(timeout=30, follow_redirects=True) as client,
        client.stream("GET", url) as response,
    ):
        response.raise_for_status()
        if urlparse(str(response.url)).hostname not in allowed_hosts:
            raise ApplicationError(
                "WALLPAPER_IMPORT_HOST_DENIED", "Import redirect host is not allowed.", 409
            )
        async for chunk in response.aiter_bytes():
            total += len(chunk)
            if total > 60 * 1024**2:
                raise ApplicationError(
                    "WALLPAPER_IMPORT_TOO_LARGE", "Imported wallpaper exceeds 60 MiB.", 413
                )
            chunks.append(chunk)
    body = b"".join(chunks)
    if content_type == "video/mp4" and not _looks_like_mp4(body):
        raise ApplicationError("WALLPAPER_UNSUPPORTED_MEDIA", "Imported video is not MP4.", 415)
    if content_type.startswith("image/") and not _looks_like_image(body):
        raise ApplicationError("WALLPAPER_UNSUPPORTED_MEDIA", "Imported image is invalid.", 415)
    return body
