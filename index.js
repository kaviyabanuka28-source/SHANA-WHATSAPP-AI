// ============================================
// 🔥 FIX: CRYPTO POLYFILL (Node.js 18/19 සඳහා)
//     Baileys Web Crypto API එක require කරන නිසා
//     globalThis.crypto define කරන්න ඕනෙ
// ============================================
const { webcrypto } = require('node:crypto');
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

const express = require('express');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { getWelcomeMessage, getServiceMenu, getResponse, checkCooldown, updateCooldown } = require('./responses');
const { createAPIServer, setBotSocket, setConnectionStatus } = require('./api-server');
const { startTelegramBot, setTelegramSocket } = require('./telegram-bot');

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
// TRACK WHETHER TELEGRAM BOT HAS BEEN STARTED
// ============================================
let telegramBotStarted = false;

// ============================================
// GLOBAL RECONNECT COUNTER
// ============================================
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

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
    
    const baileysModule = await import('@whiskeysockets/baileys');
    
    const makeWASocket = baileysModule.makeWASocket;
    const useMultiFileAuthState = baileysModule.useMultiFileAuthState;
    const DisconnectReason = baileysModule.DisconnectReason;
    const fetchLatestBaileysVersion = baileysModule.fetchLatestBaileysVersion;
    const makeInMemoryStore = baileysModule.makeInMemoryStore;
    const Browsers = baileysModule.Browsers;

    console.log(`📦 Baileys loaded successfully`);

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`📱 WhatsApp Web Version: ${version.join('.')} ${isLatest ? '(latest)' : ''}`);

    const logger = pino({ level: 'silent' });

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

    setBotSocket(sock);

    // ========== Pass socket to Telegram bot (with safety check) ==========
    try {
        const telegramBot = require('./telegram-bot');
        if (typeof telegramBot.setTelegramSocket === 'function') {
            telegramBot.setTelegramSocket(sock);
        }
    } catch (e) {
        // Telegram bot optional - WhatsApp bot continues working
    }

    // ========== START TELEGRAM BOT ONLY ONCE ==========
    if (!telegramBotStarted) {
        telegramBotStarted = true;
        try {
            startTelegramBot().catch(err => {
                console.log('⚠️ Telegram bot error (non-fatal):', err.message);
            });
        } catch (e) {
            console.log('⚠️ Could not start Telegram bot:', e.message);
        }
    }

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
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const errorMessage = lastDisconnect?.error?.message || lastDisconnect?.error?.toString() || 'Unknown';
            console.log(`\n⚠️ Connection closed. StatusCode: ${statusCode}, Error: ${errorMessage}, Logged out: ${isLoggedOut}`);
            setConnectionStatus('reconnecting');
            
            reconnectAttempts++;
            
            if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
                console.log('🛑 Max reconnect attempts reached. Clearing session and starting fresh...');
                if (fs.existsSync(sessionDir)) {
                    fs.rmSync(sessionDir, { recursive: true, force: true });
                }
                reconnectAttempts = 0;
                setTimeout(() => startBot(), 2000);
            } else if (!isLoggedOut) {
                const delay = Math.min(3000 * reconnectAttempts, 30000);
                console.log(`🔄 Reconnect attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${delay/1000}s...`);
                setTimeout(() => startBot(), delay);
            } else {
                console.log('🚫 Logged out. Clearing session...');
                if (fs.existsSync(sessionDir)) {
                    fs.rmSync(sessionDir, { recursive: true, force: true });
                }
                setConnectionStatus('logged_out');
                reconnectAttempts = 0;
                setTimeout(() => startBot(), 2000);
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // ============================================
    // MESSAGE HANDLER
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
                    await sock.sendMessage(jid, { text: getWelcomeMessage() });
                    console.log(`   ✅ Welcome sent`);
                    
                    await new Promise(r => setTimeout(r, 600));
                    
                    await sock.sendMessage(jid, { text: getServiceMenu() });
                    console.log(`   ✅ Menu sent`);
                    
                    updateCooldown(sender);
                    
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

setInterval(() => {
    console.log(`💓 [${new Date().toLocaleTimeString()}] ${config.botName} Bot running`);
}, 300000);

process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err.message);
    console.log('🔄 Restarting...');
    setTimeout(() => startBot(), 3000);
});

process.on('unhandledRejection', (err) => {
    console.error('💥 Unhandled Rejection:', err.message);
});
