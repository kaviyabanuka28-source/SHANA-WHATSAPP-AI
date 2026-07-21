const { Client, LocalAuth } = require('whatsapp-web.js');
const { Telegraf } = require('telegraf');
const express = require('express');
const fs = require('fs');
const path = require('path');

// ==================== CHROMIUM PATH ====================
function findChrome() {
    const paths = [
        '/nix/store/*/bin/chromium',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        process.env.PUPPETEER_EXECUTABLE_PATH
    ];
    try {
        const storePath = '/nix/store/';
        if (fs.existsSync(storePath)) {
            const dirs = fs.readdirSync(storePath);
            const c = dirs.find(d => d.includes('chromium'));
            if (c) return `/nix/store/${c}/bin/chromium`;
        }
    } catch(e) {}
    for (const p of paths) {
        if (p && !p.includes('*') && fs.existsSync(p)) return p;
    }
    return null;
}
const CHROME = findChrome();
console.log(`🔍 Chrome: ${CHROME || 'auto-download'}`);

// ==================== CONFIG ====================
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const PORT = process.env.PORT || 8080;
const SESSION = path.join(__dirname, 'session');
const COOLDOWN = 20 * 60 * 1000;

let client = null;
let ready = false;
const cooldowns = {};
const chats = new Set();
function log(m) { console.log(`[${new Date().toLocaleTimeString()}] ${m}`); }
function tel(t) { for (const c of chats) { try { bot.telegram.sendMessage(c, t, { parse_mode: 'Markdown' }).catch(()=>{}); } catch(e){} } }

// ==================== EXPRESS ====================
const app = express();
app.get('/', (req,res) => res.json({status:ready?'connected':'disconnected'}));
app.get('/health', (req,res) => res.send('OK'));
app.listen(PORT, '0.0.0.0', () => log(`🌐 :${PORT}`));

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
5. SOCIAL MEDIA BOOST ( All Platform ) ✅
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

එසේ නොහැකි නම් පණිවිඩයක් එවීමට කාරුණිකවන්න .

✺ තෙවනපාර්ශවීය සල්ලි දැමීම් බාරගනු නොලැබේ ❌`,

opt2: `*❏ SHANA WITHDRAW  ADDRESS ✺*

_MINI Withdraw  Rs 250-/_

පියවර 1
* මුලින්ම 1Xbet app එක open කරන්න ඉන්පසු menu යන්න.
* *ඉන්පසු උඩම ඇති setting  අයිකන් එක ක්ලික් කරන්න*

*✺ ඉන්පසුව withdraw  කියාලා අයිකන් එකක් ඇති එක ඔබන්න ඉන්පස්සෙ 1XBET CASH කියන මෙතඩ් එක තෝරන්න පොඩ්ඩක් පහලට වෙන්න තියෙන්නේ*

➢ ඉන්පසු ඔබට ගන්න ඕනි ගාන ගහන්න.

❏ city: minneriya පුරවන්න
❏ street : Lakshan service (24/7)

පුරවගන්න ඉන් පසු ඔබට ඔබගේ gmail එකක් හෝ phone නම්බරයක් ඇඩ් කරලා තියෙනවානම් කොඩ් එකක් එයි එක දාලා කන්ෆර්ම් කරන්න.

 *➢ ඉන් පසුව app එකෙන් බැක් වී ආපසු app එකට ලොග් වී withdraw තැනට යන්න.*

➢ ඉන්පසු withdraw request කියාලා button එකක් ඇති එක ඔබන්න.

➢ ඉන් පසුව ඉංග්‍රීසි වචන සහිතව නිල්පාටින් වචන වගයක් ඇවිත් ඇති එහි ඇති get code කියලා එකක් අන්න එක ඔබන්න.

➢ එක ඔබන්නට පසුව එනවා code එකක් අන්න එක screen shot එකක් ගහලා ok කරලා මට එවන්න .

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
Call , Mg 24/7 Ok ✅`,

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
මතක් රැදීසිටින්න. හැකි ඉක්මනින් SHANA Online ගෙන්වා ගැනීමට උත්සහ කරන්නෙමී....  !
ඔහුට තිබෙන වැඩත් එක්ක ඔහු කාර්ය බහුල වී ඇති අතර ඉක්මනින් පැමිණෙනු ඇත...`
};

function getReply(t) {
    const m = { '1': MSG.opt1, '2': MSG.opt2, '3': MSG.opt3, '4': MSG.opt4, '5': MSG.opt5, '6': MSG.opt6, '7': MSG.opt7, '8': MSG.opt8 };
    return m[t.trim()] || null;
}

// ==================== WHATSAPP ====================
async function startWA(phone = null) {
    try {
        log('🔄 Starting WhatsApp...');
        if (phone) {
            try { fs.rmSync(SESSION, { recursive: true, force: true }); } catch(e) {}
            log('🧹 Session cleared');
        }
        if (!fs.existsSync(SESSION)) fs.mkdirSync(SESSION);

        const opts = { headless: true, args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-zygote','--single-process'] };
        if (CHROME) opts.executablePath = CHROME;

        client = new Client({
            authStrategy: new LocalAuth({ clientId: 's', dataPath: SESSION }),
            puppeteer: opts,
            webVersionCache: { type: 'remote', remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html' }
        });

        client.on('ready', () => {
            ready = true;
            log('✅ WhatsApp Connected!');
            tel('✅ *SHANA WhatsApp Bot Connected!* 🎉\nAuto-reply 24/7 system active.');
        });

        client.on('disconnected', r => { ready = false; log('⚠️ Disconnected: ' + r); });
        client.on('auth_failure', m => log('❌ Auth: ' + m));

        client.on('message', async msg => {
            try {
                if (msg.fromMe || msg.from.includes('@g.us') || msg.from === 'status@broadcast') return;
                const phone = msg.from.split('@')[0];
                const text = msg.body?.trim();
                if (!text) return;
                log(`📩 ${phone}: ${text.substring(0,40)}`);

                const now = Date.now();
                const last = cooldowns[msg.from] || 0;
                if ((now - last) < COOLDOWN && !['1','2','3','4','5','6','7','8'].includes(text)) return;

                const r = getReply(text);
                const rep = r ? r : `${MSG.welcome}\n\n${MSG.menu}`;
                await msg.reply(rep);
                cooldowns[msg.from] = now;
                log(`✅ Replied ${phone}`);
            } catch(e) { log('❌ ' + e.message); }
        });

        log('🔄 Launching browser...');
        await client.initialize();

        if (phone) {
            log(`🔑 Pairing ${phone}...`);
            setTimeout(async () => {
                try {
                    const code = await client.generatePairingCode(phone);
                    const fm = code.match(/.{1,4}/g)?.join('-') || code;
                    log(`✅ Code: ${fm}`);
                    tel(`🔑 *SHANA WhatsApp Pair Code*
━━━━━━━━━━━━━━━━━━━━━
🔑 *${fm}*
━━━━━━━━━━━━━━━━━━━━━

📱 *Connect කරන්න:*
1️⃣ WhatsApp → Settings
2️⃣ Linked Devices → Link a Device
3️⃣ Code එක Enter කරන්න

⏳ විනාඩි 2කින් Expire!`);
                } catch(e) { log('❌ Pair: ' + e.message); tel('❌ Pair code error. Send number again.'); }
            }, 6000);
        }
    } catch(e) {
        log('❌ Init: ' + e.message);
        if (phone) tel('❌ Error. Use /pair 94XXXXXXXXX');
    }
}

// ==================== TELEGRAM ====================
let bot;

async function startTG() {
    if (!TOKEN) { log('⚠️ NO TELEGRAM TOKEN!'); return; }
    bot = new Telegraf(TOKEN);

    bot.start(ctx => {
        chats.add(ctx.chat.id);
        ctx.reply(`👋 *SHANA WhatsApp Bot* 🤖

WhatsApp connect කරගැනීමට number එක එවන්න:

\`9476XXXXXXX\`

⚡ Code එක තත්පර 15-30 ඇතුලත!`);
    });

    bot.command('help', ctx => ctx.reply('/start - Pair\n/pair 94XX - Code generate\n/status - Status'));
    bot.command('status', ctx => ctx.reply(`📊 *Status*\nWhatsApp: ${ready?'✅ Connected':'❌ Disconnected'}\nUsers: ${Object.keys(cooldowns).length}\nUptime: ${Math.floor(process.uptime()/60)} min`));

    bot.command('pair', async ctx => {
        const a = ctx.message.text.split(' ');
        if (a.length < 2) return ctx.reply('Usage: /pair 9476XXXXXXX');
        const d = a[1].replace(/[^0-9]/g,'');
        if (d.length < 9) return ctx.reply('❌ Invalid');
        await ctx.reply('⏳ Generating...');
        try { if (client) await client.destroy(); } catch(e) {}
        ready = false;
        await new Promise(r => setTimeout(r, 1000));
        startWA(d);
    });

    bot.on('text', async ctx => {
        const t = ctx.message.text.trim();
        const d = t.replace(/[^0-9]/g,'');
        chats.add(ctx.chat.id);
        if (d.length >= 9 && d.length <= 15 && !t.startsWith('/')) {
            await ctx.reply('⏳ Generating Pair Code... (15-30s)');
            try { if (client) await client.destroy(); } catch(e) {}
            ready = false;
            await new Promise(r => setTimeout(r, 1000));
            startWA(d);
        } else if (!t.startsWith('/')) {
            ctx.reply('📱 Number එක එවන්න\n\nඋදා: \`9476XXXXXXX\`');
        }
    });

    await bot.launch();
    log('🤖 Telegram Ready!');

    const has = fs.existsSync(path.join(SESSION, 's'));
    if (has) { log('🔑 Found session...'); startWA(); }
    else log('📱 Send number to pair!');
}

// ==================== START ====================
log('🚀 SHANA WhatsApp AI Bot v8.0 FINAL');
if (!fs.existsSync(SESSION)) fs.mkdirSync(SESSION);
startTG();
process.on('SIGINT', async () => { try { if (client) await client.destroy(); } catch(e){} if (bot) bot.stop(); process.exit(0); });
process.on('SIGTERM', async () => { try { if (client) await client.destroy(); } catch(e){} process.exit(0); });
