const { 
    default: makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState,
    fetchLatestWaWebVersion,
    makeCacheableSignalKeyStore,
    Browsers 
} = require('@whiskeysockets/baileys');

const { Boom } = require('@hapi/boom');
const pino = require('pino');
const express = require('express');
const fs = require('fs');
const path = require('path');

const CONFIG = {
    PAIR_NUMBER: process.env.PAIR_NUMBER || '',
    BOT_NAME: 'SHANA',
    AUTH_DIR: path.join(__dirname, 'auth_info_baileys'),
    COOLDOWN_MINUTES: 20,
    COOLDOWN_MS: 20 * 60 * 1000,
    PORT: process.env.PORT || 3000,
    RAILWAY_URL: process.env.RAILWAY_URL || '',
    KEEP_ALIVE_INTERVAL: 10 * 60 * 1000,
};

class CooldownManager {
    constructor() { this.cooldowns = new Map(); }
    isCooldown(userJid) {
        const lastReply = this.cooldowns.get(userJid);
        if (!lastReply) return false;
        const elapsed = Date.now() - lastReply;
        if ((CONFIG.COOLDOWN_MS - elapsed) <= 0) { this.cooldowns.delete(userJid); return false; }
        return true;
    }
    getRemainingMinutes(userJid) {
        const lastReply = this.cooldowns.get(userJid);
        if (!lastReply) return 0;
        return Math.ceil((CONFIG.COOLDOWN_MS - (Date.now() - lastReply)) / 60000);
    }
    setCooldown(userJid) { this.cooldowns.set(userJid, Date.now()); }
}

const cooldown = new CooldownManager();

// MESSAGES (ඔබ ඉල්ලූ පරිදි කිසිවක් වෙනස් කර නැත)
const MESSAGES = {
    WELCOME: `SHANA AI BOT SYSTEM 🕹️\n-----------------------------\nHI සුබ දවසක් සර්,මිස් 😚\n\nඔබට අවශ්ශය උපකාරය පවසන්න ! මම ඔබට සහය වීම සදහා බැදීසිටින්නේමී...!\n\nSHANA AI - ONLINE ✅`,
    MENU: `📜 SHANA All SERVICE\n\n1. SHANA 1XBET DEPOSIT තොරතුරු ✅\n2. SHANA 1XBET WITHDRAW තොරතුරු ✅\n3. SHANA 1XBET VIP PROMO CODE තොරතුරු ✅\n4. WEB SITE & SOFTWARE සාදාගැනිමට ✅\n5. SOCAL MRDIA BOOST ( All plate Fom )\n5. SHANA CONTACTS කරගැනිමට ✅\n6. AVIATOR HIGH ODD අනලයිසින් ඉගෙන ගැනිමටනම් ✅\n7. Whatsapp Ai Auto Replay Bot සාදාගැනිමටනම් ✅\n\nකරුණාකරලා ඔබට අවශ්ශය සෙවාව උඩ Menu එකේ ඇත්නම් එම අංකය ලාබාදෙන්න!.....\n\nඔබට වෙනත් කරුණක් දැන්විමට අවශ්ශයනම් පහලින් සදහන් කරන්න මම එය ඉතාමත් ඉක්මනට SHANA වේත දැන්වීමට සලස්වන්නම්\n--------------------------------\nSOFTWARE DEVELOPR SHANA 🐛`,
    OPTION_1: `💗🇱🇰🙏ආයුබෝවන්🙏🇱🇰💗\n *1X BET සහ WITHDRAWAL ඉතා ඉක්මනින් ලබාගන්න...* *SHANA SERVICE __💯* 💵💵 *මුදල් තැන්පත් කිරීම*💵💵\n✅ *Account Deposit*✅ *Account Withdraw*\n\n🔯 BOC \n🔯 94118758\n🔯MINNERIYA\n🔯 K.G LAKSHAN KAVISHKA KUMARA\n\n✳️PEOPLE BANK : 006200150094114\n ✳️K.G.LAKSHAN KAVISHKA KUMARA \n✳️HIGURAKGODA\n\n✳️ ez cash : 0764104588\n✳️LAKSHAN ( open ) \n ( වැඩ්පුර රුපියල් 20-/ දැමිමට කාරුණික වන්න )\n\n✡️ Binanace \n✡️1066282628\n✡️ LAKSHAN \n\n🔯ipay \n🔯0764104588\n🔯Lakshan\n\n✡️Dialog Finance PLC \n✡️0010 2217 5776\n✡️ LAKSHAN KAVISHKA KUMARA\n\n *❏ DEPOSIT - minute 2-5 😍* *❏ WITHDRAW - minute 10-30 😍* 👉👉 *සැ.යු.* : ඔබ විසින් *REMARK* යටතේ ඔබගේ PLAYER ID සඳහන් කල යුතුමය.\nතවද 1X BET   , BET යන වචන කිසි සේත්ම භාවිතා නොකල යුතුය...\n\n⚠️️ඉහත ක්‍රම හරහා *DEPOSIT* කර \n SLIP* එක හා ඔබේ *1XBET PLAYER ID* *type එවන්න* 👉සැ.යු. : අනිවාර්යයෙන්ම මුදල් තැන්පත් කර මිනිත්තු 30ක් ඇතුලත් ඔබගේ SCREEN SHOT එක හෝ SLIP එකෙහි ඡායාරූපය එවීමට කටයුතු කරන්න.\n\nඑසේ නොහැකි නම් පණිවිඩයක් එවීමට කාරුණිකවන්න .\n\n✺ තෙවනපාර්ශවීය සල්ලි දැමිම් බාරගනු නොලැබේ ❌`,
    OPTION_2: `*❏ SHANA WITHDRAW  ADDRESS ✺*\n\n\n \n\n _MINI Withdraw  Rs 250/_ \nපියවර 1 \n* මුලින්ම 1Xbet app එක open කරන්න ඉට පසු menu යන්න. \n * *ඉට පසු උඩම ඇති setting  අයිකන් එකක් එක ක්ලික් කරන්න*\n\n *✺ ඉට පසුව withdraw  කියලා අයිකන් එකක් ඇති එක ඔබන්න ඉට පස්සෙ 1XBET CASH කියන් මේතඩ් එක තොරන්න පොඩ්ඩක් පහලට වේන්න තියෙන්නේ*\n\n➢ ඉට පසු ඔබට ගන්න ඔනි ගාන ගහන්න.\n\n❏ city: minneriya පුරවන්න\n❏ street : Lakshan service (24/7) \n\nපුරවගන්න ඉන් පසු ඔබට ඔබගේ gamil එකක් හො phone නම්බ එකක් ඇඩ් කරලා තියේනවානම් කොඩ් එකක් එයි එක දිලා කන්පොම් කරන්න.\n\n *➢ ඉන් පසුව ඇප් එකේන් බැක් වී ආපාසු ඇප් එකට ලොග් වී විත්‍රොල් තැනට යන්න.*\n➢ ඉට පඩු විත්‍රොල් රේපුස්ට කියලා බටන් එකක් ඇති එක ඔබන්න.\n\n➢ ඉන් පසුව ඉංග්‍රිසි වචන සහිතව නිල්පාටින් වචන වගයක් ඇවිත් ඇති එහි ඇති ගෙට් කොඩ් කියලා එකක් අන්න එක ඔබන්න.\n\n➢ එක ඔබවුවට පසුව එනවා කොඩ් එකක් අන්න එකි ස්ක්‍රින් ශොට් එකක් ගහලා ok කරලා මට එවන්න .\n\nඑච්චරයි ✅`,
    OPTION_3: `VIP 1XBET PROMO CODE ඔයාල්ත් දැන්ම රෙජිස්ට වේන්න!... \n\nLashan1x \n👆👆👆👆 \nLOST නොවී ගෙමක් ගහන්න කැමති අය දැන්ම ගිහින් 1XBET ACCOUNT එකක් හාදාගන්න \n200% DEPOSIT BONUS ✅`,
    OPTION_4: `0758862130/0742381405 Call එකකින් විස්තර දැනගන්න.... \n🤝🤝🤝🤝🤝🤝🤝🤝`,
    OPTION_5: `0758862130/0742381405/0703557568 \nCall , Mg 24/7 Ok ✅`,
    OPTION_6: `0758862130/0742381405 Call එකකින් විස්තර දැනගන්න.... \n🤝🤝🤝🤝🤝🤝🤝🤝`,
    OPTION_7: `ඔබට අඩුම මුදලට 24/7 AUTO reply Bot කෙනෙක් ඔබගේ නමින් හාදාගැනිමට අවශ්ශයයිනම් පහල දුරකතන අංකයට අමතන්න 0758862130 ✅`,
    INVALID_INPUT: `AI BOT -\nමතක් රැදීසීටින් හැකි ඉක්මනින් SHANA Online ගෙන්වා ගැනිමට උත්සහ කරන්නෙමී....  !\nඔහුට තිබෙන වැඩත් එක්ක ඔහු කාර්රය බහුල වී ඇතී අතර ඉමනින් පැමිනේවී...`
};

const app = express();
app.get('/', (req, res) => res.json({ status: 'online' }));
app.get('/health', (req, res) => res.status(200).send('OK'));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(CONFIG.AUTH_DIR);
    const { version } = await fetchLatestWaWebVersion();
    
    const sock = makeWASocket({
        version,
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
        browser: Browsers.macOS('Desktop'),
        logger: pino({ level: 'silent' }),
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: false,
    });

    if (CONFIG.PAIR_NUMBER && !state.creds.registered) {
        setTimeout(async () => {
            const code = await sock.requestPairingCode(CONFIG.PAIR_NUMBER);
            console.log(`🔑 PAIR CODE: ${code}`);
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        if (update.connection === 'open') console.log('✅ Bot Connected!');
        if (update.connection === 'close') {
            const shouldReconnect = (update.lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        for (const msg of messages) {
            if (!msg.message || msg.key.fromMe) continue;
            const jid = msg.key.remoteJid;
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || "";
            if (jid.includes('@g.us') || jid === 'status@broadcast') continue;
            
            if (!cooldown.isCooldown(jid)) {
                await sock.sendMessage(jid, { text: MESSAGES.WELCOME });
                await new Promise(r => setTimeout(r, 1000));
                await sock.sendMessage(jid, { text: MESSAGES.MENU });
                cooldown.setCooldown(jid);
            } else {
                const input = text.trim();
                if (['1','2','3','4','5','6','7'].includes(input)) {
                    await sock.sendMessage(jid, { text: MESSAGES[`OPTION_${input}`] });
                    cooldown.setCooldown(jid);
                } else {
                    await sock.sendMessage(jid, { text: MESSAGES.INVALID_INPUT });
                    cooldown.setCooldown(jid);
                }
            }
        }
    });
}

app.listen(CONFIG.PORT, () => startBot(
