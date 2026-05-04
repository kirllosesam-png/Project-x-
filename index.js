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

// إعدادات العميل مع تعديلات خاصة لـ Replit
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // مهم جداً لتقليل استهلاك الرامات
            '--disable-gpu'
        ],
        // السطر اللي تحت ده بيخلي الكود يدور على المتصفح في المسار الافتراضي لـ Replit
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser'
    }
});

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
        io.emit('qr', url);
    });
});

client.on('ready', () => {
    console.log('واتساب جاهز للعمل!');
    io.emit('ready', 'Connected');
});

client.initialize().catch(err => console.error('خطأ في التشغيل:', err));

server.listen(port, () => {
    console.log(`السيرفر شغال على الرابط: http://localhost:${port}`);
});
