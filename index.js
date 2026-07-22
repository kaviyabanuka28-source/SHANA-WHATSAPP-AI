const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeInMemoryStore } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
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
// LOGGER - Silent mode for Railway
// ============================================
const logger = pino({ level: 'silent' });

// ============================================
// MAIN BOT FUNCTION
// ============================================
async function startBot() {
    console.log('\n🔄 Initializing WhatsApp connection...');

    // ========== Ensure session directory exists ==========
    const sessionDir = path.join(__dirname, config.sessionDir);
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
        console.log('📁 Session directory created');
    }

    // ========== Load auth state ==========
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    // ========== Get latest Baileys version ==========
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`📱 WhatsApp Web Version: ${version.join('.')} ${isLatest ? '(latest)' : ''}`);

    // ========== Create WhatsApp socket ==========
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

    // ========== Pass socket to API server ==========
    setBotSocket(sock);

    // ========== Message Store ==========
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
            
            // Generate pair code link in console
            console.log('📱 Pair Code generate කරන්න:');
            console.log(`   http://localhost:${config.port}/pair?phone=9475XXXXXXX`);
            console.log('   (Replace X with your phone number)\n');
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            
            console.log(`\n⚠️ Connection closed. Reconnecting: ${shouldReconnect}`);
            setConnectionStatus('reconnecting');
            
            if (shouldReconnect) {
                console.log('🔄 Reconnecting in 3 seconds...');
                setTimeout(() => startBot(), 3000);
            } else {
                console.log('🚫 Logged out. Session deleted. Please generate pair code again.');
                // Clear session folder
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

    // ============================================
    // CREDENTIALS UPDATE
    // ============================================
    sock.ev.on('creds.update', saveCreds);

    // ============================================
    // MESSAGE HANDLER - AUTO REPLY SYSTEM
    // ============================================
    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const msg of messages) {
            // Skip if not a normal message or from bot itself
            if (!msg.message || msg.key.fromMe) continue;

            // Get message text
            const text = msg.message?.conversation || 
                         msg.message?.extendedTextMessage?.text || 
                         msg.message?.imageMessage?.caption || '';
                         
            const jid = msg.key.remoteJid;
            
            // Skip group messages
            if (jid.endsWith('@g.us')) continue;

            const sender = msg.key.participant || jid;
            const pushName = msg.pushName || 'User';
            const userNumber = jid.split('@')[0];

            console.log(`\n📩 [${new Date().toLocaleTimeString()}] From: ${pushName} (${userNumber})`);
            console.log(`   Message: ${text || '(empty/media)'}`);

            try {
                // Check cooldown (20 minutes)
                const cooldown = checkCooldown(sender);
                
                if (cooldown.allowed) {
                    // ====== FIRST RESPONSE: Welcome + Menu ======
                    await sock.sendMessage(jid, { text: getWelcomeMessage() });
                    console.log(`   ✅ Welcome sent to ${pushName}`);
                    
                    // Small delay so messages don't arrive at exact same time
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    await sock.sendMessage(jid, { text: getServiceMenu() });
                    console.log(`   ✅ Menu sent to ${pushName}`);
                    
                    // Update cooldown
                    updateCooldown(sender);
                    
                    // ====== SECOND RESPONSE: Based on input ======
                    if (text.trim().length > 0) {
                        const userResponse = getResponse(text);
                        
                        // Avoid sending duplicate menu
                        if (userResponse !== getServiceMenu()) {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            await sock.sendMessage(jid, { text: userResponse });
                            console.log(`   ✅ Reply sent for option: ${text}`);
                        }
                    }
                    
                } else {
                    console.log(`   ⏳ Cooldown: ${cooldown.remaining}min remaining for ${pushName}`);
                    
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
// START BOT WITH AUTO-RESTART
// ============================================
startBot().catch(error => {
    console.error('\n❌ Fatal Error:', error.message);
    console.log('🔄 Auto-restart in 5 seconds...');
    setTimeout(() => startBot(), 5000);
});

// ============================================
// HEARTBEAT - Keep process alive
// ============================================
setInterval(() => {
    const time = new Date().toLocaleTimeString();
    console.log(`💓 [${time}] ${config.botName} Bot heartbeat`);
}, 300000); // Every 5 minutes

// Handle unexpected crashes
process.on('uncaughtException', (error) => {
    console.error('\n💥 Uncaught Exception:', error.message);
    console.log('🔄 Restarting...');
    setTimeout(() => startBot(), 3000);
});

process.on('unhandledRejection', (error) => {
    console.error('\n💥 Unhandled Rejection:', error.message);
});
