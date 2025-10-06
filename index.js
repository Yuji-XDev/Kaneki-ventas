import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys'
import qrcode from 'qrcode-terminal'
import chalk from 'chalk'
import moment from 'moment-timezone'
import readline from 'readline'
import dotenv from 'dotenv'

dotenv.config()

// Función para leer texto en consola
const ask = (query) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    rl.question(query, (ans) => {
      rl.close()
      resolve(ans.trim())
    })
  })

// Función principal
const startBot = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('./session')
  const { version } = await fetchLatestBaileysVersion()

  console.clear()
  console.log(chalk.magentaBright('╭━━━〔 𝙆𝘼𝙉𝙀𝙆𝙄 𝙑𝙀𝙉𝙏𝘼𝙎 〕━━⬣'))
  console.log(chalk.cyan('┃'))
  console.log(chalk.cyan('┃ 1️⃣ Conectar con código QR'))
  console.log(chalk.cyan('┃ 2️⃣ Conectar con código de 8 dígitos'))
  console.log(chalk.cyan('┃'))
  console.log(chalk.magentaBright('╰━━━━━━━━━━━━━━━━━━━━━━⬣\n'))

  const choice = await ask(chalk.green('👉 Elige el método de conexión (1 o 2): '))

  // ⚙️ Configurar socket sin QR impreso automático
  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ['Kaneki Ventas', 'Chrome', '1.0.0'],
    syncFullHistory: false
  })

  // 🧩 Opción 1: Conexión por código QR
  if (choice === '1') {
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
          console.log(chalk.red('⚠️ Sesión cerrada, borra /session y vuelve a conectar.'))
        } else {
          console.log(chalk.yellow('♻️ Reconectando...'))
          startBot()
        }
      }
    })
  }

  // 🧩 Opción 2: Conexión por código de 8 dígitos
  if (choice === '2') {
    const phone = await ask(chalk.yellow('\n📞 Ingresa tu número de WhatsApp (ejemplo: 51987654321): '))

    console.log(chalk.blue('\n🔄 Generando código de vinculación...'))

    try {
      // 👇 IMPORTANTE: No debe tener sesión previa activa
      const code = await sock.requestPairingCode(phone)
      console.log(chalk.greenBright(`\n🔢 Tu código de vinculación es: ${code}`))
      console.log(chalk.cyanBright('\n📲 En tu WhatsApp ve a: Dispositivos vinculados → Vincular con código'))
      console.log(chalk.yellow('⌛ El código expira en unos minutos, úsalo pronto.'))
    } catch (e) {
      console.error(chalk.red('\n❌ Error al generar el código de vinculación:'))
      console.error(e)
      console.log(chalk.yellow('\n💡 Solución rápida: borra la carpeta /session y vuelve a intentarlo.'))
    }
  }

  // 🔐 Guardar credenciales
  sock.ev.on('creds.update', saveCreds)

  // 💬 Respuestas automáticas básicas
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    if (!m.message) return

    const texto =
      (m.message.conversation ||
        m.message.extendedTextMessage?.text ||
        '').toLowerCase()

    if (texto.includes('hola')) {
      await sock.sendMessage(m.key.remoteJid, {
        text: '👋 ¡Hola! Bienvenido a *Kaneki Ventas* 🛒\nEscribe *menu* para ver nuestros productos.'
      })
    }

    if (texto.includes('menu')) {
      await sock.sendMessage(m.key.remoteJid, {
        text: '🛍️ *Catálogo disponible:*\n1️⃣ Camisas\n2️⃣ Zapatillas\n3️⃣ Accesorios\n\nEscribe el número para más info.'
      })
    }
  })
}

startBot()