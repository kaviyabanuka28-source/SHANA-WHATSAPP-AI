// config.js
module.exports = {
    botName: process.env.BOT_NAME || 'SHANA',
    version: '1.0.0',
    port: process.env.PORT || 3000,
    sessionDir: 'sessions',
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '8926050190:AAHENJrCPXIurIvp4Jm16j0PPpPIq77Dnbk',
const config = {
    botName: "SHANA",
    version: "8.0.0",
    cooldownTime: 20 * 60 * 1000,
    sessionDir: "session",
    port: process.env.PORT || 8080
};

module.exports = config;
