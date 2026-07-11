param(
  [Parameter(Mandatory = $true, Position = 0)]
  [ValidateSet('setup', 'dev', 'migrate', 'make-migration', 'check', 'start')]
  [string]$Action,
  [string]$Message = 'schema change'
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$ApiRoot = Join-Path $RepoRoot 'apps\api'

function Invoke-Uv {
  & uv @args
  if ($LASTEXITCODE -ne 0) { throw "uv command failed with exit code $LASTEXITCODE" }
}

$version = & python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"
if ($LASTEXITCODE -ne 0 -or $version -ne '3.12') {
  throw "KernelOn API requires Python 3.12.x. Detected: $version"
}

if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
  throw 'uv is required. Run scripts/api/install-uv.ps1 explicitly, then reopen the terminal.'
}

Push-Location $ApiRoot
try {
  switch ($Action) {
    'setup' {
      if (-not (Test-Path '.env')) { Copy-Item '.env.example' '.env' }
      Invoke-Uv sync --locked
    }
    'dev' { Invoke-Uv run litestar --app kernelon_api.asgi:app run --reload --host 127.0.0.1 --port 8000 }
    'migrate' { Invoke-Uv run litestar --app kernelon_api.asgi:app database upgrade }
    'make-migration' { Invoke-Uv run litestar --app kernelon_api.asgi:app database make-migrations --message $Message }
    'check' {
      Invoke-Uv run ruff check .
      Invoke-Uv run ruff format --check .
      Invoke-Uv run mypy src
      Invoke-Uv run lint-imports
      Invoke-Uv run pytest
      Invoke-Uv build
    }
    'start' { Invoke-Uv run litestar --app kernelon_api.asgi:app run --host 0.0.0.0 --port 8000 }
  }
}
finally {
  Pop-Location
}
