require('dotenv').config();

const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers } = require('@whiskeysockets/baileys');
const { Telegraf } = require('telegraf');
const express = require('express');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');

// ==================== CONFIG ====================
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const PORT = process.env.PORT || 8080;
const AUTH_DIR = path.join(__dirname, 'auth_info');
const COOLDOWN_MS = 20 * 60 * 1000; // 20 minutes

// ==================== STATE ====================
let sock = null;
let connected = false;
const userCooldowns = new Map();  // userJid -> timestamp
const telegramChats = new Set();  // Telegram chat IDs for notifications

const logger = pino({ level: 'error' });
const log = pino({ level: 'info', name: 'SHANA-BOT' });

// ==================== EXPRESS ====================
const app = express();
app.get('/', (req, res) => res.json({ status: connected ? '🟢 Connected' : '🔴 Disconnected', uptime: process.uptime() }));
app.get('/health', (req, res) => res.send('OK'));
app.get('/status', (req, res) => res.json({
    status: connected ? 'connected' : 'disconnected',
    users_24h: userCooldowns.size,
    uptime_sec: Math.floor(process.uptime())
}));
app.listen(PORT, '0.0.0.0', () => log.info(`🌐 Express on :${PORT}`));

// ==================== MESSAGES ====================
const MSG = {
    welcome: `╔══════════════════════════════════╗
║       SHANA AI BOT SYSTEM       ║
║           🕹️                    ║
╚══════════════════════════════════╝
-----------------------------
HI සුබ දවසක් සර්,මිස් 😚

ඔබට අවශ්‍ය උපකාරය පවසන්න ! මම ඔබට සහය වීම සදහා බැදීසිටින්නේමී...!`,

    menu: `📜 SHANA All SERVICE
1. SHANA 1XBET DEPOSIT තොරතුරු ✅
2. SHANA 1XBET WITHDRAW තොරතුරු ✅
3. SHANA 1XBET VIP PROMO CODE තොරතුරු ✅
4. WEB SITE & SOFTWARE සාදාගැනීමට ✅
5. SOCIAL MEDIA BOOST (All Platform) ✅
6. SHANA CONTACTS කරගැනීමට ✅
7. AVIATOR HIGH ODD අනාලයිසින් ඉගෙන ගැනීමට ✅
8. WhatsApp Ai Auto Replay Bot සාදාගැනීමට ✅

කරුණාකර ඔබට අවශ්‍ය සේවාව ඉහත Menu එකේ ඇත්නම් එම අංකය ලබාදෙන්න!
--------------------------------
SOFTWARE DEVELOPER SHANA 🐛`,

    opt1: `💗🇱🇰🙏ආයුබෝවන්🙏🇱🇰💗
1X BET සහ WITHDRAWAL ඉතා ඉක්මනින් ලබාගන්න...
SHANA SERVICE __💯

💵💵 මුදල් තැන්පත් කිරීම 💵💵
✅ Account Deposit ✅ Account Withdraw

🔯 BOC
🔯 94118758
🔯 MINNERIYA
🔯 K.G LAKSHAN KAVISHKA KUMARA

✳️ PEOPLE BANK : 006200150094114
✳️ K.G.LAKSHAN KAVISHKA KUMARA
✳️ HIGURAKGODA

✳️ ez cash : 0764104588
✳️ LAKSHAN (open)
( අඩුම රුපියල් 20/- දැමීමට කාරුණික වන්න )

✡️ Binance
✡️ 1066282628
✡️ LAKSHAN

🔯 ipay
🔯 0764104588
🔯 Lakshan

✡️ Dialog Finance PLC
✡️ 0010 2217 5776
✡️ LAKSHAN KAVISHKA KUMARA

❏ DEPOSIT - minute 2-5 😍
❏ WITHDRAW - minute 10-30 😍
👉 සැ.යු.: REMARK යටතේ ඔබගේ PLAYER ID සඳහන් කල යුතුමය.
⚠️ 1X BET , BET යන වචන කිසිසේත්ම භාවිතා නොකල යුතුය...

ඉහත ක්‍රම හරහා DEPOSIT කර SLIP එක හා ඔබේ 1XBET PLAYER ID type එවන්න
👉 සැ.යු.: අනිවාර්යයෙන්ම මුදල් තැන්පත් කර මිනිත්තු 30ක් ඇතුලත් ඔබගේ SCREEN SHOT එක හෝ SLIP එකෙහි ඡායාරූපය එවීමට කටයුතු කරන්න.
✺ තෙවනපාර්ශවීය සල්ලි දැමීම් බාරගනු නොලැබේ ❌`,

    opt2: `❏ SHANA WITHDRAW ADDRESS ✺
MINI Withdraw Rs 250-/

පියවර 1
* මුලින්ම 1Xbet app එක open කරන්න ඉන්පසු menu යන්න.
* ඉන්පසු උඩම ඇති setting අයිකන් එක ක්ලික් කරන්න
* ඉන්පසුව withdraw කියාලා අයිකන් එකක් ඇති එක ඔබන්න
* ඉන්පස්සෙ 1XBET CASH කියන මෙතඩ් එක තෝරන්න

➢ ඉන්පසු ඔබට ගන්න ඕනි ගාන ගහන්න.
❏ city: minneriya පුරවන්න
❏ street: Lakshan service (24/7)
➢ ඉන් පසුව app එකෙන් බැක් වී ආපසු app එකට ලොග් වී withdraw තැනට යන්න.
➢ ඉන්පසු withdraw request කියාලා button එක ඔබන්න.
➢ ඉන් පසුව get code කියලා එකක් ඔබන්න.
➢ එන code එක screen shot එකක් ගහලා ok කරලා මට එවන්න.
එච්චරයි ✅`,

    opt3: `VIP 1XBET PROMO CODE ඔබලාත් දැන්ම register වෙන්න!...
Lashan1x
👆👆👆👆
LOST නොවී game එකක් ගහන්න කැමති අය දැන්ම ගිහින් 1XBET ACCOUNT එකක් හදාගන්න
200% DEPOSIT BONUS ✅`,

    opt4: `0758862130 / 0742381405
Call එකකින් විස්තර දැනගන්න....
🤝🤝🤝🤝🤝🤝🤝🤝`,

    opt5: `0758862130 / 0742381405 / 0703557568
Call, MG 24/7 Ok ✅`,

    opt6: `0758862130 / 0742381405
Call එකකින් විස්තර දැනගන්න....
🤝🤝🤝🤝🤝🤝🤝🤝`,

    opt7: `ඔබට අඩුම මුදලට 24/7 AUTO reply Bot කෙනෙක් ඔබගේ නමින් හදාගැනීමට අවශ්‍යයිනම් පහල දුරකථන අංකයට අමතන්න 0758862130 ✅`,

    opt8: `ඔබට අඩුම මුදලට 24/7 AUTO reply Bot කෙනෙක් ඔබගේ නමින් හදාගැනීමට අවශ්‍යයිනම් පහල දුරකථන අංකයට අමතන්න 0758862130 ✅`,

    default: `AI BOT -
මතක් රැදීසිටින්න. හැකි ඉක්මනින් SHANA Online ගෙන්වා ගැනීමට උත්සහ කරන්නෙමී....!
ඔහුට තිබෙන වැඩත් එක්ක ඔහු කාර්ය බහුල වී ඇතී අතර ඉක්මනින් පැමිණෙනු ඇත...`
};

// ==================== GET REPLY ====================
function getReply(text) {
    const t = text.trim();
    if (t === '1') return MSG.opt1;
    if (t === '2') return MSG.opt2;
    if (t === '3') return MSG.opt3;
    if (t === '4') return MSG.opt4;
    if (t === '5') return MSG.opt5;
    if (t === '6') return MSG.opt6;
    if (t === '7') return MSG.opt7;
    if (t === '8') return MSG.opt8;
    return null;
}

// ==================== WHATSAPP BOT ====================
async function startWhatsApp(pairPhone = null) {
    try {
        const { version, isLatest } = await fetchLatestBaileysVersion();
        log.info(`Baileys v${version.join('.')}`);

        const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

        sock = makeWASocket({
            version,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger)
            },
            logger,
            printQRInTerminal: false,
            browser: Browsers.ubuntu('Chrome'),
            syncFullHistory: false,
            markOnlineOnConnect: false
        });

        // ---- HANDLE PAIR CODE ----
        if (pairPhone) {
            setTimeout(async () => {
                try {
                    const code = await sock.requestPairingCode(pairPhone);
                    const formatted = code.match(/.{1,4}/g)?.join('-') || code;
                    log.info(`🔑 Pair code: ${formatted}`);
                    
                    const msg = `🔑 *Your WhatsApp Pair Code:*\n\`${formatted}\`\n\n📱 *How to connect:*\n1. Open WhatsApp on phone\n2. Settings → Linked Devices → Link a Device\n3. Enter code: *${formatted}*\n\n⏳ Code expires in ~2 minutes!`;
                    for (const chatId of telegramChats) {
                        try { await sock.sendMessage(`${chatId}@s.whatsapp.net`, { text: msg }); } catch(e) {}
                    }
                } catch (err) {
                    log.error(`Pair code error: ${err.message}`);
                }
            }, 5000);
        }

        // ---- CONNECTION UPDATE ----
        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open') {
                connected = true;
                log.info('✅ WhatsApp Connected!');
                const notif = '✅ *SHANA WhatsApp Bot Connected!*\nAuto-reply system active 24/7.';
                for (const chatId of telegramChats) {
                    try { sock.sendMessage(`${chatId}@s.whatsapp.net`, { text: notif }); } catch(e) {}
                }
            }

            if (connection === 'close') {
                connected = false;
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                
                if (shouldReconnect) {
                    log.info('🔄 Reconnecting in 5s...');
                    setTimeout(() => startWhatsApp(), 5000);
                } else {
                    log.error('🚫 Logged out. Delete auth_info.');
                    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
                }
            }
        });

        // ---- CREDENTIALS ----
        sock.ev.on('creds.update', saveCreds);

        // ---- MESSAGE HANDLER ----
        sock.ev.on('messages.upsert', async (msgEvent) => {
            for (const msg of msgEvent.messages) {
                if (msg.key.fromMe) continue;
                if (!msg.key.remoteJid) continue;
                if (msg.key.remoteJid.endsWith('@broadcast') || msg.key.remoteJid.endsWith('@g.us') || msg.key.remoteJid === 'status@broadcast') continue;

                const jid = msg.key.remoteJid;
                const phone = jid.split('@')[0];
                const text = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').trim();
                if (!text) continue;

                log.info(`📩 ${phone}: "${text.substring(0, 40)}"`);

                const now = Date.now();
                const last = userCooldowns.get(jid) || 0;

                // If cooldown active & not a menu number → skip
                if ((now - last) < COOLDOWN_MS) {
                    if (!['1','2','3','4','5','6','7','8'].includes(text)) {
                        log.info(`⏳ Cooldown ${phone}`);
                        continue;
                    }
                }

                try {
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
                    log.error(`❌ Reply error: ${err.message}`);
                }
            }
        });

        return sock;
    } catch (err) {
        log.error(`❌ Fatal: ${err.message}`);
        setTimeout(() => startWhatsApp(), 5000);
    }
}

// ==================== TELEGRAM BOT ====================
function notifyTelegram(text) {
    for (const chatId of telegramChats) {
        try { tgBot.telegram.sendMessage(chatId, text, { parse_mode: 'Markdown' }).catch(() => {}); } catch(e) {}
    }
}

let tgBot;
async function startTelegram() {
    if (!TELEGRAM_BOT_TOKEN) { log.warn('⚠️ No TELEGRAM_BOT_TOKEN'); return; }

    tgBot = new Telegraf(TELEGRAM_BOT_TOKEN);

    tgBot.start((ctx) => {
        telegramChats.add(ctx.chat.id);
        ctx.reply(
            `👋 *SHANA WhatsApp Bot Controller* 🤖\n\n` +
            `WhatsApp bot එක connect කරගැනීමට ඔබගේ *WhatsApp number* එක පහත ආකාරයට එවන්න:\n\n` +
            `\`94XXXXXXXXX\`\n\n` +
            `(උදා: 9476XXXXXXX)`
        );
    });

    tgBot.help((ctx) => {
        ctx.reply(
            `/start - පිවිසුම\n` +
            `/status - WhatsApp status\n` +
            `/restart - Bot restart`
        );
    });

    tgBot.command('status', (ctx) => {
        ctx.reply(
            `📊 *Bot Status:*\n\n` +
            `WhatsApp: ${connected ? '✅ Connected' : '❌ Disconnected'}\n` +
            `Users: ${userCooldowns.size}\n` +
            `Uptime: ${Math.floor(process.uptime() / 60)} min`
        );
    });

    tgBot.command('restart', (ctx) => {
        ctx.reply('🔄 Restarting...');
        if (sock) sock.end(new Error('Manual restart'));
        setTimeout(() => startWhatsApp(), 2000);
    });

    tgBot.on('text', (ctx) => {
        const text = ctx.message.text.trim();
        const digits = text.replace(/[^0-9]/g, '');
        telegramChats.add(ctx.chat.id);

        if (digits.length >= 9 && digits.length <= 15) {
            ctx.reply(`⏳ Pair code generate කරමින්...`);
            
            if (sock) {
                try { sock.end(new Error('New pair')); } catch(e) {}
            }
            
            // Re-initialize with pairing
            setTimeout(() => {
                startWhatsApp(digits).catch(err => {
                    ctx.reply(`❌ Error: ${err.message}`);
                });
            }, 2000);
        } else {
            ctx.reply('📱 කරුණාකර ඔබගේ WhatsApp number එක digits වලින් පමණක් එවන්න.\n\nඋදා: `9476XXXXXXX`');
        }
    });

    await tgBot.launch();
    log.info('🤖 Telegram Bot Started');
}

// ==================== MAIN ====================
async function main() {
    log.info('🚀 SHANA WhatsApp AI Bot v2.0 (Baileys)');

    if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

    await startTelegram();

    const hasAuth = fs.existsSync(path.join(AUTH_DIR, 'creds.json'));
    if (hasAuth) {
        log.info('🔑 Existing auth found. Auto-connecting...');
        startWhatsApp();
    } else {
        log.info('🆕 No auth. Waiting for Telegram pair code request...');
        // Railway health check
    }

    process.on('SIGINT', () => { if (sock) sock.end(new Error('SIGINT')); if (tgBot) tgBot.stop(); process.exit(0); });
    process.on('SIGTERM', () => { if (sock) sock.end(new Error('SIGTERM')); process.exit(0); });
}

main().catch(err => { log.error(err.message); process.exit(1); });
