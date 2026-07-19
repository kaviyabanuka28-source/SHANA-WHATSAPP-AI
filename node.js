const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "shana-bot" }),
    puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    }
});

// ඔබගේ WhatsApp අංකය මෙතැනට ඇතුළත් කරන්න (රටේ කෝඩ් එකත් සමඟ - උදා: 947XXXXXXXX)
const MY_PHONE_NUMBER = '94742381405'; 

client.on('ready', () => {
    console.log('✅ බොට් සාර්ථකව සම්බන්ධ විය!');
});

// Pairing Code ජනනය කිරීම
client.on('qr', async (qr) => {
    console.log('📌 QR ලැබී ඇත, Pairing Code ඉල්ලීමට උත්සාහ කරයි...');
});

client.on('code', (code) => {
    console.log('================================================');
    console.log(`🔢 ඔබේ Pairing Code එක: ${code}`);
    console.log('🔗 WhatsApp > Linked Devices > Link a Device > Link with phone number instead යන්න.');
    console.log('================================================');
});

// බොට් ආරම්භ වන විටම අංකය හරහා Pairing Code ඉල්ලීම
client.on('authenticated', () => {
    console.log('🔑 සත්‍යාපනය සාර්ථකයි!');
});

client.initialize().then(async () => {
    try {
        console.log('🚀 Pairing Code ඉල්ලීම සිදු කෙරේ...');
        const pairingCode = await client.requestPairingCode(MY_PHONE_NUMBER);
        console.log('⌛ Pairing Code ඉල්ලීම සාර්ථකව යවන ලදී.');
    } catch (err) {
        console.error('❌ Pairing Code ලබා ගැනීමේ දෝෂයක්: ', err);
    }
});

// Auto Reply Commands
client.on('message', async (message) => {
    if (message.fromMe) return;
    
    const msg = message.body.toLowerCase().trim();

    if (msg === '1') {
        await message.reply('✅ *1XBET Details*\n🔗 Link: https://1xbet.com\n🎁 Bonus: 100% Welcome Bonus');
    }
    else if (['hi', 'hello', 'හායි', 'හෙලෝ'].includes(msg)) {
        await message.reply('👋 සාදරයෙන් පිළිගනිමු!\nමෙනුව බැලීමට *menu* ලෙස ටයිප් කරන්න.');
    }
    else if (msg === '2') {
        await message.reply('🛠️ *අපගේ සේවා*\n🔹 WhatsApp Bot Development\n🔹 Web Design\n🔹 AI Automation\n🔹 Digital Marketing');
    }
    else if (msg === '3') {
        await message.reply('📞 *අප හා සම්බන්ධ වන්න*\n📱 Phone: 0742381405\n🌐 Web: shana-bot.com');
    }
    else if (['menu', 'help', 'උදව්'].includes(msg)) {
        await message.reply('📋 *SHANA AI Bot - මෙනුව*\n\n1 - 1XBET විස්තර\n2 - අපගේ සේවා\n3 - සම්බන්ධ වීමට\nabout - බොට් ගැන\nbye - සමුගැනීම');
    }
    else if (msg === 'about') {
        await message.reply('🤖 *SHANA AI Bot*\nVersion: 2.0\nනිර්මාණය: SHANA Developer\nස්වයංක්‍රීය පිළිතුරු සේවාව ක්‍රියාත්මකයි.');
    }
    else if (['bye', 'බායි', 'ගිහින් එන්න'].includes(msg)) {
        await message.reply('👋 ගිහින් එන්න! නැවත හමුවෙමු! 💫');
    }
    else {
        await message.reply('🤖 පණිවිඩය ලැබුණි! \nමෙනුව බැලීමට *menu* ටයිප් කරන්න.');
    }
});
