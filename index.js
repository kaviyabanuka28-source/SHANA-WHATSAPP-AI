require('dotenv').config();
const { startBot } = require('./bot');
const { startTelegram } = require('./telegram');

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const AUTH_DIR = process.env.AUTH_DIR || 'shana_auth';
const fs = require('fs');

// Start Telegram Bot
startTelegram(TG_TOKEN);

// Check if already paired
const credsPath = `${AUTH_DIR}/creds.json`;
if (fs.existsSync(credsPath)) {
  console.log('[MAIN] ✅ Auth found. Starting WhatsApp...');
  startBot();
} else {
  console.log('[MAIN] ⏳ No auth. Use Telegram bot to pair!');
  console.log('[MAIN] 👉 Send: Pair Wh No - 9476xxxxxxx');
}

// Keep alive
setInterval(() => {
  const { isConnected } = require('./bot');
  console.log(`[HEARTBEAT] ${new Date().toISOString()} | ${isConnected() ? '✅' : '❌'}`);
}, 5 * 60 * 1000);
