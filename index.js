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
// START API SERVER
// ============================================
console.log('🌐 Starting API Server...');
createAPIServer();
console.log('✅ API Server started');

// ============================================
// MAIN BOT FUNCTION (async)
// ============================================
async function startBot() {
    console.log('\n🔄 Initializing WhatsApp connection...');

    // ========== Session directory ==========
    const sessionDir = path.join(__dirname, config.sessionDir);
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
        console.log('📁 Session directory created');
    }

    // ========== DYNAMIC IMPORT Baileys (ESM) from CJS ==========
    console.log('📦 Loading Baileys library...');
    const baileys = await import('@whiskeysockets/baileys');
    const makeWASocket = baileys.default;
    const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeInMemoryStore } = baileys;

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
        browser: ['Chrome (Linux)', '', ''],
        getMessage: async () => null
    });

    setBotSocket(sock);

    // ============================================
    // CONNECTION UPDATE
    // ============================================
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            console.log('\n✅ ✅ ✅ ===== BOT CONNECTED SUCCESSFULLY! =====');
            console.log(`   📱 ${config.botName} is ONLINE`);
            console.log(`   🕐 ${new Date().toLocaleString()}`);
            console.log('==============================================\n');
            setConnectionStatus('connected');
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            
            console.log(`\n⚠️ Connection closed. Reconnect: ${shouldReconnect}`);
            setConnectionStatus('reconnecting');
            
            if (shouldReconnect) {
                console.log('🔄 Reconnecting in 3 seconds...');
                setTimeout(() => startBot(), 3000);
            } else {
                console.log('🚫 Logged out. Clearing session...');
                if (fs.existsSync(sessionDir)) {
                    fs.rmSync(sessionDir, { recursive: true, force: true });
                }
                setConnectionStatus('logged_out');
                setTimeout(() => startBot(), 2000);
            }
        }
    });

    // Credentials update
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

            console.log(`\n📩 [${new Date().toLocaleTimeString()}] ${pushName}: ${text || '(empty)'}`);

            try {
                const cooldown = checkCooldown(sender);
                
                if (cooldown.allowed) {
                    // Welcome + Menu
                    await sock.sendMessage(jid, { text: getWelcomeMessage() });
                    await new Promise(r => setTimeout(r, 500));
                    await sock.sendMessage(jid, { text: getServiceMenu() });
                    updateCooldown(sender);
                    
                    // Specific response
                    if (text.trim().length > 0) {
                        const userResponse = getResponse(text);
                        if (userResponse !== getServiceMenu()) {
                            await new Promise(r => setTimeout(r, 1000));
                            await sock.sendMessage(jid, { text: userResponse });
                        }
                    }
                } else {
                    if (text.trim()) {
                        await sock.sendMessage(jid, { 
                            text: `⏳ කරුණාකර තව විනාඩි ${cooldown.remaining}කට පසුව නැවත උත්සහ කරන්න... 😊` 
                        });
                    }
                }
            } catch (error) {
                console.error(`❌ Error: ${error.message}`);
            }
        }
    });

    console.log('\n🚀 Bot ready! Waiting for messages...');
    console.log(`🔗 Pair Code: http://localhost:${config.port}/pair?phone=9475XXXXXXX\n`);
}

// ============================================
// START
// ============================================
startBot().catch(error => {
    console.error('\n❌ Fatal Error:', error.message);
    console.log('🔄 Restarting in 5 seconds...');
    setTimeout(() => startBot(), 5000);
});

// Heartbeat
setInterval(() => {
    console.log(`💓 [${new Date().toLocaleTimeString()}] Bot alive`);
}, 300000);

// Crash handler
process.on('uncaughtException', (err) => {
    console.error('💥 Crash:', err.message);
    setTimeout(() => startBot(), 3000);
});
process.on('unhandledRejection', (err) => {
    console.error('💥 Rejection:', err.message);
});
