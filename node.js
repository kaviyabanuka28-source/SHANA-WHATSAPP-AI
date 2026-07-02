const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

// Express Server එක Initialize කරන්න - UptimeRobot එක් ඉසිටවටම ඉතිරි තබන්න
const app = express();
const PORT = process.env.PORT || 3000;

// Health Check Endpoint
app.get('/ping', (req, res) => {
    res.status(200).json({ 
        status: 'alive',
        message: 'SHANA AI Bot ක්‍රියාවලී ඉන්නවා ✅',
        timestamp: new Date(),
        botConnected: client.info ? true : false
    });
});

// Status Endpoint
app.get('/status', (req, res) => {
    res.status(200).json({
        botName: 'SHANA AI System',
        status: client.info ? 'CONNECTED' : 'CONNECTING',
        uptime: process.uptime(),
        serviceTime: '6:30 AM - 11:00 PM',
        timestamp: new Date()
    });
});

// Home Endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'SHANA AI WhatsApp Bot Server ක්‍රියාවලී ඉන්නවා',
        endpoints: {
            ping: '/ping',
            status: '/status'
        }
    });
});

// Message duplicates එක වැලැක්වීම සඳහා cache එක
const processedMessageIds = new Map();

// User cooldown tracking - පළවෙනි menu message එක 30min cooldown
const userCooldown = new Map();
const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

// Custom message count - එක session එකකදී එක්කෙනෙක්ට කී පාරක් menu එක යව්වාද කියලා track
const messageCountInSession = new Map();

// WhatsApp Client එක Initialize කරන්න
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './session-data'
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-extensions',
            '--disable-background-networking'
        ]
    }
});

// QR Code එක Generate වෙන Event එක - GitHub Environment එකට ගැලපෙන ලෙස සකසා ඇත
client.on('qr', (qr) => {
    console.log('\n🟢 SHANA AI - WhatsApp Bot');
    console.log('========================');
    console.log('📱 කරුණාකර WhatsApp එකෙන් QR Code එක Scan කරන්න:\n');
    
    // GitHub / Linux Terminal වල අකුරු වලින් පැහැදිලිව QR එක වැටීමට small option එක string එකක් ලෙස log කිරීම
    qrcode.generate(qr, { small: true }, function (qrcodeStr) {
        console.log(qrcodeStr);
    });
});

// Bot එක Ready වුනාම Print කරන්න
client.on('ready', () => {
    console.log('\n✅ SHANA AI Bot SYSTEM CONNECTED!');
    console.log('⚡ Bot NOW RUNNING....\n');
});

// Authentication Fail උනොත්
client.on('auth_failure', (msg) => {
    console.error('❌ ගිණුම ලබා ගැනීම අසාර්ථක වුණු:', msg);
});

// Disconnect උනොත්
client.on('disconnected', (reason) => {
    console.log('❌ Bot එක Disconnect විය:', reason);
});

// ===== TIME CHECK FUNCTION =====
// Sri Lanka Timezone (UTC+5:30)
function isServiceClosed() {
    const now = new Date();
    // Convert to Sri Lanka time (UTC + 5:30)
    const slOffset = 5.5 * 60 * 60 * 1000;
    const slTime = new Date(now.getTime() + slOffset);
    const hours = slTime.getUTCHours();
    const minutes = slTime.getUTCMinutes();
    const totalMinutes = hours * 60 + minutes;

    // Closed: 11:00 PM (23:00 = 1380 min) to 6:30 AM (6:30 = 390 min)
    // Open: 6:30 AM to 11:00 PM
    return totalMinutes >= 1380 || totalMinutes < 390;
}

// ===== MAIN MENU FUNCTION =====
function getMainMenu() {
    return `Hy Mr/Mrs 🥰
SHANA AI SYSTEM 🟢💀

ඔබය උවමනාව දේ අංකය සදහන් කරන්න 👇

 1. 1XBET DEPOSIT / WITHDRAW 
( ඩිපොසොට් / විත්‍රොල් )

 2.Withdraw Adres
විත්‍රොල් ලිපිනය 

3.SOCAL MEDIA BOOST 
( ශොශල් මිඩියා බුස්ට් )`;
}

// ===== MAIN MESSAGE HANDLER =====
client.on('message', async (message) => {
    const msg = message.body.toLowerCase().trim();
    const userId = message.from;
    const messageId = message.id.id;

    // Message ID cache එකෙන් duplicate check
    if (processedMessageIds.has(messageId)) return;
    processedMessageIds.set(messageId, true);

    console.log(`📩 Message from ${userId}: ${message.body}`);

    // ===== SERVICE CLOSED CHECK (රාත්‍රි 11:00 - උදේ 6:30) =====
    if (isServiceClosed()) {
        const closedMsg = 'SHANA SERVICE රාත්‍රි 11:00 සිට උදෑසන 6:30 වන තුරු නවතා ඇත';
        // Check if we already sent this closed message to this user recently (within 30 min)
        const lastClosedSent = userCooldown.get(`closed_${userId}`);
        const now = Date.now();
        if (!lastClosedSent || (now - lastClosedSent) > COOLDOWN_MS) {
            await message.reply(closedMsg);
            userCooldown.set(`closed_${userId}`, now);
            console.log(`⏰ Service closed message sent to ${userId}`);
        }
        return;
    }

    // ===== NEW CUSTOMER - පළවෙනි පාර msg එකක් දැම්මොත් menu එක යවන්න =====
    // Check if this user has a cooldown entry
    const cooldownKey = `menu_${userId}`;
    const lastMenuSent = userCooldown.get(cooldownKey);
    const now = Date.now();

    // If no cooldown OR cooldown expired (30 min passed) - send menu for first message
    if (!lastMenuSent || (now - lastMenuSent) > COOLDOWN_MS) {
        // First message from this user or cooldown expired
        // Send main menu
        await message.reply(getMainMenu());
        userCooldown.set(cooldownKey, now);
        console.log(`✅ Main menu sent to NEW user ${userId}`);
        return;
    }

    // ===== EXISTING USER (already got menu within 30 min) - ONLY process menu choices =====
    // STRICT: Only 1, 2, or 3 are valid - ALL ELSE = SILENCE
    if (msg === '1') {
        await send1XBETDetails(message);
        return;
    }
    
    if (msg === '2') {
        await sendWithdrawReply(message);
        return;
    }
    
    if (msg === '3') {
        await sendSocialMediaBoost(message);
        return;
    }
    
    // ❌ ANY OTHER MESSAGE = COMPLETE SILENCE (NO REPLY AT ALL) ❌
    console.log(`⚠️ Invalid command from ${userId} - NO REPLY SENT`);
});

// ===== HELPER FUNCTIONS =====

// 1XBET Deposit/Withdraw Details
async function send1XBETDetails(message) {
    const betText = `🔯 *BOC* 🔯 94118758
🔯 MINNERIYA
🔯 K.G LAKSHAN KAVISHKA KUMARA

✳️ *PEOPLE BANK* : 006200150094114
✳️ K.G.LAKSHAN KAVISHKA KUMARA 
✳️ HIGURAKGODA

✳️ *ez cash* : 0764104588
✳️ LAKSHAN ( open ) 
( වැඩ්පුර රුපියල් 20-/ දැමිමට කාරුණික වන්න )

✡️ *Binanace* ✡️ 1066282628
✡️ LAKSHAN 

🔯 *ipay* 🔯 0764104588
🔯 Lakshan

✡️ *Dialog Finance PLC* ✡️ 0010 2217 5776
✡️ LAKSHAN KAVISHKA KUMARA

⏱️ *DEPOSIT* - minute 2-5 😍
⏱️ *WITHDRAW* - minute 10-30 😍

👉👉 සැ.යු.: ඔබ විසින් REMARK යටතේ ඔබගේ PLAYER ID සඳහන් කල යුතුමය.
තවද 1X BET, BET යන වචන කිසි සේත්ම භාවිතා නොකල යුතුය...

⚠️ ඉහත ක්‍රම හරහා DEPOSIT කර https://wa.me/+94764104588
අංකයට පමණක් SLIP එක හා ඔබේ 1XBET PLAYER ID type එවන්න

👉 සැ.යු. : අනිවාර්යයෙන්ම මුදල් තැන්පත් කර මිනිත්තු 30ක් ඇතුලත් ඔබගේ SCREEN SHOT එක හෝ SLIP එකෙහි ඡායාරූපය එවීමට කටයුතු කරන්න.

එසේ නොහැකි නම් පණිවිඩයක් එවීමට කාරුණිකවන්න .

✺ තෙවනපාර්ශවීය සදහා කරණ ගනු දෙනු ❌`;
    
    await message.reply(betText);
}

// Withdraw Address
async function sendWithdrawReply(message) {
    const withdrawText = `📋 *SHANA WITHDRAW ADDRESS* 📋

_MINI Withdraw Rs 250-/_

*පියවර 1*
• මුලින්ම 1Xbet app එක open කරන්න ඉට පසු menu යන්න.
• ඉට පසු උඩම ඇති setting අයිකන් එකක් එක ක්ලික් කරන්න

*✺ පියවර 2*
• ඉට පසුව withdraw කියලා අයිකන් එකක් ඇති එක ඔබන්න
• ඉට පස්සෙ 1XBET CASH කියන් මෙතඩ් එක තොරන්න
• පොඩ්ඩක් පහලට වේන්න තියෙන්නේ

*පියවර 3*
• ඉට පසු ඔබට ගන්න ඔනි ගාන ගහන්න

*පියවර 4*
❏ city: minneriya පුරවන්න
❏ street: Lakshan service (24/7) පුරවගන්න

*පියවර 5*
• ඉන් පසු ඔබට ඔබගේ gmail එකක් හෝ phone නම්බ එකක් ඇඩ් කරලා තියේනවානම් කෝඩ් එකක් එයි
• එකදිලා කන්පොම් කරන්න

*පියවර 6*
• ඉන් පසුව ඇප් එකේන් බැක් වී ආපාසු ඇප් එකට ලොග් වී විත්‍රොල් තැනට යන්න

*පියවර 7*
• ඉට පඩු විත්‍රොල් රේපුස්ට කියලා බටන් එකක් ඇති එක ඔබන්න

*පියවර 8*
• ඉන් පසුව ඉංග්‍රිසි වචන සහිතව නිල්පාටින් වචන වගයක් ඇවිත් ඇති එහි ඇති GET COUPON කියලා එකක් අන්න එක ඔබන්න

*පියවර 9*
• එක ඔබවුවට පසුව එනවා කෝඩ් එකක් අන්න එකි SCREEN SHOT එකක් ගහලා OK කරලා මට එවන්න

✅ එච්චරයි!

👉 සැ.යු.: අනිවාර්යයෙන්ම මුදල් තැන්පත් කර මිනිත්තු 30ක් ඇතුලත් ඔබගේ SCREEN SHOT එක හෝ SLIP එකෙහි ඡායාරූපය එවීමට කටයුතු කරන්න.

⚠️ තෙවනපාර්ශවීය සදහා කරණ ගනු දෙනු ❌`;
    
    await message.reply(withdrawText);
}

// Social Media Boost
async function sendSocialMediaBoost(message) {
    const socialText = `📱 *SHANA SOCIAL MEDIA BOOST* 📱

*Facebook Boost* - Likes, Followers, Shares
*Whatsapp Boost* - Status Views, Followers
*Tik Tok Boost* - Followers, Views, Likes
*You Tube Boost* - Subscribers, Views
*Telegram Boost* - Members, Views
*Instagram Boost* - Followers, Likes, Views`;
    
    await message.reply(socialText);
}

// ===== SESSION CLEANUP =====
function forceCleanupSessionData() {
    try {
        const sessionDataPath = path.join(__dirname, 'session-data');
        
        if (fs.existsSync(sessionDataPath)) {
            console.log('🧹 සැසිය දත්ත පිරිසිදු කරමින්...');
            
            function removeDir(dirPath) {
                if (fs.existsSync(dirPath)) {
                    fs.readdirSync(dirPath).forEach(file => {
                        const curPath = path.join(dirPath, file);
                        try {
                            if (fs.lstatSync(curPath).isDirectory()) {
                                removeDir(curPath);
                            } else {
                                fs.unlinkSync(curPath);
                            }
                        } catch (err) {}
                    });
                    try {
                        fs.rmdirSync(dirPath);
                    } catch (err) {}
                }
            }
            
            removeDir(sessionDataPath);
            console.log('✅ සැසිය දත්ත සිදුවෙවිය');
        }
    } catch (err) {
        console.warn('⚠️ සැසිය පිරිසිදු කිරීමට අක්ෂම:', err.message);
    }
}

function ensureNoRunningChrome() {
    try {
        const TASKLIST = execSync('tasklist /FI "IMAGENAME eq chrome.exe" /FO CSV /NH', { encoding: 'utf8' });
        if (TASKLIST && TASKLIST.trim() !== '') {
            console.log('🔄 Chrome ක්‍රියාවලී පවතින බව සනාථ විය. වසා දරමින්...');
            try {
                execSync('taskkill /IM chrome.exe /F', { encoding: 'utf8' });
                console.log('✅ Chrome සාර්ථකව වසා දමන ලදී');
            } catch (killErr) {
                console.log('⚠️ Chrome ස්වයංක්‍රීයව වසා දැමීමට අක්ෂම විය');
            }
        }
    } catch (err) {
        console.log('ℹ️ Chrome ක්‍රියාවලී පරීක්ෂා කිරීමට අක්ෂම විය');
    }
    return true;
}

function startClient() {
    ensureNoRunningChrome();
    forceCleanupSessionData();
    
    console.log('🚀 SHANA AI Bot එක Start වෙනවා...');
    console.log('⏳ QR Code එක එනතුරු රැදී සිටින්න...\n');

    try {
        client.initialize();
    } catch (err) {
        console.error('❌ Bot එක initialize කිරීමට දෝෂයක්:', err.message);
        console.log('🔄 නැවතත් ඇතිරුවමින්...');
        setTimeout(() => startClient(), 3000);
    }
}

// ===== START THE BOT =====
startClient();

// ===== START EXPRESS SERVER (UptimeRobot ඉසිටවටම තබන්න) =====
app.listen(PORT, () => {
    console.log(`\n🌐 Express Server ක්‍රියාවලී ඉන්නවා: http://localhost:${PORT}`);
    console.log(`📍 Health Check: http://localhost:${PORT}/ping`);
    console.log(`📍 Status: http://localhost:${PORT}/status`);
    console.log(`\n✅ UptimeRobot එක ping කරන්න: http://localhost:${PORT}/ping\n`);
});

// ===== ERROR HANDLING =====
process.on('unhandledRejection', (error) => {
    console.error('⚠️ නොසැලකිලිමත් දෝෂයක්:', error?.message || error);
    
    if (error?.message?.includes('EBUSY') || error?.message?.includes('resource busy')) {
        console.log('🔄 ගිණුම වලට ප්‍රවේශයි, නැවතත් ඇතිරුවමින්...');
        setTimeout(() => {
            forceCleanupSessionData();
            startClient();
        }, 5000);
    }
});
