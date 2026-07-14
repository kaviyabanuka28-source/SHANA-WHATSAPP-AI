const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 8080; // Railway 8080 පාවිච්චි කරනවා

app.get('/ping', (req, res) => {
    res.status(200).json({ status: 'alive', message: 'SHANA AI Bot is running ✅' });
});

app.listen(PORT, () => {
    console.log(`🌐 Express Server running on port ${PORT}`);
});

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './session-data' }),
    puppeteer: {
        headless: true,
        executablePath: '/usr/bin/chromium', // මේක අනිවාර්යයෙන්ම දාන්න
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-zygote',
            '--single-process',
            '--disable-extensions'
        ]
    }
});

client.on('qr', (qr) => {
    console.log('\n🟢 QR RECEIVED, SCAN THIS:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ SHANA AI Bot SYSTEM CONNECTED!');
});

// Message Logic (එහෙමමයි)
client.on('message', async (message) => {
    const msg = message.body.toLowerCase().trim();
    if (msg === '1') { await send1XBETDetails(message); }
    else if (msg === '2') { await sendWithdrawReply(message); }
    else if (msg === '3') { await sendSocialMediaBoost(message); }
    else {
        await message.reply(`Hy Mr/Mrs 🥰\nSHANA AI SYSTEM 🟢💀\n\nඔබේ උවමනාව කුමක්ද? අංකය සඳහන් කරන්න 👇\n\n1. 1XBET DEPOSIT / WITHDRAW\n2. Withdraw Adres\n3. SOCAL MEDIA BOOST`);
    }
});

async function send1XBETDetails(message) { await message.reply(`🔯 *BOC* 🔯 94118758...`); }
async function sendWithdrawReply(message) { await message.reply(`📋 *SHANA WITHDRAW ADDRESS* 📋...`); }
async function sendSocialMediaBoost(message) { await message.reply(`📱 *SHANA SOCIAL MEDIA BOOST* 📱...`); }

client.initialize();
