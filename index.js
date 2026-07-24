const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  delay,
  Browsers
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const http = require('http');
const fs = require('fs');

// Railway එක ස්ලිප් වීම වැළැක්වීමට කුඩා HTTP සර්වර් එකක්
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('SHANA AI Bot is running 24/7!\n');
});
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

// Cooldown memory tracking (පළමු වරට මැසේජ් දමන කෙනෙකුට විනාඩි 20 කට වරක් පමණක් සාමාන්‍ය මැසේජ් යැවීම සඳහා)
const userCooldowns = new Map();
const COOLDOWN_TIME = 20 * 60 * 1000; // විනාඩි 20 ක් මිලි තත්පර වලින්

function checkCooldown(userId) {
  const lastTime = userCooldowns.get(userId);
  const now = Date.now();
  if (lastTime && (now - lastTime < COOLDOWN_TIME)) {
    return false; // තවම විනාඩි 20 ගෙවී නැත
  }
  userCooldowns.set(userId, now);
  return true; // යැවිය හැක
}

// WhatsApp Anti-Ban සඳහා මිනිසෙකු මෙන් ස්වභාවිකව ටයිප් කිරීම සහ බෑන් වීම වැළැක්වීමේ ආරක්‍ෂිත ප්‍රමාදයන්
async function sendHumanLikeMessage(sock, sender, messageContent) {
  try {
    const randomPresenceDelay = Math.floor(Math.random() * 1000) + 1500; // තත්පර 1.5 - 2.5 අතර
    const randomTypingDelay = Math.floor(Math.random() * 2000) + 3000;   // තත්පර 3.0 - 5.0 අතර

    await sock.presenceSubscribe(sender);
    await delay(randomPresenceDelay);
    
    await sock.sendPresenceUpdate('composing', sender);
    await delay(randomTypingDelay);
    
    await sock.sendPresenceUpdate('paused', sender);
    await sock.sendMessage(sender, messageContent);
  } catch (error) {
    console.log('Error in human-like messaging: ', error);
  }
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: state,
    printQRInTerminal: false,
    // Pairing Code නොටිෆිකේෂන් ගැටළුව මඟහරවා ගැනීමට නිවැරදි Browser වින්‍යාසය
    browser: Browsers.macOS('Chrome'),
    markOnlineOnConnect: true,
    emitOwnEvents: true,
    getMessage: async () => { return { conversation: 'hello' } }
  });

  sock.ev.on('creds.update', saveCreds);

  // Pairing Code ලබා ගැනීම සහ WhatsApp නොටිෆිකේෂන් එක සක්‍රීය කිරීම (Railway Variables හරහා)
  if (!sock.authState.creds.registered) {
    const phoneNumber = process.env.PHONE_NUMBER;
    
    if (!phoneNumber) {
      console.log('\n❌ දෝෂයකි: කරුණාකර Railway Variables වල "PHONE_NUMBER" නමින් ඔබගේ WhatsApp අංකය (උදා: 9471xxxxxxx) ඇතුළත් කරන්න!\n');
      return;
    }

    // සර්වර් එක සම්පූර්ණයෙන්ම ස්ටාර්ට් වී සොකට් එක සූදානම් වන තෙක් තත්පර 5ක ආරක්ෂිත රැඳීමක්
    console.log(`\n⏳ Pairing code එක ජනෙරේට් වෙමින් පවතී. කරුණාකර රැඳී සිටින්න...`);
    await delay(5000);
    
    try {
      let code = await sock.requestPairingCode(phoneNumber.trim().replace(/[^0-9]/g, ''));
      code = code?.match(/.{1,4}/g)?.join('-') || code;
      console.log(`\n========================================`);
      console.log(`📌 ඔබගේ WhatsApp Pairing Code එක මෙයයි: \x1b[32m${code}\x1b[0m`);
      console.log(`========================================\n`);
    } catch (err) {
      console.log('❌ Pairing Code ලබාගැනීමේදී දෝෂයක් ඇති විය:', err);
    }
  }

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('ချိတ်විම බිඳ වැටුණි. නැවත සම්බන්ධ වෙමින් පවතී...', shouldReconnect);
      if (shouldReconnect) {
        setTimeout(() => startBot(), 5000);
      }
    } else if (connection === 'open') {
      console.log('\n✅ SHANA AI Bot සාර්ථකව WhatsApp වෙත සම්බන්ධ විය!');
    }
  });

  // පණිවිඩ ලැබුණු විට ක්‍රියාත්මක වන කොටස
  sock.ev.on('messages.upsert', async (chatUpdate) => {
    try {
      const mek = chatUpdate.messages[0];
      if (!mek.message) return;
      
      if (mek.key.fromMe) return;
      if (mek.key.remoteJid.endsWith('@g.us')) return; 

      const sender = mek.key.remoteJid;
      
      const messageType = Object.keys(mek.message)[0];
      let body = '';
      
      if (messageType === 'conversation') {
        body = mek.message.conversation;
      } else if (messageType === 'extendedTextMessage') {
        body = mek.message.extendedTextMessage?.text || '';
      } else if (messageType === 'imageMessage') {
        body = mek.message.imageMessage?.caption || '';
      } else if (messageType === 'videoMessage') {
        body = mek.message.videoMessage?.caption || '';
      }

      const text = body.trim();
      if (!text) return;

      console.log(`📩 ලැබුණු පණිවිඩයක් (${sender}): ${text}`);

      // ලාංඡන රූපය ෆෝල්ඩරයෙන් කියවා සූදානම් කිරීම (logo.jpg නමින් ෆයිල් එකක් තිබිය යුතුය)
      let logoMessageOptions = {};
      if (fs.existsSync('./logo.jpg')) {
        logoMessageOptions = { image: fs.readFileSync('./logo.jpg') };
      }

      // 1. මෙනු අංක (1 සිට 7 දක්වා) පරීක්ෂා කිරීම (මෙම අංක සඳහා කිසිදු ලිමිට් එකක් නොමැත)
      if (['1', '2', '3', '4', '5', '6', '7'].includes(text)) {
        
        if (text === '1') {
          const replyText = `💗🇱🇰🙏ආයුබෝවන්🙏🇱🇰💗\n *1X BET සහ WITHDRAWAL ඉතා ඉක්මනින් ලබාගන්න...* \n\n *SHANA SERVICE __💯* \n\n    💵💵 *මුදල් තැන්පත් කිරීම*💵💵\n✅ *Account Deposit*✅ *Account Withdraw*\n\n🔯 BOC \n🔯 94118758\n🔯MINNERIYA\n🔯 K.G LAKSHAN KAVISHKA KUMARA\n\n✳️PEOPLE BANK : 006200150094114\n ✳️K.G.LAKSHAN KAVISHKA KUMARA \n✳️HIGURAKGODA\n\n✳️  ez cash : 0764104588\n✳️LAKSHAN ( open ) \n ( වැඩ්පුර රුපියල් 20-/ දැමිමට කාරුණික වන්න )\n\n✡️ Binanace \n✡️1066282628\n✡️ LAKSHAN \n\n🔯ipay \n🔯0764104588\n🔯Lakshan\n\n✡️Dialog Finance PLC \n✡️0010 2217 5776\n✡️ LAKSHAN KAVISHKA KUMARA\n\n *❏ DEPOSIT - minute 2-5 😍* \n *❏ WITHDRAW - minute 10-30 😍* \n👉👉 *සැ.යු.* : ඔබ විසින් *REMARK* යටතේ ඔබගේ PLAYER ID සඳහන් කල යුතුමය.\nතවද 1X BET    , BET යන වචන කිසි සේත්ම භාවිතා නොකල යුතුය...\n\n⚠️️ඉහත ක්‍රම හරහා *DEPOSIT* කර \n SLIP* එක හා ඔබේ *1XBET PLAYER ID* *type එවන්න* \n\n👉සැ.යු. : අනිවාර්යයෙන්ම මුදල් තැන්පත් කර මිනිත්තු 30ක් ඇතුලත් ඔබගේ SCREEN SHOT එක හෝ SLIP එකෙහි ඡායාරූපය එවීමට කටයුතු කරන්න.\n\nඑසේ නොහැකි නම් පණිවිඩයක් එවීමට කාරුණිකවන්න .\n\n✺ තෙවනපාර්ශවීය සල්ලි දැමිම් බාරගනු නොලැබේ ❌`;
          
          if (logoMessageOptions.image) {
            await sendHumanLikeMessage(sock, sender, { image: logoMessageOptions.image, caption: `SHANA LOGO 🕹\n\n` + replyText });
          } else {
            await sendHumanLikeMessage(sock, sender, { text: `SHANA  🕹\n\n` + replyText });
          }
        } 
        else if (text === '2') {
          const replyText = `*❏ SHANA WITHDRAW  ADDRESS ✺*\n\n _MINI Withdraw  Rs 250-/_ \nපියවර 1 \n* මුලින්ම 1Xbet app එක open කරන්න ඉට පසු menu යන්න. \n * *ඉට පසු උඩම ඇති setting  អයිකන් එකක් එක ක්ලික් කරන්න*\n\n *✺ ඉට පසුව withdraw  කියලා අයිකන් එකක් ඇති එක ඔබන්න ඉට පස්සෙ 1XBET CASH කියන් මේතඩ් එක තොරන්න පොඩ්ඩක් පහලට වේන්න තියෙන්නේ*\n\n➢ ඉට පසු ඔබට ගන්න ඔනි ගාන ගහන්න.\n\n❏ city: minneriya පුරවන්න\n❏ street : Lakshan service (24/7) \n\nපුරවගන්න ඉන් පසු ඔබට ඔබගේ gamil එකක් හො phone නම්බ එකක් ඇඩ් කරලා තියේනවානම් කොඩ් එකක් එයි එක දිලා කන්පොම් කරන්න.\n\n *➢ ඉන් පසුව ඇප් එකේන් බැක් වී ආපාසු ඇප් එකට ලොග් වී විත්‍රොල් තැනට යන්න.* \n\n➢ ඉට පඩු විත්‍රොල් රේපුස්ට කියලා බටන් එකක් ඇති එක ඔබන්න.\n\n➢ ඉන් පසුව ඉංග්‍රිසි වචන සහිතව නිල්පාටින් වචන වගයක් ඇවිත් ඇති එහි ඇති ගෙට් කොඩ් කියලා එකක් අන්න එක ඔබන්න.\n\n➢ එක ඔබවුවට පසුව එනවා කොඩ් එකක් අන්න එකි ස්ක්‍රින් ශොට් එකක් ගහලා ok කරලා මට එවන්න .\n\nඑච්චරයි ✅`;

          if (logoMessageOptions.image) {
            await sendHumanLikeMessage(sock, sender, { image: logoMessageOptions.image, caption: `SHANA LOGO 🕹\n\n` + replyText });
          } else {
            await sendHumanLikeMessage(sock, sender, { text: `SHANA  🕹\n\n` + replyText });
          }
        }
        else if (text === '3') {
          const replyText = `VIP 1XBET PROMO CODE ඔයාල්ත් දැන්ම රෙජිස්ට වේන්න!...;\n\nLashan1x\n👆👆👆👆\nLOST නොවී ගෙමක් ගහන්න කැමති අය දැන්ම ගිහින් 1XBET ACCOUNT එකක් හාදාගන්න\n200% DEPOSIT BONUS ✅`;

          if (logoMessageOptions.image) {
            await sendHumanLikeMessage(sock, sender, { image: logoMessageOptions.image, caption: `SHANA LOGO 🕹\n\n` + replyText });
          } else {
            await sendHumanLikeMessage(sock, sender, { text: `SHANA  🕹\n\n` + replyText });
          }
        }
        else if (text === '4') {
          const replyText = `0758862130/0742381405 Call එකකින් විස්තර දැනගන්න....\n🤝🤝🤝🤝🤝🤝🤝🤝`;

          if (logoMessageOptions.image) {
            await sendHumanLikeMessage(sock, sender, { image: logoMessageOptions.image, caption: `SHANA LOGO 🕹\n\n` + replyText });
          } else {
            await sendHumanLikeMessage(sock, sender, { text: `SHANA  🕹\n\n` + replyText });
          }
        }
        else if (text === '5') {
          const replyText = `0758862130/0742381405/0703557568\nCall , Mg 24/7 Ok ✅`;

          if (logoMessageOptions.image) {
            await sendHumanLikeMessage(sock, sender, { image: logoMessageOptions.image, caption: `SHANA LOGO 🕹\n\n` + replyText });
          } else {
            await sendHumanLikeMessage(sock, sender, { text: `SHANA  🕹\n\n` + replyText });
          }
        }
        else if (text === '6') {
          const replyText = `0758862130/0742381405 Call එකකින් විස්තර දැනගන්න....\n🤝🤝🤝🤝🤝🤝🤝🤝`;

          if (logoMessageOptions.image) {
            await sendHumanLikeMessage(sock, sender, { image: logoMessageOptions.image, caption: `SHANA LOGO 🕹\n\n` + replyText });
          } else {
            await sendHumanLikeMessage(sock, sender, { text: `SHANA 🕹\n\n` + replyText });
          }
        }
        else if (text === '7') {
          const replyText = `ඔබට අඩුම මුදලට 24/7 AUTO reply Bot කෙනෙක් ඔබගේ නමින් හාදාගැනිමට අවශ්ශයයිනම් පහල දුරකතන අංයට අමතන්න 0758862130 ✅`;

          if (logoMessageOptions.image) {
            await sendHumanLikeMessage(sock, sender, { image: logoMessageOptions.image, caption: `SHANA LOGO 🕹\n\n` + replyText });
          } else {
            await sendHumanLikeMessage(sock, sender, { text: `SHANA  🕹\n\n` + replyText });
          }
        }
      } 
      else {
        // වෙනත් මැසේජ් එකක් දැමූ විට විනාඩි 20 කූල්ඩවුන් සීමාව ක්‍රියාත්මක වේ
        if (!checkCooldown(sender)) return; 

        // පළමු පිළිතුර (විමසුම් මෙනුව සහ ලෝගෝ එක)
        const welcomeMsg = `SHANA AI BOT SYSTEM 🕹\n-----------------------------\nHI සුබ දවසක් සර්,මිස් 😚\n\nඔබට අවශ්ශය උපකාරය පවසන්න ! මම ඔබට සහය වීම සදහා බැදීසිටින්නේමී...!\n\n📜 SHANA All SERVICE \n\n1. SHANA 1XBET DEPOSIT තොරතුරු ✅\n2. SHANA 1XBET WITHDRAW තොරතුරු ✅\n3. SHANA 1XBET VIP PROMO CODE තොරතුරු ✅\n4. WEB SITE & SOFTWARE සාදාගැනිමට ✅\n5. SOCAL MRDIA BOOST ( All plate Fom ) \n5. SHANA CONTACTS කරගැනිමට ✅\n6. AVIATOR HIGH ODD අනලයිසින් ඉගෙන ගැනිමටනම් ✅\n7.Whatsapp Ai Auto Replay Bot සාදාගැනිමටනම් ✅\n\nකරුණාකරලා ඔබට අවශ්ශය සෙවාව උඩ Menu එකේ ඇත්නම් එම අංකය ලාබාදෙන්න!..... \n\nඔබට වෙනත් කරුණක් දැන්විමට අවශ්ශයනම් පහලින් සදහන් කරන්න මම එය ඉතාමත් ඉක්මනට SHANA වේත දැන්වීමට සලස්වන්නම් \n--------------------------------\nSOFTWARE DEVELOPR SHANA 🐛`;

        if (logoMessageOptions.image) {
          await sendHumanLikeMessage(sock, sender, { image: logoMessageOptions.image, caption: `SHANA  🕹\n\n` + welcomeMsg });
        } else {
          await sendHumanLikeMessage(sock, sender, { text: `SHANA  🕹\n\n` + welcomeMsg });
        }

        // අංකයක් නොවන වෙනත් මැසේජ් එකක් සඳහා ෆෝල්බැක් මැසේජ් එක
        await delay(3000); 
        const fallbackMsg = ` -\nමතක් රැදීසීටින් හැකි ඉක්මනින් SHANA Online ගෙන්වා ගැනිමට උත්සහ කරන්නෙමී....  ! \nඔහුට තිබෙන වැඩත් එක්ක ඔහු කාර්රය බහුල වී ඇතී අතර ඉමනින් පැමිනේවී... `;
        
        await sendHumanLikeMessage(sock, sender, { text: fallbackMsg });
      }

    } catch (error) {
      console.log('Error handling message: ', error);
    }
  });
}

startBot();
