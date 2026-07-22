const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeInMemoryStore } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { getWelcomeMessage, getServiceMenu, getResponse, checkCooldown, updateCooldown } = require('./responses');
const { startKeepAlive } = require('./keep-alive');

// ============================================
// START KEEP-ALIVE SERVER (for Railway)
// ============================================
startKeepAlive();

// ============================================
// SESSION MANAGEMENT
// ============================================
const sessionDir = path.join(__dirname, 'session');
if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
}

// ============================================
// LOGGER CONFIGURATION
// ============================================
const logger = pino({
    level: 'silent', // Set to 'debug' for troubleshooting
    transport: {
        target: 'pino/file',
        options: { destination: '/dev/null' }
    }
});

// ============================================
// MAIN BOT FUNCTION
// ============================================
async function startBot() {
    console.log('╔═══════════════════════════════════╗');
    console.log(`║   🤖 ${config.botName} AI BOT SYSTEM     ║`);
    console.log('║       WhatsApp Auto Reply Bot      ║');
    console.log(`║         Version ${config.version}               ║`);
    console.log('╚═══════════════════════════════════╝');
    console.log('\n🔄 Starting bot...\n');

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version, isLatest } = await fetchLatestBaileysVersion();

    console.log(`📱 WhatsApp Web Version: ${version.join('.')} ${isLatest ? '(latest)' : '(update available)'}`);

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

    // ============================================
    // STORE MESSAGES
    // ============================================
    const store = makeInMemoryStore({ logger: pino({ level: 'silent' }) });
    store.bind(sock.ev);

    // ============================================
    // PAIR CODE GENERATION
    // ============================================
    async function generatePairCode(phoneNumber) {
        try {
            // Remove any non-digit characters
            const cleanNumber = phoneNumber.replace(/\D/g, '');
            
            // Ensure it has country code (94 for Sri Lanka)
            let fullNumber = cleanNumber;
            if (!fullNumber.startsWith('94')) {
                fullNumber = '94' + fullNumber.replace(/^0+/, '');
            }

            console.log(`\n📱 Generating Pair Code for: ${fullNumber}`);
            
            const code = await sock.requestPairingCode(fullNumber);
            
            if (code) {
                // Format the code nicely
                const formattedCode = code.match(/.{1,4}/g)?.join('-') || code;
                console.log(`✅ Pair Code: ${formattedCode}`);
                return { success: true, code: formattedCode, rawCode: code };
            } else {
                return { success: false, error: 'Failed to generate pair code' };
            }
        } catch (error) {
            console.error('❌ Pair Code Error:', error.message);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // SEND MESSAGE FUNCTION
    // ============================================
    async function sendMessage(jid, text) {
        try {
            await sock.sendMessage(jid, { text: text });
            return true;
        } catch (error) {
            console.error('❌ Send Message Error:', error.message);
            return false;
        }
    }

    // ============================================
    // CONNECTION UPDATE HANDLER
    // ============================================
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('⚠️ QR Code received - but using Pair Code method instead');
        }

        if (connection === 'open') {
            console.log('\n✅ ===== BOT CONNECTED SUCCESSFULLY! =====');
            console.log(`   🤖 ${config.botName} WhatsApp Bot is ONLINE`);
            console.log(`   📱 Connected at: ${new Date().toLocaleString()}`);
            console.log('=========================================\n');
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            
            console.log(`\n⚠️ Connection closed. Reconnecting: ${shouldReconnect}`);
            
            if (shouldReconnect) {
                console.log('🔄 Reconnecting in 5 seconds...');
                setTimeout(() => startBot(), 5000);
            } else {
                console.log('🚫 Logged out. Please delete session folder and restart.');
                process.exit(1);
            }
        }
    });

    // ============================================
    // CREDENTIALS UPDATE
    // ============================================
    sock.ev.on('creds.update', saveCreds);

    // ============================================
    // MESSAGE HANDLER - MAIN AUTO-REPLY LOGIC
    // ============================================
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        for (const msg of messages) {
            // Skip if not a normal message or if it's from the bot itself
            if (!msg.message || msg.key.fromMe) continue;

            const text = msg.message?.conversation || 
                         msg.message?.extendedTextMessage?.text || 
                         msg.message?.imageMessage?.caption || '';
                         
            const jid = msg.key.remoteJid;
            
            // Skip group messages
            if (jid.endsWith('@g.us')) continue;

            const sender = msg.key.participant || jid;
            const pushName = msg.pushName || 'User';

            console.log(`\n📩 Message from: ${pushName} (${jid})`);
            console.log(`💬 Text: ${text}`);

            try {
                // Check cooldown
                const cooldown = checkCooldown(sender);
                
                if (cooldown.allowed) {
                    // ============ FIRST REPLY: Welcome + Service Menu ============
                    
                    // 1. Send Welcome Message
                    await sendMessage(jid, getWelcomeMessage());
                    console.log(`✅ Welcome message sent to ${pushName}`);
                    
                    // 2. Send Service Menu
                    await sendMessage(jid, getServiceMenu());
                    console.log(`✅ Service menu sent to ${pushName}`);
                    
                    // Update cooldown
                    updateCooldown(sender);
                    
                    // ============ SECOND REPLY: Based on user input ============
                    // If user sent a number, send the corresponding response
                    const userResponse = getResponse(text);
                    
                    // Only send response if it's different from what was already sent
                    // and if user actually sent something meaningful
                    if (text.trim().length > 0 && userResponse !== getServiceMenu()) {
                        // Small delay to simulate thinking
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        await sendMessage(jid, userResponse);
                        console.log(`✅ Specific response sent to ${pushName} for option: ${text}`);
                    }
                    
                } else {
                    console.log(`⏳ Cooldown active for ${pushName}. ${cooldown.remaining} min remaining`);
                    
                    // Send cooldown notification
                    if (text.trim().length > 0) {
                        await sendMessage(jid, `⏳ කරුණාකර තව විනාඩි ${cooldown.remaining}කට පසුව නැවත උත්සහ කරන්න...`);
                    }
                }
            } catch (error) {
                console.error('❌ Error processing message:', error.message);
            }
        }
    });

    // ============================================
    // HANDLE PAIR CODE FROM TERMINAL INPUT
    // ============================================
    console.log('\n📱 Pair Code එකක් Generate කරන්න phone number එක ඇතුලත් කරන්න:');
    console.log('   උදා: 9476XXXXXXX  (යොදන්න: 9475XXXXXXX)');
    console.log('');
    console.log('⚠️ Bot start වුනාට පස්සේ පහත විදියට Pair Code එක generate වෙයි:');
    console.log('   Telegram Bot එකෙන් Pair Wh No - ලෙස එවූ අංකයට Auto code එක generate වේ\n');

    // Listen for terminal input for pairing
    process.stdin.on('data', async (data) => {
        const input = data.toString().trim();
        if (input.length >= 10) {
            const result = await generatePairCode(input);
            if (result.success) {
                console.log(`\n🎯 Pair Code: ${result.code}`);
                console.log('📱 මෙම Code එක WhatsApp එකට ඇතුලත් කරන්න:\n');
                console.log('   👉 Open WhatsApp > Linked Devices > Link a Device');
                console.log(`   👉 Enter code: ${result.code}\n`);
            }
        }
    });

    return sock;
}

// ============================================
// START BOT
// ============================================
console.log('\n🚀 Initializing SHANA WhatsApp Bot...\n');

startBot().catch(error => {
    console.error('❌ Fatal Error:', error.message);
    console.log('🔄 Restarting in 10 seconds...');
    setTimeout(() => {
        console.log('🔄 Restarting bot...');
        require('child_process').execSync('node index.js', { stdio: 'inherit' });
    }, 10000);
});

// ============================================
// PREVENT SLEEP - Railway keep alive
// ============================================
setInterval(() => {
    console.log(`💓 Bot heartbeat: ${new Date().toLocaleString()}`);
}, 300000); // Every 5 minutes
