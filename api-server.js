import express from 'express';
import config from './config.js';

let botSock = null;
let isConnected = false;
let connectionStatus = 'starting';
let botUser = null;

export function setBotSocket(sock) {
    botSock = sock;
}

export function setConnectionStatus(status, user = null) {
    connectionStatus = status;
    isConnected = status === 'connected';
    botUser = user;
}

export function createAPIServer() {
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
            version: config.version,
            status: connectionStatus,
            connected: isConnected,
            user: botUser ? botUser.id || botUser : null,
            uptime: Math.floor(process.uptime()),
            timestamp: new Date().toISOString()
        });
    });

    // PAIR CODE GENERATION API
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
            const cleanNumber = phone.replace(/\D/g, '');
            const fullNumber = cleanNumber.startsWith('94') ? cleanNumber : '94' + cleanNumber.replace(/^0+/, '');

            console.log(`\n📱 ===== PAIR CODE REQUEST =====`);
            console.log(`   Phone: ${fullNumber}`);
            
            const code = await botSock.requestPairingCode(fullNumber);
            
            if (code) {
                const formattedCode = code.match(/.{1,4}/g)?.join('-') || code;
                console.log(`   ✅ Code: ${formattedCode}`);
                console.log(`================================\n`);
                
                res.json({ 
                    success: true, 
                    code: formattedCode,
                    phone: fullNumber,
                    timestamp: new Date().toISOString(),
                    instructions: `1. Open WhatsApp on your phone\n2. Tap Menu (3 dots) or Settings\n3. Go to Linked Devices\n4. Tap 'Link a Device'\n5. Enter this code: ${formattedCode}`
                });
            } else {
                res.json({ success: false, error: 'Failed to generate pair code' });
            }
        } catch (error) {
            console.error(`   ❌ Pair Code Error: ${error.message}`);
            res.json({ success: false, error: error.message });
        }
    });

    // POST pair code
    app.post('/pair', async (req, res) => {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ success: false, error: 'Phone number required' });
        }
        req.query = { phone };
        app.handle(req, res);
    });

    app.listen(config.port, () => {
        console.log(`\n🌐 ======${config.botName} API SERVER ======`);
        console.log(`   Port: ${config.port}`);
        console.log(`   Pair Code: GET /pair?phone=9475XXXXXXX`);
        console.log(`================================\n`);
    });

    return app;
}
