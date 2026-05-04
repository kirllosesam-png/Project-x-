const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const qrcodeTerminal = require('qrcode-terminal');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ],
        // في Render لا نضع مسار يدوي، هو سيتعرف عليه تلقائياً
    }
});

client.on('qr', (qr) => {
    qrcodeTerminal.generate(qr, { small: true });
    io.emit('qr_code', qr);
});

client.on('ready', () => {
    console.log('✅ واتساب جاهز على السيرفر!');
    io.emit('ready', true);
});

client.on('message', async (msg) => {
    const contact = await msg.getContact();
    io.emit('new_activity', {
        type: 'receive',
        from: contact.pushname || msg.from,
        body: msg.body
    });
});

client.on('message_create', async (msg) => {
    if (msg.fromMe) {
        io.emit('new_activity', {
            type: 'sent',
            to: 'أنا',
            body: msg.body
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Render يحدد البورت تلقائياً عبر متغير بيئة
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 السيرفر يعمل على بورت: ${PORT}`);
});

client.initialize();
