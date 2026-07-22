const express = require('express');
const config = require('./config');

function startKeepAlive() {
    const app = express();
    
    app.get('/', (req, res) => {
        res.send(`🤖 ${config.botName} WhatsApp Bot is Running 24/7 ✅`);
    });

    app.get('/ping', (req, res) => {
        res.json({ 
            status: 'active', 
            bot: config.botName,
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        });
    });

    app.listen(config.port, () => {
        console.log(`🌐 Keep-Alive Server running on port ${config.port}`);
    });
}

module.exports = { startKeepAlive };
