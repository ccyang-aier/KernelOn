# syntax=docker/dockerfile:1.7
FROM ghcr.io/astral-sh/uv:0.11.28 AS uv

FROM python:3.12-slim-bookworm@sha256:8a7e7cc04fd3e2bd787f7f24e22d5d119aa590d429b50c95dfe12b3abe52f48b AS builder
COPY --from=uv /uv /uvx /bin/
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy
WORKDIR /app
COPY pyproject.toml uv.lock README.md ./
COPY src ./src
RUN uv sync --locked --no-dev --no-editable

FROM python:3.12-slim-bookworm@sha256:8a7e7cc04fd3e2bd787f7f24e22d5d119aa590d429b50c95dfe12b3abe52f48b AS runtime
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app
RUN addgroup --system kernelon && adduser --system --ingroup kernelon kernelon
COPY --from=builder --chown=kernelon:kernelon /app/.venv /app/.venv
COPY --chown=kernelon:kernelon src ./src
COPY --chown=kernelon:kernelon migrations ./migrations
COPY --chown=kernelon:kernelon alembic.ini docker-entrypoint.sh ./
RUN chmod +x /app/docker-entrypoint.sh
USER kernelon
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health/live', timeout=3)"]
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["litestar", "--app", "kernelon_api.asgi:app", "run", "--host", "0.0.0.0", "--port", "8000"]
