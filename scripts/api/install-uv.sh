#!/usr/bin/env sh
set -eu
echo "Installing uv from the official Astral installer..."
curl -LsSf https://astral.sh/uv/install.sh | sh
echo "uv installed. Reopen the shell before running the API setup script."
