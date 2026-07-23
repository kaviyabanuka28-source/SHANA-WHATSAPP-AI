#!/bin/bash
echo "🚀 Starting SHANA AI WhatsApp Bot..."
echo "📱 Node Version: $(node -v)"
echo "📦 NPM Version: $(npm -v)"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📥 Installing dependencies..."
  npm install
fi

# Start the bot
node index.js
