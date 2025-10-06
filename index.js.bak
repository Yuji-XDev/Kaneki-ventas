// index.js
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import qrcode from 'qrcode-terminal'
import chalk from 'chalk'
import moment from 'moment-timezone'
import dotenv from 'dotenv'

dotenv.config()

const startBot = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('./session')
  const sock = makeWASocket({
    printQRInTerminal: true,
    auth: state,
    browser: ['Kaneki Ventas', 'Chrome', '1.0.0']
  })

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log(chalk.green('\n📱 Escanea este código QR para vincular tu WhatsApp:\n'))
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'open') {
      console.log(chalk.cyan('\n✅ Conectado a WhatsApp correctamente.'))
      console.log('📅 Sesión iniciada:', moment().format('DD/MM/YYYY HH:mm:ss'))
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode
      if (reason === DisconnectReason.loggedOut) {
        console.log(chalk.red('⚠️ Sesión cerrada, borra la carpeta /session y vuelve a escanear el QR.'))
      } else {
        console.log(chalk.yellow('♻️ Reconectando...'))
        startBot()
      }
    }
  })

  sock.ev.on('creds.update', saveCreds)


  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    if (!m.message) return
    const texto = (m.message.conversation || m.message.extendedTextMessage?.text || '').toLowerCase()

    if (texto.includes('hola')) {
      await sock.sendMessage(m.key.remoteJid, { text: '👋 ¡Hola! Bienvenido a *Kaneki Ventas* 🛒\nEscribe *menu* para ver nuestros productos.' })
    }

    if (texto.includes('menu')) {
      await sock.sendMessage(m.key.remoteJid, { text: '🛍️ *Catálogo disponible:*\n1️⃣ Camisas\n2️⃣ Zapatillas\n3️⃣ Accesorios\n\nEscribe el número para más info.' })
    }
  })
}

startBot()