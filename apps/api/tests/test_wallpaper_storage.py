from __future__ import annotations

from typing import TYPE_CHECKING

import pytest

from kernelon_api.config import Settings
from kernelon_api.modules.wallpapers.infrastructure.storage import LocalWallpaperStorage
from kernelon_api.platform.application_errors import ApplicationError

if TYPE_CHECKING:
    from pathlib import Path


def test_local_storage_grows_on_demand_and_enforces_hard_limit(tmp_path: Path) -> None:
    root = tmp_path / "wallpapers"
    storage = LocalWallpaperStorage(root, media_limit=5, committed_limit=5)
    assert not root.exists()
    key, digest = storage.write("uploads/org/user/item.bin", b"12345")
    assert storage.read(key) == b"12345"
    assert len(digest) == 64
    with pytest.raises(ApplicationError, match="quota"):
        storage.write("uploads/org/user/overflow.bin", b"1")


def test_production_wallpaper_defaults_use_hard_budget_without_preallocation() -> None:
    settings = Settings(
        environment="production",
        wallpaper_storage_backend="s3",
        jwt_secret="x" * 32,
    )
    assert settings.wallpaper_media_limit_bytes == 50 * 1024**3
    assert settings.wallpaper_committed_limit_bytes == 45 * 1024**3
    assert settings.wallpaper_temp_limit_bytes == 5 * 1024**3
    assert settings.wallpaper_user_quota_bytes == 100 * 1024**2
