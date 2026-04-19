#!/bin/bash
# Cipher CLI Install Script

echo "🤖 Installing Cipher CLI..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found."
    exit 1
fi

echo "Node.js: $(node --version)"

# Get the repo
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Build
echo "🔨 Building..."
node build.js 2>/dev/null

# Install globally
echo "🔧 Installing..."
npm install -g .

# Add to PATH
echo 'export PATH="$(npm root -g)/bin:$PATH"' >> ~/.zshrc 2>/dev/null || true
export PATH="$(npm root -g)/bin:$PATH"

echo ""
echo "✅ Installed!"
echo ""
echo "Run in new terminal:"
echo "  cipher login"
echo "  cipher chat hello"
echo ""