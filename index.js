require('dotenv').config();
const { startBot } = require('./bot');
const { startAPI } = require('./api');
const fs = require('fs');
const path = require('path');

const AUTH_DIR = process.env.AUTH_DIR || 'shana_auth';
const PORT = process.env.PORT || 8080;
const credsPath = path.join(AUTH_DIR, 'creds.json');

console.log('╔═══════════════════════════════════════╗');
console.log('║   🤖 SHANA WhatsApp AI Bot v9.0      ║');
console.log('║      Auto Reply - 24/7 - Railway      ║');
console.log('╚═══════════════════════════════════════╝');

// Create auth directory
if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

// Start API server first
startAPI(PORT);

// Check if already paired
if (fs.existsSync(credsPath)) {
  console.log('[MAIN] ✅ Auth found. Starting WhatsApp...');
  startBot();
} else {
  console.log('[MAIN] ⏳ No auth found.');
  console.log('[MAIN] 🔗 Open Railway URL in browser');
  console.log('[MAIN] 👉 Enter phone number & get Pair Code');
  console.log('[MAIN] 📱 Link in WhatsApp > Linked Devices');
}

// Heartbeat every 5 min
setInterval(() => {
  const { isConnected } = require('./bot');
  console.log(`[HEARTBEAT] ${new Date().toISOString()} | ${isConnected() ? '✅' : '❌'}`);
}, 5 * 60 * 1000);
