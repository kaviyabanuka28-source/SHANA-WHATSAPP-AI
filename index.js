require('dotenv').config();

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
let pairingCode = null;
let userCooldowns = new Map();
const telegramChats = new Set();
const log = { 
    info: (m) => console.log(`[${new Date().toLocaleTimeString()}] ✅ ${m}`),
    warn: (m) => console.log(`[${new Date().toLocaleTimeString()}] ⚠️ ${m}`),
    error: (m) => console.log(`[${new Date().toLocaleTimeString()}] ❌ ${m}`)
};

// ==================== EXPRESS ====================
const app = express();
app.get('/', (req, res) => res.json({ status: isReady ? 'connected' : 'disconnected', uptime: process.uptime() }));
app.get('/health', (req, res) => res.send('OK'));
app.listen(PORT, '0.0.0.0', () => log.info(`Express :${PORT}`));

// ==================== MESSAGES (ඔබේ පරිදිම 100%) ====================
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
👉👉 *සැ.යු.* : ඔබ විසින් *REMARK* යටතේ ඔබගේ PLAYER ID සඳහන් කල යුතුමය.
තවද 1X BET, BET යන වචන කිසි සේත්ම භාවිතා නොකල යුතුය...

⚠️️ඉහත ක්‍රම හරහා *DEPOSIT* කර
SLIP* එක හා ඔබේ *1XBET PLAYER ID* *type එවන්න*

👉සැ.යු.: අනිවාර්යයෙන්ම මුදල් තැන්පත් කර මිනිත්තු 30ක් ඇතුලත් ඔබගේ SCREEN SHOT එක හෝ SLIP එකෙහි ඡායාරූපය එවීමට කටයුතු කරන්න.

✺ තෙවනපාර්ශවීය සල්ලි දැමීම් බාරගනු නොලැබේ ❌`,

    opt2: `*❏ SHANA WITHDRAW ADDRESS ✺*

_MINI Withdraw Rs 250-/_

පියවර 1
* මුලින්ම 1Xbet app එක open කරන්න ඉන්පසු menu යන්න.
* *ඉන්පසු උඩම ඇති setting අයිකන් එක ක්ලික් කරන්න*

*✺ ඉන්පසුව withdraw කියාලා අයිකන් එකක් ඇති එක ඔබන්න ඉන්පස්සෙ 1XBET CASH කියන මෙතඩ් එක තෝරන්න*

➢ ඉන්පසු ඔබට ගන්න ඕනි ගාන ගහන්න.
❏ city: minneriya පුරවන්න
❏ street: Lakshan service (24/7)

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

// ==================== WHATSAPP CLIENT ====================
async function createWhatsAppClient(pairPhone = null) {
    log.info('🔄 Initializing WhatsApp Web Client (Chromium)...');
    
    // Clean old session if pairing fresh
    if (pairPhone) {
        try { 
            fs.rmSync(SESSION_DIR, { recursive: true, force: true }); 
            log.info('🧹 Cleared old session for fresh pair');
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
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null
        },
        webVersionCache: {
            type: 'remote',
            remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
        }
    });

    // ---- EVENTS ----
    client.on('qr', (qr) => {
        log.info('📱 QR code received (backup method)');
        tgNotify(`📱 *QR Code generated* (backup)\nScan with WhatsApp to connect.`);
    });

    client.on('authenticated', () => {
        log.info('🔐 Authenticated');
    });

    client.on('auth_failure', (msg) => {
        log.error(`Auth failure: ${msg}`);
    });

    client.on('ready', () => {
        isReady = true;
        log.info('✅ WhatsApp Client READY!');
        log.info(`   Number: ${client.info?.wid?.user || 'unknown'}`);
        tgNotify('✅ *WhatsApp Bot Connected!*\nAuto-reply system active 24/7 🎉');
    });

    client.on('disconnected', (reason) => {
        isReady = false;
        log.warn(`Disconnected: ${reason}`);
        // Don't auto-reconnect - wait for Telegram command
    });

    // ---- MESSAGES ----
    client.on('message', async (message) => {
        try {
            if (message.fromMe) return;
            if (message.from.includes('@g.us')) return; // group messages
            if (message.from === 'status@broadcast') return;

            const jid = message.from;
            const phone = jid.split('@')[0];
            const text = message.body?.trim();
            if (!text) return;

            log.info(`📩 ${phone}: "${text.substring(0, 40)}"`);

            const now = Date.now();
            const last = userCooldowns.get(jid) || 0;

            // Cooldown check
            if ((now - last) < COOLDOWN_MS && !['1','2','3','4','5','6','7','8'].includes(text)) {
                log.info(`⏳ Cooldown ${phone}`);
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
            log.info(`✅ Replied to ${phone}`);
        } catch (err) {
            log.error(`❌ Msg error: ${err.message}`);
        }
    });

    // ---- INITIALIZE & PAIR ----
    try {
        log.info('🔄 Launching Chromium browser...');
        await client.initialize();
        
        // If pairing requested, generate pair code
        if (pairPhone) {
            log.info(`🔑 Generating pair code for ${pairPhone}...`);
            
            // Wait for client to be slightly initialized
            await new Promise(r => setTimeout(r, 3000));
            
            try {
                const code = await client.generatePairingCode(pairPhone);
                const formatted = code.match(/.{1,4}/g)?.join('-') || code;
                log.info(`✅ Pair code: ${formatted}`);
                
                const msg = `🔑 *SHANA WhatsApp Pair Code එක සූදානම්!*
━━━━━━━━━━━━━━━━━━━━━
🔑 *${formatted}*
━━━━━━━━━━━━━━━━━━━━━

📱 *WhatsApp එකට Connect කරගන්න:*
1️⃣ WhatsApp Open කරන්න
2️⃣ Settings → Linked Devices → *Link a Device*
3️⃣ Code එක Enter කරන්න: *${formatted}*

⚡ Code එක විනාඩි 2කින් Expire!
👉 ඉක්මනින් කරන්න!`;
                
                tgNotify(msg);
            } catch (pairErr) {
                log.error(`❌ Pair code error: ${pairErr.message}`);
                tgNotify(`❌ Pair code error: ${pairErr.message}\n\nTry: /pair 94XXXXXXXXX`);
            }
        }
    } catch (initErr) {
        log.error(`❌ Initialization error: ${initErr.message}`);
        if (pairPhone) {
            tgNotify(`❌ WhatsApp init error: ${initErr.message}\n\nTry again with /pair command.`);
        }
    }

    return client;
}

// ==================== TELEGRAM BOT ====================
let tgBot;

async function startTelegram() {
    if (!TELEGRAM_BOT_TOKEN) {
        log.warn('No TELEGRAM_BOT_TOKEN set');
        return;
    }

    tgBot = new Telegraf(TELEGRAM_BOT_TOKEN);

    tgBot.start((ctx) => {
        telegramChats.add(ctx.chat.id);
        ctx.reply(
            `👋 *SHANA WhatsApp Bot Controller* 🤖

WhatsApp bot එක connect කරගැනීමට *number එක එවන්න*:

\`94XXXXXXXXX\`

*(උදා: 9476XXXXXXX)*

⚡ Pair Code එක තත්පර 15-30 ඇතුලත එයි!`
        );
    });

    tgBot.command('help', (ctx) => {
        ctx.reply(
            `📋 *Commands:*
/start - නව Pair Code එකක්
/pair 94XXXXXXXXX - Pair Code generate
/status - Bot status
/restart - සියල්ල restart`
        );
    });

    tgBot.command('status', (ctx) => {
        ctx.reply(
            `📊 *SHANA Bot Status*

WhatsApp: ${isReady ? '✅ Connected' : '❌ Disconnected'}
Users: ${userCooldowns.size}
Uptime: ${Math.floor(process.uptime() / 60)} min`
        );
    });

    tgBot.command('restart', async (ctx) => {
        await ctx.reply('🔄 Restarting everything...');
        try { 
            if (client) await client.destroy(); 
        } catch(e) {}
        try { 
            fs.rmSync(SESSION_DIR, { recursive: true, force: true }); 
        } catch(e) {}
        isReady = false;
        await ctx.reply('✅ Cleaned. Send your number to pair again.');
    });

    tgBot.command('pair', async (ctx) => {
        const args = ctx.message.text.split(' ');
        if (args.length < 2) {
            ctx.reply('Usage: /pair 94XXXXXXXXX');
            return;
        }
        const digits = args[1].replace(/[^0-9]/g, '');
        if (digits.length < 9) {
            ctx.reply('❌ Invalid number. Use /pair 94XXXXXXXXX');
            return;
        }
        await ctx.reply(`⏳ Generating WhatsApp Pair Code for ${digits}...`);
        
        // Destroy old client
        try { if (client) await client.destroy(); } catch(e) {}
        isReady = false;
        
        await new Promise(r => setTimeout(r, 1000));
        
        // Create new client with pairing
        await createWhatsAppClient(digits);
    });

    // Handle phone number input
    tgBot.on('text', async (ctx) => {
        const text = ctx.message.text.trim();
        const digits = text.replace(/[^0-9]/g, '');
        telegramChats.add(ctx.chat.id);

        if (digits.length >= 9 && digits.length <= 15 && !text.startsWith('/')) {
            await ctx.reply(`⏳ WhatsApp Pair Code Generate කරමින්...\n📱 Number: ${digits}\n⏱️ කරුණාකර තත්පර 15-30ක් රැදීසිටින්න...`);
            
            // Destroy old client
            try { if (client) await client.destroy(); } catch(e) {}
            isReady = false;
            
            await new Promise(r => setTimeout(r, 1000));
            
            // Create new client with pairing
            await createWhatsAppClient(digits);
        } else if (!text.startsWith('/')) {
            await ctx.reply('📱 ඔබගේ WhatsApp number එක එවන්න\n\nඋදා: \`9476XXXXXXX\`');
        }
    });

    await tgBot.launch();
    log.info('🤖 Telegram Bot Started');

    // Check for existing session
    const hasSession = fs.existsSync(path.join(SESSION_DIR, 'shana-bot'));
    if (hasSession) {
        log.info('🔑 Existing session found. Auto-connecting...');
        createWhatsAppClient();
        tgNotify('🔄 *SHANA Bot Restarted*\nAuto-connecting with existing session...');
    } else {
        tgNotify('🆕 *SHANA WhatsApp Bot Started!*\nSend your number to generate Pair Code.');
    }
}

// ==================== MAIN ====================
async function main() {
    log.info('🚀 SHANA WhatsApp AI Bot v5.0 (whatsapp-web.js)');
    log.info('⚡ 100% Railway Compatible');

    if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

    await startTelegram();

    process.on('SIGINT', async () => {
        log.info('Shutting down...');
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
    log.error(`Fatal: ${err.message}`);
    process.exit(1);
});
