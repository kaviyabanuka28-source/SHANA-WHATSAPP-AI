const { Client, LocalAuth } = require('whatsapp-web.js');
const readline = require('readline');

// අංකය ලබා ගැනීමට readline සකසමු
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "shana-bot" }),
    puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    }
});

// බොට් ආරම්භයේදී අංකය ඉල්ලීම
client.on('qr', async () => {
    console.log('📌 QR Code ක්‍රමය වෙනුවට Pair Code ක්‍රමයට මාරු වේ...');
});

client.on('ready', () => {
    console.log('✅ බොට් සාර්ථකව සම්බන්ධ විය!');
});

// ප්‍රධාන ක්‍රියාවලිය
async function startBot() {
    console.log('🚀 SHANA AI BOT STARTING...');
    
    // Pairing Code එක සක්‍රිය කිරීම සඳහා ඉවත්ව සිටීම
    client.on('code', (code) => {
        console.log('================================================');
        console.log(`🔢 ඔබේ Pairing Code එක: ${code}`);
        console.log('🔗 WhatsApp වෙත ගොස් "Link with phone number" තෝරා මෙය ඇතුළත් කරන්න.');
        console.log('================================================');
    });

    // අංකය ලබාගෙන Pairing Code එක ඉල්ලීම
    rl.question('📱 කරුණාකර ඔබගේ WhatsApp අංකය ලබා දෙන්න (උදා: 947XXXXXXXX): ', async (number) => {
        try {
            await client.initialize();
            const pairingCode = await client.requestPairingCode(number);
            console.log('⌛ කෝඩ් එක ජනනය වෙමින් පවතී...');
        } catch (err) {
            console.error('❌ දෝෂයක් සිදුවිය: ', err);
        }
        rl.close();
    });
}

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

startBot();
