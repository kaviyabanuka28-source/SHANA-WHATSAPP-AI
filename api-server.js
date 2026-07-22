const express = require('express');
const config = require('./config');

let botSock = null;
let isConnected = false;
let connectionStatus = 'starting';

function setBotSocket(sock) {
    botSock = sock;
}

function setConnectionStatus(status) {
    connectionStatus = status;
    isConnected = status === 'connected';
}

function createAPIServer() {
    const app = express();
    app.use(express.json());

    // Health check
    app.get('/', (req, res) => {
        res.send(`✅ ${config.botName} WhatsApp Bot v${config.version} | Status: ${connectionStatus} | Connected: ${isConnected}`);
    });

    // Status API
    app.get('/status', (req, res) => {
        res.json({
            bot: config.botName,
            status: connectionStatus,
            connected: isConnected,
            uptime: Math.floor(process.uptime())
        });
    });

    // PAIR CODE GENERATION
    app.get('/pair', async (req, res) => {
        const phone = req.query.phone;
        
        if (!phone || phone.length < 10) {
            return res.status(400).json({ success: false, error: 'Valid phone number required (e.g., 9475XXXXXXX)' });
        }

        if (!botSock) {
            return res.status(503).json({ success: false, error: 'WhatsApp socket not ready yet...' });
        }

        try {
            const cleanNumber = phone.replace(/\D/g, '');
            const fullNumber = cleanNumber.startsWith('94') ? cleanNumber : '94' + cleanNumber.replace(/^0+/, '');

            console.log(`\n📱 Pair Code request for: ${fullNumber}`);
            
            const code = await botSock.requestPairingCode(fullNumber);
            
            if (code) {
                const formattedCode = code.match(/.{1,4}/g)?.join('-') || code;
                console.log(`✅ Code: ${formattedCode}`);
                res.json({ success: true, code: formattedCode, phone: fullNumber });
            } else {
                res.json({ success: false, error: 'Failed to generate code' });
            }
        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
            res.json({ success: false, error: error.message });
        }
    });

    app.listen(config.port, () => {
        console.log(`\n🌐 API Server: http://localhost:${config.port}`);
        console.log(`🔑 Pair Code: GET /pair?phone=9475XXXXXXX\n`);
    });
}

module.exports = { createAPIServer, setBotSocket, setConnectionStatus };
