const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.status(200).send('✅ SHANA AI Bot is running!');
});

app.listen(PORT, () => {
    console.log(`🌐 Server is running on port ${PORT}`);
});

// Session data path එක clean කරන්න (Service Worker crash fix)
const sessionPath = path.join(process.cwd(), '.wwebjs_auth', 'session-shana-bot', 'Default', 'Service Worker');
if (fs.existsSync(sessionPath)) {
    fs.rmSync(sessionPath, { recursive: true, force: true });
    console.log('🧹 Cleaned old Service Worker cache');
}

// ==========================================
// 🚀 CLIENT CONFIG - ගොඩක් වැදගත්
// ==========================================
const client = new Client({
    authStrategy: new LocalAuth({ clientId: "shana-bot" }),
    puppeteer: {
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--no-zygote",
            "--single-process",  // ✅ කොමාව දාලා තියෙනවා
            "--disable-extensions"
        ]
    }
});

// ==========================================
// 📱 PAIRING CODE GENERATION (නිවැරදි ක්‍රමය)
// ==========================================
let pairingRequested = false;

client.on('qr', async (qr) => {
    // QR එක generate වුණාම pairing code එක request කරන්න
    if (!pairingRequested) {
        pairingRequested = true;
        try {
            const phoneNumber = '94742381405'; // ඔබේ අංකය
            const pairingCode = await client.requestPairingCode(phoneNumber);
            console.log('\n========================================');
            console.log('🟢 ඔබේ WhatsApp Pairing Code එක:');
            console.log(`👉 ${pairingCode}`);
            console.log('💡 මෙය WhatsApp එකේ Settings > Linked Devices > Link a Device එකෙන් ඇතුලත් කරන්න');
            console.log('========================================\n');
        } catch (error) {
            console.error('❌ Pairing code error:', error.message);
        }
    }
});

// Pairing code event එක (නවතම whatsapp-web.js වල මේකයි වැඩ)
client.on('code', (code) => {
    console.log('\n========================================');
    console.log('🟢 Pairing Code (event):', code);
    console.log('========================================\n');
});

// ==========================================
// ✅ BOT READY
// ==========================================
client.on('ready', () => {
    console.log('✅ SHANA AI Bot SYSTEM CONNECTED!');
    console.log(`📱 Logged in as: ${client.info.pushname || client.info.wid.user}`);
    console.log(`📞 Phone: ${client.info.wid.user}`);
});

client.on('authenticated', () => {
    console.log('✅ AUTHENTICATED SUCCESSFULLY!');
});

// ==========================================
// 💬 AUTO REPLY SYSTEM
// ==========================================
client.on('message', async (message) => {
    try {
        // Group chats වලින් එන msgs filter (අවශ්‍යනම් ඉවත් කරන්න)
        // if (message.from.includes('@g.us')) return;

        const msg = message.body.trim().toLowerCase();
        console.log(`📩 පණිවිඩය: "${message.body}" from ${message.from}`);

        // ----- COMMANDS -----
        if (message.body === '1') {
            await message.reply('✅ 1XBET Details:\nLink: https://1xbet.com\nBonus: 100% Welcome');

        } else if (msg === 'hi' || msg === 'hello' || msg === 'හෙලෝ') {
            await message.reply('👋 හෙලෝ! SHANA AI Bot වෙත සාදරයෙන් පිළිගනිමු. \nඔබට උදව් අවශ්‍යද?\n\n*1* - 1XBET Details\n*2* - අපගේ සේවා\n*3* - සම්බන්ධ වීමට');

        } else if (msg === '2') {
            await message.reply('🛠️ අපගේ සේවා:\n• Bot Development\n• Web Design\n• AI Solutions');

        } else if (msg === '3') {
            await message.reply('📞 අප හා සම්බන්ධ වන්න:\n📱 Phone: 0742381405\n💬 WhatsApp: Same Number');

        } else if (msg.includes('thank') || msg.includes('thanks') || msg.includes('ඉස්තුති') || msg.includes('ස්තූතියි')) {
            await message.reply('🥰 ඔබට ස්තූතියි! වෙන කිසිවක් අවශ්‍යද?');

        } else if (msg.includes('bye') || msg.includes('බායි') || msg.includes('යන්නම්')) {
            await message.reply('👋 ගිහින් එන්න! ආයෙත් හමුවෙමු!');

        } else {
            // Default auto-reply (යවන්නෙක් නැතිනම්)
            await message.reply(`🤖 SHANA AI Bot\n\nඔබගේ පණිවිඩය ලැබුණි:\n"${message.body}"\n\n*1* - 1XBET Details\n*hi* - සාමාන්‍ය පිළිතුර`);
        }

        // Typing indicator (විකල්ප)
        // await message.reply('...');

    } catch (error) {
        console.error('❌ Message reply error:', error.message);
    }
});

// ==========================================
// 🔄 RECONNECTION / CRASH HANDLING
// ==========================================
client.on('auth_failure', (msg) => {
    console.error('❌ Authentication failed:', msg);
    console.log('🔄 නැවත උත්සාහ කරන්න... Session files delete කරලා restart කරන්න');
});

client.on('disconnected', async (reason) => {
    console.log('⚠️ Client disconnected:', reason);
    console.log('🔄 නැවත සම්බන්ධ වෙමින්... (5 seconds)');
    
    // Auto restart with delay
    setTimeout(async () => {
        try {
            console.log('🔄 Restarting...');
            await client.initialize();
        } catch (e) {
            console.error('❌ Restart failed:', e.message);
            process.exit(1);
        }
    }, 5000);
});

// ==========================================
// 🚀 START THE BOT
// ==========================================
console.log('⏳ SHANA AI Bot ආරම්භ වෙමින්...');
client.initialize().catch(err => {
    console.error('❌ Failed to initialize:', err.message);
});
