const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode-terminal');
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => res.send('SHANA AI Bot is Running!'));
app.listen(PORT, '0.0.0.0');

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "shana-bot" }),
    puppeteer: {
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--single-process",
            "--disable-gpu"
        ]
    }
});

// Pair Code Logic
client.on('qr', async (qr) => {
    // QR එක පෙන්වන අතරම Pair code එක ලබා ගැනීමට උත්සාහ කරයි
    console.log('QR RECEIVED - Scan or use Pair Code');
    qrcode.generate(qr, { small: true });
});

// මෙතැනදී තමයි Pair Code එක generate වෙන්නේ
client.on('ready', async () => {
    console.log('✅ Client is ready!');
});

// අලුත් ක්‍රමය: දුරකථන අංකයෙන් ලින්ක් කිරීමට
client.on('message', async (message) => {
    if (message.fromMe) return;
    const msg = message.body.toLowerCase().trim();

    if (msg === '1') {
        await message.reply('✅ *1XBET Details*\n🔗 Link: https://1xbet.com');
    } else if (['hi', 'hello', 'හායි'].includes(msg)) {
        await message.reply('👋 සාදරයෙන් පිළිගනිමු! මෙනුව සඳහා *menu* ටයිප් කරන්න.');
    } else if (msg === 'menu') {
        await message.reply('📋 *Menu*\n1 - 1XBET\n2 - සේවා\n3 - සම්බන්ධ වන්න');
    }
});

// ඔබේ දුරකථන අංකය භාවිතා කිරීමට මෙම කොටස භාවිතා කරන්න
// බොට් ආරම්භයේදී Pair code එක ලබා ගැනීමට මෙය අත්‍යවශ්‍යයි
client.on('authenticated', () => {
    console.log('✅ Authenticated!');
});

client.initialize();
