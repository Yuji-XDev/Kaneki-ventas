require('dotenv').config();
const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const salesController = require('./controllers/salesController');
const app = express();

app.use(express.json());

// Iniciar WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', qr => {
    console.log('Escanea este QR con WhatsApp:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Bot de ventas listo en WhatsApp!');
});

// Escucha mensajes entrantes
client.on('message', msg => {
    salesController.handleMessage(msg, client);
});

// Arranca WhatsApp
client.initialize();

// Endpoint de prueba HTTP
app.get('/', (req, res) => {
    res.send('Bot de ventas para WhatsApp funcionando!');
});

// Inicia servidor Express
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Express escuchando en puerto ${PORT}`);
});