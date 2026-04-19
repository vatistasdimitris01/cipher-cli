#!/bin/bash

# Cipher CLI Install Script
# Usage: curl -sL https://raw.githubusercontent.com/YOUR_USER/cipher-cli/main/install.sh | bash

echo "🤖 Installing Cipher CLI..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org"
    exit 1
fi

echo "Node.js version: $(node --version)"

# Create temp dir
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

# Clone or download
echo "📦 Downloading Cipher CLI..."
git clone --depth 1 https://github.com/YOUR_USER/cipher-cli.git . 2>/dev/null || {
    echo "❌ Failed to clone. Update the repo URL in this script."
    exit 1
}

# Install globally
echo "🔧 Installing..."
npm install -g .

echo ""
echo "✅ Installed!"
echo ""
echo "Usage:"
echo "  cipher login"
echo "  cipher chat <message>"
echo "  cipher whoami"
echo ""

# Cleanup
cd -
rm -rf "$TEMP_DIR"