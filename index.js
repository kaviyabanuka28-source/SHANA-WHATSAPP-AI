require('dotenv').config();

const crypto = require('crypto');
global.crypto = crypto;

const { 
    makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion,
    Browsers 
} = require('@whiskeysockets/baileys');
const { Telegraf } = require('telegraf');
const express = require('express');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

// ==================== CONFIG ====================
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const PORT = process.env.PORT || 8080;
const AUTH_DIR = path.join(__dirname, 'auth_info');
const COOLDOWN_MS = 20 * 60 * 1000;

// ==================== STATE ====================
let sock = null;
let connected = false;
let pairingInProgress = false;
const userCooldowns = new Map();
const telegramChats = new Set();
const log = pino({ level: 'info', name: 'SHANA', transport: { target: 'pino-pretty', options: { colorize: false } } });

// ==================== EXPRESS ====================
const app = express();
app.get('/', (req, res) => res.json({ status: connected ? 'connected' : 'disconnected', uptime: process.uptime() }));
app.get('/health', (req, res) => res.send('OK'));
app.listen(PORT, '0.0.0.0', () => log.info(`🌐 Express :${PORT}`));

// ==================== MESSAGES (ඔබේ ඉල්ලූ පරිදිම) ====================
const MSG = {
    welcome: `AI BOT - SHANA 🤖
╔══════════════════════════════════╗
║       SHANA AI BOT SYSTEM       ║
║           🕹️                    ║
╚══════════════════════════════════╝
-----------------------------
HI සුබ දවසක් සර්,මිස් 😚

ඔබට අවශ්‍ය උපකාරය පවසන්න ! මම ඔබට සහය වීම සදහා බැදීසිටින්නේමී...!`,

    menu: `AI BOT -
📜 SHANA All SERVICE

1. SHANA 1XBET DEPOSIT තොරතුරු ✅
2. SHANA 1XBET WITHDRAW තොරතුරු ✅
3. SHANA 1XBET VIP PROMO CODE තොරතුරු ✅
4. WEB SITE & SOFTWARE සාදාගැනීමට ✅
5. SOCIAL MEDIA BOOST (All Platform) ✅
6. SHANA CONTACTS කරගැනීමට ✅
7. AVIATOR HIGH ODD අනාලයිසින් ඉගෙන ගැනීමට ✅
8. WhatsApp Ai Auto Replay Bot සාදාගැනීමට ✅

කරුණාකර ඔබට අවශ්‍ය සේවාව අංකය ලබාදෙන්න!
--------------------------------
SOFTWARE DEVELOPER SHANA 🐛`,

    opt1: `💗🇱🇰🙏ආයුබෝවන්🙏🇱🇰💗
*1X BET සහ WITHDRAWAL ඉතා ඉක්මනින් ලබාගන්න...*

*SHANA SERVICE __💯*

    💵💵 *මුදල් තැන්පත් කිරීම*💵💵
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
 ( අඩුම රුපියල් 20-/ දැමීමට කාරුණික වන්න )

✡️ Binance
✡️1066282628
✡️ LAKSHAN

🔯ipay
🔯0764104588
🔯Lakshan

✡️Dialog Finance PLC
✡️0010 2217 5776
✡️ LAKSHAN KAVISHKA KUMARA

 *❏ DEPOSIT - minute 2-5 😍*
 *❏ WITHDRAW - minute 10-30 😍*
👉👉 *සැ.යු.* : ඔබ විසින් *REMARK* යටතේ ඔබගේ PLAYER ID සඳහන් කල යුතුමය.
තවද 1X BET   , BET යන වචන කිසි සේත්ම භාවිතා නොකල යුතුය...

⚠️️ඉහත ක්‍රම හරහා *DEPOSIT*  කර
 SLIP* එක හා ඔබේ *1XBET PLAYER ID* *type එවන්න*

👉සැ.යු. : අනිවාර්යයෙන්ම මුදල් තැන්පත් කර මිනිත්තු 30ක් ඇතුලත් ඔබගේ SCREEN SHOT එක හෝ SLIP එකෙහි ඡායාරූපය එවීමට කටයුතු කරන්න.

✺ තෙවනපාර්ශවීය සල්ලි දැමීම් බාරගනු නොලැබේ ❌`,

    opt2: `*❏ SHANA WITHDRAW ADDRESS ✺*

_MINI Withdraw Rs 250-/_

පියවර 1
* මුලින්ම 1Xbet app එක open කරන්න ඉන්පසු menu යන්න.
* *ඉන්පසු උඩම ඇති setting අයිකන් එක ක්ලික් කරන්න*

*✺ ඉන්පසුව withdraw කියාලා අයිකන් එකක් ඇති එක ඔබන්න ඉන්පස්සෙ 1XBET CASH කියන මෙතඩ් එක තෝරන්න*

➢ ඉන්පසු ඔබට ගන්න ඕනි ගාන ගහන්න.
❏ city: minneriya පුරවන්න
❏ street : Lakshan service (24/7)

➢ ඉන් පසුව app එකෙන් බැක් වී ආපසු app එකට ලොග් වී withdraw තැනට යන්න.
➢ ඉන්පසු withdraw request කියාලා button එක ඔබන්න.
➢ ඉන් පසුව get code කියලා එකක් ඔබන්න.
➢ එන code එක screenshot කරලා මට එවන්න.
එච්චරයි ✅`,

    opt3: `VIP 1XBET PROMO CODE ඔබලාත් දැන්ම register වෙන්න!...

Lashan1x
👆👆👆👆
LOST නොවී game එකක් ගහන්න කැමති අය දැන්ම ගිහින් 1XBET ACCOUNT එකක් හදාගන්න
200% DEPOSIT BONUS ✅`,

    opt4: `0758862130/0742381405
Call එකකින් විස්තර දැනගන්න....
🤝🤝🤝🤝🤝🤝🤝🤝`,

    opt5: `AI BOT -0758862130/0742381405/0703557568
Call, MG 24/7 Ok ✅`,

    opt6: `AI BOT -
0758862130/0742381405
Call එකකින් විස්තර දැනගන්න....
🤝🤝🤝🤝🤝🤝🤝🤝`,

    opt7: `AI BOT -
0758862130/0742381405
Call එකකින් විස්තර දැනගන්න....
🤝🤝🤝🤝🤝🤝🤝🤝`,

    opt8: `AI BOT - ඔබට අඩුම මුදලට 24/7 AUTO reply Bot කෙනෙක් ඔබගේ නමින් හදාගැනීමට අවශ්‍යයිනම් පහල දුරකථන අංකයට අමතන්න 0758862130 ✅`,

    defaultReply: `AI BOT -
මතක් රැදීසිටින්න. හැකි ඉක්මනින් SHANA Online ගෙන්වා ගැනීමට උත්සහ කරන්නෙමී....!
ඔහුට තිබෙන වැඩත් එක්ක ඔහු කාර්ය බහුල වී ඇති අතර ඉක්මනින් පැමිණෙනු ඇත...`
};

function getReply(text) {
    const t = text.trim();
    const map = {
        '1': MSG.opt1, '2': MSG.opt2, '3': MSG.opt3, '4': MSG.opt4,
        '5': MSG.opt5, '6': MSG.opt6, '7': MSG.opt7, '8': MSG.opt8
    };
    return map[t] || null;
}

function tgNotify(text) {
    for (const chatId of telegramChats) {
        try { tgBot.telegram.sendMessage(chatId, text, { parse_mode: 'Markdown' }).catch(() => {}); } catch(e) {}
    }
}

// ==================== WHATSAPP BOT (FIXED - No unnecessary reconnect) ====================
async function startWhatsApp(pairPhone = null) {
    try {
        log.info('🔄 Initializing WhatsApp...');
        
        // Clean corrupted auth if exists from previous failed attempt
        const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
        
        sock = makeWASocket({
            printQRInTerminal: false,
            auth: state,
            browser: Browsers.ubuntu('Chrome'),
            syncFullHistory: false,
            markOnlineOnConnect: false,
            logger: pino({ level: 'error' }),
            getMessage: async () => null,
            // අනවශ්‍ය options remove කරලා - validation error fix
        });

        // ---- PAIR CODE IMMEDIATELY (තත්පර 1ක delay එකයි!) ----
        if (pairPhone && !pairingInProgress) {
            pairingInProgress = true;
            
            // Generate pair code almost immediately
            setTimeout(async () => {
                try {
                    const code = await sock.requestPairingCode(pairPhone);
                    const formatted = code.match(/.{1,4}/g)?.join('-') || code;
                    log.info(`✅ Pair code: ${formatted}`);
                    
                    const msg = `🔑 *SHANA WhatsApp Pair Code එක සූදානම්!*
━━━━━━━━━━━━━━━━━━━━━
🔑 *${formatted}*
━━━━━━━━━━━━━━━━━━━━━

📱 *Connection කරගන්නේ මෙහෙමයි:*
1️⃣ WhatsApp එක Open කරන්න
2️⃣ Settings → Linked Devices → Link a Device
3️⃣ Code එක Enter කරන්න: *${formatted}*

⏳ කල් ඉකුත් වීම: විනාඩි 2ක් පමණි!
⚡ ඉක්මනින් කරන්න!`;
                    
                    tgNotify(msg);
                    pairingInProgress = false;
                } catch (err) {
                    log.error(`❌ Pair code error: ${err.message}`);
                    tgNotify(`❌ Pair code error: ${err.message}\n\nSend number again.`);
                    pairingInProgress = false;
                }
            }, 1000); // Just 1 second delay - FAST!
        }

        // ---- CONNECTION UPDATE ----
        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect } = update;
            
            if (connection) {
                log.info(`📡 Status: ${connection}`);
            }

            if (connection === 'open') {
                connected = true;
                log.info('✅ WhatsApp Connected!');
                tgNotify('✅ *SHANA WhatsApp Bot Connected!*\nAuto-reply system active 🎉');
            }

            if (connection === 'close') {
                connected = false;
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                log.warn(`⚠️ Closed (code: ${statusCode})`);
                
                // MOST IMPORTANT FIX: Don't auto-reconnect if 401 (logged out)
                if (statusCode === DisconnectReason.loggedOut) {
                    log.error('🚫 Logged out. Cleaning...');
                    try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); } catch(e) {}
                    fs.mkdirSync(AUTH_DIR, { recursive: true });
                    tgNotify('❌ *WhatsApp Logged Out!*\nSend your number again to re-pair.');
                }
                // Don't auto-reconnect at all - wait for Telegram command
            }
        });

        // ---- CREDENTIALS ----
        sock.ev.on('creds.update', saveCreds);

        // ---- MESSAGES ----
        sock.ev.on('messages.upsert', async ({ messages }) => {
            for (const msg of messages) {
                try {
                    if (msg.key.fromMe) continue;
                    if (!msg.key.remoteJid) continue;
                    if (msg.key.remoteJid.includes('@g.us') || msg.key.remoteJid.includes('@broadcast') || msg.key.remoteJid === 'status@broadcast') continue;

                    const jid = msg.key.remoteJid;
                    const phone = jid.split('@')[0];
                    const text = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').trim();
                    if (!text) continue;

                    log.info(`📩 ${phone}: "${text.substring(0, 40)}"`);

                    const now = Date.now();
                    const last = userCooldowns.get(jid) || 0;

                    // Cooldown logic: menu numbers work anytime
                    if ((now - last) < COOLDOWN_MS && !['1','2','3','4','5','6','7','8'].includes(text)) {
                        continue;
                    }

                    const optionReply = getReply(text);
                    let replyText;
                    if (optionReply) {
                        replyText = optionReply;
                    } else {
                        replyText = `${MSG.welcome}\n\n${MSG.menu}`;
                    }

                    await sock.sendMessage(jid, { text: replyText });
                    userCooldowns.set(jid, now);
                    log.info(`✅ Replied to ${phone}`);
                } catch (err) {
                    log.error(`❌ Msg error: ${err.message}`);
                }
            }
        });

        return sock;
    } catch (err) {
        log.error(`❌ Fatal: ${err.message}`);
    }
}

// ==================== TELEGRAM BOT ====================
let tgBot;

async function startTelegram() {
    if (!TELEGRAM_BOT_TOKEN) {
        log.warn('⚠️ No TELEGRAM_BOT_TOKEN');
        return;
    }

    tgBot = new Telegraf(TELEGRAM_BOT_TOKEN);

    tgBot.start((ctx) => {
        telegramChats.add(ctx.chat.id);
        ctx.reply(
            `👋 *SHANA WhatsApp Bot Controller* 🤖

WhatsApp bot එක connect කරගැනීමට ඔබගේ *WhatsApp number* එක පහත ආකාරයට එවන්න:

\`94XXXXXXXXX\`

(උදා: 9476XXXXXXX)

⏱️ Code එක තත්පර 5-10 ඇතුලත ලැබෙනු ඇත!`
        );
    });

    tgBot.help((ctx) => {
        ctx.reply(`/start - Pair code ගන්න\n/status - Status බලන්න\n/pair 94XXXXXXXXX - Pair code generate කරන්න`);
    });

    tgBot.command('status', (ctx) => {
        ctx.reply(
            `📊 *Bot Status:*\n\n` +
            `WhatsApp: ${connected ? '✅ Connected' : '❌ Disconnected'}\n` +
            `Users today: ${userCooldowns.size}\n` +
            `Uptime: ${Math.floor(process.uptime() / 60)} min`
        );
    });

    // /pair command - quick pair code
    tgBot.command('pair', async (ctx) => {
        const args = ctx.message.text.split(' ');
        if (args.length < 2) {
            ctx.reply('Usage: /pair 94XXXXXXXXX');
            return;
        }
        const digits = args[1].replace(/[^0-9]/g, '');
        if (digits.length < 9) {
            ctx.reply('❌ Invalid number. Use: /pair 9476XXXXXXX');
            return;
        }
        
        await ctx.reply(`⏳ Generating pair code for ${digits}...`);
        
        // Clean auth for fresh pairing
        try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); } catch(e) {}
        fs.mkdirSync(AUTH_DIR, { recursive: true });
        
        if (sock) {
            try { sock.end(new Error('New pairing')); } catch(e) {}
            await new Promise(r => setTimeout(r, 1000));
        }
        
        await startWhatsApp(digits);
    });

    tgBot.on('text', async (ctx) => {
        const text = ctx.message.text.trim();
        const digits = text.replace(/[^0-9]/g, '');
        telegramChats.add(ctx.chat.id);

        if (digits.length >= 9 && digits.length <= 15 && !text.startsWith('/')) {
            await ctx.reply(`⏳ Pair code generate කරමින්... (තත්පර 5-10) 📱`);
            
            // Clean auth
            try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); } catch(e) {}
            fs.mkdirSync(AUTH_DIR, { recursive: true });
            
            if (sock) {
                try { sock.end(new Error('New pairing')); } catch(e) {}
                await new Promise(r => setTimeout(r, 1000));
            }
            
            await startWhatsApp(digits);
        } else if (!text.startsWith('/')) {
            await ctx.reply('📱 කරුණාකර ඔබගේ WhatsApp number එක digits වලින් පමණක් එවන්න.\n\nඋදා: \`9476XXXXXXX\`');
        }
    });

    await tgBot.launch();
    log.info('🤖 Telegram Bot Started');
    
    // Notify
    tgNotify('🆕 *SHANA WhatsApp Bot v4.0 Started!*\nSend your WhatsApp number to generate Pair Code.\n⏱️ Code arrives in 5-10 seconds!');
}

// ==================== MAIN ====================
async function main() {
    log.info('🚀 SHANA WhatsApp AI Bot v4.0 (Final)');

    // Ensure clean auth directory
    if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

    // Start Telegram only first
    await startTelegram();

    log.info('⚡ Waiting for Telegram pair request...');
    log.info('📱 Send your WhatsApp number to Telegram bot');
}

main().catch(err => {
    log.error(`💥 Fatal: ${err.message}`);
    process.exit(1);
});
