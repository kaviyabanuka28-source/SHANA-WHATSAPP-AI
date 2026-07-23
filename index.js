const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
} = require("@whiskeysockets/baileys");
const express = require("express");
const fs = require("fs");
const path = require("path");

// ===== CONFIG =====
const PORT = process.env.PORT || 3000;
const PHONE_NUMBER = process.env.PHONE_NUMBER || ""; // e.g. 947XXXXXXXXX
const COOLDOWN_MINUTES = 20;
const SESSION_DIR = "./auth_info";

// ===== COOLDOWN TRACKING =====
const userCooldowns = new Map();

// ===== EXPRESS SERVER (Keep Railway Alive) =====
const app = express();
app.get("/", (req, res) => {
  res.send("🤖 SHANA AI BOT SYSTEM — ONLINE ✅ 24/7");
});
app.get("/status", (req, res) => {
  res.json({
    status: "online",
    uptime: process.uptime(),
    cooldown_users: userCooldowns.size,
  });
});
app.listen(PORT, () => {
  console.log(`🌐 Keep-alive server running on port ${PORT}`);
});

// ===== BOT RESPONSES =====
const WELCOME_MESSAGE = `╔══════════════════════════╗
║   𝐒𝐇𝐀𝐍𝐀 𝐀𝐈 𝐁𝐎𝐓 𝐒𝐘𝐒𝐓𝐄𝐌 🕹  ║
╚══════════════════════════╝
─────────────────────────────
HI සුබ දවසක් සර්, මිස් 😚

ඔබට අවශ්‍ය උපකාරය පවසන්න ! 
මම ඔබට සහය වීම සදහා බැඳීසිටින්නෙමි...!

─────────────────────────────
📋 SHANA ALL SERVICE

1️⃣  SHANA 1XBET DEPOSIT තොරතුරු ✅
2️⃣  SHANA 1XBET WITHDRAW තොරතුරු ✅
3️⃣  SHANA 1XBET VIP PROMO CODE තොරතුරු ✅
4️⃣  WEB SITE & SOFTWARE සාදාගැනීමට ✅
5️⃣  SOCIAL MEDIA BOOST (All Plate Form) ✅
6️⃣  SHANA CONTACTS කරගැනීමට ✅
7️⃣  AVIATOR HIGH ODD අනාලයිසින් ඉගෙන ගැනීමට ✅
8️⃣  WhatsApp AI Auto Reply Bot සාදාගැනීමට ✅

─────────────────────────────
කරුණාකර ඔබට අවශ්‍ය සේවාවේ 
අංකය ලබාදෙන්න...!

ඔබට වෙනත් කරුණක් දැනුවත් කිරීමට 
අවශ්‍යනම් පහලින් සඳහන් කරන්න.

─────────────────────────────
🔰 SOFTWARE DEVELOPER — SHANA 🐛`;

// Response messages for each option
const RESPONSES = {
  "1": `💗🇱🇰🙏 ආයුබෝවන් 🙏🇱🇰💗

╔══════════════════════════╗
║  *1XBET DEPOSIT SERVICE* 💰 ║
╚══════════════════════════╝

🔴 *SHANA SERVICE — 100%* 🔴

💰 *මුදල් තැන්පත් කිරීම (DEPOSIT)* 💰

✅ Account Deposit  ✅ Account Withdraw

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
🏦 *BANK ACCOUNTS*
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

🔯 *BOC*
🔯 94118758
🔯 MINNERIYA
🔯 K.G LAKSHAN KAVISHKA KUMARA

✳️ *PEOPLE BANK*
✳️ 006200150094114
✳️ K.G.LAKSHAN KAVISHKA KUMARA
✳️ HIGURAKGODA

✳️ *EZ CASH*
✳️ 0764104588
✳️ LAKSHAN (OPEN)
(අවම වශයෙන් රුපියල් 20/= දැමීමට කාරුණික වන්න)

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
💻 *ONLINE WALLETS*
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

✡️ *BINANCE*
✡️ 1066282628
✡️ LAKSHAN

🔯 *IPAY*
🔯 0764104588
🔯 Lakshan

✡️ *DIALOG FINANCE PLC*
✡️ 0010 2217 5776
✡️ LAKSHAN KAVISHKA KUMARA

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

⏱ *DEPOSIT — Minute 2-5* 😍
⏱ *WITHDRAW — Minute 10-30* 😍

👉 *සැ.යු.* : ඔබ විසින් *REMARK* යටතේ 
ඔබගේ PLAYER ID සඳහන් කල යුතුමය.

තවද 1XBET, BET යන වචන කිසිසේත්ම 
භාවිතා නොකල යුතුය...

⚠️ ඉහත ක්‍රම හරහා *DEPOSIT* කර 
SLIP එක හා ඔබේ *1XBET PLAYER ID* 
TYPE එවන්න

👉 *සැ.යු.* : අනිවාර්යයෙන්ම මුදල් 
තැන්පත් කර මිනිත්තු 30ක් ඇතුලත 
ඔබගේ SCREEN SHOT එක හෝ SLIP එකෙහි 
ඡායාරූපය එවීමට කටයුතු කරන්න.

එසේ නොහැකි නම් පණිවිඩයක් එවීමට 
කාරුණිකවන්න.

✺ තෙවන පාර්ශවීය සල්ලි දැමීම් 
බාරගනු නොලැබේ ❌

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
🔰 SOFTWARE DEVELOPER — SHANA 🐛`,

  "2": `💗🇱🇰🙏 ආයුබෝවන් 🙏🇱🇰💗

╔══════════════════════════╗
║ *1XBET WITHDRAW SERVICE* 💸 ║
╚══════════════════════════╝

*❏ SHANA WITHDRAW ADDRESS ✺*

💰 *MINI Withdraw — Rs 250/=* 💰

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
📌 *පියවර 1*
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

1️⃣ මුලින්ම 1XBET App එක Open කරන්න.
   ඉන්පසු Menu යන්න.

2️⃣ ඉන්පසු උඩම ඇති Setting ⚙️ 
   අයිකන් එක Click කරන්න.

3️⃣ ✺ ඉන්පසුව Withdraw කියා 
   අයිකන් එකක් ඇති, එක ඔබන්න.

4️⃣ ඉන්පස්සෙ *1XBET CASH* කියන 
   Method එක තෝරන්න (පොඩ්ඩක් 
   පහලට වෙන්න තියෙන්නේ)

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
📌 *පියවර 2*
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

➢ ඉන්පසු ඔබට ගන්න ඕනි ගාන ගහන්න.

❏ *City* : Minneriya
❏ *Street* : Lakshan Service (24/7)

➢ පුරවගන්න. ඉන්පසු ඔබගේ Gmail එකක් 
   හෝ Phone Number එකක් Add කරලා 
   තියෙනවානම් Code එකක් එයි. 
   එක දාලා Confirm කරන්න.

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
📌 *පියවර 3*
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

➢ ඉන්පසු App එකෙන් Back වී ආපසු 
   App එකට Login වී *Withdraw* තැනට යන්න.

➢ ඉන්පසු *Withdraw Request* කියලා 
   Button එකක් ඇති, එක ඔබන්න.

➢ ඉන්පසුව නිල්පාටින් English වචන 
   වගයක් ඇවිත් ඇති. එහි ඇති 
   *Get Code* කියන එක ඔබන්න.

➢ එක ඔබ්බවුවට පසුව Code එකක් එයි. 
   අන්න එක Screen Shot එකක් ගහලා 
   OK කරලා මට එවන්න.

✅ *එච්චරයි* ✅

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
🔰 SOFTWARE DEVELOPER — SHANA 🐛`,

  "3": `💗🇱🇰🙏 ආයුබෝවන් 🙏🇱🇰💗

╔══════════════════════════╗
║  *1XBET VIP PROMO CODE* 🏆 ║
╚══════════════════════════╝

🌟 *VIP 1XBET PROMO CODE* 🌟

👇👇👇👇👇👇👇👇👇👇
            *Lashan1x*
👆👆👆👆👆👆👆👆👆👆

➡️ LOST නොවී Game එකක් ගහන්න 
   කැමති අය දැන්ම ගිහින් 
   1XBET ACCOUNT එකක් හදාගන්න!

🔥 *200% DEPOSIT BONUS* ✅

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
🔰 SOFTWARE DEVELOPER — SHANA 🐛`,

  "4": `💗🇱🇰🙏 ආයුබෝවන් 🙏🇱🇰💗

╔══════════════════════════╗
║ *WEB SITE & SOFTWARE* 💻 ║
╚══════════════════════════╝

වෙබ් සයිට් සහ Software සාදාගැනීමට 
අවශ්‍යනම් පහත දුරකථන අංකයට 
Call එකක් ගසන්න...

📞 *0758862130 / 0742381405*

Call එකකින් විස්තර දැනගන්න....
🤝🤝🤝🤝🤝🤝🤝🤝

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
🔰 SOFTWARE DEVELOPER — SHANA 🐛`,

  "5": `💗🇱🇰🙏 ආයුබෝවන් 🙏🇱🇰💗

╔══════════════════════════╗
║ *SOCIAL MEDIA BOOST* 📈 ║
╚══════════════════════════╝

Social Media Boost (All Plate Forms) 
සහ SHANA Contacts සදහා පහත 
අංක අමතන්න...

📞 *0758862130 / 0742381405 / 0703557568*

Call / Message — 24/7 OK ✅

🤝🤝🤝🤝🤝🤝🤝🤝

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
🔰 SOFTWARE DEVELOPER — SHANA 🐛`,

  "6": `💗🇱🇰🙏 ආයුබෝවන් 🙏🇱🇰💗

╔══════════════════════════╗
║ *AVIATOR HIGH ODD* 🎯 ║
╚══════════════════════════╝

AVIATOR HIGH ODD Analysis ඉගෙන 
ගැනීමට අවශ්‍යනම් පහත අංකයට 
Call එකක් ගසන්න...

📞 *0758862130 / 0742381405*

Call එකකින් විස්තර දැනගන්න....
🤝🤝🤝🤝🤝🤝🤝🤝

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
🔰 SOFTWARE DEVELOPER — SHANA 🐛`,

  "7": `💗🇱🇰🙏 ආයුබෝවන් 🙏🇱🇰💗

╔══════════════════════════╗
║ *WHATSAPP AI AUTO BOT* 🤖 ║
╚══════════════════════════╝

ඔබට අඩුම මුදලකට 24/7 AUTO Reply 
Bot කෙනෙක් ඔබගේ නමින් 
හදාගැනීමට අවශ්‍යයිනම් 
පහත දුරකථන අංකයට අමතන්න:

📞 *0758862130* ✅

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
🔰 SOFTWARE DEVELOPER — SHANA 🐛`,
};

const UNKNOWN_REPLY = `🤖 *SHANA AI BOT SYSTEM* 🕹
─────────────────────────────

මතක් රැඳීසිටින්න...
හැකි ඉක්මනින් *SHANA Online* ගෙන්වා 
ගැනීමට උත්සාහ කරන්නෙමි....! ⏳

ඔහුට තිබෙන වැඩත් එක්ක ඔහු 
කාර්යය බහුල වී ඇති අතර 
ඉක්මනින් පැමිණෙනු ඇත... 

─────────────────────────────
🔰 SOFTWARE DEVELOPER — SHANA 🐛`;

// ===== MAIN BOT FUNCTION =====
async function startBot() {
  console.log("🚀 Starting SHANA AI Bot...");

  // Ensure session directory exists
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: Browsers.windows("Desktop"),
    syncFullHistory: false,
    markOnlineOnConnect: false,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
    logger: require("pino")({ level: "silent" }),
    generateHighQualityLinkPreview: false,
  });

  // ===== PAIRING CODE GENERATION =====
  if (!sock.authState.creds.registered && PHONE_NUMBER) {
    console.log("🔐 Generating Pairing Code...");
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(PHONE_NUMBER);
        const formattedCode = code.match(/.{1,4}/g)?.join("-") || code;
        console.log("\n");
        console.log("╔══════════════════════════════════╗");
        console.log("║       🔐 PAIRING CODE          ║");
        console.log("╠══════════════════════════════════╣");
        console.log(`║                                  ║`);
        console.log(`║     ${formattedCode.padEnd(24)}║`);
        console.log(`║                                  ║`);
        console.log("╠══════════════════════════════════╣");
        console.log("║ Open WhatsApp → Linked Devices  ║");
        console.log("║ → Link a Device → Enter Code   ║");
        console.log("╚══════════════════════════════════╝");
        console.log("\n");
      } catch (err) {
        console.error("❌ Pairing Code Error:", err.message);
      }
    }, 3000);
  }

  // ===== SAVE CREDENTIALS =====
  sock.ev.on("creds.update", saveCreds);

  // ===== CONNECTION HANDLER =====
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "open") {
      console.log("✅ WhatsApp Connected Successfully!");
      console.log(`📱 Bot is live — 24/7 Mode ✅`);
    }
    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(
        `❌ Connection closed (${statusCode}). Reconnecting: ${shouldReconnect}`
      );
      if (shouldReconnect) {
        console.log("🔄 Reconnecting in 5 seconds...");
        setTimeout(startBot, 5000);
      } else {
        console.log("🚫 Logged out. Please re-deploy with new session.");
      }
    }
  });

  // ===== MESSAGE HANDLER =====
  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      // Ignore own messages, group messages, and status updates
      if (msg.key.fromMe) continue;
      if (!msg.key.remoteJid) continue;
      if (msg.key.remoteJid.endsWith("@g.us")) continue;
      if (msg.key.remoteJid === "status@broadcast") continue;

      const sender = msg.key.remoteJid;
      const messageContent =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        "";

      const userText = messageContent.trim();
      const now = Date.now();

      // ===== COOLDOWN CHECK =====
      const lastReplyTime = userCooldowns.get(sender) || 0;
      if (now - lastReplyTime < COOLDOWN_MINUTES * 60 * 1000) {
        // Skip — still in cooldown
        continue;
      }

      console.log(`📩 Message from ${sender}: "${userText}"`);

      try {
        // ===== STEP 1: Send Welcome Message =====
        await sock.sendMessage(sender, { text: WELCOME_MESSAGE });

        // Small delay to keep message order
        await new Promise((r) => setTimeout(r, 1000));

        // ===== STEP 2: Determine and Send Specific Reply =====
        const optionNumber = userText.replace(/\s/g, ""); // Remove spaces
        let replyText;

        if (RESPONSES[optionNumber]) {
          replyText = RESPONSES[optionNumber];
        } else {
          replyText = UNKNOWN_REPLY;
        }

        await sock.sendMessage(sender, { text: replyText });

        // ===== SET COOLDOWN =====
        userCooldowns.set(sender, now);
        console.log(`✅ Replied to ${sender} | Cooldown: ${COOLDOWN_MINUTES}min`);
      } catch (err) {
        console.error(`❌ Error replying to ${sender}:`, err.message);
      }
    }
  });

  // ===== KEEP SOCKET ALIVE =====
  setInterval(async () => {
    try {
      if (sock?.ws?.readyState === 1) {
        // Socket is open, ping to keep alive
        console.log("💓 Heartbeat — Connection Alive");
      }
    } catch (e) {
      // Ignore
    }
  }, 60000);

  return sock;
}

// ===== START BOT =====
startBot().catch((err) => {
  console.error("💥 Fatal Error:", err);
  process.exit(1);
});
