const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.status(200).send('Bot is running!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--no-zygote"
        ]
    }
});

// 1. බොට් එක සම්බන්ධ වූ විට සිදුවන දේ
client.on('ready', async () => {
    console.log('✅ SHANA AI Bot SYSTEM CONNECTED!');
    
    // Pairing Code එක ලබා ගැනීම
    try {
        const phoneNumber = '94742381405'; 
        const pairingCode = await client.requestPairingCode(phoneNumber);
        console.log('🟢 ඔබේ Pairing Code එක: ' + pairingCode);
    } catch (error) {
        console.error('❌ Pairing code ලබා ගැනීමේ දෝෂයක්:', error);
    }
});

// 2. පණිවිඩ වලට පිළිතුරු දීම (Auto Reply Logic)
client.on('message', async (message) => {
    console.log(`පණිවිඩයක් ලැබුනි: ${message.body}`);

    // උදාහරණය: '1' එවූ විට පිළිතුරු දීම
    if (message.body === '1') {
        await message.reply('1XBET Details මෙතැනින් ලබාගන්න...');
    }
    
    // ඔබට අවශ්‍ය තවත් ඕනෑම දෙයක් මෙතැනට එකතු කරන්න
    if (message.body.toLowerCase() === 'hi') {
        await message.reply('හෙලෝ! SHANA AI Bot වෙත සාදරයෙන් පිළිගනිමු.');
    }
});

client.on('auth_failure', msg => {
    console.error('❌ Authentication failed:', msg);
});

client.on('disconnected', (reason) => {
    console.log('⚠️ Client disconnected:', reason);
    process.exit(); 
});

client.initialize().catch(err => {
    console.error('❌ Initialization failed:', err);
});
