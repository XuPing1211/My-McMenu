$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $MyInvocation.MyCommand.Path
$url = 'http://127.0.0.1:4173'

# Development-only bridge: copy the local Kiro MCP authorization into the
# child Vite process without writing it to the project or printing its value.
if (-not $env:MCD_MCP_TOKEN) {
  $workspace = Split-Path -Parent (Split-Path -Parent $project)
  $mcpConfigPath = Join-Path $workspace '.kiro\settings\mcp.json'
  if (Test-Path -LiteralPath $mcpConfigPath) {
    try {
      $mcpConfig = Get-Content -LiteralPath $mcpConfigPath -Raw | ConvertFrom-Json
      $mcdServer = $mcpConfig.mcpServers.'mcd-mcp'
      $authorization = [string]$mcdServer.headers.Authorization
      if ($authorization) {
        $env:MCD_MCP_TOKEN = $authorization -replace '^Bearer\s+', ''
        if (-not $env:MCD_MCP_URL) { $env:MCD_MCP_URL = [string]$mcdServer.url }
        Write-Host 'Local McDonald''s MCP authorization detected.' -ForegroundColor DarkGreen
      }
    } catch {
      Write-Host 'Could not read the local MCP configuration; the demo will show a retryable MCP error.' -ForegroundColor Yellow
    }
  }
}

function Test-ServerReady {
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 1 -ErrorAction Stop
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
  } catch {
    return $false
  }
}

if (Test-ServerReady) {
  Write-Host "My McMenu is already running at $url" -ForegroundColor Green
  Start-Process $url
  exit 0
}

$bun = $null
$bunCommand = Get-Command bun.exe -ErrorAction SilentlyContinue
if ($bunCommand) {
  $bun = $bunCommand.Source
}
if (-not $bun) {
  $fallback = Join-Path $env:LOCALAPPDATA 'Kiro-Cli\bun.exe'
  if (Test-Path -LiteralPath $fallback) {
    $bun = $fallback
  }
}

if ($bun) {
  $runtime = $bun
  $arguments = @('run', 'dev', '--', '--host', '127.0.0.1', '--port', '4173')
  Write-Host "Starting My McMenu with Bun..." -ForegroundColor Cyan
} else {
  $runtime = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
  if (-not $runtime) {
    Write-Error 'Bun or npm was not found. Install Bun/Node.js, then run OPEN_DEMO.bat again.'
    exit 1
  }
  $arguments = @('run', 'dev', '--', '--host', '127.0.0.1', '--port', '4173')
  Write-Host "Starting My McMenu with npm..." -ForegroundColor Cyan
}

$serverProcess = Start-Process -FilePath $runtime -ArgumentList $arguments -WorkingDirectory $project -NoNewWindow -PassThru
$ready = $false
for ($attempt = 1; $attempt -le 60; $attempt += 1) {
  Start-Sleep -Milliseconds 500
  if (Test-ServerReady) {
    $ready = $true
    break
  }
  if ($serverProcess.HasExited) {
    break
  }
}

if (-not $ready) {
  Write-Host 'The Vite server did not become ready on port 4173.' -ForegroundColor Red
  if ($serverProcess.HasExited) {
    Write-Host "Server process exited with code $($serverProcess.ExitCode)." -ForegroundColor Red
  }
  Read-Host 'Press Enter to close'
  exit 1
}

Write-Host "My McMenu is ready: $url" -ForegroundColor Green
Start-Process $url
Write-Host 'Keep this window open while viewing the demo. Press Ctrl+C to stop the server.' -ForegroundColor Yellow
Wait-Process -Id $serverProcess.Id
