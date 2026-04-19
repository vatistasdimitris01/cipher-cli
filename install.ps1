# Cipher CLI Install Script - Windows

Write-Host "🤖 Installing Cipher CLI..." -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found." -ForegroundColor Red
    exit 1
}

Write-Host "Node.js: $(node --version)" -ForegroundColor Green

$SCRIPT_DIR = $PSScriptRoot
Set-Location $SCRIPT_DIR

Write-Host "🔨 Building..." -ForegroundColor Cyan
node build.js

Write-Host "🔧 Installing..." -ForegroundColor Cyan
npm install -g .

Write-Host ""
Write-Host "✅ Installed!" -ForegroundColor Green
Write-Host ""
Write-Host "Run in new terminal:" -ForegroundColor Cyan
Write-Host "  cipher login"
Write-Host "  cipher chat hello"
Write-Host ""