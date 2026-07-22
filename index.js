require('dotenv').config();
const { startWhatsApp, isConnected } = require('./whatsapp');
const { startTelegram, stopTelegram } = require('./telegram');

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WHATSAPP_AUTH_FOLDER = process.env.WHATSAPP_AUTH_FOLDER || 'shana_auth';

// ── Graceful Shutdown ──
process.on('SIGINT', async () => {
  console.log('\n[MAIN] Shutting down gracefully...');
  stopTelegram();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[MAIN] SIGTERM received. Shutting down...');
  stopTelegram();
  process.exit(0);
});

// ── Uncaught exception handler ──
process.on('uncaughtException', (err) => {
  console.error('[MAIN] Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('[MAIN] Unhandled Rejection:', reason);
});

// ── Start Everything ──
async function main() {
  console.log('╔══════════════════════════════════════╗');
  console.log('║     SHANA AI BOT v1.0 - Starting    ║');
  console.log('╚══════════════════════════════════════╝');
  console.log(`Time: ${new Date().toISOString()}`);
  
  // Start Telegram Bot (for pair code generation)
  if (TELEGRAM_TOKEN) {
    console.log('[MAIN] Starting Telegram Bot...');
    startTelegram(TELEGRAM_TOKEN);
  } else {
    console.warn('[MAIN] TELEGRAM_BOT_TOKEN not set! Telegram bot disabled.');
  }
  
  // Start WhatsApp Bot
  console.log('[MAIN] Starting WhatsApp Bot...');
  try {
    await startWhatsApp(WHATSAPP_AUTH_FOLDER);
  } catch (err) {
    console.error('[MAIN] WhatsApp start error:', err.message);
    console.log('[MAIN] Will retry in 10 seconds...');
    setTimeout(() => startWhatsApp(WHATSAPP_AUTH_FOLDER), 10000);
  }
  
  // Keep-alive: Log status every 5 minutes
  setInterval(() => {
    const connected = isConnected();
    console.log(`[KEEP-ALIVE] ${new Date().toISOString()} | WhatsApp: ${connected ? '✅' : '❌'}`);
  }, 5 * 60 * 1000);
  
  console.log('[MAIN] ✓ Bot is running! Waiting for connections...');
}

main();
