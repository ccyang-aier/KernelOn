"""Stable HTTP DTOs for the implemented Mineradio compatibility slice."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from pydantic import BaseModel, ConfigDict, Field

if TYPE_CHECKING:
    from kernelon_api.modules.music.domain import (
        BeatMapCacheStatus,
        MusicAppInfo,
        MusicDiscoverHome,
    )


class StrictResponseModel(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class MusicCookieImportRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    cookie: Any = ""
    data: Any = ""
    text: Any = ""

    @property
    def raw_cookie(self) -> Any:
        return self.cookie or self.data or self.text or ""


class MusicSongLikeRequest(BaseModel):
    id: str | int = ""
    like: bool = True


class MusicPlaylistCreateRequest(BaseModel):
    name: str = ""
    privacy: str | int = "0"


class MusicPlaylistAddSongRequest(BaseModel):
    pid: str | int = ""
    id: str | int = ""
    ids: str | int = ""


class MusicUpdateResponse(StrictResponseModel):
    provider: str
    configured: bool
    owner: str
    repo: str
    preview: bool
    manifest_override: bool = Field(alias="manifestOverride")


class MusicAppVersionResponse(StrictResponseModel):
    name: str
    product_name: str = Field(alias="productName")
    version: str
    update: MusicUpdateResponse

    @classmethod
    def from_domain(cls, value: MusicAppInfo) -> MusicAppVersionResponse:
        return cls(
            name=value.name,
            product_name=value.product_name,
            version=value.version,
            update=MusicUpdateResponse(
                provider=value.update.provider,
                configured=value.update.configured,
                owner=value.update.owner,
                repo=value.update.repo,
                preview=value.update.preview,
                manifest_override=value.update.manifest_override,
            ),
        )


class BeatMapCacheStatusResponse(StrictResponseModel):
    enabled: bool
    directory: str = Field(alias="dir")
    drive: str
    reason: str
    mode: str

    @classmethod
    def from_domain(cls, value: BeatMapCacheStatus) -> BeatMapCacheStatusResponse:
        return cls(
            enabled=value.enabled,
            directory=value.directory,
            drive=value.drive,
            reason=value.reason,
            mode=value.mode,
        )


class MusicDiscoverHomeResponse(StrictResponseModel):
    logged_in: bool = Field(alias="loggedIn")
    user: dict[str, Any] | None
    daily_songs: list[dict[str, Any]] = Field(alias="dailySongs")
    playlists: list[dict[str, Any]]
    podcasts: list[dict[str, Any]]
    mode: str | None = None
    updated_at: int = Field(alias="updatedAt")

    @classmethod
    def from_domain(cls, value: MusicDiscoverHome) -> MusicDiscoverHomeResponse:
        return cls(
            logged_in=value.logged_in,
            user=dict(value.user) if value.user is not None else None,
            daily_songs=[dict(item) for item in value.daily_songs],
            playlists=[dict(item) for item in value.playlists],
            podcasts=[dict(item) for item in value.podcasts],
            mode=value.mode,
            updated_at=value.updated_at,
        )
