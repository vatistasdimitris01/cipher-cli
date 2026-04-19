#!/bin/bash

echo "🤖 Installing Cipher CLI..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found."
    exit 1
fi

echo "Node.js: $(node --version)"

# Create temp dir
TEMP=$(mktemp -d)
cd "$TEMP"

# Download the repo
echo "📦 Downloading..."
git clone --depth 1 https://github.com/vatistasdimitris01/cipher-cli.git . 2>/dev/null || {
    echo "❌ Download failed."
    exit 1
}

# Build
echo "🔨 Building..."
node build.js 2>/dev/null

# Install globally
echo "🔧 Installing..."
npm install -g .

echo ""
echo "✅ Installed!"
echo ""
echo "Run in new terminal:"
echo "  cipher login"
echo "  cipher chat hello"
echo ""

# Cleanup
cd -
rm -rf "$TEMP"