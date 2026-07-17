const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 8080;

app.get('/ping', (req, res) => {
    res.status(200).json({ status: 'alive', message: 'SHANA AI Bot is running ✅' });
});

app.listen(PORT, () => {
    console.log(`🌐 Express Server running on port ${PORT}`);
});

const client = new Client({
    puppeteer: {
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu"
        ]
    },
    authStrategy: new LocalAuth() 
});

// Pairing Code Logic
client.on('qr', async (qr) => {
    // QR එක පෙන්වනවා වෙනුවට අපි Pairing Code එක ඉල්ලනවා
    console.log('QR received, requesting pairing code...');
});

client.on('ready', () => {
    console.log('✅ SHANA AI Bot SYSTEM CONNECTED!');
});

// මෙය වැදගත්ම කොටස: බොට් එක පණ ගැන්වූ පසු අංකය ඉල්ලීම
client.initialize().then(async () => {
    const phoneNumber = 'YOUR_WHATSAPP_NUMBER'; // මෙතැනට ඔබේ WhatsApp අංකය (රටේ කෝඩ් එකත් සමඟ - උදා: 947XXXXXXXX) දමන්න
    const pairingCode = await client.requestPairingCode(phoneNumber);
    console.log('🟢 ඔබේ Pairing Code එක මෙයයි: ' + pairingCode);
    console.log('කරුණාකර මෙම අංක 8 ඔබේ WhatsApp හි "Link with phone number" කොටසට ඇතුළත් කරන්න.');
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
