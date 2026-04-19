#!/bin/bash
echo "🔧 Cipher Setup"
echo "================"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build
echo "🔨 Building..."
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
npx vercel --prod

echo ""
echo "✅ Setup complete!"
echo ""
echo "Now run:"
echo "  npx tsx cli.ts login"
