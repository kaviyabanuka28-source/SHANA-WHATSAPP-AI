// ==================== NO dotenv! Railway env variables directly ====================
const { Client, LocalAuth } = require('whatsapp-web.js');
const { Telegraf } = require('telegraf');
const express = require('express');
const fs = require('fs');
const path = require('path');

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

function info(m) { console.log(`[${new Date().toLocaleTimeString()}] ✅ ${m}`); }
function warn(m) { console.log(`[${new Date().toLocaleTimeString()}] ⚠️ ${m}`); }
function error(m) { console.log(`[${new Date().toLocaleTimeString()}] ❌ ${m}`); }

// ==================== EXPRESS ====================
const app = express();
app.get('/', (req, res) => res.json({ status: isReady ? 'connected' : 'disconnected', uptime: process.uptime() }));
app.get('/health', (req, res) => res.send('OK'));
app.listen(PORT, '0.0.0.0', () => info(`Express :${PORT}`));

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

✳️ ez cash : 0764104588
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
👉👉 *සැ.යු.* : REMARK යටතේ PLAYER ID සඳහන් කල යුතුමය.
⚠️ 1X BET, BET වචන භාවිතා නොකල යුතුය...

👉සැ.යු.: මුදල් තැන්පත් කර මිනිත්තු 30ක් ඇතුලත් SLIP/SCREENSHOT එවන්න.
✺ තෙවනපාර්ශවීය සල්ලි දැමීම් බාරගනු නොලැබේ ❌`,

    opt2: `*❏ SHANA WITHDRAW ADDRESS ✺*

_MINI Withdraw Rs 250-/_

පියවර 1
* 1Xbet app එක open කරන්න → menu යන්න.
* උඩම ඇති setting අයිකන් එක ක්ලික් කරන්න
* withdraw කියාලා අයිකන් එක ඔබන්න
* 1XBET CASH method එක තෝරන්න

➢ ඕනි ගාන ගහන්න.
❏ city: minneriya
❏ street: Lakshan service (24/7)

➢ Back → Login → withdraw request → get code
➢ Code එක screenshot කරලා මට එවන්න.
එච්චරයි ✅`,

    opt3: `VIP 1XBET PROMO CODE
Lashan1x
👆👆👆👆
200% DEPOSIT BONUS ✅`,

    opt4: `0758862130/0742381405
Call එකකින් 🤝`,

    opt5: `AI BOT -0758862130/0742381405/0703557568
Call, MG 24/7 ✅`,

    opt6: `0758862130/0742381405
Call එකකින් 🤝`,

    opt7: `0758862130/0742381405
Call එකකින් 🤝`,

    opt8: `AI BOT - අඩුම මුදලට 24/7 AUTO reply Bot
0758862130 ✅`,

    defaultReply: `AI BOT -
මතක් රැදීසිටින්න. හැකි ඉක්මනින් SHANA Online ගෙන්වා ගැනීමට උත්සහ කරන්නෙමී....!
ඔහු කාර්ය බහුල වී ඇති අතර ඉක්මනින් පැමිණෙනු ඇත...`
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

// ==================== WHATSAPP CLIENT ====================
async function createWhatsAppClient(pairPhone = null) {
    info('🔄 Initializing WhatsApp Web Client...');
    
    if (pairPhone) {
        try { 
            fs.rmSync(SESSION_DIR, { recursive: true, force: true }); 
            info('🧹 Session cleaned for fresh pair');
        } catch(e) {}
    }
    
    if (!fs.existsSync(SESSION_DIR)) {
        fs.mkdirSync(SESSION_DIR, { recursive: true });
    }

    client = new Client({
        authStrategy: new LocalAuth({
            clientId: 'shana-bot',
            dataPath: SESSION_DIR
        }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-zygote',
                '--single-process'
            ]
        },
        webVersionCache: {
            type: 'remote',
            remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
        }
    });

    client.on('ready', () => {
        isReady = true;
        info('✅ WhatsApp READY!');
        info(`   Number: ${client.info?.wid?.user || 'unknown'}`);
        tgNotify('✅ *WhatsApp Bot Connected!*\nAuto-reply active 24/7 🎉');
    });

    client.on('disconnected', (reason) => {
        isReady = false;
        warn(`Disconnected: ${reason}`);
    });

    client.on('auth_failure', (msg) => {
        error(`Auth failure: ${msg}`);
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

            info(`📩 ${phone}: "${text.substring(0, 40)}"`);

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
            info(`✅ Replied to ${phone}`);
        } catch (err) {
            error(`Msg error: ${err.message}`);
        }
    });

    try {
        info('🔄 Launching Chromium browser...');
        await client.initialize();
        
        if (pairPhone) {
            info(`🔑 Generating pair code for ${pairPhone}...`);
            
            await new Promise(r => setTimeout(r, 5000));
            
            try {
                const code = await client.generatePairingCode(pairPhone);
                const formatted = code.match(/.{1,4}/g)?.join('-') || code;
                info(`✅ Pair code: ${formatted}`);
                
                const msg = `🔑 *SHANA WhatsApp Pair Code*
━━━━━━━━━━━━━━━━━━━━━
🔑 *${formatted}*
━━━━━━━━━━━━━━━━━━━━━

📱 *Connect කරන්න:*
1️⃣ WhatsApp → Settings
2️⃣ Linked Devices → *Link a Device*
3️⃣ Code එක Enter කරන්න: *${formatted}*

⏳ විනාඩි 2කින් Expire!`;
                
                tgNotify(msg);
            } catch (pairErr) {
                error(`Pair code: ${pairErr.message}`);
                tgNotify(`❌ Error: ${pairErr.message}\n\nTry again with /pair command.`);
            }
        }
    } catch (initErr) {
        error(`Init error: ${initErr.message}`);
        if (pairPhone) {
            tgNotify(`❌ WhatsApp init error. Use /pair again.`);
        }
    }
}

// ==================== TELEGRAM ====================
let tgBot;

async function startTelegram() {
    if (!TELEGRAM_BOT_TOKEN) {
        warn('No TELEGRAM_BOT_TOKEN in environment!');
        info('Add TELEGRAM_BOT_TOKEN in Railway Variables');
        return;
    }

    tgBot = new Telegraf(TELEGRAM_BOT_TOKEN);

    tgBot.start((ctx) => {
        telegramChats.add(ctx.chat.id);
        ctx.reply(
            `👋 *SHANA WhatsApp Bot* 🤖

WhatsApp bot connect කරගැනීමට number එක එවන්න:

\`9476XXXXXXX\`

⚡ Code එක තත්පර 15-30 ඇතුලත එයි!`
        );
    });

    tgBot.command('help', (ctx) => {
        ctx.reply(`/start - Pair Code\n/pair 94XXXXXXXXX - Generate code\n/status - Bot status`);
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
            ctx.reply('Usage: /pair 94XXXXXXXXX');
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
        await createWhatsAppClient(digits);
    });

    tgBot.on('text', async (ctx) => {
        const text = ctx.message.text.trim();
        const digits = text.replace(/[^0-9]/g, '');
        telegramChats.add(ctx.chat.id);

        if (digits.length >= 9 && digits.length <= 15 && !text.startsWith('/')) {
            await ctx.reply(`⏳ Generating WhatsApp Pair Code...`);
            try { if (client) await client.destroy(); } catch(e) {}
            isReady = false;
            await new Promise(r => setTimeout(r, 1000));
            await createWhatsAppClient(digits);
        } else if (!text.startsWith('/')) {
            ctx.reply('📱 ඔබගේ WhatsApp number එක එවන්න\n\nඋදා: `9476XXXXXXX`');
        }
    });

    await tgBot.launch();
    info('🤖 Telegram Bot Started');

    const hasSession = fs.existsSync(path.join(SESSION_DIR, 'shana-bot'));
    if (hasSession) {
        info('🔑 Existing session. Auto-connecting...');
        createWhatsAppClient();
        tgNotify('🔄 *SHANA Bot Restarted*\nAuto-connecting...');
    } else {
        info('📱 Send number to Telegram bot to pair!');
    }
}

// ==================== MAIN ====================
async function main() {
    info('🚀 SHANA WhatsApp AI Bot v6.0');
    info('⚡ 100% Railway Compatible');
    info('');

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
    error(`Fatal: ${err.message}`);
    process.exit(1);
});
