#!/usr/bin/env bash
set -euo pipefail

MODE=${1:-}
PORT=${2:-8000}
REPO_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
CONDA_EXE=${CONDA_EXE:-/home/miniforge3/bin/conda}
CONDA_ENV=${CONDA_ENV:-v20}
LINUX_VENV=${UV_PROJECT_ENVIRONMENT:-/tmp/kernelon-api-v20}

if [[ ! -x "$CONDA_EXE" ]]; then
  CONDA_EXE="$HOME/miniforge3/bin/conda"
fi
if [[ ! -x "$CONDA_EXE" ]]; then
  echo "Conda executable not found. Set CONDA_EXE to the WSL2 Conda binary." >&2
  exit 1
fi

export UV_PROJECT_ENVIRONMENT="$LINUX_VENV"
POSTGRES_PORT=${KERNELON_POSTGRES_PORT:-5433}
export KERNELON_POSTGRES_PORT="$POSTGRES_PORT"
export KERNELON_DATABASE_URL=${KERNELON_DATABASE_URL:-postgresql+psycopg://kernelon:kernelon@127.0.0.1:${POSTGRES_PORT}/kernelon}

cd "$REPO_ROOT"

case "$MODE" in
  prepare)
    docker compose up --detach postgres
    "$CONDA_EXE" run -n "$CONDA_ENV" uv sync --project apps/api --locked
    "$CONDA_EXE" run -n "$CONDA_ENV" uv run --project apps/api \
      litestar --app kernelon_api.asgi:app database upgrade --no-prompt
    ;;
  serve)
    exec "$CONDA_EXE" run -n "$CONDA_ENV" uv run --project apps/api \
      litestar --app kernelon_api.asgi:app run --host 0.0.0.0 --port "$PORT"
    ;;
  serve-dev)
    # Windows-mounted repositories do not reliably emit filesystem events into WSL.
    # Force watchfiles to poll so Litestar reload observes edits made on Windows.
    export WATCHFILES_FORCE_POLLING=${WATCHFILES_FORCE_POLLING:-true}
    exec "$CONDA_EXE" run -n "$CONDA_ENV" uv run --project apps/api \
      litestar --app kernelon_api.asgi:app run --reload --reload-dir "$REPO_ROOT/apps/api/src" \
      --host 0.0.0.0 --port "$PORT"
    ;;
  *)
    echo "Usage: $0 {prepare|serve|serve-dev} [port]" >&2
    exit 2
    ;;
esac
