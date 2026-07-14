"""Provider-neutral wallpaper values."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Literal

MediaKind = Literal["image", "video"]


@dataclass(frozen=True, slots=True)
class WallpaperAsset:
    provider: str
    external_id: str
    title: str
    media_type: MediaKind
    poster_url: str
    sources: tuple[dict[str, object], ...]
    source_page_url: str
    author: str = "Unknown"
    category: str = "Other"
    tags: tuple[str, ...] = ()
    width: int = 0
    height: int = 0
    duration_seconds: int = 0
    likes: int = 0
    license_name: str = "Unknown"
    license_url: str = ""
    attribution: str = ""
    can_import: bool = False
    size_bytes: int | None = None
    id: str = field(init=False)

    def __post_init__(self) -> None:
        object.__setattr__(self, "id", f"{self.provider}:{self.external_id}")

    def to_dict(self) -> dict[str, object]:
        value = asdict(self)
        value.update(
            {
                "externalId": value.pop("external_id"),
                "mediaType": value.pop("media_type"),
                "posterUrl": value.pop("poster_url"),
                "sourcePageUrl": value.pop("source_page_url"),
                "durationSeconds": value.pop("duration_seconds"),
                "licenseName": value.pop("license_name"),
                "licenseUrl": value.pop("license_url"),
                "canImport": value.pop("can_import"),
                "sizeBytes": value.pop("size_bytes"),
            }
        )
        return value
