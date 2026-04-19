# Cipher CLI Install Script for Windows
# Run in PowerShell as Administrator

Write-Host "🤖 Installing Cipher CLI..." -ForegroundColor Cyan

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found. Install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

Write-Host "Node.js version: $(node --version)" -ForegroundColor Green

# Create temp dir
$TEMP_DIR = [System.IO.Path]::GetTempPathName() + "cipher-install"
New-Item -ItemType Directory -Path $TEMP_DIR -Force | Out-Null
Set-Location $TEMP_DIR

# Clone
Write-Host "📦 Downloading Cipher CLI..." -ForegroundColor Cyan
git clone --depth 1 https://github.com/YOUR_USER/cipher-cli.git . 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to clone. Update the repo URL in this script." -ForegroundColor Red
    Set-Location $env:USERPROFILE
    Remove-Item $TEMP_DIR -Recurse -Force
    exit 1
}

# Install globally
Write-Host "🔧 Installing..." -ForegroundColor Cyan
npm install -g .

Write-Host ""
Write-Host "✅ Installed!" -ForegroundColor Green
Write-Host ""
Write-Host "Usage:" -ForegroundColor Cyan
Write-Host "  cipher login"
Write-Host "  cipher chat <message>"
Write-Host "  cipher whoami"
Write-Host ""

# Cleanup
Set-Location $env:USERPROFILE
Remove-Item $TEMP_DIR -Recurse -Force