#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
WORK_ROOT=${KERNELON_WSL_WORK_ROOT:-/tmp/kernelon-wsl-validation}
CONDA_EXE=${CONDA_EXE:-$HOME/miniforge3/bin/conda}
CONDA_ENV=${CONDA_ENV:-v20}
POSTGRES_PORT=${KERNELON_POSTGRES_PORT:-5432}
API_PORT=${KERNELON_API_PORT:-8000}
LINUX_VENV=${UV_PROJECT_ENVIRONMENT:-/tmp/kernelon-api-v20}
PNPM_REGISTRY=${KERNELON_PNPM_REGISTRY:-https://registry.npmjs.org}
PIP_INDEX_URL=${KERNELON_PIP_INDEX_URL:-https://pypi.org/simple}
export KERNELON_POSTGRES_PORT=$POSTGRES_PORT
export KERNELON_API_PORT=$API_PORT
export KERNELON_DATABASE_URL="postgresql+psycopg://kernelon:kernelon@127.0.0.1:${POSTGRES_PORT}/kernelon"
export KERNELON_TEST_DATABASE_URL=$KERNELON_DATABASE_URL
export UV_PROJECT_ENVIRONMENT=$LINUX_VENV

if ! grep -qi microsoft /proc/version; then
  echo "This script must run inside WSL2." >&2
  exit 1
fi
if [ ! -x "$CONDA_EXE" ]; then
  echo "Conda executable not found: $CONDA_EXE" >&2
  exit 1
fi
if ! "$CONDA_EXE" run -n "$CONDA_ENV" python -c 'import sys; raise SystemExit(sys.version_info[:2] != (3, 12))'; then
  echo "Conda environment '$CONDA_ENV' must use Python 3.12.x." >&2
  exit 1
fi
if ! "$CONDA_EXE" run -n "$CONDA_ENV" uv --version >/dev/null 2>&1; then
  echo "uv is missing in '$CONDA_ENV'. Install it explicitly with:" >&2
  echo "  $CONDA_EXE run -n $CONDA_ENV python -m pip install uv==0.11.28" >&2
  exit 1
fi
if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  echo "Docker Engine and Compose are required inside WSL2." >&2
  exit 1
fi
if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required. Enable the repository version with Corepack first." >&2
  exit 1
fi
if ! command -v rsync >/dev/null 2>&1; then
  echo "rsync is required to create an isolated Linux workspace." >&2
  exit 1
fi

mkdir -p "$WORK_ROOT"
rsync --archive --delete \
  --exclude .git \
  --exclude .next \
  --exclude .venv \
  --exclude node_modules \
  --exclude dist \
  --exclude target \
  --exclude coverage \
  --exclude .pytest_cache \
  --exclude .ruff_cache \
  --exclude .mypy_cache \
  "$REPO_ROOT/" "$WORK_ROOT/"

cd "$WORK_ROOT"
docker compose up --detach postgres
for _ in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U kernelon -d kernelon >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
docker compose exec -T postgres pg_isready -U kernelon -d kernelon

pnpm install --frozen-lockfile --registry "$PNPM_REGISTRY"
"$CONDA_EXE" run -n "$CONDA_ENV" uv sync --project apps/api --locked
"$CONDA_EXE" run -n "$CONDA_ENV" uv run --project apps/api litestar --app kernelon_api.asgi:app database upgrade --no-prompt
"$CONDA_EXE" run -n "$CONDA_ENV" uv run --project apps/api litestar --app kernelon_api.asgi:app database heads
"$CONDA_EXE" run -n "$CONDA_ENV" pnpm check
docker build --build-arg PIP_INDEX_URL="$PIP_INDEX_URL" --tag kernelon-api:wsl apps/api
test "$(docker run --rm --entrypoint id kernelon-api:wsl -u)" != "0"
docker compose build --build-arg PIP_INDEX_URL="$PIP_INDEX_URL" api
docker compose up --detach --no-build api
for _ in $(seq 1 30); do
  if curl --fail --silent "http://127.0.0.1:${API_PORT}/health/ready" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
curl --fail --show-error "http://127.0.0.1:${API_PORT}/health/ready"

echo "WSL2 validation completed with Conda environment '$CONDA_ENV'."
