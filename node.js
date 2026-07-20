const { Client, LocalAuth } = require('whatsapp-web.js');
const { execSync } = require('child_process');

// ========== COOLDOWN ==========
const COOLDOWN_MS = 20 * 60 * 1000; // විනාඩි 20

const userStates = new Map(); // { state: 0=welcome, 1=menu, 2=normal, lastReplyAt }

function canReply(userId) {
    const data = userStates.get(userId);
    if (!data) return true;
    if (Date.now() - data.lastReplyAt < COOLDOWN_MS) return false;
    return true;
}

// ========== CHROMIUM ==========
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

// ========== CLIENT ==========
const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
            '--disable-gpu', '--disable-accelerated-2d-canvas', '--no-first-run',
            '--no-zygote', '--single-process', '--disable-background-networking',
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

// ========== MESSAGE TEMPLATES (ඔබේ පණිවිඩ වචනයෙන් වචනය) ==========

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

// ====================================================================
// *** DIRECT SEND FUNCTION (pupPage.evaluate හරහා WhatsApp Web Store එකට) ***
// ====================================================================
async function sendDirectMessage(chatId, text) {
    try {
        const result = await client.pupPage.evaluate(async (params) => {
            const { chatId: cId, text: msgText } = params;
            
            // WhatsApp Web Store එකෙන් chat එක load කරන්න
            const chat = window.Store.Chat.get(cId);
            if (!chat) return { success: false, error: 'Chat not found' };
            
            // Message object එක හදන්න
            const id = window.Store.Msg.nextId();
            const msg = {
                id: id,
                body: msgText,
                type: 'chat',
                to: chatId,
                from: window.Store.User.getMaybeMeUser().jid,
                self: 'in',
                t: parseInt(Date.now() / 1000),
                notifyName: window.Store.User.getMaybeMeUser().name || 'Bot',
                isNewMsg: true,
                isOnlineMsg: true,
            };
            
            // Message එක send කරන්න
            await window.Store.SendMessage.addAndSendMsgToChat(chat, msg);
            
            // Success එක confirm කරන්න
            const sentMsg = window.Store.Msg.get(id._serialized);
            return { success: true, id: id._serialized, found: !!sentMsg };
        }, { chatId, text });
        
        console.log(`✅ Message sent to ${chatId}:`, result);
        return true;
    } catch (e) {
        console.error(`❌ Direct send failed for ${chatId}:`, e.message || e);
        // Fallback to client.sendMessage
        try {
            await client.sendMessage(chatId, text);
            console.log(`✅ Fallback sendMessage worked for ${chatId}`);
            return true;
        } catch (e2) {
            console.error(`❌ Fallback also failed:`, e2.message || e2);
            return false;
        }
    }
}

// ====================================================================
// *** AUTO-REPLY LOGIC ***
// ====================================================================
async function handleMessage(message) {
    if (message.fromMe) return;
    
    const userId = message.from;
    const msgBody = message.body.trim();
    
    console.log(`📨 From: ${userId} | "${msgBody}"`);
    
    // --- Initialize user state if new ---
    if (!userStates.has(userId)) {
        userStates.set(userId, { state: 0, lastReplyAt: 0 });
    }
    
    const userData = userStates.get(userId);
    
    // --- Cooldown check (20 min) ---
    if (!canReply(userId)) {
        console.log(`⏳ Cooldown for ${userId}, next reply after ${new Date(userData.lastReplyAt + COOLDOWN_MS).toLocaleTimeString()}`);
        return;
    }
    
    let replyText = '';
    let nextState = userData.state;
    
    // ===== STATE 0: Welcome not sent yet =====
    if (userData.state === 0) {
        replyText = MSG_WELCOME;
        nextState = 1;
        console.log(`➡️ State 0→1: Sending WELCOME to ${userId}`);
    }
    // ===== STATE 1: Welcome sent, menu not sent yet =====
    else if (userData.state === 1) {
        replyText = MSG_MENU;
        nextState = 2;
        console.log(`➡️ State 1→2: Sending MENU to ${userId}`);
    }
    // ===== STATE 2: Normal mode =====
    else {
        const msg = msgBody.toLowerCase().trim();
        
        if (['menu', 'help', 'උදව්'].includes(msg)) {
            replyText = MSG_MENU;
            console.log(`➡️ State 2: Sending MENU to ${userId}`);
        }
        else if (msg === '1') {
            replyText = MSG_OPT1;
            console.log(`➡️ State 2: Sending OPTION 1 to ${userId}`);
        }
        else if (msg === '2') {
            replyText = MSG_OPT2;
            console.log(`➡️ State 2: Sending OPTION 2 to ${userId}`);
        }
        else if (msg === '3') {
            replyText = MSG_OPT3;
            console.log(`➡️ State 2: Sending OPTION 3 to ${userId}`);
        }
        else if (msg === '4') {
            replyText = MSG_OPT4;
            console.log(`➡️ State 2: Sending OPTION 4 to ${userId}`);
        }
        else if (msg === '5') {
            replyText = MSG_OPT5;
            console.log(`➡️ State 2: Sending OPTION 5 to ${userId}`);
        }
        else if (msg === '6') {
            replyText = MSG_OPT6;
            console.log(`➡️ State 2: Sending OPTION 6 to ${userId}`);
        }
        else if (msg === '7') {
            replyText = MSG_OPT7;
            console.log(`➡️ State 2: Sending OPTION 7 to ${userId}`);
        }
        else {
            replyText = MSG_DEFAULT;
            console.log(`➡️ State 2: Sending DEFAULT to ${userId}`);
        }
    }
    
    // --- Send the reply ---
    if (replyText) {
        const success = await sendDirectMessage(userId, replyText);
        if (success) {
            userData.state = nextState;
            userData.lastReplyAt = Date.now();
            console.log(`✅ Done. Next state: ${nextState}, cooldown until ${new Date(Date.now() + COOLDOWN_MS).toLocaleTimeString()}`);
        } else {
            console.log(`❌ Reply failed for ${userId}, state unchanged`);
        }
    }
}

// ====================================================================
// *** EVENTS ***
// ====================================================================

client.on('qr', async (qr) => {
    console.log('📱 QR received — requesting pairing code...');
    if (!pairingCodeRequested && process.env.WHATSAPP_NUMBER) {
        pairingCodeRequested = true;
        try {
            const pCode = await client.requestPairingCode(process.env.WHATSAPP_NUMBER, true);
            console.log('================================================');
            console.log(`🔢 Pairing Code: ${pCode}`);
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

client.on('authenticated', () => console.log('🔐 Authenticated!'));

client.on('ready', () => {
    console.log('✅ Bot සාර්ථකව සම්බන්ධ විය! Auto-reply ACTIVE ✅');
    pairingCodeRequested = false;
});

client.on('disconnected', (reason) => {
    console.log(`⚠️ Disconnected: ${reason || 'unknown'}`);
    pairingCodeRequested = false;
    setTimeout(() => { console.log('🔄 Reconnecting...'); client.initialize(); }, 5000);
});

client.on('auth_failure', (msg) => {
    console.error('❌ Auth failure:', msg);
    pairingCodeRequested = false;
});

// ====================================================================
// *** MESSAGE HANDLER — pupPage එක ready වෙනකන් WAIT කරලා register කරන්න ***
// ====================================================================
client.on('message', async (message) => {
    // pupPage එක ready ද කියලා check කරන්න
    if (!client.pupPage || !client.pupPage.isConnected()) {
        console.log('⏳ pupPage not ready yet, queueing message...');
        // Retry after 2 seconds
        setTimeout(async () => {
            if (client.pupPage && client.pupPage.isConnected()) {
                await handleMessage(message);
            } else {
                console.log('⏳ pupPage still not ready after retry, trying client.sendMessage fallback...');
                // Pure fallback - just use sendMessage
                const msg = message.body.toLowerCase().trim();
                const userId = message.from;
                let replyText = MSG_WELCOME;
                try {
                    await client.sendMessage(userId, replyText);
                    userStates.set(userId, { state: 1, lastReplyAt: Date.now() });
                    console.log(`✅ Fallback reply sent to ${userId}`);
                } catch (e) {
                    console.error(`❌ Fallback failed:`, e.message);
                }
            }
        }, 2000);
        return;
    }
    await handleMessage(message);
});

// ========== INITIALIZE ==========
console.log('🚀 Bot ආරම්භ වේ...');
client.initialize();
