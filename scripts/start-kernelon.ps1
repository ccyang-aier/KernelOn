param(
  [ValidateRange(1, 65535)]
  [int]$BackendPort = 8000
)

$ErrorActionPreference = 'Stop'
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$FrontendPort = 3000
$LogRoot = Join-Path $RepoRoot 'logs\startup'
$ApiHelper = Join-Path $RepoRoot 'scripts\dev\api-wsl.sh'
$WebHelper = Join-Path $RepoRoot 'scripts\dev\web-start.ps1'

function Invoke-CheckedCommand {
  param(
    [Parameter(Mandatory = $true)][string]$FilePath,
    [Parameter(Mandatory = $true)][string[]]$Arguments
  )

  $previousPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = 'Continue'
    & $FilePath @Arguments
    $exitCode = $LASTEXITCODE
  }
  finally {
    $ErrorActionPreference = $previousPreference
  }
  if ($exitCode -ne 0) {
    throw "Command failed with exit code ${exitCode}: $FilePath $($Arguments -join ' ')"
  }
}

function Resolve-PnpmCommand {
  $pnpm = Get-Command pnpm -ErrorAction SilentlyContinue
  if ($pnpm) {
    return @{ FilePath = $pnpm.Source; Prefix = @() }
  }

  $corepack = Get-Command corepack -ErrorAction SilentlyContinue
  if (-not $corepack) {
    $knownCorepack = 'C:\nvm4w\nodejs\corepack.cmd'
    if (Test-Path $knownCorepack) {
      return @{ FilePath = $knownCorepack; Prefix = @('pnpm') }
    }
    throw 'pnpm/corepack was not found. Install Node.js with Corepack before starting KernelOn.'
  }

  return @{ FilePath = $corepack.Source; Prefix = @('pnpm') }
}

function Stop-DockerPortOwner {
  param([int]$Port)

  $previousPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = 'Continue'
    $containerIds = @(& wsl.exe docker ps --filter "publish=$Port" --format '{{.ID}}' 2>$null)
  }
  finally {
    $ErrorActionPreference = $previousPreference
  }
  foreach ($containerId in $containerIds) {
    if ($containerId) {
      Write-Host "Stopping Docker container $containerId on port $Port..." -ForegroundColor Yellow
      Invoke-CheckedCommand -FilePath 'wsl.exe' -Arguments @('docker', 'stop', $containerId.Trim())
    }
  }
}

function Stop-WslPortOwner {
  param([int]$Port)

  $killCommand = @"
if command -v fuser >/dev/null 2>&1; then
  fuser -k ${Port}/tcp >/dev/null 2>&1 || true
else
  pids=`$(ss -ltnp "sport = :${Port}" 2>/dev/null | sed -n 's/.*pid=\([0-9][0-9]*\).*/\1/p')
  if [ -n "`$pids" ]; then kill -9 `$pids >/dev/null 2>&1 || true; fi
fi
"@
  Invoke-CheckedCommand -FilePath 'wsl.exe' -Arguments @('bash', '-lc', $killCommand)
}

function Stop-WindowsPortOwner {
  param([int]$Port)

  $listeners = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
  foreach ($processId in ($listeners | Select-Object -ExpandProperty OwningProcess -Unique)) {
    if (-not $processId -or $processId -eq $PID) { continue }
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if (-not $process) { continue }
    if ($process.ProcessName -eq 'wslrelay') {
      Write-Host "Waiting for the WSL port relay on $Port to close..." -ForegroundColor DarkYellow
      continue
    }
    if ($process.ProcessName -match 'docker|com\.docker') {
      throw "Port $Port is still owned by Docker process $($process.ProcessName). Stop its publishing container and retry."
    }
    Write-Host "Stopping Windows process $($process.ProcessName) ($processId) on port $Port..." -ForegroundColor Yellow
    Stop-Process -Id $processId -Force
  }
}

function Stop-PortOwner {
  param([int]$Port)

  Stop-DockerPortOwner -Port $Port
  Stop-WslPortOwner -Port $Port
  Stop-WindowsPortOwner -Port $Port
  Start-Sleep -Milliseconds 400
}

function Wait-HttpReady {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Url,
    [int]$TimeoutSeconds = 60
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
        Write-Host "$Name is ready: $Url" -ForegroundColor Green
        return
      }
    }
    catch {
      Start-Sleep -Milliseconds 700
    }
  } while ((Get-Date) -lt $deadline)

  throw "$Name did not become ready within $TimeoutSeconds seconds. Check $LogRoot."
}

if (-not (Get-Command wsl.exe -ErrorAction SilentlyContinue)) {
  throw 'WSL2 is required to start the KernelOn backend.'
}
if (-not (Test-Path $ApiHelper)) {
  throw "WSL API helper not found: $ApiHelper"
}

New-Item -ItemType Directory -Path $LogRoot -Force | Out-Null
$pnpmCommand = Resolve-PnpmCommand
$wslRepoRoot = (& wsl.exe wslpath -a ($RepoRoot -replace '\\', '/')).Trim()
$wslApiHelper = "$wslRepoRoot/scripts/dev/api-wsl.sh"

Write-Host 'Stopping existing KernelOn port owners...' -ForegroundColor Cyan
Stop-PortOwner -Port $FrontendPort
Stop-PortOwner -Port $BackendPort

Write-Host 'Preparing PostgreSQL, backend dependencies, and migrations...' -ForegroundColor Cyan
Invoke-CheckedCommand -FilePath 'wsl.exe' -Arguments @('bash', $wslApiHelper, 'prepare', "$BackendPort")

Write-Host 'Building the latest frontend...' -ForegroundColor Cyan
$buildArguments = @($pnpmCommand.Prefix) + @('--filter', '@kernelon/web', 'build')
Push-Location $RepoRoot
try {
  Invoke-CheckedCommand -FilePath $pnpmCommand.FilePath -Arguments $buildArguments
}
finally {
  Pop-Location
}

$backendOut = Join-Path $LogRoot 'backend.out.log'
$backendErr = Join-Path $LogRoot 'backend.err.log'
$frontendOut = Join-Path $LogRoot 'frontend.out.log'
$frontendErr = Join-Path $LogRoot 'frontend.err.log'
Remove-Item $backendOut, $backendErr, $frontendOut, $frontendErr -Force -ErrorAction SilentlyContinue

Write-Host "Starting backend on port $BackendPort..." -ForegroundColor Cyan
$backendProcess = Start-Process -FilePath 'wsl.exe' `
  -ArgumentList @('bash', $wslApiHelper, 'serve', "$BackendPort") `
  -RedirectStandardOutput $backendOut -RedirectStandardError $backendErr `
  -WindowStyle Hidden -PassThru

Write-Host "Starting frontend on port $FrontendPort..." -ForegroundColor Cyan
$frontendProcess = Start-Process -FilePath 'powershell.exe' `
  -ArgumentList @(
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $WebHelper,
    '-RepoRoot', $RepoRoot, '-BackendPort', "$BackendPort"
  ) `
  -RedirectStandardOutput $frontendOut -RedirectStandardError $frontendErr `
  -WindowStyle Hidden -PassThru

try {
  Wait-HttpReady -Name 'KernelOn backend' -Url "http://127.0.0.1:$BackendPort/health/ready"
  Wait-HttpReady -Name 'KernelOn frontend' -Url "http://127.0.0.1:$FrontendPort/api/health"
}
catch {
  Stop-Process -Id $backendProcess.Id, $frontendProcess.Id -Force -ErrorAction SilentlyContinue
  throw
}

Write-Host ''
Write-Host 'KernelOn started successfully.' -ForegroundColor Green
Write-Host "Frontend: http://127.0.0.1:$FrontendPort"
Write-Host "Backend:  http://127.0.0.1:$BackendPort"
Write-Host "Logs:     $LogRoot"
Write-Host "PIDs:     frontend=$($frontendProcess.Id), backend=$($backendProcess.Id)"
