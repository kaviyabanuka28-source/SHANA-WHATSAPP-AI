const { Telegraf } = require('telegraf');
const { generatePairCodeOnly, startWhatsApp, getStatus } = require('./whatsapp');
const fs = require('fs');
const path = require('path');

let bot = null;

function startTelegram(token, authFolder = 'shana_auth') {
  if (!token) {
    console.error('[TELEGRAM] No token!');
    return null;
  }

  bot = new Telegraf(token);

  bot.start(async (ctx) => {
    await ctx.reply(
      `*🤖 SHANA WhatsApp Bot Setup* 🚀\n\n` +
      `ඔබගේ WhatsApp අංකය මෙසේ එවන්න:\n` +
      `\`Pair Wh No - 9476xxxxxxx\`\n\n` +
      `මම Pair Code එක generate කරලා දෙන්නම්.\n` +
      `✅ WhatsApp එකේ Menu > Linked Devices > Link a Device\n` +
      `✅ Code එක enter කරන්න\n` +
      `✅ Bot Connect වෙයි!\n\n` +
      `📌 උපදෙස්: *Pair Wh No -* කියලා අංකය එවන්න.`,
      { parse_mode: 'Markdown' }
    );
  });

  bot.command('status', async (ctx) => {
    const status = getStatus();
    const authExists = fs.existsSync(path.join(authFolder, 'creds.json'));
    
    await ctx.reply(
      `📊 *SHANA Bot Status*\n\n` +
      `WhatsApp: ${status.connected ? '✅ Connected' : '❌ Disconnected'}\n` +
      `Auth Save: ${authExists ? '✅ Yes' : '❌ No'}\n` +
      `Users Tracked: ${status.usersTracked}\n` +
      `Last 20min Active: ${status.activeCooldowns}\n\n` +
      `${status.connected ? '🟢 Bot Online & Working!' : '🔴 Bot Offline - අංකය නැවත Link කරන්න'}`,
      { parse_mode: 'Markdown' }
    );
  });

  bot.command('restart', async (ctx) => {
    await ctx.reply('🔄 WhatsApp Bot Restart කරමින්...');
    startWhatsApp(authFolder);
    await ctx.reply('✅ Restarted!');
  });

  bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();
    
    // Pair Wh No - 9476xxxxxxx
    const pairMatch = text.match(/pair\s*wh\s*no\s*[:\-]?\s*(\d+)/i);
    
    if (pairMatch) {
      const phoneNumber = pairMatch[1];
      
      await ctx.reply(`⏳ Pair Code Generate කරමින්... 📱 ${phoneNumber}`);
      
      try {
        const code = await generatePairCodeOnly(phoneNumber);
        
        await ctx.reply(
          `✅ *Pair Code Generated!*\n\n` +
          `📱 *Number:* \`${phoneNumber}\`\n` +
          `🔐 *Code:* \`${code}\`\n\n` +
          `📌 *How to Link:*\n` +
          `1️⃣ WhatsApp Open කරන්න\n` +
          `2️⃣ Menu (⋮) > Linked Devices\n` +
          `3️⃣ *Link a Device* tap කරන්න\n` +
          `4️⃣ මෙම Code එක Enter කරන්න:\n` +
          `\`${code}\`\n\n` +
          `⚠️ Code එක *විනාඩි 1ක්* ඇතුලත භාවිතා කරන්න!\n` +
          `🔄 Bot connect වීමට තත්පර කිහිපයක් ගතවේ.\n` +
          `✅ Connect වූ පසු Auto Auto Reply සක්‍රිය වේ!`,
          { parse_mode: 'Markdown' }
        );
      } catch (err) {
        await ctx.reply(`❌ *Error:* ${err.message}\n\nනැවත උත්සාහ කරන්න.`);
      }
      return;
    }
    
    // Just a number
    const justNumber = text.match(/^(\d{7,15})$/);
    if (justNumber) {
      const phoneNumber = justNumber[1];
      await ctx.reply(`⏳ Pair Code Generate කරමින්...`);
      
      try {
        const code = await generatePairCodeOnly(phoneNumber);
        await ctx.reply(
          `✅ *Pair Code:* \`${code}\`\n\n` +
          `WhatsApp > Menu > Linked Devices > Link a Device`,
          { parse_mode: 'Markdown' }
        );
      } catch (err) {
        await ctx.reply(`❌ Error: ${err.message}`);
      }
      return;
    }
    
    await ctx.reply(
      `❓ හදුනාගත නොහැක.\n\n` +
      `Pair Code එකක් ලබාගැනීමට:\n` +
      `*Pair Wh No - 9476xxxxxxx*`,
      { parse_mode: 'Markdown' }
    );
  });

  bot.catch((err) => console.error('[TELEGRAM] Error:', err.message));

  bot.launch()
    .then(() => console.log('[TELEGRAM] ✅ Bot Started!'))
    .catch(err => console.error('[TELEGRAM] Launch error:', err.message));

  return bot;
}

function stopTelegram() {
  if (bot) bot.stop('SIGINT');
}

module.exports = { startTelegram, stopTelegram };
