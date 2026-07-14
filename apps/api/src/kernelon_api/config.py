"""Validated application configuration."""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

API_ROOT = Path(os.environ.get("KERNELON_API_ROOT", Path(__file__).resolve().parents[2])).resolve()


class Settings(BaseSettings):
    """KernelOn API settings loaded from environment variables and ``.env``."""

    model_config = SettingsConfigDict(
        env_file=API_ROOT / ".env",
        env_prefix="KERNELON_",
        case_sensitive=False,
        extra="ignore",
    )

    environment: Literal["development", "test", "production"] = "development"
    database_url: PostgresDsn = PostgresDsn(
        "postgresql+psycopg://kernelon:kernelon@127.0.0.1:5432/kernelon"
    )
    host: str = "127.0.0.1"
    port: int = Field(default=8000, ge=1, le=65535)
    allowed_origins: list[str] = Field(
        default_factory=lambda: [
            "http://127.0.0.1:3000",
            "http://localhost:3000",
            "http://127.0.0.1:3002",
            "http://localhost:3002",
            "http://tauri.localhost",
            "tauri://localhost",
        ]
    )
    allowed_hosts: list[str] = Field(
        default_factory=lambda: [
            "127.0.0.1",
            "127.0.0.1:8000",
            "localhost",
            "localhost:8000",
        ]
    )
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    openapi_enabled: bool = True
    request_max_body_size: int = Field(default=10 * 1024 * 1024, ge=1024)
    jwt_secret: str = "development-only-change-me-at-least-32-bytes"  # noqa: S105
    jwt_issuer: str = "kernelon-api"
    jwt_audience: str = "kernelon-clients"
    access_token_minutes: int = Field(default=15, ge=1, le=1440)
    refresh_token_days: int = Field(default=30, ge=1, le=365)
    wallpaper_storage_backend: Literal["local", "s3"] = "local"
    wallpaper_storage_path: Path = API_ROOT.parent.parent / ".kernelon-data" / "wallpapers"
    wallpaper_media_limit_bytes: int = Field(default=1024**3, ge=1024**2)
    wallpaper_committed_limit_bytes: int = Field(default=700 * 1024**2, ge=1024**2)
    wallpaper_temp_limit_bytes: int = Field(default=300 * 1024**2, ge=1024**2)
    wallpaper_org_quota_bytes: int = Field(default=500 * 1024**2, ge=1024**2)
    wallpaper_user_quota_bytes: int = Field(default=100 * 1024**2, ge=1024**2)
    wallpaper_system_reserve_bytes: int = Field(default=200 * 1024**2, ge=0)
    wallpaper_processing_mode: Literal["passthrough", "transcode"] = "passthrough"
    wallpaper_coverr_api_key: str | None = None

    @field_validator("allowed_origins", "allowed_hosts")
    @classmethod
    def reject_wildcard_in_production(cls, value: list[str], info: object) -> list[str]:
        """Reject wildcard lists later in the model-level production check."""
        if not value:
            raise ValueError("at least one value is required")
        return value

    def validate_production_safety(self) -> None:
        """Fail fast when a production configuration uses unsafe wildcards."""
        if self.environment == "production" and (
            "*" in self.allowed_origins or "*" in self.allowed_hosts
        ):
            raise ValueError("wildcard origins and hosts are not allowed in production")
        if self.environment == "production" and len(self.jwt_secret.encode()) < 32:
            raise ValueError("jwt_secret must contain at least 32 bytes in production")
        if self.wallpaper_committed_limit_bytes + self.wallpaper_temp_limit_bytes > self.wallpaper_media_limit_bytes:
            raise ValueError("wallpaper committed and temporary limits exceed the media limit")
        if self.environment == "production" and self.wallpaper_storage_backend != "s3":
            raise ValueError("production wallpaper storage must use the s3 backend")

    @property
    def sqlalchemy_url(self) -> str:
        """Return the database URL without exposing it in logs."""
        return str(self.database_url)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the process-wide validated settings instance."""
    settings = Settings()
    settings.validate_production_safety()
    return settings
