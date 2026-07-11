"""System endpoint tests."""

import os
from collections.abc import AsyncIterator

import pytest
from litestar import Litestar
from litestar.testing import AsyncTestClient

from kernelon_api.asgi import create_app
from kernelon_api.config import Settings


@pytest.fixture
async def client() -> AsyncIterator[AsyncTestClient[Litestar]]:
    settings = Settings(
        environment="test",
        database_url="postgresql+psycopg://kernelon:kernelon@127.0.0.1:1/kernelon",
        openapi_enabled=True,
        allowed_hosts=["testserver.local"],
    )
    async with AsyncTestClient(app=create_app(settings)) as test_client:
        yield test_client


async def test_liveness_does_not_require_database(
    client: AsyncTestClient[Litestar],
) -> None:
    response = await client.get("/health/live", headers={"X-Request-ID": "test-request-1"})

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.headers["X-Request-ID"] == "test-request-1"


async def test_readiness_returns_503_when_database_is_unavailable(
    client: AsyncTestClient[Litestar],
) -> None:
    response = await client.get("/health/ready")

    assert response.status_code == 503
    assert response.json() == {
        "status": "unavailable",
        "service": "kernelon-api",
        "version": "0.1.0",
        "checks": {"database": "unavailable"},
    }


async def test_unknown_route_uses_problem_details(
    client: AsyncTestClient[Litestar],
) -> None:
    response = await client.get("/does-not-exist", headers={"X-Request-ID": "problem-test"})

    assert response.status_code == 404
    assert response.headers["content-type"].startswith("application/problem+json")
    assert response.json()["requestId"] == "problem-test"


async def test_openapi_is_available_in_test_environment(
    client: AsyncTestClient[Litestar],
) -> None:
    response = await client.get("/schema/openapi.json")

    assert response.status_code == 200
    document = response.json()
    assert document["openapi"].startswith("3.1")
    assert document["paths"]["/health/live"]["get"]["operationId"] == "system_liveness"


@pytest.mark.integration
async def test_readiness_succeeds_with_postgres() -> None:
    database_url = os.getenv("KERNELON_TEST_DATABASE_URL")
    if not database_url:
        pytest.skip("KERNELON_TEST_DATABASE_URL is not configured")
    settings = Settings(
        environment="test",
        database_url=database_url,
        openapi_enabled=False,
        allowed_hosts=["testserver.local"],
    )
    async with AsyncTestClient(app=create_app(settings)) as test_client:
        response = await test_client.get("/health/ready")

    assert response.status_code == 200
    assert response.json()["checks"] == {"database": "ok"}
