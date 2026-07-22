const { 
  makeWASocket, 
  useMultiFileAuthState, 
  DisconnectReason,
  makeCacheableSignalKeyStore
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

// Store cooldowns: Map<phoneNumber, timestamp>
const cooldowns = new Map();
// Track if user has received welcome + menu already
const greetedUsers = new Set();

let sock = null;
let reconnectTimer = null;

/**
 * Initialize WhatsApp socket with pair code
 */
async function startWhatsApp(authFolder = 'shana_auth') {
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);
  
  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
    markOnlineOnConnect: true,
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
    shouldIgnoreJid: jid => !jid.endsWith('@s.whatsapp.net'),
    patchMessageBeforeSending: (msg) => msg,
  });

  // Handle credentials update
  sock.ev.on('creds.update', saveCreds);

  // Handle connection updates
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      const shouldReconnect = 
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      
      console.log('[WHATSAPP] Connection closed. Reconnect:', shouldReconnect);
      
      if (shouldReconnect) {
        // Auto reconnect after 3 seconds
        reconnectTimer = setTimeout(() => startWhatsApp(authFolder), 3000);
      } else {
        console.log('[WHATSAPP] Logged out. Waiting for new pair code...');
        sock = null;
      }
    } else if (connection === 'open') {
      console.log('[WHATSAPP] ✓ Connected successfully!');
    }
  });

  // Handle incoming messages
  sock.ev.on('messages.upsert', async (msg) => {
    const messages = msg.messages;
    
    for (const message of messages) {
      // Skip own messages, status broadcasts, and non-text messages
      if (message.key.fromMe) continue;
      if (message.key.remoteJid === 'status@broadcast') continue;
      
      const jid = message.key.remoteJid;
      const text = message.message?.conversation || 
                   message.message?.extendedTextMessage?.text || '';
      
      if (!text) continue;
      
      const sender = jid.split('@')[0];
      const now = Date.now();
      
      console.log(`[WHATSAPP] Message from ${sender}: ${text.substring(0, 50)}`);
      
      // Check if this is the first message from this user
      if (!greetedUsers.has(sender)) {
        greetedUsers.add(sender);
        
        // Send welcome message
        await sendMessage(jid, WELCOME_MESSAGE);
        
        // Small delay then send menu
        await sleep(1500);
        await sendMessage(jid, MENU_MESSAGE);
        
        // Set cooldown
        cooldowns.set(sender, now);
        continue;
      }
      
      // Check cooldown
      const lastReply = cooldowns.get(sender) || 0;
      if (now - lastReply < COOLDOWN_MS) {
        const remaining = Math.ceil((COOLDOWN_MS - (now - lastReply)) / 60000);
        console.log(`[WHATSAPP] Cooldown active for ${sender}. ${remaining}min remaining`);
        continue;
      }
      
      // Process menu selection
      const trimmed = text.trim();
      let reply = null;
      
      if (MENU_RESPONSES[trimmed]) {
        reply = MENU_RESPONSES[trimmed];
      } else {
        // Check if it's a number but not a valid menu option
        const num = parseInt(trimmed);
        if (!isNaN(num) && num >= 1 && num <= 8) {
          // Invalid - shouldn't happen since we checked above, but just in case
          reply = RESPONSE_DEFAULT;
        } else {
          // Not a number - send default response
          reply = RESPONSE_DEFAULT;
        }
      }
      
      if (reply) {
        await sendMessage(jid, reply);
        cooldowns.set(sender, now);
      }
    }
  });

  return sock;
}

/**
 * Send a text message via WhatsApp
 */
async function sendMessage(jid, text) {
  try {
    if (!sock) {
      console.log('[WHATSAPP] Cannot send: socket not connected');
      return false;
    }
    await sock.sendMessage(jid, { text });
    return true;
  } catch (err) {
    console.error('[WHATSAPP] Send error:', err.message);
    return false;
  }
}

/**
 * Generate pair code for a given phone number
 * Returns the pair code string
 */
async function generatePairCode(phoneNumber) {
  // Clean the phone number
  let cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  
  // Remove leading 0 if present and add country code if needed
  if (cleanNumber.startsWith('0')) {
    cleanNumber = cleanNumber.substring(1);
  }
  if (!cleanNumber.startsWith('94')) {
    cleanNumber = '94' + cleanNumber;
  }
  
  console.log(`[PAIR] Generating pair code for: ${cleanNumber}`);
  
  try {
    const { state } = await useMultiFileAuthState('temp_pair_auth');
    const tempSock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
    });
    
    // Request pair code
    const code = await tempSock.requestPairCode(cleanNumber);
    
    // Close temp socket
    tempSock.end();
    
    console.log(`[PAIR] Code generated: ${code}`);
    return code;
  } catch (err) {
    console.error('[PAIR] Error generating code:', err.message);
    throw err;
  }
}

/**
 * Check if WhatsApp is connected
 */
function isConnected() {
  return sock !== null && sock.ws?.readyState === 1; // WebSocket.OPEN
}

/**
 * Get connection status
 */
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
  generatePairCode,
  sendMessage,
  isConnected,
  getStatus,
};
