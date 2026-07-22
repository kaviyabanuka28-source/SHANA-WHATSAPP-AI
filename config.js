const config = {
    // Bot Name
    botName: "SHANA",
    version: "1.0.0",

    // Cooldown time in milliseconds (20 minutes)
    cooldownTime: 20 * 60 * 1000,

    // Owner/Admin contacts
    adminContacts: ["94758862130@s.whatsapp.net", "94742381405@s.whatsapp.net", "94703557568@s.whatsapp.net"],

    // Session file name
    sessionFile: "shana_auth_info.json",

    // Bot prefix
    prefix: ".",
    
    // Railway port
    port: process.env.PORT || 3000
};

module.exports = config;
