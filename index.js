const { Client, LocalAuth } = require('whatsapp-web.js');
const { Telegraf } = require('telegraf');
const express = require('express');
const fs = require('fs');
const path = require('path');

// ==================== CHROMIUM PATH DETECT ====================
function findChromium() {
    const paths = [
        process.env.CHROMIUM_PATH,
        process.env.PUPPETEER_EXECUTABLE_PATH,
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/snap/bin/chromium',
        '/nix/store/*/bin/chromium'
    ];
    
    // Search nix store for chromium
    try {
        const storePath = '/nix/store/';
        if (fs.existsSync(storePath)) {
            const dirs = fs.readdirSync(storePath);
            const chromiumDir = dirs.find(d => d.includes('chromium'));
            if (chromiumDir) {
                return `/nix/store/${chromiumDir}/bin/chromium`;
            }
        }
    } catch(e) {}
    
    // Check common paths
    for (const p of paths) {
        if (p && !p.includes('*') && fs.existsSync(p)) return p;
    }
    
    return null;
}

const CHROMIUM_PATH = findChromium();
console.log(`🔍 Chromium path: ${CHROMIUM_PATH || 'NOT FOUND - using auto-download'}`);

// ==================== CONFIG ====================
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const PORT = process.env.PORT || 8080;
const SESSION_DIR = path.join(__dirname, 'session');
const COOLDOWN_MS = 20 * 60 * 1000;

// ==================== STATE ====================
let client = null;
let isReady = false;
let userCooldowns = new Map();
const telegramChats = new Set();
let currentPairPhone = null;

function log(m) { console.log(`[${new Date().toLocaleTimeString()}] ${m}`); }

// ==================== EXPRESS ====================
const app = express();
app.get('/', (req, res) => res.json({ status: isReady ? 'connected' : 'disconnected', uptime: process.uptime() }));
app.get('/health', (req, res) => res.send('OK'));
app.listen(PORT, '0.0.0.0', () => log('✅ Express :' + PORT));

// ==================== MESSAGES ====================
const MSG = {
    welcome: `AI BOT - ( SHANA )
SHANA AI BOT SYSTEM 🕹️
-----------------------------
HI සුබ දවසක් සර්,මිස් 😚

ඔබට අවශ්‍ය උපකාරය පවසන්න ! මම ඔබට සහය වීම සදහා බැදීසිටින්නේමී...!
-----------------------------`,

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

කරුණාකර අංකය ලබාදෙන්න!
--------------------------------
SOFTWARE DEVELOPER SHANA 🐛`,

    opt1: `💗🇱🇰🙏ආයුබෝවන්🙏🇱🇰💗
*1X BET සහ WITHDRAWAL*

💵💵 *මුදල් තැන්පත් කිරීම*💵💵
✅ Account Deposit / Withdraw

🔯 BOC - 94118758 - MINNERIYA - K.G LAKSHAN KAVISHKA KUMARA
✳️ PEOPLE BANK - 006200150094114 - K.G.LAKSHAN KAVISHKA KUMARA - HIGURAKGODA
✳️ ez cash - 0764104588 - LAKSHAN (අඩුම රු.20/-)
✡️ Binance - 1066282628 - LAKSHAN
🔯 ipay - 0764104588 - Lakshan
✡️ Dialog Finance PLC - 0010 2217 5776 - LAKSHAN KAVISHKA KUMARA

❏ DEPOSIT - min 2-5 😍
❏ WITHDRAW - min 10-30 😍
👉 REMARK යටතේ PLAYER ID අනිවාර්යයෙන්ම
✺ තෙවනපාර්ශවීය ගෙවීම් බාර නොගැනේ ❌`,

    opt2: `❏ SHANA WITHDRAW ✺
MINI Rs 250-/

1. 1Xbet app → Menu → Settings → Withdraw
2. 1XBET CASH method එක තෝරන්න
3. මුදල ඇතුලත් කරන්න
4. city: minneriya / street: Lakshan service (24/7)
5. Back → Login → Withdraw Request
6. Get Code → Screenshot → Send to me
✅`,

    opt3: `VIP 1XBET PROMO CODE
Lashan1x
👆👆👆👆
200% DEPOSIT BONUS ✅`,

    opt4: `0758862130/0742381405 🤝`,

    opt5: `0758862130/0742381405/0703557568
Call, MG 24/7 ✅`,

    opt6: `0758862130/0742381405 🤝`,

    opt7: `0758862130/0742381405 🤝`,

    opt8: `අඩුම මුදලට 24/7 AUTO reply Bot
0758862130 ✅`,

    defaultReply: `AI BOT -
මතක් රැදීසිටින්න. හැකි ඉක්මනින් SHANA Online ගෙන්වා ගැනීමට උත්සහ කරන්නෙමී....!
ඔහු කාර්ය බහුල වී ඇති අතර ඉක්මනින් පැමිණෙනු ඇත...`
};

function getReply(text) {
    const t = text.trim();
    const map = { '1': MSG.opt1, '2': MSG.opt2, '3': MSG.opt3, '4': MSG.opt4, '5': MSG.opt5, '6': MSG.opt6, '7': MSG.opt7, '8': MSG.opt8 };
    return map[t] || null;
}

function tgNotify(text) {
    for (const chatId of telegramChats) {
        try { tgBot.telegram.sendMessage(chatId, text, { parse_mode: 'Markdown' }).catch(() => {}); } catch(e) {}
    }
}

// ==================== WHATSAPP ====================
async function startWhatsApp(pairPhone = null) {
    try {
        log('🔄 Initializing WhatsApp...');
        
        if (pairPhone) {
            try { fs.rmSync(SESSION_DIR, { recursive: true, force: true }); } catch(e) {}
            log('🧹 Session cleaned');
        }
        
        if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

        const puppeteerOpts = {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-zygote',
                '--single-process'
            ]
        };
        
        // Set custom chromium path if found
        if (CHROMIUM_PATH) {
            puppeteerOpts.executablePath = CHROMIUM_PATH;
            log('🔧 Using system Chromium');
        } else {
            log('📥 Chromium will be auto-downloaded by puppeteer');
        }

        client = new Client({
            authStrategy: new LocalAuth({
                clientId: 'shana-bot',
                dataPath: SESSION_DIR
            }),
            puppeteer: puppeteerOpts,
            webVersionCache: {
                type: 'remote',
                remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
            }
        });

        client.on('ready', () => {
            isReady = true;
            log('✅ WhatsApp READY!');
            log(`   Number: ${client.info?.wid?.user || 'unknown'}`);
            tgNotify('✅ *SHANA WhatsApp Bot Connected!* 🎉');
            
            if (currentPairPhone) {
                tgNotify(`✅ *Successfully Connected!*\nWhatsApp Bot is now active 24/7.\nAuto-reply system running.`);
                currentPairPhone = null;
            }
        });

        client.on('disconnected', (reason) => {
            isReady = false;
            log('⚠️ Disconnected: ' + reason);
        });

        client.on('auth_failure', (msg) => {
            log('❌ Auth failure: ' + msg);
        });

        client.on('message', async (message) => {
            try {
                if (message.fromMe) return;
                if (message.from.includes('@g.us')) return;
                if (message.from === 'status@broadcast') return;

                const jid = message.from;
                const phone = jid.split('@')[0];
                const text = message.body?.trim();
                if (!text) return;

                log(`📩 ${phone}: "${text.substring(0, 40)}"`);

                const now = Date.now();
                const last = userCooldowns.get(jid) || 0;

                if ((now - last) < COOLDOWN_MS && !['1','2','3','4','5','6','7','8'].includes(text)) {
                    return;
                }

                const optionReply = getReply(text);
                let replyText;
                if (optionReply) {
                    replyText = optionReply;
                } else {
                    replyText = `${MSG.welcome}\n\n${MSG.menu}`;
                }

                await message.reply(replyText);
                userCooldowns.set(jid, now);
                log(`✅ Replied to ${phone}`);
            } catch (err) {
                log('❌ Msg: ' + err.message);
            }
        });

        log('🔄 Launching browser...');
        await client.initialize();
        
        // Generate pair code if requested
        if (pairPhone) {
            currentPairPhone = pairPhone;
            log(`🔑 Pairing ${pairPhone}...`);
            
            await new Promise(r => setTimeout(r, 5000));
            
            try {
                const code = await client.generatePairingCode(pairPhone);
                const formatted = code.match(/.{1,4}/g)?.join('-') || code;
                log(`✅ Pair code: ${formatted}`);
                
                const msg = `🔑 *SHANA WhatsApp Pair Code Ready!*
━━━━━━━━━━━━━━━━━━━━━
🔑 *${formatted}*
━━━━━━━━━━━━━━━━━━━━━

📱 *Connect කරන්න:*
1️⃣ WhatsApp Open කරන්න
2️⃣ Settings → Linked Devices → Link a Device
3️⃣ Code එක Enter කරන්න

⏳ Code expires in 2 minutes!`;
                
                tgNotify(msg);
            } catch (err) {
                log('❌ Pair code error: ' + err.message);
                tgNotify('❌ Pair code error. Send number again.');
            }
        }
    } catch (err) {
        log('❌ Init error: ' + err.message);
        if (pairPhone) {
            tgNotify('❌ WhatsApp error. Use /pair 94XXXXXXXXX again.');
        }
    }
}

// ==================== TELEGRAM ====================
let tgBot;

async function startTelegram() {
    if (!TELEGRAM_BOT_TOKEN) {
        log('⚠️ NO TELEGRAM_BOT_TOKEN! Add to Railway Variables!');
        return;
    }

    tgBot = new Telegraf(TELEGRAM_BOT_TOKEN);

    tgBot.start((ctx) => {
        telegramChats.add(ctx.chat.id);
        ctx.reply(
            `👋 *SHANA WhatsApp Bot* 🤖

WhatsApp connect කරගැනීමට number එක එවන්න:

\`9476XXXXXXX\`

⚡ Code එක තත්පර 15-30 ඇතුලත එයි!

*(අංකය: @BotFather ගෙන් නව Token එකක් ගත්තාද?)`
        );
    });

    tgBot.help((ctx) => {
        ctx.reply(`/start - Pair Code\n/pair 94XXXXXXXXX - Generate\n/status - Bot status`);
    });

    tgBot.command('status', (ctx) => {
        ctx.reply(`📊 *Status*
WhatsApp: ${isReady ? '✅ Connected' : '❌ Disconnected'}
Users: ${userCooldowns.size}
Uptime: ${Math.floor(process.uptime() / 60)} min`);
    });

    tgBot.command('pair', async (ctx) => {
        const args = ctx.message.text.split(' ');
        if (args.length < 2) {
            ctx.reply('Usage: /pair 9476XXXXXXX');
            return;
        }
        const digits = args[1].replace(/[^0-9]/g, '');
        if (digits.length < 9) {
            ctx.reply('❌ Invalid number');
            return;
        }
        await ctx.reply(`⏳ Generating pair code...`);
        try { if (client) await client.destroy(); } catch(e) {}
        isReady = false;
        await new Promise(r => setTimeout(r, 1000));
        await startWhatsApp(digits);
    });

    tgBot.on('text', async (ctx) => {
        const text = ctx.message.text.trim();
        const digits = text.replace(/[^0-9]/g, '');
        telegramChats.add(ctx.chat.id);

        if (digits.length >= 9 && digits.length <= 15 && !text.startsWith('/')) {
            await ctx.reply(`⏳ Generating Pair Code... (15-30 seconds)`);
            try { if (client) await client.destroy(); } catch(e) {}
            isReady = false;
            await new Promise(r => setTimeout(r, 1000));
            await startWhatsApp(digits);
        } else if (!text.startsWith('/')) {
            ctx.reply('📱 WhatsApp number එක එවන්න\n\nඋදා: `9476XXXXXXX`');
        }
    });

    await tgBot.launch();
    log('🤖 Telegram Bot Started!');
    
    const hasSession = fs.existsSync(path.join(SESSION_DIR, 'shana-bot'));
    if (hasSession) {
        log('🔑 Existing session found. Connecting...');
        startWhatsApp();
    } else {
        log('📱 Send number to Telegram to pair!');
    }
}

// ==================== MAIN ====================
async function main() {
    log('🚀 SHANA WhatsApp AI Bot v7.0 FINAL');
    log('');
    log('📌 Telegram Bot Token: ' + (TELEGRAM_BOT_TOKEN ? '✅ Set' : '❌ NOT SET'));
    log('📌 Chromium Path: ' + (CHROMIUM_PATH || 'Auto-download'));
    log('');

    if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

    await startTelegram();

    process.on('SIGINT', async () => {
        try { if (client) await client.destroy(); } catch(e) {}
        if (tgBot) tgBot.stop();
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        try { if (client) await client.destroy(); } catch(e) {}
        process.exit(0);
    });
}

main().catch(err => {
    log('❌ Fatal: ' + err.message);
    process.exit(1);
});
