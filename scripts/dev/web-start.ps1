param(
  [Parameter(Mandatory = $true)][string]$RepoRoot,
  [Parameter(Mandatory = $true)][int]$BackendPort,
  [ValidateSet('Development', 'Production')]
  [string]$Mode = 'Production'
)

$ErrorActionPreference = 'Stop'
$env:KERNELON_API_URL = "http://127.0.0.1:$BackendPort"

$pnpm = Get-Command pnpm -ErrorAction SilentlyContinue
if ($pnpm) {
  $filePath = $pnpm.Source
  $prefix = @()
}
else {
  $corepack = Get-Command corepack -ErrorAction SilentlyContinue
  if ($corepack) {
    $filePath = $corepack.Source
  }
  elseif (Test-Path 'C:\nvm4w\nodejs\corepack.cmd') {
    $filePath = 'C:\nvm4w\nodejs\corepack.cmd'
  }
  else {
    throw 'pnpm/corepack was not found.'
  }
  $prefix = @('pnpm')
}

Set-Location $RepoRoot
$webCommand = if ($Mode -eq 'Development') { 'dev' } else { 'start' }
& $filePath @prefix --filter '@kernelon/web' $webCommand
exit $LASTEXITCODE
