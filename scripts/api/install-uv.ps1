$ErrorActionPreference = 'Stop'
Write-Host 'Installing uv from the official Astral installer...'
Invoke-RestMethod https://astral.sh/uv/install.ps1 | Invoke-Expression
Write-Host 'uv installed. Reopen the terminal before running the API setup script.'
