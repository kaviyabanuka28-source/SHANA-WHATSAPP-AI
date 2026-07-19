const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "shana-bot" }),
    puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    }
});

// Pair Code එක ලොග් එකේ පෙන්වන්න
client.on('qr', (qr) => {
    console.log('📱 QR Code එක ලැබුණා. පේයාර් කෝඩ් එක භාවිතා කරන්න.');
    // QR code එකේ අගය Pair code එකක් ලෙසත් වැඩ කරන නිසා 
    // WhatsApp "Link with phone number" වලට ගිහින් ඔබේ අංකය දීලා
    // අනිත් පැත්තෙන් එන කෝඩ් එක භාවිතා කරන්න.
});

client.on('ready', () => {
    console.log('✅ බොට් සාර්ථකව සම්බන්ධ විය!');
});

// Auto Reply Command ටික
client.on('message', async (message) => {
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
