"""Quota-aware local wallpaper storage."""

from __future__ import annotations

import hashlib
from pathlib import Path  # noqa: TC003 - used to resolve and constrain runtime paths

from kernelon_api.platform.application_errors import ApplicationError


class LocalWallpaperStorage:
    def __init__(self, root: Path, media_limit: int, committed_limit: int) -> None:
        self.root = root.resolve()
        self.media_limit = media_limit
        self.committed_limit = committed_limit

    def usage(self) -> int:
        if not self.root.exists():
            return 0
        return sum(path.stat().st_size for path in self.root.rglob("*") if path.is_file())

    def write(self, key: str, body: bytes) -> tuple[str, str]:
        if self.usage() + len(body) > min(self.media_limit, self.committed_limit):
            raise ApplicationError(
                "WALLPAPER_STORAGE_FULL", "Wallpaper storage quota exceeded.", 507
            )
        target = (self.root / key).resolve()
        if self.root not in target.parents:
            raise ApplicationError("INVALID_STORAGE_KEY", "Invalid wallpaper storage key.")
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(body)
        return str(target.relative_to(self.root)).replace("\\", "/"), hashlib.sha256(
            body
        ).hexdigest()

    def read(self, key: str) -> bytes:
        target = (self.root / key).resolve()
        if self.root not in target.parents or not target.is_file():
            raise ApplicationError(
                "WALLPAPER_MEDIA_NOT_FOUND", "Wallpaper media was not found.", 404
            )
        return target.read_bytes()

    def delete(self, key: str) -> None:
        target = (self.root / key).resolve()
        if self.root in target.parents:
            target.unlink(missing_ok=True)
