// Telegram Bot for WhatsApp Pair Code Generation
const config = require('./config');

let botSock = null;

function setTelegramSocket(sock) {
    botSock = sock;
    console.log('🔗 Telegram bot got WhatsApp socket');
}

async function startTelegramBot() {
    try {
        // Dynamic import Telegraf (ESM module)
        const { Telegraf } = await import('telegraf');
        
        // 👇 ඔබේ Telegram Bot Token එක මෙතන දාන්න
        const BOT_TOKEN = '8926050190:AAHENJrCPXIurIvp4Jm16j0PPpPIq77Dnbk';
        
        const bot = new Telegraf(BOT_TOKEN);

        // /start command
        bot.start((ctx) => {
            ctx.reply(`🤖 *SHANA WhatsApp Pair Code Generator*

ඔබගේ WhatsApp number එක පහත ආකාරයට එවන්න:

\`Pair Wh No - 9475XXXXXXX\`

(94 න් පටන් ගන්න, 0 න් පටන් ගන්න එපා)`);
        });

        // Message handler
        bot.on('text', async (ctx) => {
            const text = ctx.message.text;
            
            if (text.toLowerCase().includes('pair wh no') || text.toLowerCase().includes('pair')) {
                const phoneMatch = text.match(/\d{10,13}/);
                
                if (!phoneMatch) {
                    return ctx.reply('⚠️ වලංගු phone number එකක් ඇතුලත් කරන්න.\nඋදා: \`Pair Wh No - 9475XXXXXXX\`');
                }

                const phoneNumber = phoneMatch[0];
                const cleanNumber = phoneNumber.replace(/\D/g, '');
                const fullNumber = cleanNumber.startsWith('94') ? cleanNumber : '94' + cleanNumber.replace(/^0+/, '');

                await ctx.reply(`⏳ *Pair Code එක Generate කරමින්...*\n\n📱 Number: ${fullNumber}`);

                try {
                    if (!botSock) {
                        return ctx.reply('❌ WhatsApp Bot තාම සම්බන්ධ වෙලා නැහැ. ටික වේලාවකින් උත්සහ කරන්න.');
                    }

                    const code = await botSock.requestPairingCode(fullNumber);
                    
                    if (code) {
                        const formattedCode = code.match(/.{1,4}/g)?.join('-') || code;
                        
                        await ctx.reply(`✅ *Pair Code Generated Successfully!* ✅

📟 *Code:* \`${formattedCode}\`

📱 *Phone:* ${fullNumber}

➡️ *WhatsApp එකට connect කරන්න:*
1. WhatsApp එක open කරන්න
2. Menu (තිත් 3) → Linked Devices
3. Link a Device තෝරන්න
4. මෙම Code එක ඇතුලත් කරන්න: \`${formattedCode}\`

⏱️ මෙම Code එක විනාඩි 5ක් වලංගුයි.`);
                        
                        console.log(`✅ Telegram: Pair Code sent for ${fullNumber}`);
                    } else {
                        ctx.reply('❌ Pair Code එක Generate කරන්න බැරි උනා.');
                    }
                } catch (error) {
                    console.error(`❌ Telegram Pair Error: ${error.message}`);
                    ctx.reply(`❌ Error: ${error.message}`);
                }
            } else {
                ctx.reply(`🤖 *SHANA WhatsApp Bot*

Pair Code එකක් ගන්න:
\`Pair Wh No - 9475XXXXXXX\`

/help - උදව්`);
            }
        });

        // Help command
        bot.help((ctx) => {
            ctx.reply(`*SHANA WhatsApp Pair Code Bot*

*Commands:*
• \`Pair Wh No - 9475XXXXXXX\` - Pair Code එකක් ගන්න
• /start - Start කරන්න
• /help - උදව්

*Example:*
\`Pair Wh No - 94758862130\``);
        });

        // Launch bot
        await bot.launch();
        console.log('\n✅ 🤖 Telegram Bot started successfully!');
        console.log('   📱 Send "Pair Wh No - 9475XXXXXXX" to get Pair Code\n');
        
        // Enable graceful stop
        process.once('SIGINT', () => bot.stop('SIGINT'));
        process.once('SIGTERM', () => bot.stop('SIGTERM'));

        return bot;
    } catch (error) {
        console.error('❌ Telegram Bot Error:', error.message);
        console.log('⚠️ Telegram bot will not be available. WhatsApp bot continues working.');
        return null;
    }
}

// ========== 🔥 FIX: මෙතන module.exports එක හරියට දාන්න ඕනෙ ==========
module.exports = { startTelegramBot, setTelegramSocket };
