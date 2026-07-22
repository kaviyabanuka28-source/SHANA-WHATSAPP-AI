const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');
const { WELCOME, MENU, MENU_MAP, R_DEFAULT, COOLDOWN_MS } = require('./responses');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

const AUTH_DIR = process.env.AUTH_DIR || 'shana_auth';
const cooldowns = new Map();
const greeted = new Set();
let sock = null;
let reconnectTimer = null;

async function startBot() {
  // Create auth dir if not exists
  if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  console.log(`[BOT] Starting with Baileys v${version.join('.')}`);
  console.log(`[BOT] Registered: ${state.creds.registered}`);

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
    shouldIgnoreJid: jid => !jid.endsWith('@s.whatsapp.net'),
    emitOwnEvents: false,
    getMessage: async () => undefined
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {
      console.log(`[BOT] ✅ CONNECTED! User: ${sock.user?.id || 'unknown'}`);
      console.log(`[BOT] 🤖 Auto Reply System ACTIVE!`);
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;
      console.log(`[BOT] ❌ Disconnected. Code: ${code}, LoggedOut: ${loggedOut}`);

      sock = null;

      if (!loggedOut) {
        const delay = 5000;
        console.log(`[BOT] 🔄 Reconnecting in ${delay/1000}s...`);
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(startBot, delay);
      } else {
        console.log('[BOT] 👋 Logged out. Delete auth folder & re-pair.');
      }
    }
  });

  // 📩 Message handler
  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') continue;

      const jid = msg.key.remoteJid;
      const text = msg.message?.conversation ||
                   msg.message?.extendedTextMessage?.text || '';

      if (!text && !msg.message?.imageMessage) continue;

      const sender = jid.split('@')[0];
      const now = Date.now();

      console.log(`[MSG] 📩 ${sender}: ${text.substring(0, 60)}`);

      // First message → Welcome + Menu
      if (!greeted.has(sender)) {
        greeted.add(sender);
        await sendWA(jid, WELCOME);
        await sleep(1500);
        await sendWA(jid, MENU);
        cooldowns.set(sender, now);
        continue;
      }

      // Cooldown check (20 min)
      const last = cooldowns.get(sender) || 0;
      if (now - last < COOLDOWN_MS) continue;

      // Menu reply or default
      const reply = MENU_MAP[text.trim()] || R_DEFAULT;
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
    console.error('[SEND ERROR]', e.message);
    return false;
  }
}

// ⚡ Generate Pair Code via API
async function generatePair(phoneNumber) {
  let num = phoneNumber.replace(/[^0-9]/g, '');
  if (num.startsWith('0')) num = num.substring(1);
  if (!num.startsWith('94')) num = '94' + num;

  console.log(`[PAIR] 🔑 Generating code for ${num}...`);

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const temp = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'error' }))
    },
    printQRInTerminal: false,
    logger: pino({ level: 'error' }),
    defaultQueryTimeoutMs: 90000,
    getMessage: async () => undefined
  });

  temp.ev.on('creds.update', saveCreds);

  // ⏳ Wait for socket to be ready
  await sleep(3000);

  if (!temp.authState.creds.registered) {
    const code = await temp.requestPairingCode(num);
    console.log(`[PAIR] ✅ Code: ${code}`);
    
    // 🔄 Wait for pairing (connection)
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        temp.end();
        resolve({ code, status: 'waiting' });
      }, 55000);

      temp.ev.on('connection.update', (upd) => {
        if (upd.connection === 'open') {
          clearTimeout(timeout);
          console.log('[PAIR] ✅ PAIRED!');
          temp.end();
          resolve({ code, status: 'paired' });
        }
      });
    });
  } else {
    temp.end();
    return { code: null, status: 'already_paired' };
  }
}

function isConnected() {
  return sock && sock.ws?.readyState === 1;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

module.exports = { startBot, generatePair, isConnected };
