const express = require('express');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { getWelcomeMessage, getServiceMenu, getResponse, checkCooldown, updateCooldown } = require('./responses');
const { createAPIServer, setBotSocket, setConnectionStatus } = require('./api-server');

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
// MAIN BOT FUNCTION
// ============================================
async function startBot() {
    console.log('\n🔄 Initializing WhatsApp connection...');

    // Session directory
    const sessionDir = path.join(__dirname, config.sessionDir);
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
        console.log('📁 Session directory created');
    }

    // ========== DYNAMIC IMPORT BAILEYS (ESM from CJS) ==========
    console.log('📦 Loading Baileys library...');
    
    // 🟢 FIX: Use named exports directly, NOT .default
    const baileysModule = await import('@whiskeysockets/baileys');
    
    // Extract named exports
    const makeWASocket = baileysModule.makeWASocket;
    const useMultiFileAuthState = baileysModule.useMultiFileAuthState;
    const DisconnectReason = baileysModule.DisconnectReason;
    const fetchLatestBaileysVersion = baileysModule.fetchLatestBaileysVersion;
    const makeInMemoryStore = baileysModule.makeInMemoryStore;
    const Browsers = baileysModule.Browsers;

    console.log(`📦 Baileys loaded successfully`);
    console.log(`   makeWASocket: ${typeof makeWASocket}`);
    console.log(`   useMultiFileAuthState: ${typeof useMultiFileAuthState}`);

    // Load auth state
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    
    // Get latest version
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`📱 WhatsApp Web Version: ${version.join('.')} ${isLatest ? '(latest)' : ''}`);

    const logger = pino({ level: 'silent' });

    // ========== CREATE SOCKET ==========
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
        browser: Browsers?.ubuntu('Chrome') || ['Chrome (Linux)', '', ''],
        getMessage: async () => null
    });

    // Pass socket to API server
    setBotSocket(sock);

    // ============================================
    // CONNECTION UPDATE
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
            setConnectionStatus('connected');
            
            console.log(`🔗 Get Pair Code: http://localhost:${config.port}/pair?phone=9475XXXXXXX\n`);
        }

        if (connection === 'close') {
            const isLoggedOut = lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut;
            console.log(`\n⚠️ Connection closed. Logged out: ${isLoggedOut}`);
            setConnectionStatus('reconnecting');
            
            if (!isLoggedOut) {
                console.log('🔄 Reconnecting in 3 seconds...');
                setTimeout(() => startBot(), 3000);
            } else {
                console.log('🚫 Logged out. Clearing session...');
                if (fs.existsSync(sessionDir)) {
                    fs.rmSync(sessionDir, { recursive: true, force: true });
                }
                setConnectionStatus('logged_out');
                console.log('🔄 Restarting for fresh pair...');
                setTimeout(() => startBot(), 2000);
            }
        }
    });

    // ============================================
    // CREDENTIALS UPDATE
    // ============================================
    sock.ev.on('creds.update', saveCreds);

    // ============================================
    // MESSAGE HANDLER - AUTO REPLY
    // ============================================
    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const msg of messages) {
            if (!msg.message || msg.key.fromMe) continue;

            const text = msg.message?.conversation || 
                         msg.message?.extendedTextMessage?.text || '';
            const jid = msg.key.remoteJid;
            if (jid.endsWith('@g.us')) continue;

            const sender = msg.key.participant || jid;
            const pushName = msg.pushName || 'User';
            const userNumber = jid.split('@')[0];

            console.log(`\n📩 [${new Date().toLocaleTimeString()}] From: ${pushName} (${userNumber})`);
            console.log(`   Message: ${text || '(empty)'}`);

            try {
                const cooldown = checkCooldown(sender);
                
                if (cooldown.allowed) {
                    // 1. Welcome message
                    await sock.sendMessage(jid, { text: getWelcomeMessage() });
                    console.log(`   ✅ Welcome sent`);
                    
                    await new Promise(r => setTimeout(r, 600));
                    
                    // 2. Service menu
                    await sock.sendMessage(jid, { text: getServiceMenu() });
                    console.log(`   ✅ Menu sent`);
                    
                    updateCooldown(sender);
                    
                    // 3. Specific response based on input
                    if (text.trim().length > 0) {
                        const userResponse = getResponse(text);
                        if (userResponse !== getServiceMenu()) {
                            await new Promise(r => setTimeout(r, 1000));
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

    console.log('\n🚀 ✅ Bot initialized and ready!');
    console.log(`📱 Waiting for WhatsApp messages...\n`);
}

// ============================================
// START
// ============================================
startBot().catch(error => {
    console.error('\n❌ Fatal Error:', error.message);
    console.error('   Stack:', error.stack?.split('\n')[1]);
    console.log('🔄 Auto-restarting in 5 seconds...');
    setTimeout(() => startBot(), 5000);
});

// ============================================
// HEARTBEAT (every 5 minutes)
// ============================================
setInterval(() => {
    console.log(`💓 [${new Date().toLocaleTimeString()}] ${config.botName} Bot running`);
}, 300000);

// ============================================
// CRASH HANDLERS
// ============================================
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err.message);
    console.log('🔄 Restarting...');
    setTimeout(() => startBot(), 3000);
});

process.on('unhandledRejection', (err) => {
    console.error('💥 Unhandled Rejection:', err.message);
});
