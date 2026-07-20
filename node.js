const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

// පැරණි session එක මකා දැමීම (සෑම restart එකකදීම අලුතින් Pair කිරීමට)
const sessionPath = path.join(__dirname, '.wwebjs_auth');
if (fs.existsSync(sessionPath)) {
    fs.rmSync(sessionPath, { recursive: true, force: true });
}

const MY_PHONE_NUMBER = process.env.WHATSAPP_NUMBER;
const userCooldowns = new Map();
const COOLDOWN_TIME = 5000;

function canReply(userId) {
    const lastTime = userCooldowns.get(userId);
    if (lastTime && (Date.now() - lastTime) < COOLDOWN_TIME) {
        return false;
    }
    return true;
}

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-zygote',
            '--single-process'
        ]
    },
    // මේක අනිවාර්යයෙන්ම දාන්න, code එක එනකල් බලාගෙන ඉන්න වෙලාව වැඩි කරනවා
    authTimeoutMs: 60000 
});

client.on('ready', async () => {
    console.log('✅ බොට් සාර්ථකව සම්බන්ධ විය!');
    
    setTimeout(async () => {
        try {
            console.log(`🔄 ${MY_PHONE_NUMBER} අංකය සඳහා Pairing Code ඉල්ලයි...`);
            
            // මේ පේළිය මෙහෙම වෙනස් කරන්න (mobile: true කියන එක එකතු ක
const pairingCode = await client.requestPairingCode(MY_PHONE_NUMBER, true);
            
            console.log('================================================');
            console.log(`🔢 ඔබේ Pairing Code එක: ${pairingCode}`);
            console.log('================================================');
        } catch (e) {
            console.error('❌ Pairing Code ලබා ගැනීමේ දෝෂය: ', e);
            // වැරදුනොත් ආයෙත් එකපාරක් try කරන්න කියල log එකක් දාමු
            console.log('⚠️ කරුණාකර නැවත උත්සාහ කරන්න...');
        }
    }, 5000); 
});

client.initialize();

client.on('message', async (message) => {
    if (message.fromMe) return;

    const userId = message.from;
    const msg = message.body.toLowerCase().trim();

    if (msg === 'hi' || msg === 'hello' || msg === 'හායි' || msg === 'හෙලෝ') {
        if (!canReply(userId)) return;
        await message.reply('🤖 SHANA AI BOT SYSTEM 🕹️\n-----------------------------\nHI සුබ දවසක් සර්,මිස් 😚\n\nඔබට අවශ්ශය උපකාරය පවසන්න ! මම ඔබට සහය වීම සදහා බැදීසිටින්නේමී...!');
        userCooldowns.set(userId, Date.now());
        return;
    }

    if (['menu', 'help', 'උදව්'].includes(msg)) {
        if (!canReply(userId)) return;
        await message.reply('AI BOT -\n📜 SHANA All SERVICE \n\n1. SHANA 1XBET DEPOSIT තොරතුරු ✅\n2. SHANA 1XBET WITHDRAW තොරතුරු ✅\n3. SHANA 1XBET VIP PROMO CODE තොරතුරු ✅\n4. WEB SITE & SOFTWARE සාදාගැනිමට ✅\n5. SOCAL MEDIA BOOST ( All plate Form ) ✅\n6. AVIATOR HIGH ODD අනලයිසින් ඉගෙන ගැනිමටනම් ✅\n7. Whatsapp Ai Auto Replay Bot සාදාගැනිමටනම් ✅\n\nකරුණාකරලා ඔබට අවශ්ශය සෙවාව අංකය ලබාදෙන්න!..... \n\nSOFTWARE DEVELOPR SHANA 🐛');
        userCooldowns.set(userId, Date.now());
        return;
    }

    if (['1', '2', '3', '4', '5', '6', '7'].includes(msg)) {
        if (!canReply(userId)) return;
        let replyText = '';
        if (msg === '1') replyText = '💗🇱🇰🙏ආයුබෝවන්🙏🇱🇰💗\n*1X BET සහ WITHDRAWAL ඉතා ඉක්මනින් ලබාගන්න...*\n\n*SHANA SERVICE __💯*\n\n💵💵 *මුදල් තැන්පත් කිරීම*💵💵\n✅ *Account Deposit*✅ *Account Withdraw*\n\n🔯 BOC: 94118758 (MINNERIYA - K.G LAKSHAN KAVISHKA KUMARA)\n✳️PEOPLE BANK: 006200150094114 (K.G.LAKSHAN KAVISHKA KUMARA)\n✳️ez cash: 0764104588 (LAKSHAN)\n✡️ Binanace: 1066282628 (LAKSHAN)\n🔯ipay: 0764104588 (Lakshan)\n✡️Dialog Finance PLC: 0010 2217 5776 (LAKSHAN KAVISHKA KUMARA)\n\n*❏ DEPOSIT - minute 2-5 😍*\n*❏ WITHDRAW - minute 10-30 😍*\n👉👉 *සැ.යු.* : ඔබ විසින් *REMARK* යටතේ ඔබගේ PLAYER ID සඳහන් කල යුතුමය.\nතවද 1X BET , BET යන වචන කිසි සේත්ම භාවිතා නොකල යුතුය...\n\n⚠️️ඉහත ක්‍රම හරහා *DEPOSIT* කර SLIP එක හා ඔබේ *1XBET PLAYER ID* type එවන්න.';
        else if (msg === '2') replyText = '*❏ SHANA WITHDRAW ADDRESS ✺*\n\n_MINI Withdraw Rs 250/_\nපියවර 1: 1Xbet app එක open කර menu යන්න.\n* ඉට පසු උඩම ඇති setting අයිකන් එක ක්ලික් කරන්න\n* ✺ ඉට පසුව withdraw Icon එක තෝරන්න.\n➢ ඉට පසු ඔබට ගන්න ඔනි ගාන ගහන්න.\n❏ city: minneriya\n❏ street : Lakshan service (24/7)\n\nඑම පියවර සම්පූර්ණ කර එන කොඩ් එකේ Screenshot එකක් මට එවන්න ✅';
        else if (msg === '3') replyText = 'VIP 1XBET PROMO CODE ඔයාල්ත් දැන්ම රෙජිස්ට වේන්න!... \n\nLashan1x\n👆👆👆👆\nLOST නොවී ගෙමක් ගහන්න කැමති අය දැන්ම ගිහින් 1XBET ACCOUNT එකක් හාදාගන්න\n200% DEPOSIT BONUS ✅';
        else if (msg === '4' || msg === '6') replyText = '0758862130 / 0742381405 Call එකකින් විස්තර දැනගන්න.... 🤝🤝🤝';
        else if (msg === '5') replyText = 'AI BOT - 0758862130 / 0742381405 / 0703557568\nCall, Mg 24/7 Ok ✅';
        else if (msg === '7') replyText = 'AI BOT -\nඔබට අඩුම මුදලට 24/7 AUTO reply Bot කෙනෙක් ඔබගේ නමින් හදාගැනීමට අවශ්‍යයිනම් පහල දුරකතන අංකයට අමතන්න: 0758862130 ✅';

        await message.reply(replyText);
        userCooldowns.set(userId, Date.now());
        return;
    }

    if (!canReply(userId)) return;
    await message.reply('AI BOT -\nමතක් රැදීසීටින් හැකි ඉක්මනින් SHANA Online ගෙන්වා ගැනිමට උත්සහ කරන්නෙමී.... ! \nඔහුට තිබෙන වැඩත් එක්ක ඔහු කාර්රය බහුල වී ඇතී අතර ඉමනින් පැමිනේවී...');
    userCooldowns.set(userId, Date.now());
});
