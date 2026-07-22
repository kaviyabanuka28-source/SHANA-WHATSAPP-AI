const { Telegraf } = require('telegraf');
const { generatePair, isConnected, startBot } = require('./bot');

function startTelegram(token) {
  if (!token) { console.log('[TG] No token'); return; }

  const bot = new Telegraf(token);
  const AUTH_DIR = process.env.AUTH_DIR || 'shana_auth';
  const fs = require('fs');

  bot.start(async (ctx) => {
    await ctx.reply(
      `*🤖 SHANA WhatsApp Bot Setup*\n\n` +
      `WhatsApp Pair Code එකක් ලබාගැනීමට:\n` +
      `\`Pair Wh No - 9476xxxxxxx\`\n\n` +
      `Code එක WhatsApp එකේ:\n` +
      `Menu > Linked Devices > Link a Device\n\n` +
      `✅ Connect වූ පසු Auto Reply සක්‍රිය වේ!`,
      { parse_mode: 'Markdown' }
    );
  });

  bot.command('status', async (ctx) => {
    const paired = fs.existsSync(`${AUTH_DIR}/creds.json`);
    await ctx.reply(
      `📊 *Status*\n\n` +
      `Connected: ${isConnected() ? '✅' : '❌'}\n` +
      `Paired: ${paired ? '✅' : '❌'}\n\n` +
      `${isConnected() ? '🟢 Auto Reply Active!' : '🔴 Pair code එකක් ලබාගෙන Link කරන්න.'}`,
      { parse_mode: 'Markdown' }
    );
  });

  bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();

    // Pair Wh No - 9476xxxxxxx
    const match = text.match(/pair\s*wh\s*no\s*[:\-]?\s*(\d{7,15})/i);
    if (match) {
      const phone = match[1];
      await ctx.reply(`⏳ Pair code generate කරමින්... 📱 ${phone}`);

      try {
        const result = await generatePair(phone);
        
        if (result.status === 'already_paired') {
          await ctx.reply('✅ Already paired! Restarting bot...');
          startBot();
          return;
        }

        await ctx.reply(
          `✅ *Pair Code Generated!*\n\n` +
          `🔐 *Code:* \`${result.code}\`\n\n` +
          `📱 *Number:* ${phone}\n\n` +
          `*How to Link:*\n` +
          `1️⃣ WhatsApp > Menu > Linked Devices\n` +
          `2️⃣ Tap *Link a Device*\n` +
          `3️⃣ Enter Code: \`${result.code}\`\n\n` +
          `⚠️ Code valid for 1 minute!\n` +
          `✅ After linking, Auto Reply starts!`,
          { parse_mode: 'Markdown' }
        );

        // If pairing completed immediately
        if (result.status === 'paired') {
          await ctx.reply('✅ *Paired Successfully!* Bot is running!');
        }

      } catch (err) {
        await ctx.reply(`❌ Error: ${err.message}`);
      }
      return;
    }

    // Just a number
    const numOnly = text.match(/^(\d{7,15})$/);
    if (numOnly) {
      const phone = numOnly[1];
      await ctx.reply(`⏳ Generating...`);
      try {
        const result = await generatePair(phone);
        if (result.status === 'already_paired') {
          await ctx.reply('✅ Already paired!');
          return;
        }
        await ctx.reply(`✅ *Code:* \`${result.code}\``, { parse_mode: 'Markdown' });
      } catch (err) {
        await ctx.reply(`❌ ${err.message}`);
      }
      return;
    }

    await ctx.reply(`❓ Send: \`Pair Wh No - 9476xxxxxxx\``, { parse_mode: 'Markdown' });
  });

  bot.catch((e) => console.error('[TG ERROR]', e.message));
  bot.launch().then(() => console.log('[TG] ✅ Bot Started!'));
  return bot;
}

module.exports = { startTelegram };
