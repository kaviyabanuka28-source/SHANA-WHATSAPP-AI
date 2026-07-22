const express = require('express');
const config = require('./config');

let botSock = null;
let isConnected = false;
let connectionStatus = 'starting';
let botUser = null;

function setBotSocket(sock) {
    botSock = sock;
}

function setConnectionStatus(status, user = null) {
    connectionStatus = status;
    isConnected = status === 'connected';
    botUser = user;
}

function createAPIServer() {
    const app = express();
    app.use(express.json());

    // ============================================
    // HEALTH CHECK - Railway sleep වලක්වන්න
    // ============================================
    app.get('/', (req, res) => {
        res.send(`✅ ${config.botName} WhatsApp Bot v${config.version} | Status: ${connectionStatus} | Connected: ${isConnected}`);
    });

    // ============================================
    // STATUS API
    // ============================================
    app.get('/status', (req, res) => {
        res.json({
            bot: config.botName,
            version: config.version,
            status: connectionStatus,
            connected: isConnected,
            user: botUser ? botUser.id || botUser : null,
            uptime: Math.floor(process.uptime()),
            timestamp: new Date().toISOString()
        });
    });

    // ============================================
    // PAIR CODE GENERATION API (Telegram එකට link කරන්න)
    // ============================================
    app.get('/pair', async (req, res) => {
        const phone = req.query.phone;
        
        if (!phone || phone.length < 10) {
            return res.status(400).json({ 
                success: false, 
                error: 'Valid phone number required (e.g., 9475XXXXXXX)' 
            });
        }

        if (!botSock) {
            return res.status(503).json({ 
                success: false, 
                error: 'WhatsApp socket not ready. Bot still initializing...' 
            });
        }

        try {
            // Clean phone number
            const cleanNumber = phone.replace(/\D/g, '');
            const fullNumber = cleanNumber.startsWith('94') ? cleanNumber : '94' + cleanNumber.replace(/^0+/, '');

            console.log(`\n📱 ===== PAIR CODE REQUEST =====`);
            console.log(`   Phone: ${fullNumber}`);
            console.log(`   Time: ${new Date().toLocaleString()}`);
            
            // Generate pair code
            const code = await botSock.requestPairingCode(fullNumber);
            
            if (code) {
                // Format: ABCD-EFGH-IJKL
                const formattedCode = code.match(/.{1,4}/g)?.join('-') || code;
                console.log(`   ✅ Pair Code: ${formattedCode}`);
                console.log(`================================\n`);
                
                res.json({ 
                    success: true, 
                    code: formattedCode,
                    phone: fullNumber,
                    timestamp: new Date().toISOString(),
                    instructions: [
                        "1. Open WhatsApp on your phone",
                        "2. Tap Menu (3 dots) or Settings",
                        "3. Go to Linked Devices",
                        "4. Tap 'Link a Device'",
                        "5. Enter this code: " + formattedCode
                    ].join('\n')
                });
            } else {
                res.json({ success: false, error: 'Failed to generate pair code' });
            }
        } catch (error) {
            console.error(`   ❌ Pair Code Error: ${error.message}`);
            res.json({ success: false, error: error.message });
        }
    });

    // ============================================
    // MANUAL PAIR CODE FROM REQUEST BODY
    // ============================================
    app.post('/pair', async (req, res) => {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ success: false, error: 'Phone number required' });
        }
        
        // Reuse the GET handler logic
        req.query = { phone };
        app.handle(req, res, 'GET /pair');
    });

    // Start server
    app.listen(config.port, () => {
        console.log(`\n🌐 ======${config.botName} API SERVER ======`);
        console.log(`   Port: ${config.port}`);
        console.log(`   Health: http://localhost:${config.port}/`);
        console.log(`   Status: http://localhost:${config.port}/status`);
        console.log(`   Pair Code: http://localhost:${config.port}/pair?phone=9475XXXXXXX`);
        console.log(`================================\n`);
    });

    return app;
}

module.exports = { createAPIServer, setBotSocket, setConnectionStatus };
