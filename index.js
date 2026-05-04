const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const socketIO = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const port = process.env.PORT || 5000;

app.use(express.static('public'));

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process'],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser'
    }
});

client.on('qr', (qr) => {
    qrcode.toDataURL(qr, (err, url) => {
        io.emit('qr', url);
    });
});

client.on('ready', () => {
    io.emit('ready');
});

io.on('connection', (socket) => {
    // لما المستخدم يكتب رقمه يجيله الكود فوراً
    socket.on('requestPairingCode', async (num) => {
        try {
            const code = await client.requestPairingCode(num);
            socket.emit('pairingCode', code);
        } catch (e) {
            socket.emit('error', 'خطأ في طلب الكود');
        }
    });
});

client.initialize();
server.listen(port, () => console.log('Server is running!'));
