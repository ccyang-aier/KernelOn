"""Quota-aware local wallpaper storage."""

from __future__ import annotations

import hashlib
from pathlib import Path  # noqa: TC003 - used to resolve and constrain runtime paths
from typing import Any, Protocol

import boto3  # type: ignore[import-untyped]

from kernelon_api.platform.application_errors import ApplicationError


class WallpaperStorage(Protocol):
    def usage(self) -> int: ...
    def write(self, key: str, body: bytes) -> tuple[str, str]: ...
    def read(self, key: str) -> bytes: ...
    def delete(self, key: str) -> None: ...
    def media_url(self, key: str) -> str | None: ...


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

    def media_url(self, key: str) -> str | None:
        return None


class S3WallpaperStorage:
    """S3-compatible storage using the standard AWS credential and endpoint chain."""

    def __init__(self, bucket: str, media_limit: int, committed_limit: int) -> None:
        if not bucket or "/" in bucket or "\\" in bucket:
            raise ValueError("wallpaper S3 storage path must be a bucket name")
        self.bucket = bucket
        self.media_limit = media_limit
        self.committed_limit = committed_limit
        self.client: Any = boto3.client("s3")

    def usage(self) -> int:
        total = 0
        continuation: str | None = None
        while True:
            values: dict[str, Any] = {"Bucket": self.bucket}
            if continuation:
                values["ContinuationToken"] = continuation
            response = self.client.list_objects_v2(**values)
            total += sum(int(item.get("Size") or 0) for item in response.get("Contents", []))
            if not response.get("IsTruncated"):
                return total
            continuation = str(response["NextContinuationToken"])

    def write(self, key: str, body: bytes) -> tuple[str, str]:
        if key.startswith("/") or ".." in key.split("/"):
            raise ApplicationError("INVALID_STORAGE_KEY", "Invalid wallpaper storage key.")
        if self.usage() + len(body) > min(self.media_limit, self.committed_limit):
            raise ApplicationError(
                "WALLPAPER_STORAGE_FULL", "Wallpaper storage quota exceeded.", 507
            )
        self.client.put_object(Bucket=self.bucket, Key=key, Body=body)
        return key, hashlib.sha256(body).hexdigest()

    def read(self, key: str) -> bytes:
        response = self.client.get_object(Bucket=self.bucket, Key=key)
        return bytes(response["Body"].read())

    def delete(self, key: str) -> None:
        self.client.delete_object(Bucket=self.bucket, Key=key)

    def media_url(self, key: str) -> str:
        return str(
            self.client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": key},
                ExpiresIn=3600,
            )
        )
