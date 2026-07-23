const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const { WELCOME, MENU, MENU_RESPONSES, R_DEFAULT, COOLDOWN_MS } = require('./responses');

const AUTH_DIR = process.env.AUTH_DIR || 'shana_auth';
const cooldowns = new Map();
const greeted = new Set();
let sock = null;
let reconnectTimer = null;

// ─── Start WhatsApp Bot (Only if auth exists) ───
async function startBot() {
  if (!fs.existsSync(path.join(AUTH_DIR, 'creds.json'))) {
    console.log('[BOT] ⏳ No auth found. Use API to pair first.');
    console.log('[BOT] 👉 GET /pair?phone=9476xxxxxxx');
    return null;
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();
  
  console.log(`[BOT] Starting WhatsApp... v${version.join('.')}`);

  sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'error' }))
    },
    printQRInTerminal: false,
    logger: pino({ level: 'error' }),
    defaultQueryTimeoutMs: 30000,
    keepAliveIntervalMs: 15000,
    markOnlineOnConnect: true,
    syncFullHistory: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === 'open') {
      console.log(`[BOT] ✅ CONNECTED! ${sock.user?.id}`);
      console.log('[BOT] 🤖 Auto Reply ACTIVE!');
    }
    
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;
      console.log(`[BOT] ❌ Disconnected. Code: ${code}, LoggedOut: ${loggedOut}`);
      sock = null;
      
      if (!loggedOut) {
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(startBot, 5000);
      }
    }
  });

  // 📩 Message Handler
  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') continue;
      
      const jid = msg.key.remoteJid;
      const text = msg.message?.conversation || 
                   msg.message?.extendedTextMessage?.text || '';
      if (!text && !msg.message?.imageMessage) continue;
      
      const sender = jid.split('@')[0];
      const now = Date.now();
      
      console.log(`[MSG] 📩 ${sender}: ${text.substring(0, 50)}`);

      if (!greeted.has(sender)) {
        greeted.add(sender);
        await sendWA(jid, WELCOME);
        await sleep(1500);
        await sendWA(jid, MENU);
        cooldowns.set(sender, now);
        continue;
      }

      const last = cooldowns.get(sender) || 0;
      if (now - last < COOLDOWN_MS) continue;
      
      const reply = MENU_RESPONSES[text.trim()] || R_DEFAULT;
      await sendWA(jid, reply);
      cooldowns.set(sender, now);
    }
  });

  return sock;
}

async function sendWA(jid, text) {
  try {
    if (!sock) return false;
    await sock.sendMessage(jid, { text });
    return true;
  } catch (e) {
    console.error('[SEND ERR]', e.message);
    return false;
  }
}

// ─── GENERATE PAIR CODE ───
async function generatePairCode(phoneNumber) {
  let num = phoneNumber.replace(/[^0-9]/g, '');
  if (num.startsWith('0')) num = num.substring(1);
  if (!num.startsWith('94')) num = '94' + num;
  
  console.log(`[PAIR] 🔑 Generating code for ${num}...`);

  // Clean old auth if partially paired
  const credsPath = path.join(AUTH_DIR, 'creds.json');
  const appStateSyncPath = path.join(AUTH_DIR, 'app-state-sync-key.json');
  if (fs.existsSync(appStateSyncPath)) fs.unlinkSync(appStateSyncPath);

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const tempSock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'error' }))
    },
    printQRInTerminal: false,
    logger: pino({ level: 'error' }),
    defaultQueryTimeoutMs: 120000,
    getMessage: async () => undefined,
  });

  tempSock.ev.on('creds.update', saveCreds);

  // ⏳ Wait for socket to be ready (connecting state)
  await sleep(2000);

  try {
    if (!tempSock.authState.creds.registered) {
      const code = await tempSock.requestPairingCode(num);
      console.log(`[PAIR] ✅ Code generated: ${code}`);
      
      // Format nicely: ABCD-EFGH-IJKL
      const formatted = code.match(/.{1,4}/g)?.join('-') || code;
      
      // Return code immediately + wait for pairing in background
      setTimeout(async () => {
        // Check after 60s if paired
        await sleep(60000);
        if (fs.existsSync(credsPath)) {
          console.log('[PAIR] ✅ Paired detected! Restarting main bot...');
          tempSock.end();
          startBot();
        } else {
          console.log('[PAIR] ⏳ Still waiting for pairing...');
          tempSock.end();
        }
      }, 1000);
      
      return { success: true, code: formatted, raw: code };
    } else {
      tempSock.end();
      return { success: true, code: null, already: true };
    }
  } catch (err) {
    tempSock.end();
    console.error('[PAIR] Error:', err.message);
    throw err;
  }
}

function isConnected() { return sock && sock.ws?.readyState === 1; }

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

module.exports = { startBot, generatePairCode, isConnected };
