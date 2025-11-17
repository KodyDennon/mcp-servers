# 🚀 MCP Servers - One-Command Setup Script (Windows)
# This script will set up your MCP servers in seconds!

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║   🚀 MCP Servers Setup Assistant      ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# Check for Node.js
Write-Host "⚡ Checking prerequisites..." -ForegroundColor Cyan
try {
    $nodeVersion = node -v
    $nodeVersionNumber = [int]($nodeVersion.Substring(1).Split('.')[0])
    if ($nodeVersionNumber -lt 20) {
        Write-Host "❌ Node.js version must be >= 20.0.0 (you have $nodeVersion)" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed!" -ForegroundColor Red
    Write-Host "   Please install Node.js >= 20.0.0 from https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Check for pnpm
try {
    $pnpmVersion = pnpm -v
    Write-Host "✓ pnpm $pnpmVersion detected" -ForegroundColor Green
} catch {
    Write-Host "⚠️  pnpm not found. Installing pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
    Write-Host "✓ pnpm installed successfully" -ForegroundColor Green
}

# Install dependencies
Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
pnpm install

# Build packages
Write-Host ""
Write-Host "🔨 Building packages..." -ForegroundColor Cyan
pnpm build

# Run tests
Write-Host ""
Write-Host "🧪 Running tests..." -ForegroundColor Cyan
pnpm test

Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   ✨ Setup Complete! ✨               ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Available MCP Servers:" -ForegroundColor White
Write-Host ""
Write-Host "1. 🗄️  Supabase DB Server" -ForegroundColor Cyan -NoNewline
Write-Host " (v3.2.5)" -ForegroundColor White
Write-Host "   Full-featured Supabase/PostgreSQL access with 35+ tools" -ForegroundColor Blue
Write-Host "   📍 Location: " -NoNewline
Write-Host "packages\supabase-db" -ForegroundColor Yellow
Write-Host "   📖 Setup: " -NoNewline
Write-Host "packages\supabase-db\README.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. 📱 iOS Simulator Server" -ForegroundColor Cyan -NoNewline
Write-Host " (v0.2.0)" -ForegroundColor White
Write-Host "   DevTools-like automation for Xcode iPhone Simulator" -ForegroundColor Blue
Write-Host "   📍 Location: " -NoNewline
Write-Host "packages\ios-simulator" -ForegroundColor Yellow
Write-Host "   📖 Setup: " -NoNewline
Write-Host "packages\ios-simulator\README.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "Quick Start:" -ForegroundColor White
Write-Host "   cd packages\supabase-db; pnpm start     # Start Supabase DB server" -ForegroundColor Yellow
Write-Host "   cd packages\ios-simulator; pnpm start   # Start iOS Simulator server" -ForegroundColor Yellow
Write-Host ""
Write-Host "Configuration Examples:" -ForegroundColor White
Write-Host "   packages\supabase-db\examples\           # Platform-specific configs" -ForegroundColor Yellow
Write-Host ""
Write-Host "Happy coding! 🎉" -ForegroundColor Green
Write-Host ""
