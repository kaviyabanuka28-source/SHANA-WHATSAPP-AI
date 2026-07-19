const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "shana-bot" }),
    puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    }
});

// QR එක පෙන්වන්නේ නැතිව Pair Code සඳහා මග පෙන්වීම
client.on('qr', (qr) => {
    console.log('================================================');
    console.log('📌 SHANA AI BOT READY FOR PAIRING');
    console.log('🔗 ඔබගේ WhatsApp හි "Link with phone number instead" තෝරන්න.');
    console.log('🔢 ඔබේ WhatsApp අංකය ලබා දී, එන 8 ඉලක්කමේ කෝඩ් එක ඇතුළත් කරන්න.');
    console.log('================================================');
});

client.on('ready', () => {
    console.log('✅ බොට් සාර්ථකව සම්බන්ධ විය!');
});

// Auto Reply Commands
client.on('message', async (message) => {
    if (message.fromMe) return;
    
    const msg = message.body.toLowerCase().trim();

    // 1XBET
    if (msg === '1') {
        await message.reply('✅ *1XBET Details*\n🔗 Link: https://1xbet.com\n🎁 Bonus: 100% Welcome Bonus');
    }
    // Greetings
    else if (['hi', 'hello', 'හායි', 'හෙලෝ'].includes(msg)) {
        await message.reply('👋 සාදරයෙන් පිළිගනිමු!\nමෙනුව බැලීමට *menu* ලෙස ටයිප් කරන්න.');
    }
    // Services
    else if (msg === '2') {
        await message.reply('🛠️ *අපගේ සේවා*\n🔹 WhatsApp Bot Development\n🔹 Web Design\n🔹 AI Automation\n🔹 Digital Marketing');
    }
    // Contact
    else if (msg === '3') {
        await message.reply('📞 *අප හා සම්බන්ධ වන්න*\n📱 Phone: 0742381405\n🌐 Web: shana-bot.com');
    }
    // Help/Menu
    else if (['menu', 'help', 'උදව්'].includes(msg)) {
        await message.reply('📋 *SHANA AI Bot - මෙනුව*\n\n1 - 1XBET විස්තර\n2 - අපගේ සේවා\n3 - සම්බන්ධ වීමට\nabout - බොට් ගැන\nbye - සමුගැනීම');
    }
    // About
    else if (msg === 'about') {
        await message.reply('🤖 *SHANA AI Bot*\nVersion: 2.0\nනිර්මාණය: SHANA Developer\nස්වයංක්‍රීය පිළිතුරු සේවාව ක්‍රියාත්මකයි.');
    }
    // Goodbye
    else if (['bye', 'බායි', 'ගිහින් එන්න'].includes(msg)) {
        await message.reply('👋 ගිහින් එන්න! නැවත හමුවෙමු! 💫');
    }
    // Default fallback
    else {
        await message.reply('🤖 පණිවිඩය ලැබුණි! \nමෙනුව බැලීමට *menu* ටයිප් කරන්න.');
    }
});

client.initialize();
