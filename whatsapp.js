const { 
  makeWASocket, 
  useMultiFileAuthState, 
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const {
  WELCOME_MESSAGE,
  MENU_MESSAGE,
  MENU_RESPONSES,
  RESPONSE_DEFAULT,
  COOLDOWN_MS
} = require('./responses');

const cooldowns = new Map();
const greetedUsers = new Set();
let sock = null;
let startAttempts = 0;
const MAX_START_ATTEMPTS = 3;
let isConnecting = false;

/**
 * Initialize WhatsApp socket using saved auth state
 * Call this AFTER pairing is complete
 */
async function startWhatsApp(authFolder = 'shana_auth') {
  if (isConnecting) return;
  isConnecting = true;
  
  try {
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    
    console.log(`[WHATSAPP] Using Baileys v${version.join('.')}, Latest: ${isLatest}`);
    
    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'error' }),
      defaultQueryTimeoutMs: 30000,
      keepAliveIntervalMs: 15000,
      markOnlineOnConnect: true,
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
      shouldIgnoreJid: jid => !jid.endsWith('@s.whatsapp.net'),
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        // QR code received (shouldn't happen if using pair code, but handle it)
        console.log('[WHATSAPP] QR code received (ignoring, using pair code)');
        return;
      }

      if (connection === 'open') {
        console.log('[WHATSAPP] ✅ Connected successfully!');
        console.log(`[WHATSAPP] User: ${sock.user?.id || 'unknown'}`);
        isConnecting = false;
        startAttempts = 0;
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;
        
        console.log(`[WHATSAPP] ❌ Disconnected. StatusCode: ${statusCode}, LoggedOut: ${isLoggedOut}`);

        if (isLoggedOut) {
          console.log('[WHATSAPP] Logged out. Clearing auth...');
          sock = null;
          isConnecting = false;
          return;
        }

        // Auto reconnect
        isConnecting = false;
        const delay = Math.min(3000 * Math.pow(2, startAttempts), 30000);
        startAttempts++;
        console.log(`[WHATSAPP] Reconnecting in ${delay/1000}s (attempt ${startAttempts})`);
        setTimeout(() => startWhatsApp(authFolder), delay);
      }
    });

    // Handle incoming messages
    sock.ev.on('messages.upsert', async (msg) => {
      const messages = msg.messages;
      
      for (const message of messages) {
        if (message.key.fromMe) continue;
        if (message.key.remoteJid === 'status@broadcast') continue;
        
        const jid = message.key.remoteJid;
        const text = message.message?.conversation || 
                     message.message?.extendedTextMessage?.text || 
                     message.message?.imageMessage?.caption || '';
        
        if (!text && !message.message?.imageMessage) continue;
        
        const sender = jid.split('@')[0];
        const now = Date.now();
        
        console.log(`[WHATSAPP] 📩 From ${sender}: ${text.substring(0, 60)}`);
        
        // First message - send welcome
        if (!greetedUsers.has(sender)) {
          greetedUsers.add(sender);
          await sleep(500);
          await sendMessage(jid, WELCOME_MESSAGE);
          await sleep(1500);
          await sendMessage(jid, MENU_MESSAGE);
          cooldowns.set(sender, now);
          continue;
        }
        
        // Check cooldown (20 min)
        const lastReply = cooldowns.get(sender) || 0;
        if (now - lastReply < COOLDOWN_MS) {
          continue;
        }
        
        // Process response
        const trimmed = text.trim();
        let reply = null;
        
        if (MENU_RESPONSES[trimmed]) {
          reply = MENU_RESPONSES[trimmed];
        } else {
          reply = RESPONSE_DEFAULT;
        }
        
        if (reply) {
          await sendMessage(jid, reply);
          cooldowns.set(sender, now);
        }
      }
    });

  } catch (err) {
    console.error('[WHATSAPP] Fatal error:', err.message);
    isConnecting = false;
  }

  return sock;
}

async function sendMessage(jid, text) {
  try {
    if (!sock) return false;
    await sock.sendMessage(jid, { text });
    return true;
  } catch (err) {
    console.error('[WHATSAPP] Send error:', err.message);
    return false;
  }
}

/**
 * PAIR CODE GENERATOR — Generate code and WAIT for connection
 * This is the FIXED version that actually works!
 */
async function generatePairCodeAndWait(phoneNumber, authFolder = 'shana_auth') {
  // Clean number
  let num = phoneNumber.replace(/[^0-9]/g, '');
  if (num.startsWith('0')) num = num.substring(1);
  if (!num.startsWith('94')) num = '94' + num;
  
  console.log(`[PAIR] 🔑 Generating pair code for ${num}...`);
  
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);
  const { version } = await fetchLatestBaileysVersion();
  
  const tempSock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'error' }),
    defaultQueryTimeoutMs: 60000,
  });
  
  // Save creds when they update
  tempSock.ev.on('creds.update', saveCreds);
  
  return new Promise((resolve, reject) => {
    let timeout = setTimeout(() => {
      tempSock.end();
      reject(new Error('Pair code generation timed out'));
    }, 30000);
    
    tempSock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;
      
      if (connection === 'open') {
        clearTimeout(timeout);
        console.log(`[PAIR] ✅ Pairing successful! User: ${tempSock.user?.id}`);
        tempSock.end();
        resolve({ success: true, user: tempSock.user?.id });
      }
      
      if (connection === 'close') {
        clearTimeout(timeout);
        const code = lastDisconnect?.error?.output?.statusCode;
        if (code !== DisconnectReason.loggedOut) {
          reject(new Error(`Connection closed with code: ${code}`));
        }
      }
    });
    
    // Request the pair code
    tempSock.requestPairCode(num)
      .then(code => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          tempSock.end();
          reject(new Error('User did not scan/link within 60 seconds'));
        }, 60000);
        
        console.log(`[PAIR] ✅ Code generated: ${code}`);
        resolve({ code, waitForConnection: true });
      })
      .catch(err => {
        clearTimeout(timeout);
        tempSock.end();
        reject(err);
      });
  });
}

/**
 * Generate pair code ONLY (without waiting for connection)
 * Returns just the code - user can link later
 */
async function generatePairCodeOnly(phoneNumber) {
  let num = phoneNumber.replace(/[^0-9]/g, '');
  if (num.startsWith('0')) num = num.substring(1);
  if (!num.startsWith('94')) num = '94' + num;
  
  console.log(`[PAIR] 🔑 Generating pair code for ${num}...`);
  
  const { state } = await useMultiFileAuthState('temp_pair_auth');
  const { version } = await fetchLatestBaileysVersion();
  
  const tempSock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'error' }),
    defaultQueryTimeoutMs: 60000,
  });
  
  return new Promise((resolve, reject) => {
    let done = false;
    
    const cleanup = () => {
      if (!done) {
        done = true;
        tempSock.end();
      }
    };
    
    setTimeout(() => {
      cleanup();
      reject(new Error('Timeout generating pair code'));
    }, 30000);
    
    tempSock.requestPairCode(num)
      .then(code => {
        cleanup();
        resolve(code);
      })
      .catch(err => {
        cleanup();
        reject(err);
      });
  });
}

function isConnected() {
  return sock !== null && sock.ws?.readyState === 1;
}

function getStatus() {
  return {
    connected: isConnected(),
    usersTracked: greetedUsers.size,
    activeCooldowns: cooldowns.size,
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  startWhatsApp,
  generatePairCodeAndWait,
  generatePairCodeOnly,
  sendMessage,
  isConnected,
  getStatus,
};
