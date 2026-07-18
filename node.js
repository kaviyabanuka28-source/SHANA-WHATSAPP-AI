const { Client, LocalAuth } = require('whatsapp-web.js');

const express = require('express');



const app = express();

const PORT = process.env.PORT || 8080;



app.get('/ping', (req, res) => {

    res.status(200).json({ status: 'alive' });

});



app.listen(PORT);



const client = new Client({

    puppeteer: {

        headless: true,

        args: ["--no-sandbox", "--disable-setuid-sandbox"]

    },

    authStrategy: new LocalAuth()

});



client.on('ready', () => {

    console.log('✅ SHANA AI Bot SYSTEM CONNECTED!');

});



// අංකය ඇතුළත් කිරීම

client.initialize().then(async () => {

    // ඔබේ අංකය (රටේ කෝඩ් එක සමඟ 94xxxxxxxxx)

    const phoneNumber = '94742381405'; 

    const pairingCode = await client.requestPairingCode(phoneNumber);

    console.log('🟢 ඔබේ Pairing Code එක: ' + pairingCode);

});



client.on('message', async (message) => {

    // ඔබේ message logic එක මෙතැනට දාන්න

    if (message.body === '1') {

        await message.reply('1XBET Details...');

    }

});
