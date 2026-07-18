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
    authStrategy: new LocalAuth({ clientId: "shana-bot" }), // clientId එකක් දීම වඩා හොඳයි
    puppeteer: {
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--no-zygote",
            "--single-process" 
            "--disable-extensions"
        ]
    }
});

// බොට් එක සූදානම් වූ පසු මෙය ක්‍රියාත්මක වේ
client.on('ready', () => {
    console.log('✅ SHANA AI Bot SYSTEM CONNECTED!');
});

// Pairing Code ලබා ගැනීම (මෙය බොට් එක ආරම්භ වීමේදීම සිදුකරන්න)
client.on('authenticated', () => {
    console.log('✅ AUTHENTICATED!');
});

// පණිවිඩ වලට පිළිතුරු දීම
client.on('message', async (message) => {
    console.log(`පණිවිඩයක් ලැබුනි: ${message.body}`);

    if (message.body === '1') {
        await message.reply('1XBET Details මෙතැනින් ලබාගන්න...');
    }
    
    if (message.body.toLowerCase() === 'hi') {
        await message.reply('හෙලෝ! SHANA AI Bot වෙත සාදරයෙන් පිළිගනිමු.');
    }
});

// අත්‍යවශ්‍යම පියවර: බොට් එක ආරම්භ කිරීම
client.initialize().then(async () => {
    console.log('⏳ Pairing Code එක උත්සාහ කරමින්...');
    try {
        const phoneNumber = '94742381405'; 
        const pairingCode = await client.requestPairingCode(phoneNumber);
        console.log('🟢 ඔබේ Pairing Code එක: ' + pairingCode);
    } catch (error) {
        console.error('❌ Pairing code ලබා ගැනීමේ දෝෂයක්:', error);
    }
});

client.on('auth_failure', msg => {
    console.error('❌ Authentication failed:', msg);
});

client.on('disconnected', (reason) => {
    console.log('⚠️ Client disconnected:', reason);
    process.exit(); 
});
