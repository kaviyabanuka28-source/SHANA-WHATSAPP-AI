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
            '--disable-extensions',
            '--disable-background-networking'
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
    const betText = `🔯 *BOC* 🔯 94118758... (ඔබේ පණිවිඩය මෙහි ඇත)`; // පූර්ණ පණිවිඩය මෙහි තබන්න
    await message.reply(betText);
}

async function sendWithdrawReply(message) {
    const withdrawText = `📋 *SHANA WITHDRAW ADDRESS* 📋... (ඔබේ පණිවිඩය මෙහි ඇත)`; // පූර්ණ පණිවිඩය මෙහි තබන්න
    await message.reply(withdrawText);
}

async function sendSocialMediaBoost(message) {
    const socialText = `📱 *SHANA SOCIAL MEDIA BOOST* 📱... (ඔබේ පණිවිඩය මෙහි ඇත)`; // පූර්ණ පණිවිඩය මෙහි තබන්න
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
