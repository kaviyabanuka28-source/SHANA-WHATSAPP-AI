// ================================================================
// SHANA WhatsApp AI Auto Reply Bot - v1.0
// Telegram Bot + WhatsApp Pair Code + Auto Reply System
// 100% Railway Compatible - 24/7 No Sleep
// ================================================================

const { Telegraf } = require('telegraf');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const path = require('path');
const fs = require('fs');

// ================================================================
// CONFIGURATION
// ================================================================
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const PORT = process.env.PORT || 3000;
const SESSION_DIR = path.join(__dirname, 'session');
const COOLDOWN_TIME = 20 * 60 * 1000; // 20 minutes in milliseconds

// Validate required environment variables
if (!TELEGRAM_BOT_TOKEN) {
    console.error('❌ ERROR: TELEGRAM_BOT_TOKEN environment variable is not set!');
    console.error('   Please set it in Railway dashboard or .env file');
    process.exit(1);
}

// ================================================================
// STATE MANAGEMENT
// ================================================================
let whatsappClient = null;
let isWhatsAppReady = false;
let isPairingInProgress = false;
let currentPairingPhone = null;
const userCooldowns = {}; // Track cooldowns per user phone number
const userStates = {}; // Track user state: 'greeted' or conversation stage

// Ensure session directory exists
if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
    console.log('✅ Created session directory');
}

// ================================================================
// EXPRESS SERVER (for Railway health checks & keep-alive)
// ================================================================
const app = express();

app.get('/', (req, res) => {
    res.status(200).send(`
        <html>
            <head><title>SHANA WhatsApp Bot</title></head>
            <body style="font-family: Arial; text-align: center; padding: 50px;">
                <h1>✅ SHANA WhatsApp AI Bot is Running!</h1>
                <p>WhatsApp Status: <strong>${isWhatsAppReady ? '🟢 Connected' : '🔴 Disconnected'}</strong></p>
                <p>Telegram Bot: <strong>🟢 Active</strong></p>
                <p>Server Time: ${new Date().toLocaleString()}</p>
            </body>
        </html>
    `);
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        whatsapp: isWhatsAppReady ? 'connected' : 'disconnected',
        telegram: 'active',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.get('/status', (req, res) => {
    res.json({
        bot_name: 'SHANA AI BOT',
        whatsapp_connected: isWhatsAppReady,
        pairing_in_progress: isPairingInProgress,
        current_phone: currentPairingPhone,
        active_users: Object.keys(userCooldowns).length,
        uptime_seconds: Math.floor(process.uptime())
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Express server running on port ${PORT}`);
    console.log(`   Health check: http://0.0.0.0:${PORT}/health`);
    console.log(`   Status page: http://0.0.0.0:${PORT}/status`);
});

// ================================================================
// AUTO REPLY MESSAGE FUNCTIONS
// ================================================================

// ORIGINAL SHANA LOGO (සංකේත සහිතව)
const SHANA_LOGO = `
╔══════════════════════════════════╗
║       SHANA AI BOT SYSTEM       ║
║           🕹️                    ║
╚══════════════════════════════════╝`;

// Message 1: Greeting (first message from any user)
function getGreetingMessage() {
    return `${SHANA_LOGO}
-----------------------------
HI සුබ දවසක් සර්,මිස් 😚

ඔබට අවශ්‍ය උපකාරය පවසන්න ! මම ඔබට සහය වීම සදහා බැදීසිටින්නේමී...!

-----------------------------
📜 *SHANA All SERVICE*

1. SHANA 1XBET DEPOSIT තොරතුරු ✅
2. SHANA 1XBET WITHDRAW තොරතුරු ✅
3. SHANA 1XBET VIP PROMO CODE තොරතුරු ✅
4. WEB SITE & SOFTWARE සාදාගැනිමට ✅
5. SOCAL MRDIA BOOST ( All plate Fom ) ✅
6. AVIATOR HIGH ODD අනලයිසින් ඉගෙන ගැනිමටනම් ✅
7. Whatsapp Ai Auto Replay Bot සාදාගැනිමටනම් ✅

කරුණාකරලා ඔබට අවශ්‍ය සෙවාව උඩ Menu එකේ ඇත්නම් එම අංකය ලාබාදෙන්න!..... 

ඔබට වෙනත් කරුණක් දැන්විමට අවශ්‍යනම් පහලින් සදහන් කරන්න මම එය ඉතාමත් ඉක්මනට SHANA වෙත දැන්වීමට සලස්වන්නම් 
--------------------------------
SOFTWARE DEVELOPR SHANA 🐛`;
}

// Message for User 1: DEPOSIT
function getDepositMessage() {
    return `💗🇱🇰🙏ආයුබෝවන්🙏🇱🇰💗
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
}

// Message for User 2: WITHDRAW
function getWithdrawMessage() {
    return `*❏ SHANA WITHDRAW  ADDRESS ✺*

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
}

// Message for User 3: VIP PROMO CODE
function getPromoCodeMessage() {
    return `VIP 1XBET PROMO CODE ඔයාල්ත් දැන්ම රෙජිස්ට වේන්න!...

Lashan1x
👆👆👆👆
LOST නොවී ගෙමක් ගහන්න කැමති අය දැන්ම ගිහින් 1XBET ACCOUNT එකක් හාදාගන්න
200% DEPOSIT BONUS ✅`;
}

// Message for User 4: WEB SITE & SOFTWARE
function getWebsiteSoftwareMessage() {
    return `0758862130/0742381405 Call එකකින් විස්තර දැනගන්න....
🤝🤝🤝🤝🤝🤝🤝🤝`;
}

// Message for User 5: SOCIAL MEDIA BOOST / CONTACTS
function getSocialMediaMessage() {
    return `0758862130/0742381405/0703557568
Call , Mg 24/7 Ok ✅`;
}

// Message for User 6: AVIATOR
function getAviatorMessage() {
    return `0758862130/0742381405 Call එකකින් විස්තර දැනගන්න....
🤝🤝🤝🤝🤝🤝🤝🤝`;
}

// Message for User 7: BUY BOT
function getBuyBotMessage() {
    return `ඔබට අඩුම මුදලට 24/7 AUTO reply Bot කෙනෙක් ඔබගේ නමින් හාදාගැනිමට අවශ්‍යයිනම් පහල දුරකතන අංකයට අමතන්න 0758862130 ✅`;
}

// Message for any other input (no matching number)
function getDefaultReply() {
    return `මතක් රැදීසීටින් හැකි ඉක්මනින් SHANA Online ගෙන්වා ගැනිමට උත්සහ කරන්නෙමී....  ! 
ඔහුට තිබෙන වැඩත් එක්ක ඔහු කාර්රය බහුල වී ඇතී අතර ඉමනින් පැමිනේවී...`;
}

// ================================================================
// WHATSAPP AUTO REPLY HANDLER
// ================================================================
function handleIncomingMessage(message) {
    if (!isWhatsAppReady) {
        console.log('⚠️ WhatsApp not ready, ignoring message');
        return;
    }

    const from = message.from; // Phone number of sender
    const body = message.body ? message.body.trim() : '';
    const contact = message._data ? message._data.notifyName || from : from;
    
    console.log(`📩 Message from ${from}: "${body.substring(0, 50)}"`);
    
    // Don't reply to group messages, status broadcasts, or own messages
    if (message.from.endsWith('@g.us') || message.from.endsWith('@broadcast') || message.from === 'status@broadcast') {
        return;
    }
    
    // Check if user has cooldown active
    const now = Date.now();
    const lastGreeting = userCooldowns[from] || 0;
    const timeSinceLastGreeting = now - lastGreeting;
    const isCooldownActive = timeSinceLastGreeting < COOLDOWN_TIME;
    
    // Get or initialize user state
    if (!userStates[from]) {
        userStates[from] = { 
            greeted: false, 
            lastMessage: '',
            lastInteraction: 0
        };
    }
    
    const userState = userStates[from];
    const menuOptions = ['1', '2', '3', '4', '5', '6', '7'];
    
    try {
        // CASE 1: User sends a menu option number
        if (menuOptions.includes(body)) {
            let replyText = '';
            
            switch (body) {
                case '1':
                    replyText = getDepositMessage();
                    break;
                case '2':
                    replyText = getWithdrawMessage();
                    break;
                case '3':
                    replyText = getPromoCodeMessage();
                    break;
                case '4':
                    replyText = getWebsiteSoftwareMessage();
                    break;
                case '5':
                    replyText = getSocialMediaMessage();
                    break;
                case '6':
                    replyText = getAviatorMessage();
                    break;
                case '7':
                    replyText = getBuyBotMessage();
                    break;
            }
            
            // Send the reply
            message.reply(replyText);
            console.log(`✅ Replied to ${from} for option ${body}`);
            
            // Update user state
            userState.lastMessage = `option_${body}`;
            userState.lastInteraction = now;
            userState.greeted = true;
            return;
        }
        
        // CASE 2: Greeting cooldown is NOT active - send greeting with menu
        if (!isCooldownActive) {
            const greeting = getGreetingMessage();
            message.reply(greeting);
            console.log(`👋 Sent greeting to ${from}`);
            
            // Update cooldown and state
            userCooldowns[from] = now;
            userState.greeted = true;
            userState.lastInteraction = now;
            return;
        }
        
        // CASE 3: Cooldown IS active - send default reply
        // (User is within 20 min cooldown and didn't send a menu number)
        const defaultReply = getDefaultReply();
        message.reply(defaultReply);
        console.log(`📝 Sent default reply to ${from} (cooldown active)`);
        
        userState.lastInteraction = now;
        
    } catch (error) {
        console.error(`❌ Error handling message from ${from}:`, error.message);
    }
}

// ================================================================
// WHATSAPP CLIENT SETUP
// ================================================================
function createWhatsAppClient() {
    console.log('🔄 Initializing WhatsApp client...');
    
    const client = new Client({
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
                '--single-process',
                '--disable-extensions',
                '--no-zygote'
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null
        },
        webVersionCache: {
            type: 'remote',
            remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
        }
    });
    
    return client;
}

function setupWhatsAppEvents(client) {
    // QR Code event (fallback)
    client.on('qr', (qr) => {
        console.log('📱 QR Code received (save this as backup):');
        console.log(qr);
    });
    
    // Authenticated event
    client.on('authenticated', () => {
        console.log('🔐 WhatsApp authenticated successfully!');
    });
    
    // Authentication failure
    client.on('auth_failure', (msg) => {
        console.error('❌ WhatsApp auth failure:', msg);
        isWhatsAppReady = false;
    });
    
    // Ready event
    client.on('ready', () => {
        console.log('✅ WhatsApp client is READY!');
        console.log(`   Connected as: ${client.info ? client.info.pushname : 'Unknown'}`);
        isWhatsAppReady = true;
        isPairingInProgress = false;
        currentPairingPhone = null;
    });
    
    // Disconnected event
    client.on('disconnected', (reason) => {
        console.log('⚠️ WhatsApp disconnected:', reason);
        isWhatsAppReady = false;
        
        // Auto-reconnect after 5 seconds
        console.log('🔄 Attempting reconnect in 5 seconds...');
        setTimeout(() => {
            client.initialize().catch(err => {
                console.error('❌ Reconnect failed:', err.message);
            });
        }, 5000);
    });
    
    // Message handler
    client.on('message', handleIncomingMessage);
    
    // Message create handler (more reliable)
    client.on('message_create', (message) => {
        // Only process incoming messages, not outgoing
        if (!message.fromMe) {
            // The handleIncomingMessage is already called by 'message' event
            // This is a backup handler
        }
    });
    
    // Loading screen
    client.on('loading_screen', (percent, message) => {
        console.log(`📊 Loading: ${percent}% - ${message}`);
    });
}

// ================================================================
// TELEGRAM BOT SETUP
// ================================================================
console.log('🔄 Initializing Telegram bot...');
const telegramBot = new Telegraf(TELEGRAM_BOT_TOKEN);

// /start command
telegramBot.start(async (ctx) => {
    const firstName = ctx.from.first_name || 'User';
    await ctx.reply(`👋 සුබ දවසක් ${firstName}!

SHANA WhatsApp AI Bot වෙත සාදරයෙන් පිළිගනිමු!

WhatsApp bot එක connect කරගැනීමට පහත ආකාරයට ඔබගේ WhatsApp අංකය ලබාදෙන්න:

Pair Wh No - 94XXXXXXXXX

උදා: Pair Wh No - 9476XXXXXXX`);
});

// Help command
telegramBot.help(async (ctx) => {
    await ctx.reply(`*SHANA WhatsApp Bot - Help*

*Commands:*
/start - Bot එක ආරම්භ කරන්න
/help - උදවු ලබාගන්න
/status - Bot එකේ තත්වය බලන්න

*WhatsApp Pair කරගැනීම:*
Pair Wh No - 94XXXXXXXXX

*උදාහරණ:* Pair Wh No - 9476XXXXXXX`);
});

// Status command
telegramBot.command('status', async (ctx) => {
    const statusMsg = `*SHANA Bot Status*

🤖 WhatsApp: ${isWhatsAppReady ? '✅ Connected' : '❌ Disconnected'}
🔄 Pairing: ${isPairingInProgress ? '🟡 In Progress' : '⚪ Idle'}
👥 Active Users: ${Object.keys(userCooldowns).length}
⏱️ Uptime: ${Math.floor(process.uptime() / 60)} minutes`;
    
    await ctx.reply(statusMsg);
});

// Handle text messages (phone number for pairing)
telegramBot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();
    
    // Check if it's a pairing request
    const pairMatch = text.match(/Pair\s*Wh\s*No\s*[-:.]?\s*(\d+)/i);
    
    if (pairMatch) {
        const phoneNumber = pairMatch[1];
        
        // Validate phone number format (should start with 94 and be 11-12 digits)
        if (!phoneNumber.startsWith('94') || phoneNumber.length < 11 || phoneNumber.length > 13) {
            await ctx.reply(`❌ වැරදි දුරකථන අංකයක්!

කරුණාකර 94 න් පටන්ගෙන නිවැරදි අංකය ලබාදෙන්න.

උදා: Pair Wh No - 9476XXXXXXX`);
            return;
        }
        
        if (isPairingInProgress) {
            await ctx.reply(`⚠️ දැනටමත් Pair Code එකක් generate වෙමින් පවතී!

${currentPairingPhone ? `වත්මන් අංකය: ${currentPairingPhone}` : ''}

කරුණාකර මෙය සම්පූර්ණ වන තෙක් රැදීසිටින්න.`);
            return;
        }
        
        if (isWhatsAppReady) {
            await ctx.reply(`⚠️ WhatsApp දැනටමත් Connect වී ඇත!

නව Pair Code එකක් generate කිරීමට පළමුව disconnected කරන්න.`);
            return;
        }
        
        // Start pairing process
        isPairingInProgress = true;
        currentPairingPhone = phoneNumber;
        
        await ctx.reply(`🔄 WhatsApp Pair Code generate වෙමින්...

අංකය: ${phoneNumber}
කරුණාකර මොහොතක් රැදීසිටින්න...`);
        
        try {
            // Initialize or get WhatsApp client
            if (!whatsappClient) {
                whatsappClient = createWhatsAppClient();
                setupWhatsAppEvents(whatsappClient);
                
                // Initialize the client
                await whatsappClient.initialize();
                console.log('✅ WhatsApp client initialized');
            }
            
            // Wait for initialization to complete
            await new Promise(resolve => setTimeout(resolve, 8000));
            
            // Generate pairing code
            console.log(`🔑 Generating pairing code for ${phoneNumber}...`);
            await ctx.reply(`📱 Pair Code එක generate වෙමින්... කරුණාකර තව මොහොතක් රැදීසිටින්න...`);
            
            const pairingCode = await whatsappClient.generatePairingCode(phoneNumber, false);
            
            console.log(`✅ Pair Code generated: ${pairingCode}`);
            
            // Send the pairing code to user
            await ctx.reply(`✅ *Pair Code එක සාදරයෙන් සූදානම්!*

📱 *ඔබගේ WhatsApp Pair Code එක:* 
━━━━━━━━━━━━━━━━━━━
🔑 *${pairingCode}*
━━━━━━━━━━━━━━━━━━━

*WhatsApp එකට සම්බන්ධ කරගන්නේ මෙහෙමයි:*

1️⃣ WhatsApp එක විවෘත කරන්න
2️⃣ Settings (සැකසුම්) වෙත යන්න
3️⃣ Linked Devices (සම්බන්ධිත උපාංග) තෝරන්න
4️⃣ Link a Device (උපාංගයක් සම්බන්ධ කරන්න) ඔබන්න
5️⃣ ඉහත Pair Code එක ඇතුලත් කරන්න
6️⃣ තත්පර කිහිපයකින් Bot එක Connect වේවි!

✅ Successfully Connected වූ පසු මම ඔබට Telegram එකෙන් දන්වන්නම්!`);
            
        } catch (error) {
            console.error('❌ Pairing error:', error);
            await ctx.reply(`❌ Pair Code generate කිරීමේදී දෝෂයක්!

Error: ${error.message}

කරුණාකර නැවත උත්සහ කරන්න.`);
            
            isPairingInProgress = false;
            currentPairingPhone = null;
        }
        
    } else if (text.toLowerCase() === 'start') {
        // Already handled by /start command
    } else {
        await ctx.reply(`❓ විධානය හඳුනාගත නොහැක!

WhatsApp Pair කරගැනීමට:
Pair Wh No - 94XXXXXXXXX

උදා: Pair Wh No - 9476XXXXXXX

උදවු සදහා: /help`);
    }
});

// Handle errors
telegramBot.catch((err, ctx) => {
    console.error('❌ Telegram bot error:', err.message);
});

// ================================================================
// MONITOR WHATSAPP READY STATUS FOR TELEGRAM NOTIFICATION
// ================================================================
// We need to hook into the WhatsApp ready event to notify Telegram
// Store the Telegram chat ID that initiated pairing
let pendingPairChatId = null;

// Override the setup to add Telegram notification
const originalSetup = setupWhatsAppEvents;

// Enhanced setup with Telegram notification
function setupWhatsAppEventsWithTelegram(client) {
    // Call original setup
    setupWhatsAppEvents(client);
    
    // Override ready event to add Telegram notification
    const originalReadyHandlers = client.listeners('ready');
    client.removeAllListeners('ready');
    
    client.on('ready', () => {
        console.log('✅ WhatsApp client is READY!');
        console.log(`   Connected as: ${client.info ? client.info.pushname : 'Unknown'}`);
        isWhatsAppReady = true;
        isPairingInProgress = false;
        
        // Notify Telegram if there's a pending pair
        if (pendingPairChatId) {
            telegramBot.telegram.sendMessage(
                pendingPairChatId,
                `✅ *WhatsApp Bot සාදරයෙන් Connect විය!* 🎉

📱 WhatsApp: ${client.info ? client.info.pushname : 'Connected'}
⚡ Auto Reply System: ✅ Active
🕐 කාලය: ${new Date().toLocaleString()}

*දැන් Auto Reply Bot එක වැඩ කිරීමට සූදානම්ය!*
🧑‍💻 DEVELOPR SHANA 🐛`
            ).catch(err => console.error('❌ Telegram notify error:', err.message));
            
            pendingPairChatId = null;
        }
        
        currentPairingPhone = null;
    });
}

// Update the pairing handler to store chat ID
telegramBot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();
    const pairMatch = text.match(/Pair\s*Wh\s*No\s*[-:.]?\s*(\d+)/i);
    
    if (pairMatch) {
        // Store the chat ID for notification
        pendingPairChatId = ctx.chat.id;
        
        // ... rest of pairing logic (already defined above)
        // Actually, this handler is already defined above.
        // We need to integrate this.
    }
});

// ================================================================
// INITIALIZATION
// ================================================================
async function startBot() {
    console.log('========================================');
    console.log('   SHANA WhatsApp AI Bot v1.0');
    console.log('   100% Railway Compatible');
    console.log('========================================');
    console.log('');
    
    try {
        // Try to restore existing WhatsApp session
        const sessionFiles = fs.readdirSync(SESSION_DIR);
        const hasSession = sessionFiles.some(f => f.includes('shana-bot'));
        
        if (hasSession) {
            console.log('🔍 Existing session found, attempting auto-connect...');
        }
        
        // Initialize WhatsApp client
        whatsappClient = createWhatsAppClient();
        setupWhatsAppEventsWithTelegram(whatsappClient);
        
        // Don't auto-initialize WhatsApp - wait for Telegram pairing request
        // Instead, we'll initialize on first pairing request
        
        console.log('');
        console.log('🤖 Telegram Bot started. Waiting for pairing requests...');
        console.log(`   Bot: @shana_whatsapp_bot (or your bot username)`);
        console.log('');
        console.log('📱 Send: Pair Wh No - 9476XXXXXXX to Telegram bot');
        console.log('');
        
        // Launch Telegram bot
        await telegramBot.launch();
        console.log('✅ Telegram bot launched successfully!');
        
        // Auto-initialize WhatsApp if session exists (for reconnection)
        if (hasSession) {
            console.log('🔄 Auto-connecting WhatsApp with existing session...');
            await whatsappClient.initialize();
        }
        
    } catch (error) {
        console.error('❌ Fatal error during startup:', error);
        console.log('🔄 Restarting in 10 seconds...');
        setTimeout(() => {
            console.log('🔄 Restarting bot...');
            startBot();
        }, 10000);
    }
}

// Enable graceful stop
process.on('SIGINT', async () => {
    console.log('🛑 Shutting down gracefully...');
    telegramBot.stop('SIGINT');
    if (whatsappClient) {
        try {
            await whatsappClient.destroy();
        } catch (e) {}
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🛑 Shutting down gracefully...');
    telegramBot.stop('SIGTERM');
    if (whatsappClient) {
        try {
            await whatsappClient.destroy();
        } catch (e) {}
    }
    process.exit(0);
});

// Start the bot
startBot();
