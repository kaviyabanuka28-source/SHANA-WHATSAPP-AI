const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// ==========================================
// 🌐 WEB SERVER - Railway health check එකට
// ==========================================
app.get('/', (req, res) => {
    res.status(200).send(`
        <html>
        <head><title>SHANA AI Bot</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>✅ SHANA AI Bot is Running!</h1>
            <p>Status: <strong>Connected</strong></p>
            <p>Check Railway logs for QR code</p>
        </body>
        </html>
    `);
});

// QR code එක web එකෙන් බලන්න endpoint එකක්
app.get('/qr', (req, res) => {
    const qrFile = path.join(__dirname, 'last_qr.txt');
    if (fs.existsSync(qrFile)) {
        const qrData = fs.readFileSync(qrFile, 'utf8');
        res.send(`<pre>${qrData}</pre>`);
    } else {
        res.send('QR code not generated yet. Check logs.');
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Server running on port ${PORT}`);
    console.log(`🌐 QR Code URL: https://${process.env.RAILWAY_PUBLIC_DOMAIN || 'localhost:' + PORT}/qr`);
});

// ==========================================
// 🧹 SESSION CLEAN (Fresh start)
// ==========================================
const sessionDir = path.join(process.cwd(), '.wwebjs_auth');
if (fs.existsSync(sessionDir)) {
    fs.rmSync(sessionDir, { recursive: true, force: true });
    console.log('🧹 Session cleaned for fresh login');
}

// ==========================================
// 🚀 CLIENT CONFIG - Railway සඳහා ප්‍රශස්ත
// ==========================================
const client = new Client({
    authStrategy: new LocalAuth({ clientId: "shana-bot" }),
    puppeteer: {
        headless: true,
        executablePath: process.env.CHROME_PATH || '/usr/bin/chromium-browser',
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--no-zygote",
            "--single-process",
            "--disable-extensions",
            "--disable-software-rasterizer"
        ]
    }
});

// ==========================================
// 📱 QR CODE GENERATION - Logs + Web
// ==========================================
client.on('qr', (qr) => {
    console.log('\n========================================');
    console.log('📱📱📱 WHATSAPP QR CODE - SCAN THIS:');
    console.log('========================================\n');
    
    // QR code එක terminal එකට print කරන්න
    qrcode.generate(qr, { small: true });
    
    console.log('\n========================================');
    console.log('📌 SCAN කරන විදිය:');
    console.log('1. WhatsApp එක open කරන්න');
    console.log('2. Settings (⚙️) > Linked Devices');
    console.log('3. Link a Device > QR code එක scan කරන්න');
    console.log('========================================\n');
    
    // QR code එක text file එකට save කරන්න (web endpoint එකට)
    try {
        // QR code එක terminal-friendly text එකක් විදියට save කරන්න
        const qrText = `WhatsApp QR Code - SHANA Bot\n========================\n\nScan this QR code with your WhatsApp:\n\n${qr}\n\n1. WhatsApp > Settings > Linked Devices\n2. Link a Device\n3. Scan this QR code\n`;
        fs.writeFileSync(path.join(__dirname, 'last_qr.txt'), qrText);
        console.log('💻 QR also available at: /qr endpoint');
    } catch(e) {
        // ignore
    }
});

// ==========================================
// ✅ BOT EVENTS
// ==========================================
client.on('ready', () => {
    console.log('\n✅✅✅ SHANA AI Bot SUCCESSFULLY CONNECTED! ✅✅✅');
    console.log(`📱 Logged in as: ${client.info.pushname || client.info.wid.user}`);
    console.log(`📞 Phone: ${client.info.wid.user}`);
    console.log(`✅ Auto-reply system is now ACTIVE!\n`);
    
    // QR file එක delete කරන්න (තවදුරටත් අවශ්‍ය නෑ)
    const qrFile = path.join(__dirname, 'last_qr.txt');
    if (fs.existsSync(qrFile)) fs.unlinkSync(qrFile);
});

client.on('authenticated', () => {
    console.log('✅ Authenticated successfully! Session saved.');
});

client.on('auth_failure', (msg) => {
    console.error('❌ Auth failure:', msg);
    console.log('🔄 Session invalid. Restarting in 3s...');
    setTimeout(() => {
        // Session delete කරලා restart කරන්න
        if (fs.existsSync(sessionDir)) {
            fs.rmSync(sessionDir, { recursive: true, force: true });
        }
        process.exit(1);
    }, 3000);
});

// ==========================================
// 💬 AUTO REPLY SYSTEM
// ==========================================
client.on('message', async (message) => {
    try {
        // Own messages skip කරන්න
        if (message.fromMe) return;
        
        const msg = message.body.trim();
        const sender = message._data.notifyName || message.from;
        
        console.log(`📩 "${msg}" from ${sender}`);

        // ----- AUTO REPLIES -----
        if (msg === '1') {
            await message.reply('✅ *1XBET Details*\n\n🔗 Link: https://1xbet.com\n🎁 Bonus: 100% Welcome Bonus\n📱 Mobile App Available');
        }
        else if (['hi', 'hello', 'හායි', 'හෙලෝ', 'hai', 'සුභ උදෑසනක්', 'සුභ සන්ධ්‍යාවක්'].includes(msg.toLowerCase())) {
            await message.reply(`👋 *SHANA AI Bot* වෙත සාදරයෙන් පිළිගනිමු!\n\n👉 *Commands:*\n• *1* - 1XBET Details\n• *2* - අපගේ සේවා\n• *3* - සම්බන්ධ වීමට\n• *menu* - මෙනුව බලන්න\n• *hi* - Hello පණිවිඩය`);
        }
        else if (msg === '2') {
            await message.reply('🛠️ *අපගේ සේවා*\n\n🔹 WhatsApp Bot Development\n🔹 Web Design & Development\n🔹 AI Chatbot Solutions\n🔹 Automation Systems\n🔹 Digital Marketing');
        }
        else if (msg === '3') {
            await message.reply('📞 *අප හා සම්බන්ධ වන්න*\n\n📱 Phone: 0742381405\n💬 WhatsApp: 0742381405\n🌐 Web: shana-bot.com\n📧 Email: contact@shana-bot.com');
        }
        else if (['menu', 'help', 'උදව්', 'commands', 'ලිස්ට්'].includes(msg.toLowerCase())) {
            await message.reply(`📋 *SHANA AI Bot - Command List*\n\n*1* - 1XBET Details\n*2* - අපගේ සේවා\n*3* - සම්බන්ධ වීමට\n*hi* - Hello පණිවිඩය\n*menu* - මෙම මෙනුව\n*bye* - සමුගැනීම\n*about* - බොට් ගැන`);
        }
        else if (['thank', 'thanks', 'ස්තූතියි', 'ඉස්තුති', 'thx', 'thank you', 'tanks'].some(w => msg.toLowerCase().includes(w))) {
            await message.reply('🥰 ඔබට ස්තූතියි! කැමතිනම් *menu* ටයිප් කරලා වෙන commands බලන්න 😊');
        }
        else if (['bye', 'බායි', 'යන්නම්', 'go', 'exit', 'ගිහින් එන්න', 'goodbye'].some(w => msg.toLowerCase().includes(w))) {
            await message.reply('👋 ගිහින් එන්න! නැවත හමුවෙමු! 💫');
        }
        else if (['about', 'info', 'මොකක්ද', 'කවුද', 'bot', 'who'].some(w => msg.toLowerCase().includes(w))) {
            await message.reply(`🤖 *SHANA AI Bot*\n\n⚡ Version: 2.0\n💡 Features: Auto Reply, 24/7 Online\n🛠️ Platform: WhatsApp Web\n📅 Status: Active\n\n*menu* ටයිප් කරන්න සියලු commands බලන්න`);
        }
        else {
            // Default reply - හඳුනා නොගත් messages
            await message.reply(`🤖 *SHANA AI Bot*\n\nඔබගේ පණිවිඩය ලැබුණි ✅\n\n📌 *menu* ටයිප් කරන්න commands list එක බලන්න\n📌 *1* - 1XBET Details`);
        }

    } catch (error) {
        console.error('❌ Reply error:', error.message);
    }
});

// ==========================================
// 🔄 DISCONNECT HANDLING
// ==========================================
client.on('disconnected', async (reason) => {
    console.log('⚠️ Disconnected:', reason);
    console.log('🔄 Reconnecting in 5 seconds...');
    
    setTimeout(async () => {
        try {
            console.log('🔄 Restarting client...');
            await client.initialize();
        } catch (e) {
            console.error('❌ Reconnect failed:', e.message);
            process.exit(1);
        }
    }, 5000);
});

// ==========================================
// 🚀 START BOT
// ==========================================
console.log('\n⏳ SHANA AI Bot starting...');
console.log(`📱 Node version: ${process.version}`);
console.log('🔍 Checking browser...\n');

// Chromium check කරන්න
const { execSync } = require('child_process');
try {
    const chromePath = execSync('which chromium-browser || which google-chrome || which chromium || echo "not found"').toString().trim();
    console.log(`✅ Browser: ${chromePath}`);
} catch(e) {
    console.log('⚠️ Browser check skipped');
}

client.initialize().catch(err => {
    console.error('❌ Initialize failed:', err.message);
    console.log('🔄 Retrying in 3s...');
    setTimeout(() => process.exit(1), 3000);
});

// Railway sleep නොවීමට keep-alive
setInterval(() => {
    console.log('💓 Bot heartbeat: alive', new Date().toISOString());
}, 600000); // Every 10 minutes
