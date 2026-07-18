const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 8080;

// Railway වැනි සේවාවන් සඳහා heartbeat එකක්
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
            "--disable-dev-shm-usage", // මෙය ඉතා වැදගත් (Memory ගැටලු මගහැරීමට)
            "--disable-gpu",
            "--no-zygote"
        ]
    }
});

client.on('ready', () => {
    console.log('✅ SHANA AI Bot SYSTEM CONNECTED!');
});

// දෝෂ හඳුනාගැනීම සඳහා
client.on('auth_failure', msg => {
    console.error('❌ Authentication failed:', msg);
});

client.on('disconnected', (reason) => {
    console.log('⚠️ Client disconnected:', reason);
    process.exit(); // නැවත restart වීමට
});

// අංකය ඇතුළත් කිරීම සහ Pairing Code ලබා ගැනීම
client.initialize().catch(err => {
    console.error('❌ Initialization failed:', err);
});

// Pairing code ලබා ගැනීමේදී ඇතිවන දෝෂ මගහැරීමට try-catch භාවිතා කිරීම
client.on('ready', async () => {
    try {
        const phoneNumber = '94742381405'; 
        const pairingCode = await client.requestPairingCode(phoneNumber);
        console.log('🟢 ඔබේ Pairing Code එක: ' + pairingCode);
    } catch (error) {
        console.error('❌ Pairing code ලබා ගැනීමේ දෝෂයක්:', error);
    }
});

client.on('message', async (message) => {
    // Message logic
    if (message.body === '1') {
        await message.reply('1XBET Details...');
    }
});
