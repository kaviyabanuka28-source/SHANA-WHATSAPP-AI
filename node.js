const { Client, LocalAuth } = require('whatsapp-web.js');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ========== COOLDOWN (20 min) ==========
const COOLDOWN_MS = 20 * 60 * 1000;
const userStates = new Map();

function canReply(userId) {
    const data = userStates.get(userId);
    if (!data) return true;
    return (Date.now() - data.lastReplyAt) >= COOLDOWN_MS;
}

// ========== CHROMIUM PATH (Railway Nixpacks compatible) ==========
function findChromiumPath() {
    // PUPPETEER_EXECUTABLE_PATH check
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        const p = process.env.PUPPETEER_EXECUTABLE_PATH;
        // Railway nixpacks වල "chromium" විතරක් දාලා තියෙනවා නම් full path search කරන්න
        if (p === 'chromium' || p === 'chromium-browser') {
            // which command එකෙන් හොයන්න
        } else {
            return p;
        }
    }
    
    // which command එකෙන් හොයන්න
    try {
        const result = execSync(
            'which chromium 2>/dev/null || which chromium-browser 2>/dev/null || ' +
            'which google-chrome-stable 2>/dev/null || which google-chrome 2>/dev/null || echo ""'
        ).toString().trim();
        if (result) return result;
    } catch (_) {}
    
    // Common paths
    const candidates = [
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/nix/store/*/bin/chromium',  // Nixpacks
        '/home/user/.nix-profile/bin/chromium',
        '/run/current-system/sw/bin/chromium',
        '/nix/var/nix/profiles/default/bin/chromium',
        '/snap/bin/chromium'
    ];
    
    // Glob pattern support නැති නිසා fs.readdirSync භාවිතා කරන්න
    try {
        const nixStore = '/nix/store';
        if (fs.existsSync(nixStore)) {
            const dirs = fs.readdirSync(nixStore);
            for (const dir of dirs) {
                if (dir.includes('chromium')) {
                    const p = path.join(nixStore, dir, 'bin', 'chromium');
                    if (fs.existsSync(p)) return p;
                }
            }
        }
    } catch (_) {}
    
    for (const p of candidates) {
        if (p.includes('*')) continue; // skip glob ones
        try { fs.accessSync(p); return p; } catch (_) {}
    }
    
    return undefined;
}

const chromiumPath = findChromiumPath();
if (chromiumPath) {
    console.log(`🔍 Chromium path: ${chromiumPath}`);
    // PUPPETEER_EXECUTABLE_PATH set කරන්න නැත්තම්
    if (!process.env.PUPPETEER_EXECUTABLE_PATH) {
        process.env.PUPPETEER_EXECUTABLE_PATH = chromiumPath;
    }
} else {
    console.warn('⚠️ Chromium not found - will use system default');
}

// Session path
const SESSION_PATH = './.wwebjs_auth';

// ========== CLIENT ==========
const client = new Client({
    authStrategy: new LocalAuth({ dataPath: SESSION_PATH }),
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
});

// ========== MESSAGE TEMPLATES (ඔබේ එලෙසම) ==========
const MSG_WELCOME = 
`AI BOT - 
SHANA AI BOT SYSTEM 🕹️
-----------------------------
HI සුබ දවසක් සර්,මිස් 😚

ඔබට අවශ්ශය උපකාරය පවසන්න ! මම ඔබට සහය වීම සදහා බැදීසිටින්නේමී...!`;

const MSG_MENU = 
`AI BOT -
📜 SHANA All SERVICE 

1. SHANA 1XBET DEPOSIT තොරතුරු ✅
2. SHANA 1XBET WITHDRAW තොරතුරු ✅
3. SHANA 1XBET VIP PROMO CODE තොරතුරු ✅
4. WEB SITE & SOFTWARE සාදාගැනිමට ✅
5. SOCAL MRDIA BOOST ( All plate Fom ) 
5. SHANA CONTACTS කරගැනිමට ✅
6. AVIATOR HIGH ODD අනලයිසින් ඉගෙන ගැනිමටනම් ✅
7.Whatsapp Ai Auto Replay Bot සාදාගැනිමටනම් ✅

කරුණාකරලා ඔබට අවශ්ශය සෙවාව උඩ Menu එකේ ඇත්නම් එම අංකය ලාබාදෙන්න!..... 

ඔබට වෙනත් කරුණක් දැන්විමට අවශ්ශයනම් පහලින් සදහන් කරන්න මම එය ඉතාමත් ඉක්මනට SHANA වේත දැන්වීමට සලස්වන්නම් 
--------------------------------
SOFTWARE DEVELOPR SHANA 🐛`;

const MSG_OPT1 = 
`💗🇱🇰🙏ආයුබෝවන්🙏🇱🇰💗
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

 *❏ DEPOSIT - minute 2-5 😍* 
 *❏ WITHDRAW - minute 10-30 😍* 
👉👉 *සැ.යු.* : ඔබ විසින් *REMARK* යටතේ ඔබගේ PLAYER ID සඳහන් කල යුතුමය.
තවද 1X BET   , BET යන වචන කිසි සේත්ම භාවිතා නොකල යුතුය...

⚠️️ඉහත ක්‍රම හරහා *DEPOSIT*  කර 
 SLIP* එක හා ඔබේ *1XBET PLAYER ID* *type එවන්න* 

👉සැ.යු. : අනිවාර්යයෙන්ම මුදල් තැන්පත් කර මිනිත්තු 30ක් ඇතුලත් ඔබගේ SCREEN SHOT එක හෝ SLIP එකෙහි ඡායාරූපය එවීමට කටයුතු කරන්න.

එසේ නොහැකි නම් පණිවිඩයක් එවීමට කාරුණිකවන්න .

✺ තෙවනපාර්ශවීය සල්ලි දැමිම් බාරගනු නොලැබේ ❌`;

const MSG_OPT2 = 
`*❏ SHANA WITHDRAW  ADDRESS ✺*

 

 _MINI Withdraw  Rs 250-/_ 
පියවර 1 
* මුලින්ම 1Xbet app එක open කරන්න ඉට පසු menu යන්න. 
 * *ඉට පසු උඩම ඇති setting  අයිකන් එකක් එක ක්ලික් කරන්න*

 *✺ ඉට පසුව withdraw  කියලා අයිකන් එකක් ඇති එක ඔබන්න ඉට පස්සෙ 1XBET CASH කියන් මේතඩ් එක තොරන්න පොඩ්ඩක් පහලට වේන්න තියෙන්නේ*

➢ ඉට පසු ඔබට ගන්න ඔනි ගාන ගහන්න.

❏ city: minneriya පුරවන්න
❏ street : Lakshan service (24/7) 

පුරවගන්න ඉන් පසු ඔබට ඔබගේ gamil එකක් හො phone නම්බ එකක් ඇඩ් කරලා තියේනවානම් කොඩ් එකක් එයි එක දිලා කන්පොම් කරන්න.

 *➢ ඉන් පසුව ඇප් එකේන් බැක් වී ආපාසු ඇප් එකට ලොග් වී විත්‍රොල් තැනට යන්න.* 

➢ ඉට පඩු විත්‍රොල් රේපුස්ට කියලා බටන් එකක් ඇති එක ඔබන්න.

➢ ඉන් පසුව ඉංග්‍රිසි වචන සහිතව නිල්පාටින් වචන වගයක් ඇවිත් ඇති එහි ඇති ගෙට් කොඩ් කියලා එකක් අන්න එක ඔබන්න.

➢ එක ඔබවුවට පසුව එනවා කොඩ් එකක් අන්න එකි ස්ක්‍රින් ශොට් එකක් ගහලා ok කරලා මට එවන්න .

එච්චරයි ✅`;

const MSG_OPT3 = 
`VIP 1XBET PROMO CODE ඔයාල්ත් දැන්ම රෙජිස්ට වේන්න!...

Lashan1x
👆👆👆👆
LOST නොවී ගෙමක් ගහන්න කැමති අය දැන්ම ගිහින් 1XBET ACCOUNT එකක් හාදාගන්න
200% DEPOSIT BONUS ✅`;

const MSG_OPT4 = 
`AI BOT -
0758862130/0742381405 Call එකකින් විස්තර දැනගන්න....
🤝🤝🤝🤝🤝🤝🤝🤝`;

const MSG_OPT5 = 
`AI BOT -0758862130/0742381405/0703557568
Call , Mg 24/7 Ok ✅`;

const MSG_OPT6 = 
`AI BOT -
0758862130/0742381405 Call එකකින් විස්තර දැනගන්න....
🤝🤝🤝🤝🤝🤝🤝🤝`;

const MSG_OPT7 = 
`AI BOT -
 ඔබට අඩුම මුදලට 24/7 AUTO reply Bot කෙනෙක් ඔබගේ නමින් හාදාගැනිමට අවශ්ශයයිනම් පහල දුරකතන අංකයට අමතන්න 0758862130 ✅`;

const MSG_DEFAULT = 
`AI BOT -
මතක් රැදීසීටින් හැකි ඉක්මනින් SHANA Online ගෙන්වා ගැනිමට උත්සහ කරන්නෙමී....  ! 
ඔහුට තිබෙන වැඩත් එක්ක ඔහු කාර්රය බහුල වී ඇතී අතර ඉමනින් පැමිනේවී...`;

// ========== AUTO-REPLY LOGIC (FIXED) ==========
async function handleMessage(message) {
    // Ignore own messages
    if (message.fromMe) return;

    const userId = message.from;
    const msgBody = message.body.trim().toLowerCase();

    console.log(`\n📨 Message from: ${userId}`);
    console.log(`💬 Content: "${message.body.trim()}"`);

    // Initialize user state
    if (!userStates.has(userId)) {
        userStates.set(userId, { state: 0, lastReplyAt: 0 });
        console.log(`🆕 New user state initialized: ${userId}`);
    }

    const userData = userStates.get(userId);

    // Cooldown check
    if (!canReply(userId)) {
        const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - userData.lastReplyAt)) / 60000);
        console.log(`⏳ Cooldown active for ${userId} — ${remaining} min remaining`);
        return;
    }

    let replyText = '';
    let nextState = userData.state;

    try {
        if (userData.state === 0) {
            // State 0: Send WELCOME
            replyText = MSG_WELCOME;
            nextState = 1;
            console.log(`➡️ State 0 → 1: Sending WELCOME`);
        }
        else if (userData.state === 1) {
            // State 1: Send MENU
            replyText = MSG_MENU;
            nextState = 2;
            console.log(`➡️ State 1 → 2: Sending MENU`);
        }
        else {
            // State 2+: Check menu options
            const msg = msgBody.trim();

            if (msg === 'menu' || msg === 'help' || msg === 'උදව්') {
                replyText = MSG_MENU;
                console.log(`➡️ State 2: MENU requested`);
            }
            else if (msg === '1') {
                replyText = MSG_OPT1;
                console.log(`➡️ State 2: OPTION 1`);
            }
            else if (msg === '2') {
                replyText = MSG_OPT2;
                console.log(`➡️ State 2: OPTION 2`);
            }
            else if (msg === '3') {
                replyText = MSG_OPT3;
                console.log(`➡️ State 2: OPTION 3`);
            }
            else if (msg === '4') {
                replyText = MSG_OPT4;
                console.log(`➡️ State 2: OPTION 4`);
            }
            else if (msg === '5') {
                replyText = MSG_OPT5;
                console.log(`➡️ State 2: OPTION 5`);
            }
            else if (msg === '6') {
                replyText = MSG_OPT6;
                console.log(`➡️ State 2: OPTION 6`);
            }
            else if (msg === '7') {
                replyText = MSG_OPT7;
                console.log(`➡️ State 2: OPTION 7`);
            }
            else {
                replyText = MSG_DEFAULT;
                console.log(`➡️ State 2: DEFAULT reply (unknown: "${msgBody}")`);
            }
        }

        if (replyText) {
            console.log(`📤 Sending reply to ${userId}...`);
            
            // Mark as seen
            try {
                const chat = await message.getChat();
                await chat.sendSeen();
            } catch (_) {}
            
            // Send message
            await client.sendMessage(userId, replyText);
            
            // Update state and cooldown
            userData.state = nextState;
            userData.lastReplyAt = Date.now();
            
            console.log(`✅ Reply sent! State: ${nextState}`);
        }
    } catch (error) {
        console.error(`❌ Error handling ${userId}:`, error.message || error);
    }
}

// ========== PAIRING CODE WITH RETRY LOGIC ==========
let pairingCodeRequested = false;
let pairingRetryCount = 0;
const MAX_RETRIES = 5;

async function requestPairingCodeWithRetry() {
    if (!process.env.WHATSAPP_NUMBER || pairingCodeRequested) return;
    
    pairingCodeRequested = true;
    const phoneNumber = process.env.WHATSAPP_NUMBER.replace(/[^0-9]/g, ''); // අංක විතරක් ගන්න
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`\n🔑 Pairing code attempt ${attempt}/${MAX_RETRIES} for ${phoneNumber}...`);
            
            const code = await client.requestPairingCode(phoneNumber, true);
            
            console.log('================================================');
            console.log(`🔢✅ Pairing Code: ${code}`);
            console.log('📱 WhatsApp → Linked Devices → Link with Phone Number');
            console.log('📱 Enter this code: ' + code);
            console.log('================================================');
            return; // Success!
        } catch (err) {
            console.error(`❌ Attempt ${attempt} failed:`, err.message || err);
            
            if (attempt < MAX_RETRIES) {
                const delay = attempt * 3000; // 3s, 6s, 9s, 12s, 15s
                console.log(`⏳ Retrying in ${delay/1000} seconds...`);
                await new Promise(r => setTimeout(r, delay));
            } else {
                console.error('❌ All retry attempts failed!');
                pairingCodeRequested = false; // Reset for next QR event
            }
        }
    }
}

// ========== WAIT FOR PAGE READY THEN REQUEST PAIRING ==========
async function waitForPageAndPair() {
    console.log('⏳ Waiting for WhatsApp Web page to initialize...');
    
    // Wait for the puppeteer page to be available
    let pageReady = false;
    for (let i = 0; i < 30; i++) { // Try for 30 seconds
        try {
            if (client.pupPage) {
                // Check if page is actually responsive
                await client.pupPage.evaluate(() => 1 + 1);
                pageReady = true;
                console.log('✅ Page is ready!');
                break;
            }
        } catch (_) {}
        await new Promise(r => setTimeout(r, 1000));
    }
    
    if (pageReady) {
        // Wait additional time for WhatsApp Web internal JS to load
        console.log('⏳ Waiting for WhatsApp Web internal modules (5s)...');
        await new Promise(r => setTimeout(r, 5000));
        await requestPairingCodeWithRetry();
    } else {
        console.error('❌ Page did not become ready within 30 seconds');
        // Try anyway as backup
        setTimeout(requestPairingCodeWithRetry, 10000);
    }
}

// ========== EVENTS (FIXED) ==========

// loading_screen: track progress
client.on('loading_screen', (percent, message) => {
    console.log(`⏳ Loading: ${percent}% - ${message}`);
    
    if (percent === 100 && !pairingCodeRequested && process.env.WHATSAPP_NUMBER) {
        console.log('📄 Page 100% loaded! Waiting before pairing...');
        setTimeout(waitForPageAndPair, 2000);
    }
});

// QR code backup
client.on('qr', (qr) => {
    console.log('📱 QR Code received from WhatsApp Web');
    
    if (!pairingCodeRequested && process.env.WHATSAPP_NUMBER) {
        console.log('📱 QR received - will attempt pairing code in 8 seconds...');
        setTimeout(waitForPageAndPair, 8000);
    }
});

// Pairing code event (for newer versions that support pairWithPhoneNumber)
client.on('code', (code) => {
    console.log('================================================');
    console.log(`🔢✅ Pairing Code (from code event): ${code}`);
    console.log('📱 WhatsApp → Linked Devices → Link with Phone Number');
    console.log('================================================');
    pairingCodeRequested = true;
});

client.on('authenticated', () => {
    console.log('🔐 Authenticated successfully! Session saved.');
});

client.on('ready', () => {
    console.log('\n✅✅✅ Bot සාර්ථකව සම්බන්ධ විය! Auto-reply ACTIVE ✅✅✅');
    console.log('📌 Users can now message this number for auto-replies!\n');
});

client.on('disconnected', (reason) => {
    console.log(`⚠️ Disconnected: ${reason || 'unknown'}`);
    pairingCodeRequested = false;
    
    if (reason === 'LOGOUT' || reason === 'UNPAIRED') {
        // Session expired - need to delete and re-authenticate
        console.log('🗑️ Session expired! Deleting old session...');
        try {
            if (fs.existsSync(SESSION_PATH)) {
                fs.rmSync(SESSION_PATH, { recursive: true, force: true });
                console.log('✅ Session deleted successfully');
            }
        } catch (e) {
            console.error('❌ Failed to delete session:', e.message);
        }
    }
    
    console.log('🔄 Reconnecting in 5 seconds...');
    setTimeout(() => {
        console.log('🔄 Restarting client...');
        client.initialize();
    }, 5000);
});

client.on('auth_failure', (msg) => {
    console.error('❌ Auth failure:', msg);
    
    // Delete session and try again
    console.log('🗑️ Deleting session due to auth failure...');
    try {
        if (fs.existsSync(SESSION_PATH)) {
            fs.rmSync(SESSION_PATH, { recursive: true, force: true });
            console.log('✅ Session deleted');
        }
    } catch (e) {
        console.error('❌ Failed to delete session:', e.message);
    }
});

// ========== MESSAGE HANDLER (FIXED: ONLY ONE EVENT) ==========
// ✅ FIX: එක event එකක් විතරක් - double fire වෙන එක නවත්වන්න
client.on('message', async (message) => {
    await handleMessage(message);
});

// ========== INITIALIZE ==========
console.log('🚀 SHANA AI Bot ආරම්භ වේ...');
console.log('⏳ WhatsApp Web එක load වෙනකන් ඉන්න...\n');

// Check for existing session
if (fs.existsSync(SESSION_PATH)) {
    console.log('📂 Existing session found. Attempting to reuse...');
} else {
    console.log('🆕 No existing session. Will request pairing code...');
}

client.initialize();
