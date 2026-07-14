const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

// Express Server
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/ping', (req, res) => {
    res.status(200).json({ status: 'alive', message: 'SHANA AI Bot is running ✅' });
});

app.listen(PORT, () => {
    console.log(`🌐 Express Server running on port ${PORT}`);
});

puppeteer: {
    headless: true,
    executablePath: '/usr/bin/chromium-browser', // මෙතන -browser කියන එක එකතු කරන්න
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
    ]
}

client.on('qr', (qr) => {
    console.log('\n🟢 QR RECEIVED, SCAN THIS:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ SHANA AI Bot SYSTEM CONNECTED!');
});

// Message Logic
client.on('message', async (message) => {
    const msg = message.body.toLowerCase().trim();
    
    if (msg === '1') { await send1XBETDetails(message); }
    else if (msg === '2') { await sendWithdrawReply(message); }
    else if (msg === '3') { await sendSocialMediaBoost(message); }
    else {
        await message.reply(`Hy Mr/Mrs 🥰\nSHANA AI SYSTEM 🟢💀\n\nඔබේ උවමනාව කුමක්ද? අංකය සඳහන් කරන්න 👇\n\n1. 1XBET DEPOSIT / WITHDRAW\n2. Withdraw Adres\n3. SOCAL MEDIA BOOST`);
    }
});

async function send1XBETDetails(message) { 
    await message.reply(`🔯 *BOC* 🔯 94118758\nK.G LAKSHAN KAVISHKA KUMARA\n\n✳️ *PEOPLE BANK* : 006200150094114\n✳️ K.G.LAKSHAN KAVISHKA KUMARA\n\n👉 තව විස්තර සඳහා මට පණිවිඩයක් එවන්න.`); 
}

async function sendWithdrawReply(message) { 
    await message.reply(`📋 *SHANA WITHDRAW ADDRESS* 📋\n\nපියවර 1: 1Xbet app එක open කරන්න...`); 
}

async function sendSocialMediaBoost(message) { 
    await message.reply(`📱 *SHANA SOCIAL MEDIA BOOST* 📱\n\nFacebook, WhatsApp, TikTok, YouTube, Telegram, Instagram Boosts available!`); 
}

client.initialize();
