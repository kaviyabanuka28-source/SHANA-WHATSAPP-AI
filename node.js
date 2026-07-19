const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

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

// Pair Code පෙන්වීම සඳහා විශේෂ ඉවෙන්ට් එක
client.on('qr', (qr) => {
    console.log('📌 QR RECEIVED');
    console.log('🔗 WhatsApp > Linked Devices > Link a Device > Link with phone number instead');
    console.log('👉 ඔබගේ දුරකථන අංකය ලබා දී, පහත QR කෝඩ් එක හෝ Pair Code එක භාවිතා කරන්න.');
    
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ SHANA AI Bot සාර්ථකව සම්බන්ධ විය!');
});

client.on('authenticated', () => {
    console.log('✅ Authentication සාර්ථකයි!');
});

// Auto Reply Command ටික
client.on('message', async (message) => {
    if (message.fromMe) return;
    
    const msg = message.body.toLowerCase().trim();

    if (msg === '1') {
        await message.reply('✅ *1XBET Details*\n🔗 Link: https://1xbet.com');
    } 
    else if (['hi', 'hello', 'හායි'].includes(msg)) {
        await message.reply('👋 සාදරයෙන් පිළිගනිමු! මෙනුව සඳහා *menu* ටයිප් කරන්න.');
    } 
    else if (msg === '2') {
        await message.reply('🛠️ *අපගේ සේවා*\n🔹 WhatsApp Bot Development\n🔹 Web Design');
    }
    else if (msg === '3') {
        await message.reply('📞 *අප හා සම්බන්ධ වන්න*\n📱 Phone: 0742381405');
    }
    else if (msg === 'menu') {
        await message.reply('📋 *Commands List*\n1 - 1XBET\n2 - සේවා\n3 - සම්බන්ධ වන්න');
    }
});

client.initialize();
