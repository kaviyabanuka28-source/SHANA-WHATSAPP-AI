const {
    makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================
const BOT_NUMBER = process.env.BOT_NUMBER || ''; // Your WhatsApp number with country code (e.g., 9476XXXXXXX)
const COOLDOWN_MS = 20 * 60 * 1000; // 20 minutes
const AUTH_DIR = 'auth_info';
const LOG_LEVEL = process.env.LOG_LEVEL || 'silent';

// ============================================
// EXACT RESPONSE TEMPLATES (යවන ලද පරිදිම)
// ============================================

const WELCOME_MESSAGE = `🐾 SHANA AI BOT SYSTEM 🕹️
-----------------------------
HI සුබ දවසක් සර්,මිස් 😚

ඔබට අවශ්ශය උපකාරය පවසන්න ! මම ඔබට සහය වීම සදහා බැදීසිටින්නේමී...!`;

const SERVICE_MENU = `📜 SHANA All SERVICE 

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

const OPTION_1_DEPOSIT = `💗🇱🇰🙏ආයුබෝවන්🙏🇱🇰💗
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

const OPTION_2_WITHDRAW = `*❏ SHANA WITHDRAW  ADDRESS ✺*


 

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

const OPTION_3_PROMO = `VIP 1XBET PROMO CODE ඔයාල්ත් දැන්ම රෙජිස්ට වේන්න!...

Lashan1x
👆👆👆👆
LOST නොවී ගෙමක් ගහන්න කැමති අය දැන්ම ගිහින් 1XBET ACCOUNT එකක් හාදාගන්න
200% DEPOSIT BONUS ✅`;

const OPTION_4_WEBSITE = `0758862130/0742381405 Call එකකින් විස්තර දැනගන්න....
🤝🤝🤝🤝🤝🤝🤝🤝`;

const OPTION_5_SOCIAL = `0758862130/0742381405/0703557568
Call , Mg 24/7 Ok ✅`;

const OPTION_6_AVIATOR = `0758862130/0742381405 Call එකකින් විස්තර දැනගන්න....
🤝🤝🤝🤝🤝🤝🤝🤝`;

const OPTION_7_BOT = `ඔබට අඩුම මුදලට 24/7 AUTO reply Bot කෙනෙක් ඔබගේ නමින් හාදාගැනිමට අවශ්ශයයිනම් පහල දුරකතන අංකයට අමතන්න 0758862130 ✅`;

const WAITING_RESPONSE = `AI BOT -
මතක් රැදීසීටින් හැකි ඉක්මනින් SHANA Online ගෙන්වා ගැනිමට උත්සහ කරන්නෙමී....  ! 
ඔහුට තිබෙන වැඩත් එක්ක ඔහු කාර්රය බහුල වී ඇතී අතර ඉමනින් පැමිනේවී...`;

// ============================================
// USER STATE MANAGEMENT
// ============================================
const userStates = new Map();

function getUserState(jid) {
    if (!userStates.has(jid)) {
        userStates.set(jid, {
            state: 'NEW',          // NEW -> WELCOME_SENT -> MENU_SENT
            lastWelcomeTime: 0,
            lastActivity: 0
        });
    }
    return userStates.get(jid);
}

// ============================================
// MAIN BOT FUNCTION
// ============================================
async function startBot() {
    console.log('🤖 SHANA WhatsApp Bot ආරම්භ වේ...');

    // Create auth directory if not exists
    if (!fs.existsSync(AUTH_DIR)) {
        fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    // Load auth state
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    // Get latest Baileys version
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`📱 Baileys version: ${version.join('.')}, isLatest: ${isLatest}`);

    // Create socket
    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: LOG_LEVEL })),
        },
        printQRInTerminal: false,
        logger: pino({ level: LOG_LEVEL }),
        browser: ['Chrome (Linux)', '', ''],
        markOnlineOnConnect: true,
        generateHighQualityLink: true,
        syncFullHistory: false,
    });

    // ============================================
    // PAIR CODE GENERATION
    // ============================================
    if (!sock.authState.creds.registered) {
        if (!BOT_NUMBER) {
            console.error('❌ ERROR: BOT_NUMBER environment variable not set!');
            console.error('⚠️  Please set BOT_NUMBER in Railway dashboard (e.g., 9476XXXXXXX)');
            process.exit(1);
        }

        console.log('🔄 Requesting Pair Code...');
        try {
            let code = await sock.requestPairingCode(BOT_NUMBER);
            code = code?.match(/.{1,4}/g)?.join('-') || code;
            console.log('\n========================================');
            console.log('🔐 PAIR CODE (12-digit code)');
            console.log('========================================');
            console.log(`📱 Number: ${BOT_NUMBER}`);
            console.log(`🔑 Code: ${code}`);
            console.log('========================================');
            console.log('📌 WhatsApp > Linked Devices > Link a Device');
            console.log('📌 Enter this code on your phone');
            console.log('========================================\n');
        } catch (err) {
            console.error('❌ Pair code error:', err);
        }
    } else {
        console.log('✅ Already registered. Bot starting...');
    }

    // ============================================
    // CREDENTIALS UPDATE HANDLER
    // ============================================
    sock.ev.on('creds.update', saveCreds);

    // ============================================
    // CONNECTION UPDATE HANDLER
    // ============================================
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            console.log('✅ WhatsApp Bot සම්බන්ධ විය! 24/7 Online ✅');
            console.log(`📱 Bot Number: ${sock.user?.id || 'Unknown'}`);
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)
                ? lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
                : true;

            console.log('⚠️ Connection closed.', 
                lastDisconnect?.error?.message || '',
                shouldReconnect ? '🔄 Reconnecting in 5 seconds...' : '❌ Logged out.');

            if (shouldReconnect) {
                setTimeout(() => startBot(), 5000);
            } else {
                console.log('❌ Bot logged out. Delete auth_info folder and restart.');
                process.exit(1);
            }
        }
    });

    // ============================================
    // MESSAGE HANDLER
    // ============================================
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        try {
            const msg = messages[0];
            
            // Skip if no message or from self
            if (!msg || !msg.key || msg.key.fromMe) return;

            // Get remote JID (sender)
            const jid = msg.key.remoteJid;
            
            // Only handle individual messages (not group messages)
            if (!jid || !jid.endsWith('@s.whatsapp.net')) return;

            // Get message text
            const messageText = (
                msg.message?.conversation ||
                msg.message?.extendedTextMessage?.text ||
                msg.message?.imageMessage?.caption ||
                ''
            ).trim();

            // Skip empty messages
            if (!messageText) return;

            const pushName = msg.pushName || 'User';
            console.log(`📩 Message from ${pushName} (${jid}): ${messageText.substring(0, 50)}`);

            // Get user state
            const userState = getUserState(jid);
            const now = Date.now();
            const timeSinceLastWelcome = now - userState.lastWelcomeTime;

            // ============================================
            // LOGIC FLOW
            // ============================================

            // CASE 1: New user or cooldown expired -> Send Welcome
            if (userState.state === 'NEW' || timeSinceLastWelcome >= COOLDOWN_MS) {
                try {
                    await sock.sendMessage(jid, { text: WELCOME_MESSAGE });
                    console.log(`✅ Welcome sent to ${pushName}`);
                    
                    userState.state = 'WELCOME_SENT';
                    userState.lastWelcomeTime = now;
                    userState.lastActivity = now;
                } catch (err) {
                    console.error(`❌ Error sending welcome to ${jid}:`, err.message);
                }
                return;
            }

            // CASE 2: Welcome already sent (and still in cooldown) -> Send Service Menu
            if (userState.state === 'WELCOME_SENT') {
                try {
                    await sock.sendMessage(jid, { text: SERVICE_MENU });
                    console.log(`✅ Service Menu sent to ${pushName}`);
                    
                    userState.state = 'MENU_SENT';
                    userState.lastActivity = now;
                } catch (err) {
                    console.error(`❌ Error sending menu to ${jid}:`, err.message);
                }
                return;
            }

            // CASE 3: Menu already sent -> Process user's choice
            if (userState.state === 'MENU_SENT') {
                let response = null;

                switch (messageText) {
                    case '1':
                        response = OPTION_1_DEPOSIT;
                        break;
                    case '2':
                        response = OPTION_2_WITHDRAW;
                        break;
                    case '3':
                        response = OPTION_3_PROMO;
                        break;
                    case '4':
                        response = OPTION_4_WEBSITE;
                        break;
                    case '5':
                        response = OPTION_5_SOCIAL;
                        break;
                    case '6':
                        response = OPTION_6_AVIATOR;
                        break;
                    case '7':
                        response = OPTION_7_BOT;
                        break;
                    default:
                        response = WAITING_RESPONSE;
                        break;
                }

                try {
                    await sock.sendMessage(jid, { text: response });
                    console.log(`✅ Response sent to ${pushName} for option "${messageText}"`);
                    
                    // After sending response, reset state to WELCOME_SENT
                    // so next message triggers the menu again
                    userState.state = 'WELCOME_SENT';
                    userState.lastActivity = now;
                } catch (err) {
                    console.error(`❌ Error sending response to ${jid}:`, err.message);
                }
                return;
            }

            // Fallback: reset state
            userState.state = 'NEW';
            userState.lastActivity = now;

        } catch (err) {
            console.error('❌ Message handler error:', err.message);
            console.error(err.stack);
        }
    });

    // ============================================
    // PRESENCE: Always show online
    // ============================================
    try {
        await sock.sendPresenceUpdate('available');
        setInterval(async () => {
            try {
                await sock.sendPresenceUpdate('available');
            } catch (e) {
                // Ignore presence errors
            }
        }, 5 * 60 * 1000); // Every 5 minutes
    } catch (e) {
        // Ignore initial presence error
    }

    console.log('✅ Bot handler registered successfully!');
    return sock;
}

// ============================================
// START THE BOT
// ============================================
startBot().catch(err => {
    console.error('❌ Fatal error:', err);
    console.log('🔄 Restarting in 10 seconds...');
    setTimeout(() => {
        console.log('🔄 Restarting...');
        startBot();
    }, 10000);
});

// ============================================
// UNCAUGHT EXCEPTIONS HANDLER
// ============================================
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err.message);
    console.log('🔄 Restarting in 5 seconds...');
    setTimeout(() => startBot(), 5000);
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err.message);
});
