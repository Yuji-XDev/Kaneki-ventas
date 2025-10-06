// Inicializa el bot y la conexión con WhatsApp
const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const handleMessage = require('../controllers/messageController');
const log = require('../utils/logger');

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const { version } = await fetchLatestBaileysVersion();

  let sock;

  async function connect() {
    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: true,
    });

    sock.ev.on('creds.update', saveCreds);

    // Manejo de reconexión automática
    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode;
        log(`Desconectado de WhatsApp: ${DisconnectReason[reason] || reason}`);
        // Intentar reconectar
        setTimeout(connect, 5000);
      } else if (connection === 'open') {
        log('Bot conectado a WhatsApp');
      } else if (qr) {
        log('Escanea el código QR para iniciar sesión');
      }
    });

    // Manejo de mensajes entrantes (privados y grupos)
    sock.ev.on('messages.upsert', async ({ messages }) => {
      try {
        const msg = messages[0];
        if (!msg.key.fromMe && (msg.message?.conversation || msg.message?.extendedTextMessage?.text)) {
          await handleMessage(sock, msg);
          log(`Mensaje recibido de ${msg.key.remoteJid}`);
        }
      } catch (err) {
        log(`Error procesando mensaje: ${err.message}`);
      }
    });
  }

  // Iniciar la conexión al bot
  await connect();
}

module.exports = startBot;