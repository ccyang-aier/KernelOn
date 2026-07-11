"""Configuration contract tests."""

import pytest

from kernelon_api.config import Settings


def test_production_rejects_wildcards() -> None:
    settings = Settings(
        environment="production", allowed_origins=["*"], allowed_hosts=["localhost"]
    )

    with pytest.raises(ValueError, match="wildcard"):
        settings.validate_production_safety()


def test_development_accepts_local_origins() -> None:
    settings = Settings(environment="development")

    settings.validate_production_safety()

    assert settings.sqlalchemy_url.startswith("postgresql+psycopg://")
