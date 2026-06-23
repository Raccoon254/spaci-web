# Spaci installer for Windows
# Usage: irm https://spaci.kentom.co.ke/install.ps1 | iex
$ErrorActionPreference = 'Stop'

$Feed = 'https://spaci.kentom.co.ke/updates'
$Site = 'https://spaci.kentom.co.ke'

function Step($m) { Write-Host "`n==> $m" -ForegroundColor Blue }
function Ok($m)   { Write-Host "  done  $m" -ForegroundColor Green }
function Die($m)  { Write-Host "`n  x  $m" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "  Spaci  $Site" -ForegroundColor White

Step "Checking the latest version"
try {
  $yml = (Invoke-WebRequest -UseBasicParsing "$Feed/latest.yml").Content
} catch {
  Die "Could not reach $Site. Check your connection."
}

# Parse the version and the exact installer file name from the release manifest.
$version = ($yml -split "`n" | Where-Object { $_ -match '^version:' } |
  ForEach-Object { ($_ -replace '^version:\s*', '').Trim() } | Select-Object -First 1)
$path = ($yml -split "`n" | Where-Object { $_ -match '^path:' } |
  ForEach-Object { ($_ -replace '^path:\s*', '').Trim() } | Select-Object -First 1)

if (-not $version) { Die "Could not read the latest version." }
if (-not $path) { $path = "Spaci-Setup-$version.exe" }
Ok "Latest is v$version"

$tmp = Join-Path $env:TEMP $path
Step "Downloading Spaci v$version"
$enc = [Uri]::EscapeDataString($path)
Invoke-WebRequest -UseBasicParsing "$Feed/$enc" -OutFile $tmp

Step "Launching the installer"
Start-Process -FilePath $tmp

Write-Host ""
Write-Host "  Spaci v$version installer started. Follow the prompts." -ForegroundColor Green
Write-Host ""
