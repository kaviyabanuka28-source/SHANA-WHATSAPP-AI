const fs = require('fs');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

// Express Server එක Initialize කරන්න
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

const processedMessageIds = new Map();
const userCooldown = new Map();
const COOLDOWN_MS = 30 * 60 * 1000; 

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
            '--disable-gpu',
            '--no-zygote'
        ]
    }
});

client.on('qr', (qr) => {
    console.log('\n🟢 SHANA AI - WhatsApp Bot');
    console.log('========================');
    console.log('📱 කරුණාකර WhatsApp එකෙන් QR Code එක Scan කරන්න:\n');
    qrcode.generate(qr, { small: true }, function (qrcodeStr) {
        console.log(qrcodeStr);
    });
});

client.on('ready', () => {
    console.log('\n✅ SHANA AI Bot SYSTEM CONNECTED!');
    console.log('⚡ Bot NOW RUNNING....\n');
});

client.on('auth_failure', (msg) => {
    console.error('❌ ගිණුම ලබා ගැනීම අසාර්ථක වුණු:', msg);
});

client.on('disconnected', (reason) => {
    console.log('❌ Bot එක Disconnect විය:', reason);
});

function isServiceClosed() {
    const now = new Date();
    const slOffset = 5.5 * 60 * 60 * 1000;
    const slTime = new Date(now.getTime() + slOffset);
    const hours = slTime.getUTCHours();
    const minutes = slTime.getUTCMinutes();
    const totalMinutes = hours * 60 + minutes;
    return totalMinutes >= 1380 || totalMinutes < 390;
}

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

client.on('message', async (message) => {
    const msg = message.body.toLowerCase().trim();
    const userId = message.from;
    const messageId = message.id.id;

    if (processedMessageIds.has(messageId)) return;
    processedMessageIds.set(messageId, true);

    console.log(`📩 Message from ${userId}: ${message.body}`);

    if (isServiceClosed()) {
        const closedMsg = 'SHANA SERVICE රාත්‍රි 11:00 සිට උදෑසන 6:30 වන තුරු නවතා ඇත';
        const lastClosedSent = userCooldown.get(`closed_${userId}`);
        const now = Date.now();
        if (!lastClosedSent || (now - lastClosedSent) > COOLDOWN_MS) {
            await message.reply(closedMsg);
            userCooldown.set(`closed_${userId}`, now);
        }
        return;
    }

    const cooldownKey = `menu_${userId}`;
    const lastMenuSent = userCooldown.get(cooldownKey);
    const now = Date.now();

    if (!lastMenuSent || (now - lastMenuSent) > COOLDOWN_MS) {
        await message.reply(getMainMenu());
        userCooldown.set(cooldownKey, now);
        return;
    }

    if (msg === '1') { await send1XBETDetails(message); return; }
    if (msg === '2') { await sendWithdrawReply(message); return; }
    if (msg === '3') { await sendSocialMediaBoost(message); return; }
});

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

// BOT STARTUP
console.log('🚀 SHANA AI Bot එක Start වෙනවා...');
client.initialize();

app.listen(PORT, () => {
    console.log(`\n🌐 Express Server ක්‍රියාවලී ඉන්නවා: http://localhost:${PORT}`);
});

process.on('unhandledRejection', (error) => {
    console.error('⚠️ දෝෂයක්:', error?.message || error);
});
