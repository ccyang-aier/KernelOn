#!/usr/bin/env sh
set -eu

ACTION="${1:-}"
MESSAGE="${2:-schema change}"
REPO_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
API_ROOT="$REPO_ROOT/apps/api"

case "$ACTION" in
  setup|dev|migrate|make-migration|check|start) ;;
  *) echo "Usage: $0 {setup|dev|migrate|make-migration|check|start} [message]" >&2; exit 2 ;;
esac

PYTHON_VERSION=$(python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
if [ "$PYTHON_VERSION" != "3.12" ]; then
  echo "KernelOn API requires Python 3.12.x. Detected: $PYTHON_VERSION" >&2
  exit 1
fi

if ! command -v uv >/dev/null 2>&1; then
  echo "uv is required. Run scripts/api/install-uv.sh explicitly, then reopen the shell." >&2
  exit 1
fi

cd "$API_ROOT"
case "$ACTION" in
  setup)
    [ -f .env ] || cp .env.example .env
    uv sync --locked
    ;;
  dev) uv run litestar --app kernelon_api.asgi:app run --reload --host 127.0.0.1 --port 8000 ;;
  migrate) uv run litestar --app kernelon_api.asgi:app database upgrade --no-prompt ;;
  make-migration) uv run litestar --app kernelon_api.asgi:app database make-migrations --message "$MESSAGE" ;;
  check)
    uv run ruff check .
    uv run ruff format --check .
    uv run mypy src
    uv run lint-imports
    uv run pytest
    uv build
    ;;
  start) uv run litestar --app kernelon_api.asgi:app run --host 0.0.0.0 --port 8000 ;;
esac
