require('dotenv').config();

// ===== EXPLICIT CRYPTO IMPORT (මේකයි ප්‍රශ්ණේ හදන්නේ) =====
const crypto = require('crypto');
global.crypto = crypto;

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
const COOLDOWN_MS = 20 * 60 * 1000; // විනාඩි 20

// ==================== STATE ====================
let sock = null;
let connected = false;
let isConnecting = false;
const userCooldowns = new Map();
const telegramChats = new Set();

const logger = pino({ level: 'error' });
const log = pino({ level: 'info', name: 'SHANA' });

// ==================== EXPRESS ====================
const app = express();
app.get('/', (req, res) => res.json({ status: connected ? 'connected' : 'disconnected', uptime: process.uptime() }));
app.get('/health', (req, res) => res.send('OK'));
app.get('/status', (req, res) => res.json({
    status: connected ? 'connected' : 'disconnected',
    users: userCooldowns.size,
    uptime_sec: Math.floor(process.uptime()),
    connecting: isConnecting
}));
app.listen(PORT, '0.0.0.0', () => log.info(`🌐 Express :${PORT}`));

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
👉 REMARK යටතේ PLAYER ID සඳහන් කරන්න
⚠️ 1X BET, BET වචන භාවිතා නොකරන්න
✺ තෙවනපාර්ශවීය සල්ලි දැමීම් බාරගනු නොලැබේ ❌`,

    opt2: `❏ SHANA WITHDRAW ADDRESS ✺
MINI Withdraw Rs 250-/

1. 1Xbet app එක open කරන්න
2. Menu → Settings → Withdraw
3. 1XBET CASH method එක තෝරන්න
4. ගාන ගහන්න
5. city: minneriya
6. street: Lakshan service (24/7)
7. Withdraw request කරන්න
8. Get code කියලා ඔබන්න
9. Code එක screenshot කරලා මට එවන්න
එච්චරයි ✅`,

    opt3: `VIP 1XBET PROMO CODE
Lashan1x
👆👆👆👆
200% DEPOSIT BONUS ✅`,

    opt4: `0758862130 / 0742381405
Call එකකින් විස්තර දැනගන්න....
🤝🤝🤝🤝🤝🤝🤝🤝`,

    opt5: `0758862130 / 0742381405 / 0703557568
Call, MG 24/7 Ok ✅`,

    opt6: `0758862130 / 0742381405
Call එකකින් විස්තර දැනගන්න....
🤝🤝🤝🤝🤝🤝🤝🤝`,

    opt7: `0758862130 ✅`,

    opt8: `0758862130 ✅`,

    default: `මතක් රැදීසිටින්න. හැකි ඉක්මනින් SHANA Online ගෙන්වා ගැනීමට උත්සහ කරන්නෙමී....!
ඔහුට තිබෙන වැඩත් එක්ක ඔහු කාර්ය බහුල වී ඇතී අතර ඉක්මනින් පැමිණෙනු ඇත...`
};

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

// ==================== WHATSAPP ====================
async function startWhatsApp(pairPhone = null) {
    if (isConnecting) {
        log.info('⏳ Already connecting, skipping...');
        return;
    }
    
    try {
        isConnecting = true;
        
        const { version, isLatest } = await fetchLatestBaileysVersion();
        log.info(`🔧 Baileys v${version.join('.')}`);

        const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

        // Close old socket if exists
        if (sock) {
            try { sock.end(new Error('Reconnecting')); } catch(e) {}
            await new Promise(r => setTimeout(r, 2000));
        }

        sock = makeWASocket({
            version,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger)
            },
            logger,
            printQRInTerminal: false,
            browser: Browsers.ubuntu('Chrome'),
            // මේ options remove කරලා - ඒවා validation error එකට හේතුවයි
        });

        // ---- PAIR CODE (delay එකකින් call කරන්න) ----
        if (pairPhone) {
            setTimeout(async () => {
                try {
                    log.info(`🔑 Generating pair code for ${pairPhone}...`);
                    const code = await sock.requestPairingCode(pairPhone);
                    const formatted = code.match(/.{1,4}/g)?.join('-') || code;
                    log.info(`✅ Pair code: ${formatted}`);
                    
                    const msg = `🔑 *Your WhatsApp Pair Code:*\n\`\`\`${formatted}\`\`\`\n\n📱 *Connect කරගන්නේ මෙහෙමයි:*\n1. WhatsApp එක open කරන්න\n2. Settings → Linked Devices\n3. *Link a Device* ඔබන්න\n4. මේ code එක enter කරන්න: *${formatted}*\n\n⏳ Code එක විනාඩි 2න් expire වෙයි!`;
                    
                    for (const chatId of telegramChats) {
                        try {
                            await sock.sendMessage(`${chatId}@s.whatsapp.net`, { text: msg });
                        } catch(e) {}
                    }
                    
                    // Also send via Telegram directly as backup
                    for (const chatId of telegramChats) {
                        try {
                            await tgBot.telegram.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
                        } catch(e) {}
                    }
                } catch (err) {
                    log.error(`❌ Pair code error: ${err.message}`);
                    for (const chatId of telegramChats) {
                        try {
                            tgBot.telegram.sendMessage(chatId, `❌ Pair code error: ${err.message}\n\nPlease try again.`);
                        } catch(e) {}
                    }
                }
            }, 8000); // 8 second delay allow connection to stabilize
        }

        // ---- CONNECTION UPDATE ----
        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect } = update;

            log.info(`📡 Connection update: ${connection}`);
            
            if (connection === 'open') {
                connected = true;
                isConnecting = false;
                log.info('✅ WhatsApp Connected!');
                
                const notif = '✅ *SHANA WhatsApp Bot Connected!*\nAuto-reply system active 24/7. 🎉';
                for (const chatId of telegramChats) {
                    try { tgBot.telegram.sendMessage(chatId, notif); } catch(e) {}
                }
            }

            if (connection === 'close') {
                connected = false;
                isConnecting = false;
                
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                log.warn(`⚠️ Connection closed: code ${statusCode}`);
                
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                
                if (shouldReconnect) {
                    log.info('🔄 Reconnecting in 10s...');
                    setTimeout(() => {
                        startWhatsApp().catch(e => log.error(e.message));
                    }, 10000);
                } else {
                    log.error('🚫 Logged out. Delete auth_info folder.');
                    try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); } catch(e) {}
                }
            }
        });

        // ---- CREDENTIALS ----
        sock.ev.on('creds.update', saveCreds);

        // ---- MESSAGE HANDLER ----
        sock.ev.on('messages.upsert', async (msgEvent) => {
            for (const msg of msgEvent.messages) {
                try {
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
                    const cooldownActive = (now - last) < COOLDOWN_MS;

                    // Cooldown check - menu numbers bypass cooldown
                    if (cooldownActive && !['1','2','3','4','5','6','7','8'].includes(text)) {
                        log.info(`⏳ Cooldown ${phone}`);
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

        isConnecting = false;
        return sock;
    } catch (err) {
        log.error(`❌ Fatal: ${err.message}`);
        isConnecting = false;
        connected = false;
        log.info('🔄 Retrying in 15s...');
        setTimeout(() => {
            startWhatsApp().catch(e => log.error(e.message));
        }, 15000);
    }
}

// ==================== TELEGRAM ====================
let tgBot;

async function startTelegram() {
    if (!TELEGRAM_BOT_TOKEN) {
        log.warn('⚠️ TELEGRAM_BOT_TOKEN missing');
        return;
    }

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
            `/start - Pair කිරීම ආරම්භ කරන්න\n` +
            `/status - WhatsApp status බලන්න\n` +
            `/restart - Bot restart කරන්න`
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
        ctx.reply('🔄 Restarting WhatsApp...');
        if (sock) {
            try { sock.end(new Error('Manual restart')); } catch(e) {}
        }
        setTimeout(() => {
            startWhatsApp().catch(err => {
                ctx.reply(`❌ Error: ${err.message}`);
            });
        }, 3000);
    });

    tgBot.on('text', (ctx) => {
        const text = ctx.message.text.trim();
        const digits = text.replace(/[^0-9]/g, '');
        telegramChats.add(ctx.chat.id);

        if (digits.length >= 9 && digits.length <= 15) {
            ctx.reply(`⏳ Pair code generate කරමින්... \nNumber: ${digits}`);
            
            // Kill existing connection and start fresh with pairing
            const doPair = async () => {
                if (sock) {
                    try { sock.end(new Error('Pairing')); } catch(e) {}
                    await new Promise(r => setTimeout(r, 3000));
                }
                await startWhatsApp(digits);
            };
            
            doPair().catch(err => {
                ctx.reply(`❌ Error: ${err.message}`);
            });
        } else if (ctx.message.text.startsWith('/')) {
            // Commands handled above
        } else {
            ctx.reply('📱 කරුණාකර ඔබගේ WhatsApp number එක digits වලින් පමණක් එවන්න.\n\nඋදා: `9476XXXXXXX`');
        }
    });

    await tgBot.launch();
    log.info('🤹 Telegram Bot Started');
}

// ==================== MAIN ====================
async function main() {
    log.info('🚀 SHANA WhatsApp AI Bot v3.0 (Stable)');

    if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

    await startTelegram();

    const hasAuth = fs.existsSync(path.join(AUTH_DIR, 'creds.json'));
    if (hasAuth) {
        log.info('🔑 Existing auth. Auto-connecting...');
        setTimeout(() => {
            startWhatsApp().catch(err => log.error(err.message));
        }, 3000);
    } else {
        log.info('🆕 No auth. Waiting for Telegram pair request...');
    }

    process.on('SIGINT', () => {
        if (sock) try { sock.end(new Error('SIGINT')); } catch(e) {}
        if (tgBot) tgBot.stop();
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        if (sock) try { sock.end(new Error('SIGTERM')); } catch(e) {}
        process.exit(0);
    });
}

main().catch(err => {
    log.error(`💥 Fatal: ${err.message}`);
    process.exit(1);
});
