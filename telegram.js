const { Telegraf, Markup } = require('telegraf');
const { generatePairCode, isConnected, getStatus } = require('./whatsapp');

let bot = null;
let pendingPairRequests = new Map(); // chatId -> phoneNumber

/**
 * Start Telegram bot
 */
function startTelegram(token) {
  if (!token) {
    console.error('[TELEGRAM] No token provided!');
    return null;
  }

  bot = new Telegraf(token);

  // ── /start command ──
  bot.start(async (ctx) => {
    const name = ctx.from.first_name || 'User';
    
    await ctx.reply(
      `👋 ආයුබෝවන් ${name}!\n\n` +
      `🤖 *SHANA WhatsApp Bot Setup*\n\n` +
      `ඔබගේ WhatsApp අංකය ලබාදෙන්න. \n` +
      `මම Pair Code එකක් Generate කරලා දෙන්නම්!\n\n` +
      `*Pair Wh No -* කියලා \n` +
      `ඔබගේ WhatsApp අංකය එවන්න.\n\n` +
      `*උදා:* Pair Wh No - 9476xxxxxxx`,
      { parse_mode: 'Markdown' }
    );
  });

  // ── /status command ──
  bot.command('status', async (ctx) => {
    const status = getStatus();
    await ctx.reply(
      `📊 *SHANA Bot Status*\n\n` +
      `WhatsApp: ${status.connected ? '✅ Connected' : '❌ Disconnected'}\n` +
      `Users Tracked: ${status.usersTracked}\n` +
      `Active Cooldowns: ${status.activeCooldowns}`,
      { parse_mode: 'Markdown' }
    );
  });

  // ── Handle text messages ──
  bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();
    
    // Check for "Pair Wh No -" pattern
    const pairMatch = text.match(/pair\s*wh\s*no\s*[:\-]?\s*(\d+)/i);
    
    if (pairMatch) {
      const phoneNumber = pairMatch[1];
      
      await ctx.reply(`⏳ ඔබගේ WhatsApp අංකය සඳහා Pair Code එකක් Generate කරමින්...\n\n📱 ${phoneNumber}`);
      
      try {
        const code = await generatePairCode(phoneNumber);
        
        await ctx.reply(
          `✅ *Pair Code Generated Successfully!*\n\n` +
          `📱 *Number:* \`${phoneNumber}\`\n` +
          `🔐 *Pair Code:* \`${code}\`\n\n` +
          `📌 *How to Connect:*\n` +
          `1️⃣ WhatsApp එක Open කරන්න\n` +
          `2️⃣ Menu > Linked Devices > Link a Device\n` +
          `3️⃣ මෙම Code එක Enter කරන්න\n` +
          `4️⃣ Bot Connect වීමට තත්පර කිහිපයක් රැඳී සිටින්න\n\n` +
          `⚡ Connect වූ පසු Auto Reply ස්වයංක්‍රීයව සක්‍රිය වේ!`,
          { parse_mode: 'Markdown' }
        );
      } catch (err) {
        await ctx.reply(
          `❌ *Error Generating Code*\n\n` +
          `${err.message}\n\n` +
          `කරුණාකර නැවත උත්සාහ කරන්න.`,
          { parse_mode: 'Markdown' }
        );
      }
      return;
    }
    
    // Handle just a number (if user sends only their number)
    const justNumber = text.match(/^(\d{7,15})$/);
    if (justNumber) {
      const phoneNumber = justNumber[1];
      
      await ctx.reply(`⏳ Pair Code Generate කරමින්... 📱 ${phoneNumber}`);
      
      try {
        const code = await generatePairCode(phoneNumber);
        
        await ctx.reply(
          `✅ *Pair Code Generated!*\n\n` +
          `🔐 \`${code}\`\n\n` +
          `WhatsApp > Menu > Linked Devices > Link a Device\n` +
          `Code එක Enter කරන්න.`,
          { parse_mode: 'Markdown' }
        );
      } catch (err) {
        await ctx.reply(`❌ Error: ${err.message}`);
      }
      return;
    }
    
    // Default response
    await ctx.reply(
      `❓ තේරුනේ නැත.\n\n` +
      `WhatsApp Pair Code එකක් ලබාගැනීමට:\n` +
      `*Pair Wh No - 94xxxxxxxxx*\n\n` +
      `ලෙස ඔබගේ WhatsApp අංකය එවන්න.`,
      { parse_mode: 'Markdown' }
    );
  });

  // Handle errors
  bot.catch((err, ctx) => {
    console.error('[TELEGRAM] Error:', err.message);
  });

  // Launch bot
  bot.launch()
    .then(() => console.log('[TELEGRAM] ✓ Bot started!'))
    .catch(err => console.error('[TELEGRAM] Launch error:', err.message));

  return bot;
}

/**
 * Stop Telegram bot gracefully
 */
function stopTelegram() {
  if (bot) {
    bot.stop('SIGINT');
  }
}

module.exports = { startTelegram, stopTelegram };
