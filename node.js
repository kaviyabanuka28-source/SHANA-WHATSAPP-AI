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
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    },
    authStrategy: new LocalAuth()
});

client.on('ready', () => {
    console.log('✅ SHANA AI Bot SYSTEM CONNECTED!');
});

client.initialize().then(async () => {
    // මෙතැනට ඔබේ WhatsApp අංකය ඇතුළත් කරන්න (උදා: 9477xxxxxxx)
    const phoneNumber = '947xxxxxxxx'; 
    const pairingCode = await client.requestPairingCode(phoneNumber);
    console.log('🟢 ඔබේ Pairing Code එක මෙයයි: ' + pairingCode);
});

// පණිවිඩ Logic එක
client.on('message', async (message) => {
    const msg = message.body.toLowerCase().trim();
    if (msg === '1') { await message.reply('1XBET Details...'); }
    else if (msg === '2') { await message.reply('Withdraw details...'); }
    else { await message.reply('Hy! Please select 1, 2, or 3.'); }
});
