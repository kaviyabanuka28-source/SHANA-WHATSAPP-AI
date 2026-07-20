/*
===========================================================
  SHANA AI WHATSAPP BOT - 100% Auto Reply System
  Pair Code Connection | 20-min Cooldown | Railway 24/7
===========================================================
*/

// වෙනස් කළ යුතු තැන
const { 
    default: makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState,
    fetchLatestWaWebVersion,
    makeCacheableSignalKeyStore,
    Browsers // මෙය අලුතින් එක් කරන්න
} = require('@whiskeysockets/baileys');

const { Boom } = require('@hapi/boom');
const pino = require('pino');
const express = require('express');
const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    // ඔබගේ WhatsApp Number (Country Code එකත් එක්ක, + ලකුණ නැතුව)
    // Example: 947XXXXXXXX (Sri Lanka)
    PAIR_NUMBER: process.env.PAIR_NUMBER || '', // Railway මත env variable එකක් විදිහට දෙන්න
    
    // Bot name
    BOT_NAME: 'SHANA',
    
    // Auth folder path
    AUTH_DIR: path.join(__dirname, 'auth_info_baileys'),
    
    // Cooldown in minutes
    COOLDOWN_MINUTES: 20,
    COOLDOWN_MS: 20 * 60 * 1000,
    
    // Port for web server (Railway required)
    PORT: process.env.PORT || 3000,
    
    // Railway sleep prevention
    RAILWAY_URL: process.env.RAILWAY_URL || '', // Your Railway public URL
    KEEP_ALIVE_INTERVAL: 10 * 60 * 1000, // 10 minutes
};

// ============================================
// COOLDOWN MANAGER (In-Memory)
// ============================================
class CooldownManager {
    constructor() {
        this.cooldowns = new Map(); // Map<userJid, timestamp>
    }
    
    /**
     * Check if user is in cooldown
     */
    isCooldown(userJid) {
        const lastReply = this.cooldowns.get(userJid);
        if (!lastReply) return false;
        
        const elapsed = Date.now() - lastReply;
        const remaining = CONFIG.COOLDOWN_MS - elapsed;
        
        if (remaining <= 0) {
            this.cooldowns.delete(userJid);
            return false;
        }
        
        return true;
    }
    
    /**
     * Get remaining cooldown time in minutes
     */
    getRemainingMinutes(userJid) {
        const lastReply = this.cooldowns.get(userJid);
        if (!lastReply) return 0;
        
        const elapsed = Date.now() - lastReply;
        const remaining = CONFIG.COOLDOWN_MS - elapsed;
        
        return Math.ceil(remaining / 60000);
    }
    
    /**
     * Set cooldown for user
     */
    setCooldown(userJid) {
        this.cooldowns.set(userJid, Date.now());
        console.log(`[COOLDOWN] Set for ${userJid} - ${CONFIG.COOLDOWN_MINUTES} min`);
    }
    
    /**
     * Format cooldown message
     */
    formatCooldownMessage(userJid) {
        const remaining = this.getRemainingMinutes(userJid);
        return `⏳ කරුණාකර තව විනාඩි ${remaining}ක් බලා සිටින්න...`;
    }
}

// Initialize cooldown manager
const cooldown = new CooldownManager();

// ============================================
// AUTO-REPLY MESSAGES (Exact as requested)
// ============================================
const MESSAGES = {
    // ── Welcome Message (එක පාර reply වෙන්න) ──
    WELCOME: `SHANA AI BOT SYSTEM 🕹️
-----------------------------
HI සුබ දවසක් සර්,මිස් 😚

ඔබට අවශ්ශය උපකාරය පවසන්න ! මම ඔබට සහය වීම සදහා බැදීසිටින්නේමී...!

SHANA AI - ONLINE ✅`,

    // ── Menu (Service List) ──
    MENU: `📜 SHANA All SERVICE

1. SHANA 1XBET DEPOSIT තොරතුරු ✅
2. SHANA 1XBET WITHDRAW තොරතුරු ✅
3. SHANA 1XBET VIP PROMO CODE තොරතුරු ✅
4. WEB SITE & SOFTWARE සාදාගැනිමට ✅
5. SOCAL MRDIA BOOST ( All plate Fom )
5. SHANA CONTACTS කරගැනිමට ✅
6. AVIATOR HIGH ODD අනලයිසින් ඉගෙන ගැනිමටනම් ✅
7. Whatsapp Ai Auto Replay Bot සාදාගැනිමටනම් ✅

කරුණාකරලා ඔබට අවශ්ශය සෙවාව උඩ Menu එකේ ඇත්නම් එම අංකය ලාබාදෙන්න!.....

ඔබට වෙනත් කරුණක් දැන්විමට අවශ්ශයනම් පහලින් සදහන් කරන්න මම එය ඉතාමත් ඉක්මනට SHANA වේත දැන්වීමට සලස්වන්නම්
--------------------------------
SOFTWARE DEVELOPR SHANA 🐛`,

    // ── User Input "1" → Deposit Info ──
    OPTION_1: `💗🇱🇰🙏ආයුබෝවන්🙏🇱🇰💗
 *1X BET සහ WITHDRAWAL ඉතා ඉක්මනින් ලබාගන්න...* *SHANA SERVICE __💯* 💵💵 *මුදල් තැන්පත් කිරීම*💵💵
✅ *Account Deposit*✅ *Account Withdraw*

🔯 BOC 
🔯 94118758
🔯MINNERIYA
🔯 K.G LAKSHAN KAVISHKA KUMARA

✳️PEOPLE BANK : 006200150094114
 ✳️K.G.LAKSHAN KAVISHKA KUMARA 
✳️HIGURAKGODA

✳️  ez cash : 0764104588
✳️LAKSHAN ( open ) 
 ( වැඩ්පුර රුපියල් 20-/ දැමිමට කාරුණික වන්න )

✡️ Binanace 
✡️1066282628
✡️ LAKSHAN 

🔯ipay 
🔯0764104588
🔯Lakshan

✡️Dialog Finance PLC 
✡️0010 2217 5776
✡️ LAKSHAN KAVISHKA KUMARA

 *❏ DEPOSIT - minute 2-5 😍* *❏ WITHDRAW - minute 10-30 😍* 👉👉 *සැ.යු.* : ඔබ විසින් *REMARK* යටතේ ඔබගේ PLAYER ID සඳහන් කල යුතුමය.
තවද 1X BET   , BET යන වචන කිසි සේත්ම භාවිතා නොකල යුතුය...

⚠️️ඉහත ක්‍රම හරහා *DEPOSIT* කර 
 SLIP* එක හා ඔබේ *1XBET PLAYER ID* *type එවන්න* 👉සැ.යු. : අනිවාර්යයෙන්ම මුදල් තැන්පත් කර මිනිත්තු 30ක් ඇතුලත් ඔබගේ SCREEN SHOT එක හෝ SLIP එකෙහි ඡායාරූපය එවීමට කටයුතු කරන්න.

එසේ නොහැකි නම් පණිවිඩයක් එවීමට කාරුණිකවන්න .

✺ තෙවනපාර්ශවීය සල්ලි දැමිම් බාරගනු නොලැබේ ❌`,

    // ── User Input "2" → Withdraw Info ──
    OPTION_2: `*❏ SHANA WITHDRAW  ADDRESS ✺*


 

 _MINI Withdraw  Rs 250/_ 
පියවර 1 
* මුලින්ම 1Xbet app එක open කරන්න ඉට පසු menu යන්න. 
 * *ඉට පසු උඩම ඇති setting  අයිකන් එකක් එක ක්ලික් කරන්න*

 *✺ ඉට පසුව withdraw  කියලා අයිකන් එකක් ඇති එක ඔබන්න ඉට පස්සෙ 1XBET CASH කියන් මේතඩ් එක තොරන්න පොඩ්ඩක් පහලට වේන්න තියෙන්නේ*

➢ ඉට පසු ඔබට ගන්න ඔනි ගාන ගහන්න.

❏ city: minneriya පුරවන්න
❏ street : Lakshan service (24/7) 

පුරවගන්න ඉන් පසු ඔබට ඔබගේ gamil එකක් හො phone නම්බ එකක් ඇඩ් කරලා තියේනවානම් කොඩ් එකක් එයි එක දිලා කන්පොම් කරන්න.

 *➢ ඉන් පසුව ඇප් එකේන් බැක් වී ආපාසු ඇප් එකට ලොග් වී විත්‍රොල් තැනට යන්න.* ➢ ඉට පඩු විත්‍රොල් රේපුස්ට කියලා බටන් එකක් ඇති එක ඔබන්න.

➢ ඉන් පසුව ඉංග්‍රිසි වචන සහිතව නිල්පාටින් වචන වගයක් ඇවිත් ඇති එහි ඇති ගෙට් කොඩ් කියලා එකක් අන්න එක ඔබන්න.

➢ එක ඔබවුවට පසුව එනවා කොඩ් එකක් අන්න එකි ස්ක්‍රින් ශොට් එකක් ගහලා ok කරලා මට එවන්න .

එච්චරයි ✅`,

    // ── User Input "3" → VIP Promo Code ──
    OPTION_3: `VIP 1XBET PROMO CODE ඔයාල්ත් දැන්ම රෙජිස්ට වේන්න!...

Lashan1x
👆👆👆👆
LOST නොවී ගෙමක් ගහන්න කැමති අය දැන්ම ගිහින් 1XBET ACCOUNT එකක් හාදාගන්න
200% DEPOSIT BONUS ✅`,

    // ── User Input "4" → Website & Software ──
    OPTION_4: `0758862130/0742381405 Call එකකින් විස්තර දැනගන්න....
🤝🤝🤝🤝🤝🤝🤝🤝`,

    // ── User Input "5" → Social Media Boost / SHANA Contacts ──
    OPTION_5: `0758862130/0742381405/0703557568
Call , Mg 24/7 Ok ✅`,

    // ── User Input "6" → Aviator Analysis ──
    OPTION_6: `0758862130/0742381405 Call එකකින් විස්තර දැනගන්න....
🤝🤝🤝🤝🤝🤝🤝🤝`,

    // ── User Input "7" → WhatsApp Auto Reply Bot ──
    OPTION_7: `ඔබට අඩුම මුදලට 24/7 AUTO reply Bot කෙනෙක් ඔබගේ නමින් හාදාගැනිමට අවශ්ශයයිනම් පහල දුරකතන අංකයට අමතන්න 0758862130 ✅`,

    // ── Invalid Input / Non-number message ──
    INVALID_INPUT: `AI BOT -
මතක් රැදීසීටින් හැකි ඉක්මනින් SHANA Online ගෙන්වා ගැනිමට උත්සහ කරන්නෙමී....  ! 
ඔහුට තිබෙන වැඩත් එක්ක ඔහු කාර්රය බහුල වී ඇතී අතර ඉමනින් පැමිනේවී...`
};

// ============================================
// EXPRESS WEB SERVER (Railway Keep-Alive)
// ============================================
const app = express();

app.get('/', (req, res) => {
    res.json({
        status: 'online',
        bot: CONFIG.BOT_NAME,
        uptime: process.uptime(),
        time: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// ============================================
// MAIN BOT FUNCTION
// ============================================
async function startBot() {
    console.log('='.repeat(50));
    console.log(`  ${CONFIG.BOT_NAME} AI WhatsApp Bot ආරම්භ වේ...`);
    console.log('='.repeat(50));

    let sock = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 50;

    async function connect() {
        try {
            // Auth directory එක නැතිනම් හදන්න
            if (!fs.existsSync(CONFIG.AUTH_DIR)) {
                fs.mkdirSync(CONFIG.AUTH_DIR, { recursive: true });
                console.log('[AUTH] Auth folder created');
            }

            // Load auth state
            const { state, saveCreds } = await useMultiFileAuthState(CONFIG.AUTH_DIR);
            
            // Get latest WhatsApp version
            const { version } = await fetchLatestWaWebVersion();
            console.log(`[VERSION] WhatsApp Web Version: ${version.join('.')}`);

            // Create WhatsApp socket
            sock = makeWASocket({
                version,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
                },
                // මෙතන 'Browsers' නිවැරදිව භාවිතය
                browser: Browsers.macOS('Desktop'), 
                logger: pino({ level: 'silent' }),
                markOnlineOnConnect: true,
                syncFullHistory: false,
                generateHighQualityLinkPreview: false,
            });

            // මෙය පසුව එකතු කරන්න (QR වෙනුවට Pair Code සඳහා)
            if (CONFIG.PAIR_NUMBER && !sock.authState.creds.registered) {
                const code = await sock.requestPairingCode(CONFIG.PAIR_NUMBER);
                console.log(`🔑 PAIR CODE: ${code}`);
            }

            // ── Save credentials on update ──
            sock.ev.on('creds.update', saveCreds);

            // ── Connection update handler ──
            sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    console.log('[QR] QR Code received (Ignoring - using Pair Code)');
                }

                if (connection === 'open') {
                    console.log('='.repeat(50));
                    console.log(`  ✅ ${CONFIG.BOT_NAME} AI Bot සාර්ථකව සම්බන්ධ විය!`);
                    console.log(`  📱 Bot Online - ${new Date().toLocaleString()}`);
                    console.log('='.repeat(50));
                    reconnectAttempts = 0;
                }

                if (connection === 'close') {
                    const shouldReconnect = 
                        (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                    
                    console.log(`[CONNECTION] සම්බන්ධතාවය විසන්ධි විය. Reconnect: ${shouldReconnect}`);

                    if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                        reconnectAttempts++;
                        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
                        console.log(`[RECONNECT] තත්පර ${delay/1000}කින් නැවත සම්බන්ධ වේ... (උත්සහය: ${reconnectAttempts})`);
                        setTimeout(connect, delay);
                    } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                        console.log('[FATAL] උපරිම reconnect උත්සහයන් අවසන්. Bot එක restart වේ.');
                        process.exit(1);
                    }
                }
            });

            // ── Incoming Messages Handler ──
            sock.ev.on('messages.upsert', async ({ messages, type }) => {
                try {
                    // Only process new messages (not own messages)
                    if (type !== 'notify') return;

                    for (const msg of messages) {
                        // Skip if no message content
                        if (!msg.message) continue;
                        
                        // Get sender info
                        const jid = msg.key.remoteJid;
                        const sender = msg.key.participant || jid;
                        const pushName = msg.pushName || 'User';
                        
                        // Skip group messages and status broadcasts
                        if (jid.includes('@g.us') || jid === 'status@broadcast') continue;
                        
                        // Skip bot's own messages
                        if (msg.key.fromMe) continue;
                        
                        // Extract text from message
                        let text = '';
                        if (msg.message.conversation) {
                            text = msg.message.conversation.trim();
                        } else if (msg.message.extendedTextMessage?.text) {
                            text = msg.message.extendedTextMessage.text.trim();
                        } else if (msg.message.imageMessage?.caption) {
                            text = msg.message.imageMessage.caption.trim();
                        } else {
                            // Non-text message (image, sticker, video)
                            text = '';
                        }

                        console.log(`[MSG] From: ${pushName} (${jid}) - Text: "${text}"`);

                        // ── Process the message ──
                        await processUserMessage(sock, msg, jid, text, pushName);
                    }
                } catch (err) {
                    console.error('[MSG ERROR]:', err.message);
                }
            });

            // ── Handle messages update for edit/delete detection ──
            sock.ev.on('messages.update', async (updates) => {
                // Not needed for basic auto-reply
            });

        } catch (err) {
            console.error('[BOT ERROR]:', err.message);
            console.log('[RESTART] Bot එක තත්පර 5කින් restart වේ...');
            setTimeout(startBot, 5000);
        }
    }

    // ── Start the connection ──
    await connect();

    return sock;
}

// ============================================
// MESSAGE PROCESSING LOGIC
// ============================================
async function processUserMessage(sock, msg, jid, text, pushName) {
    try {
        // ── First message check: Send Welcome + Menu ──
        // If user has no cooldown (never messaged before OR cooldown expired)
        if (!cooldown.isCooldown(jid)) {
            console.log(`[PROCESS] Sending WELCOME to ${pushName} (${jid})`);
            
            // Send Welcome Message
            await sock.sendMessage(jid, { 
                text: MESSAGES.WELCOME 
            });
            
            // Small delay between messages
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Send Menu
            await sock.sendMessage(jid, { 
                text: MESSAGES.MENU 
            });
            
            // Set cooldown
            cooldown.setCooldown(jid);
            return;
        }
        
        // ── User is in cooldown period ──
        // If user sends a message during cooldown, do NOT reply at all
        // (Silently ignore during cooldown as per requirement)
        if (cooldown.isCooldown(jid)) {
            console.log(`[COOLDOWN] ${pushName} is in cooldown. Remaining: ${cooldown.getRemainingMinutes(jid)}min`);
            return; // No reply during cooldown
        }
        
        // ── If we get here, cooldown has expired. Process the input ──
        // Check if user sent a number
        const userInput = text.trim();
        
        if (userInput === '1') {
            await sock.sendMessage(jid, { text: MESSAGES.OPTION_1 });
        } else if (userInput === '2') {
            await sock.sendMessage(jid, { text: MESSAGES.OPTION_2 });
        } else if (userInput === '3') {
            await sock.sendMessage(jid, { text: MESSAGES.OPTION_3 });
        } else if (userInput === '4') {
            await sock.sendMessage(jid, { text: MESSAGES.OPTION_4 });
        } else if (userInput === '5') {
            await sock.sendMessage(jid, { text: MESSAGES.OPTION_5 });
        } else if (userInput === '6') {
            await sock.sendMessage(jid, { text: MESSAGES.OPTION_6 });
        } else if (userInput === '7') {
            await sock.sendMessage(jid, { text: MESSAGES.OPTION_7 });
        } else {
            // Invalid input (not a number or non-number message)
            await sock.sendMessage(jid, { text: MESSAGES.INVALID_INPUT });
        }
        
        // Set cooldown after sending ANY reply
        cooldown.setCooldown(jid);
        console.log(`[REPLY] Sent response to ${pushName} for input: "${userInput}"`);
        
    } catch (err) {
        console.error(`[SEND ERROR] Failed to send to ${jid}:`, err.message);
    }
}

// ============================================
// SELF-KEEP-ALIVE (Prevent Railway Sleep)
// ============================================
function startKeepAlive() {
    if (!CONFIG.RAILWAY_URL) {
        console.log('[KEEPALIVE] RAILWAY_URL set කර නැත. Self-ping එක වැඩ නොකරයි.');
        console.log('[KEEPALIVE] UptimeRobot.com වෙබ් අඩවියෙන් FREE monitor එකක් හදාගන්න.');
        return;
    }
    
    console.log(`[KEEPALIVE] Self-ping එක ${CONFIG.KEEP_ALIVE_INTERVAL/60000} min ට වරක් start වේ...`);
    
    setInterval(async () => {
        try {
            const http = require('http');
            const https = require('https');
            const url = CONFIG.RAILWAY_URL.replace(/\/$/, '') + '/health';
            
            const client = url.startsWith('https') ? https : http;
            
            await new Promise((resolve, reject) => {
                const req = client.get(url, (res) => {
                    resolve(res.statusCode);
                });
                req.on('error', reject);
                req.setTimeout(10000, () => {
                    req.destroy();
                    reject(new Error('Timeout'));
                });
            });
            
            console.log(`[KEEPALIVE] Ping OK - ${new Date().toLocaleString()}`);
        } catch (err) {
            console.log(`[KEEPALIVE] Ping failed: ${err.message}`);
        }
    }, CONFIG.KEEP_ALIVE_INTERVAL);
}

// ============================================
// START APPLICATION
// ============================================
async function main() {
    // Start Express server
    app.listen(CONFIG.PORT, () => {
        console.log(`[SERVER] Web server port ${CONFIG.PORT} එකෙන් ආරම්භ විය`);
        console.log(`[SERVER] Health check: http://localhost:${CONFIG.PORT}/health`);
    });
    
    // Start WhatsApp Bot
    await startBot();
    
    // Start keep-alive
    startKeepAlive();
}

// Error handling for uncaught errors
process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT ERROR]:', err.message);
    console.log('[RECOVERY] Bot එක restart වේ...');
    setTimeout(() => process.exit(1), 2000);
});

process.on('unhandledRejection', (err) => {
    console.error('[UNHANDLED REJECTION]:', err.message);
});

// Start
main();
