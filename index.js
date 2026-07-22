import { default as makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeInMemoryStore } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import { getWelcomeMessage, getServiceMenu, getResponse, checkCooldown, updateCooldown } from './responses.js';
import { createAPIServer, setBotSocket, setConnectionStatus } from './api-server.js';

// ============================================
// __dirname equivalent for ESM
// ============================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// BANNER
// ============================================
console.log(`
╔═══════════════════════════════════════╗
║   🤖 ${config.botName} WhatsApp AI Bot v${config.version}      ║
║      Auto Reply - 24/7 - Railway      ║
║         🚫 NO BROWSER REQUIRED        ║
╚═══════════════════════════════════════╝
`);

// ============================================
// START API SERVER FIRST
// ============================================
console.log('🌐 Starting API Server...');
createAPIServer();
console.log('✅ API Server started');

// ============================================
// LOGGER - Silent mode
// ============================================
const logger = pino({ level: 'silent' });

// ============================================
// MAIN BOT FUNCTION
// ============================================
async function startBot() {
    console.log('\n🔄 Initializing WhatsApp connection...');

    const sessionDir = path.join(__dirname, config.sessionDir);
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
        console.log('📁 Session directory created');
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`📱 WhatsApp Web Version: ${version.join('.')} ${isLatest ? '(latest)' : ''}`);

    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        auth: state,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        markOnlineOnConnect: true,
        syncFullHistory: false,
        generateHighQualityLink: true,
        browser: ['Chrome (Linux)', '', ''],
        getMessage: async () => null
    });

    // Pass socket to API server
    setBotSocket(sock);

    // Message Store
    const store = makeInMemoryStore({ logger: pino({ level: 'silent' }) });
    store.bind(sock.ev);

    // ============================================
    // CONNECTION UPDATE HANDLER
    // ============================================
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'connecting') {
            console.log('⏳ Connecting to WhatsApp...');
            setConnectionStatus('connecting');
        }

        if (connection === 'open') {
            console.log('\n✅ ✅ ✅ ===== BOT CONNECTED! =====');
            console.log(`   📱 ${config.botName} is ONLINE`);
            console.log(`   🕐 ${new Date().toLocaleString()}`);
            console.log('==================================\n');
            
            setConnectionStatus('connected', sock.user);
            
            console.log(`📱 Pair Code: http://localhost:${config.port}/pair?phone=9475XXXXXXX\n`);
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            
            console.log(`\n⚠️ Connection closed. Reconnecting: ${shouldReconnect}`);
            setConnectionStatus('reconnecting');
            
            if (shouldReconnect) {
                console.log('🔄 Reconnecting in 3 seconds...');
                setTimeout(() => startBot(), 3000);
            } else {
                console.log('🚫 Logged out. Session deleted.');
                if (fs.existsSync(sessionDir)) {
                    fs.rmSync(sessionDir, { recursive: true, force: true });
                    console.log('🧹 Session folder cleared');
                }
                setConnectionStatus('logged_out');
                console.log('🔄 Restarting for fresh pairing...');
                setTimeout(() => startBot(), 2000);
            }
        }
    });

    // Credentials update
    sock.ev.on('creds.update', saveCreds);

    // ============================================
    // MESSAGE HANDLER - AUTO REPLY
    // ============================================
    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const msg of messages) {
            if (!msg.message || msg.key.fromMe) continue;

            const text = msg.message?.conversation || 
                         msg.message?.extendedTextMessage?.text || 
                         msg.message?.imageMessage?.caption || '';
                         
            const jid = msg.key.remoteJid;
            if (jid.endsWith('@g.us')) continue;

            const sender = msg.key.participant || jid;
            const pushName = msg.pushName || 'User';
            const userNumber = jid.split('@')[0];

            console.log(`\n📩 [${new Date().toLocaleTimeString()}] From: ${pushName} (${userNumber})`);
            console.log(`   Message: ${text || '(empty/media)'}`);

            try {
                const cooldown = checkCooldown(sender);
                
                if (cooldown.allowed) {
                    // 1. Welcome message
                    await sock.sendMessage(jid, { text: getWelcomeMessage() });
                    console.log(`   ✅ Welcome sent`);
                    
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // 2. Service menu
                    await sock.sendMessage(jid, { text: getServiceMenu() });
                    console.log(`   ✅ Menu sent`);
                    
                    updateCooldown(sender);
                    
                    // 3. Specific response if user sent a number
                    if (text.trim().length > 0) {
                        const userResponse = getResponse(text);
                        if (userResponse !== getServiceMenu()) {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            await sock.sendMessage(jid, { text: userResponse });
                            console.log(`   ✅ Reply sent for: ${text}`);
                        }
                    }
                } else {
                    console.log(`   ⏳ Cooldown: ${cooldown.remaining}min`);
                    if (text.trim().length > 0) {
                        await sock.sendMessage(jid, { 
                            text: `⏳ කරුණාකර තව විනාඩි ${cooldown.remaining}කට පසුව නැවත උත්සහ කරන්න... 😊` 
                        });
                    }
                }
            } catch (error) {
                console.error(`   ❌ Error: ${error.message}`);
            }
        }
    });

    console.log('\n🚀 Bot initialized! Waiting for messages...\n');
    return sock;
}

// ============================================
// START BOT
// ============================================
startBot().catch(error => {
    console.error('\n❌ Fatal Error:', error.message);
    console.log('🔄 Auto-restart in 5 seconds...');
    setTimeout(() => startBot(), 5000);
});

// Heartbeat every 5 minutes
setInterval(() => {
    console.log(`💓 [${new Date().toLocaleTimeString()}] ${config.botName} Bot heartbeat`);
}, 300000);

// Handle crashes
process.on('uncaughtException', (error) => {
    console.error('\n💥 Uncaught Exception:', error.message);
    setTimeout(() => startBot(), 3000);
});

process.on('unhandledRejection', (error) => {
    console.error('\n💥 Unhandled Rejection:', error.message);
});
