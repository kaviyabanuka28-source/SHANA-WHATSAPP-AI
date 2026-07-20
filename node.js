const { Client, LocalAuth } = require('whatsapp-web.js');
const { execSync } = require('child_process');

// ========== COOLDOWN SYSTEM ==========
const userCooldowns = new Map();
const COOLDOWN_MS = 1000;

function canReply(userId) {
    const lastReply = userCooldowns.get(userId);
    if (lastReply && (Date.now() - lastReply) < COOLDOWN_MS) return false;
    return true;
}

// ========== CHROMIUM PATH DETECTION ==========
function findChromiumPath() {
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        const p = process.env.PUPPETEER_EXECUTABLE_PATH;
        if (p !== 'chromium' && p !== 'chromium-browser') return p;
    }
    try {
        const result = execSync(
            'which chromium 2>/dev/null || which chromium-browser 2>/dev/null || which google-chrome-stable 2>/dev/null || which google-chrome 2>/dev/null || echo ""'
        ).toString().trim();
        if (result) return result;
    } catch (_) {}
    const candidates = [
        '/home/user/.nix-profile/bin/chromium',
        '/run/current-system/sw/bin/chromium',
        '/nix/var/nix/profiles/default/bin/chromium',
    ];
    for (const p of candidates) {
        try { require('fs').accessSync(p); return p; } catch (_) {}
    }
    return undefined;
}

const chromiumPath = findChromiumPath();
if (chromiumPath) console.log(`🔍 Chromium path: ${chromiumPath}`);
else console.warn('⚠️ Chromium not found');

// ========== CLIENT CONFIG ==========
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth',
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-background-networking',
        ],
        executablePath: chromiumPath,
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1014553472.html',
    },
});

// ========== STATE ==========
let pairingCodeRequested = false;

// ========== REPLAY FUNCTION (message.reply වෙනුවට client.sendMessage) ==========
async function sendReply(message, text) {
    try {
        // sendMessage එක quotedMessageId එකත් එක්ක use කරනවා -> reply වගේමයි
        await client.sendMessage(message.from, text, {
            quotedMessageId: message.id._serialized
        });
        console.log(`✅ Reply sent to ${message.from}`);
        return true;
    } catch (e) {
        console.error(`❌ sendMessage failed for ${message.from}:`, e.message || e);
        // Fallback: without quote
        try {
            await client.sendMessage(message.from, text);
            console.log(`✅ Reply sent (without quote) to ${message.from}`);
            return true;
        } catch (e2) {
            console.error(`❌ sendMessage (fallback) also failed:`, e2.message || e2);
            return false;
        }
    }
}

// ========== AUTO-REPLY LOGIC ==========
async function handleIncomingMessage(message) {
    if (message.fromMe) return;
    
    const userId = message.from;
    const msg = message.body.toLowerCase().trim();
    
    console.log(`📨 From: ${userId} | Message: "${message.body}"`);

    // ----- Cooldown check -----
    if (!canReply(userId)) {
        console.log(`⏳ Cooldown active for ${userId}, skipping`);
        return;
    }

    let replyText = null;

    // ----- Greeting -----
    if (msg === 'hi' || msg === 'hello' || msg === 'හායි' || msg === 'හෙලෝ') {
        replyText = '🤖 SHANA AI BOT SYSTEM 🕹️\n-----------------------------\nHI සුබ දවසක් සර්,මිස් 😚\n\nඔබට අවශ්ශය උපකාරය පවසන්න ! මම ඔබට සහය වීම සදහා බැදීසිටින්නේමී...!';
    }
    // ----- Menu / Help -----
    else if (['menu', 'help', 'උදව්'].includes(msg)) {
        replyText = 'AI BOT -\n📜 SHANA All SERVICE \n\n1. SHANA 1XBET DEPOSIT තොරතුරු ✅\n2. SHANA 1XBET WITHDRAW තොරතුරු ✅\n3. SHANA 1XBET VIP PROMO CODE තොරතුරු ✅\n4. WEB SITE & SOFTWARE සාදාගැනිමට ✅\n5. SOCAL MEDIA BOOST ( All plate Form ) ✅\n6. AVIATOR HIGH ODD අනලයිසින් ඉගෙන ගැනිමටනම් ✅\n7. Whatsapp Ai Auto Replay Bot සාදාගැනිමටනම් ✅\n\nකරුණාකරලා ඔබට අවශ්ශය සෙවාව අංකය ලබාදෙන්න!..... \n\nSOFTWARE DEVELOPR SHANA 🐛';
    }
    // ----- Number options (1-7) -----
    else if (['1', '2', '3', '4', '5', '6', '7'].includes(msg)) {
        if (msg === '1') {
            replyText = '💗🇱🇰🙏ආයුබෝවන්🙏🇱🇰💗\n*1X BET සහ WITHDRAWAL ඉතා ඉක්මනින් ලබාගන්න...*\n\n*SHANA SERVICE __💯*\n\n💵💵 *මුදල් තැන්පත් කිරීම*💵💵\n✅ *Account Deposit*✅ *Account Withdraw*\n\n🔯 BOC: 94118758 (MINNERIYA - K.G LAKSHAN KAVISHKA KUMARA)\n✳️PEOPLE BANK: 006200150094114 (K.G.LAKSHAN KAVISHKA KUMARA)\n✳️ez cash: 0764104588 (LAKSHAN)\n✡️ Binanace: 1066282628 (LAKSHAN)\n🔯ipay: 0764104588 (Lakshan)\n✡️Dialog Finance PLC: 0010 2217 5776 (LAKSHAN KAVISHKA KUMARA)\n\n*❏ DEPOSIT - minute 2-5 😍*\n*❏ WITHDRAW - minute 10-30 😍*\n👉👉 *සැ.යු.* : ඔබ විසින් *REMARK* යටතේ ඔබගේ PLAYER ID සඳහන් කල යුතුමය.\nතවද 1X BET , BET යන වචන කිසි සේත්ම භාවිතා නොකල යුතුය...\n\n⚠️️ඉහත ක්‍රම හරහා *DEPOSIT* කර SLIP එක හා ඔබේ *1XBET PLAYER ID* type එවන්න.';
        } else if (msg === '2') {
            replyText = '*❏ SHANA WITHDRAW ADDRESS ✺*\n\n_MINI Withdraw Rs 250/_\nපියවර 1: 1Xbet app එක open කර menu යන්න.\n* ඉට පසු උඩම ඇති setting අයිකන් එක ක්ලික් කරන්න\n* ✺ ඉට පසුව withdraw Icon එක තෝරන්න.\n➢ ඉට පසු ඔබට ගන්න ඔනි ගාන ගහන්න.\n❏ city: minneriya\n❏ street : Lakshan service (24/7)\n\nඑම පියවර සම්පූර්ණ කර එන කොඩ් එකේ Screenshot එකක් මට එවන්න ✅';
        } else if (msg === '3') {
            replyText = 'VIP 1XBET PROMO CODE ඔයාල්ත් දැන්ම රෙජිස්ට වේන්න!... \n\nLashan1x\n👆👆👆👆\nLOST නොවී ගෙමක් ගහන්න කැමති අය දැන්ම ගිහින් 1XBET ACCOUNT එකක් හාදාගන්න\n200% DEPOSIT BONUS ✅';
        } else if (msg === '4' || msg === '6') {
            replyText = '0758862130 / 0742381405 Call එකකින් විස්තර දැනගන්න.... 🤝🤝🤝';
        } else if (msg === '5') {
            replyText = 'AI BOT - 0758862130 / 0742381405 / 0703557568\nCall, Mg 24/7 Ok ✅';
        } else if (msg === '7') {
            replyText = 'AI BOT -\nඔබට අඩුම මුදලට 24/7 AUTO reply Bot කෙනෙක් ඔබගේ නමින් හදාගැනීමට අවශ්‍යයිනම් පහල දුරකතන අංකයට අමතන්න: 0758862130 ✅';
        }
    }
    // ----- Default reply -----
    else {
        replyText = 'AI BOT -\nමතක් රැදීසීටින් හැකි ඉක්මනින් SHANA Online ගෙන්වා ගැනිමට උත්සහ කරන්නෙමී.... ! \nඔහුට තිබෙන වැඩත් එක්ක ඔහු කාර්රය බහුල වී ඇතී අතර ඉමනින් පැමිනේවී...';
    }

    // ----- Send the reply -----
    if (replyText) {
        const success = await sendReply(message, replyText);
        if (success) {
            userCooldowns.set(userId, Date.now());
        }
    }
}

// ================================================================
// ඔක්කොම EVENT LISTENERS මුලින්ම REGISTER කරන්න (initialize() ට කලින්)
// ================================================================

client.on('qr', async (qr) => {
    console.log('📱 QR received — requesting pairing code...');
    if (!pairingCodeRequested && process.env.WHATSAPP_NUMBER) {
        pairingCodeRequested = true;
        try {
            const pairingCode = await client.requestPairingCode(
                process.env.WHATSAPP_NUMBER, true
            );
            console.log('================================================');
            console.log(`🔢 Pairing Code: ${pairingCode}`);
            console.log('📱 WhatsApp → Linked Devices → Link with Phone Number');
            console.log('================================================');
        } catch (e) {
            console.error('❌ Pairing Code error:', e.message || e);
            pairingCodeRequested = false;
        }
    }
});

client.on('code', (code) => {
    console.log('================================================');
    console.log(`🔢 Pairing Code: ${code}`);
    console.log('================================================');
});

client.on('authenticated', () => {
    console.log('🔐 Authenticated!');
});

client.on('ready', () => {
    console.log('✅ Bot connected successfully! Auto-reply system ACTIVE ✅');
    pairingCodeRequested = false;
});

client.on('disconnected', (reason) => {
    console.log(`⚠️ Disconnected: ${reason || 'unknown'}`);
    pairingCodeRequested = false;
    setTimeout(() => {
        console.log('🔄 Reconnecting...');
        client.initialize();
    }, 5000);
});

client.on('auth_failure', (msg) => {
    console.error('❌ Auth failure:', msg);
    pairingCodeRequested = false;
});

// ========== *** MAIN MESSAGE HANDLER *** ==========
// message_create event එක ALL messages catch කරනවා (incoming + outgoing)
// මේක 'message' event එකට වඩා reliable
client.on('message_create', async (message) => {
    await handleIncomingMessage(message);
});

// ========== INITIALIZE ==========
console.log('🚀 Starting bot...');
client.initialize();
