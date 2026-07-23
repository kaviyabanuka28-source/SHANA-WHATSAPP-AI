#!/bin/bash
echo "🚀 Starting SHANA AI WhatsApp Bot..."
echo "📱 Node Version: $(node -v)"
echo "📦 NPM Version: $(npm -v)"

# Install dependencies if not installed
if [ ! -d "node_modules" ]; then
  echo "📥 Installing dependencies..."
  npm install --production
fi

# Start the bot with index.js
echo "✅ Starting bot..."
node index.js
