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
    console.log('🌐 Server is running on port 8080');
});

// ---------- Service Worker Clean (Crash Fix) ----------
const workerPath = path.join(process.cwd(), '.wwebjs_auth', 'session-shana-bot', 'Default', 'Service Worker');
if (fs.existsSync(workerPath)) {
    fs.rmSync(workerPath, { recursive: true, force: true });
    console.log('🧹 Session cache cleaned');
}

// ==================================================
// 📌 NEW METHOD: pairWithPhoneNumber (100% Working)
// ==================================================
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
            "--single-process",
            "--disable-extensions"
        ]
    },
    // ✅ NEW: Pairing Code config මෙතනින් දෙන්න
    pairWithPhoneNumber: {
        phoneNumber: "94742381405"  // ඔබේ අංකය (country code + number, + නැතුව)
    }
});

// ✅ NEW: Pairing code එන්නේ මේ event එකෙන්
client.on('code', (code) => {
    console.log('\n========================================');
    console.log('🟢🟢🟢 ඔබේ WhatsApp Pairing Code:');
    console.log(`👉👉👉 ${code} 👈👈👈`);
    console.log('💡 WhatsApp Settings > Linked Devices > Link a Device');
    console.log('========================================\n');
});

// ==================================================
// ✅ BOT EVENTS
// ==================================================
client.on('ready', () => {
    console.log('✅ SHANA AI Bot SYSTEM CONNECTED!');
    console.log(`📱 Logged in as: ${client.info.pushname || client.info.wid.user}`);
});

client.on('authenticated', () => {
    console.log('✅ AUTHENTICATED SUCCESSFULLY!');
});

// ==================================================
// 💬 AUTO REPLY SYSTEM (Crash-Proof)
// ==================================================
client.on('message', async (message) => {
    try {
        const msg = message.body.trim();
        console.log(`📩 "${msg}" from ${message.from}`);

        if (msg === '1') {
            await message.reply('✅ 1XBET Details:\nLink: https://1xbet.com\nBonus: 100% Welcome');
        } 
        else if (msg.toLowerCase() === 'hi' || msg.toLowerCase() === 'hello' || msg.toLowerCase() === 'හෙලෝ' || msg.toLowerCase() === 'හායි') {
            await message.reply('👋 හෙලෝ! SHANA AI Bot වෙත සාදරයෙන් පිළිගනිමු.\n\n*1* - 1XBET Details\n*2* - අපගේ සේවා\n*3* - සම්බන්ධ වීමට\n*hi* - සාමාන්‍ය පිළිතුර');
        }
        else if (msg === '2') {
            await message.reply('🛠️ අපගේ සේවා:\n• Bot Development\n• Web Design\n• AI Solutions\n• WhatsApp Automation');
        }
        else if (msg === '3') {
            await message.reply('📞 අප හා සම්බන්ධ වන්න:\n📱 0742381405\n💬 WhatsApp');
        }
        else if (['thank', 'thanks', 'ස්තූතියි', 'ඉස්තුති'].some(w => msg.toLowerCase().includes(w))) {
            await message.reply('🥰 ඔබට ස්තූතියි! වෙන කිසිවක් අවශ්‍යද?');
        }
        else if (['bye', 'බායි', 'යන්නම්', 'go', 'exit'].some(w => msg.toLowerCase().includes(w))) {
            await message.reply('👋 ගිහින් එන්න! නැවත හමුවෙමු!');
        }
        else {
            await message.reply(`🤖 SHANA AI Bot\n\nඔබගේ පණිවිඩය: "${msg}"\n\n*1* - 1XBET\n*hi* - Hello`);
        }

    } catch (error) {
        console.error('❌ Reply error:', error.message);
    }
});

// ==================================================
// 🔄 CRASH HANDLING & RECONNECT
// ==================================================
client.on('auth_failure', (msg) => {
    console.error('❌ Auth failed:', msg);
    console.log('🔄 Restarting...');
    setTimeout(() => process.exit(0), 3000);
});

client.on('disconnected', (reason) => {
    console.log('⚠️ Disconnected:', reason);
    console.log('🔄 Auto reconnect in 5s...');
    setTimeout(() => {
        client.initialize().catch(e => {
            console.error('❌ Restart failed:', e.message);
            process.exit(1);
        });
    }, 5000);
});

// ==================================================
// 🚀 START
// ==================================================
console.log('⏳ SHANA AI Bot ආරම්භ වෙමින්...');
client.initialize().catch(err => {
    console.error('❌ Initialize failed:', err.message);
});
