const express = require('express');
const { generatePairCode, isConnected, startBot } = require('./bot');
const fs = require('fs');
const path = require('path');
const AUTH_DIR = process.env.AUTH_DIR || 'shana_auth';

function startAPI(port = 8080) {
  const app = express();
  
  app.get('/', (req, res) => {
    const paired = fs.existsSync(path.join(AUTH_DIR, 'creds.json'));
    res.send(`
      <html>
      <head><title>SHANA WhatsApp Bot</title>
      <style>
        body { font-family: Arial; max-width: 600px; margin: 50px auto; padding: 20px; }
        .box { border: 2px solid #25D366; padding: 20px; border-radius: 10px; }
        .connected { color: green; } .disconnected { color: red; }
        input, button { padding: 10px; font-size: 16px; margin: 5px; }
        code { background: #f0f0f0; padding: 5px 10px; border-radius: 5px; font-size: 18px; }
      </style>
      </head>
      <body>
        <div class="box">
          <h2>🤖 SHANA WhatsApp Bot</h2>
          <p>Status: <strong class="${isConnected() ? 'connected' : 'disconnected'}">
            ${isConnected() ? '✅ CONNECTED' : '❌ DISCONNECTED'}</strong></p>
          <p>Paired: <strong>${paired ? '✅ Yes' : '❌ No'}</strong></p>
          <hr>
          <h3>🔑 Generate Pair Code</h3>
          <form action="/pair" method="get">
            <input type="text" name="phone" placeholder="9476xxxxxxx" required>
            <button type="submit">Generate</button>
          </form>
          <p><small>Example: 94761234567</small></p>
          <hr>
          <h3>📌 How to Connect</h3>
          <ol>
            <li>Enter your WhatsApp number above</li>
            <li>Get the Pair Code</li>
            <li>WhatsApp > Menu > Linked Devices</li>
            <li>Tap "Link a Device"</li>
            <li>Enter the code</li>
            <li>Bot connects automatically!</li>
          </ol>
        </div>
      </body>
      </html>
    `);
  });

  app.get('/pair', async (req, res) => {
    const phone = req.query.phone;
    if (!phone) {
      return res.send('<html><body><h3>❌ Error: ?phone=9476xxxxxxx required</h3><a href="/">Back</a></body></html>');
    }

    try {
      const result = await generatePairCode(phone);
      
      if (result.already) {
        return res.send(`
          <html><body>
          <h3>✅ Already Paired!</h3>
          <p>Bot is already connected. Auto Reply working!</p>
          <a href="/">Back</a>
          </body></html>
        `);
      }

      const html = `
      <html>
      <head><title>Pair Code Generated</title>
      <style>
        body { font-family: Arial; max-width: 500px; margin: 50px auto; padding: 20px; text-align: center; }
        .code-box { border: 3px dashed #25D366; padding: 30px; border-radius: 15px; margin: 20px; }
        .code { font-size: 32px; font-weight: bold; letter-spacing: 3px; color: #075E54; }
        .steps { text-align: left; margin: 20px; }
        li { margin: 10px 0; }
      </style>
      </head>
      <body>
        <h2>✅ Pair Code Generated!</h2>
        <div class="code-box">
          <p>📱 Number: <strong>${phone}</strong></p>
          <p class="code">🔐 ${result.code}</p>
        </div>
        <div class="steps">
          <h3>📌 How to Link:</h3>
          <ol>
            <li>📱 Open WhatsApp on your phone</li>
            <li>⋮ Menu (3 dots) > <strong>Linked Devices</strong></li>
            <li>➕ Tap <strong>"Link a Device"</strong></li>
            <li>🔢 Enter this code: <strong>${result.code}</strong></li>
            <li>⏳ Wait 5-10 seconds</li>
            <li>✅ Bot connects automatically!</li>
          </ol>
        </div>
        <p>🔄 <a href="/">Refresh page to check status</a></p>
        <script>
          // Auto refresh after 30 seconds to check connection
          setTimeout(() => { location.href = '/'; }, 30000);
        </script>
      </body>
      </html>`;
      
      res.send(html);
    } catch (err) {
      res.send(`<html><body><h3>❌ Error: ${err.message}</h3><a href="/">Try again</a></body></html>`);
    }
  });

  app.get('/status', (req, res) => {
    res.json({
      connected: isConnected(),
      paired: fs.existsSync(path.join(AUTH_DIR, 'creds.json'))
    });
  });

  app.get('/restart', (req, res) => {
    res.send('Restarting...');
    startBot();
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`[API] ✅ Server: http://localhost:${port}`);
    console.log(`[API] 🔑 Pair Code: GET /pair?phone=9476xxxxxxx`);
    console.log(`[API] 📊 Status: GET /status`);
  });
}

module.exports = { startAPI };
