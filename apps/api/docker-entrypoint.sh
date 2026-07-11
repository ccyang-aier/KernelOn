#!/bin/sh
set -eu

litestar --app kernelon_api.asgi:app database upgrade --no-prompt
exec "$@"
