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
import fs from 'fs'
import path from 'path'

dotenv.config()

// 🧠 Función para leer texto en consola
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

// 📦 Carga dinámica de módulos
const loadModules = async (dir) => {
  const modules = {}
  const folder = path.join(process.cwd(), dir)
  if (!fs.existsSync(folder)) return modules

  for (const file of fs.readdirSync(folder)) {
    if (file.endsWith('.js')) {
      const mod = await import(path.join('file://', folder, file))
      modules[file.replace('.js', '')] = mod.default || mod
    }
  }
  return modules
}

// 🚀 Función principal del bot
const startBot = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('./session')
  const { version } = await fetchLatestBaileysVersion()

  // 📚 Cargar módulos
  const catalogos = await loadModules('./catalogos')
  const plugins = await loadModules('./plugins')
  const comandos = await loadModules('./comandos')

  console.clear()
  console.log(chalk.magentaBright('╭━━━〔 𝙆𝘼𝙉𝙀𝙆𝙄 𝙑𝙀𝙉𝙏𝘼𝙎 🗿 〕━━⬣'))
  console.log(chalk.cyan('┃ 1️⃣ Conectar con código QR'))
  console.log(chalk.cyan('┃ 2️⃣ Conectar con código de 8 dígitos'))
  console.log(chalk.magentaBright('╰━━━━━━━━━━━━━━━━━━━━━━⬣\n'))

  const choice = await ask(chalk.green('👉 Elige el método de conexión (1 o 2): '))

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ['Kaneki Ventas', 'Chrome', '1.0.0'],
    syncFullHistory: false
  })

  // 🔗 Conexión por QR
  if (choice === '1') {
    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update
      if (qr) {
        console.log(chalk.green('\n📱 Escanea este código QR para vincular tu WhatsApp:\n'))
        qrcode.generate(qr, { small: true })
      }
      if (connection === 'open') {
        console.log(chalk.cyan('\n✅ Conectado correctamente a WhatsApp.'))
        console.log('📅 Sesión iniciada:', moment().format('DD/MM/YYYY HH:mm:ss'))
      }
      if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode
        if (reason === DisconnectReason.loggedOut) {
          console.log(chalk.red('⚠️ Sesión cerrada, borra la carpeta /session y vuelve a conectar.'))
        } else {
          console.log(chalk.yellow('♻️ Reconectando...'))
          startBot()
        }
      }
    })
  }

  // 🔢 Conexión por código de 8 dígitos
  if (choice === '2') {
    let phone
    while (true) {
      phone = await ask(chalk.yellow('\n📞 Ingresa tu número (ejemplo: 51987654321): '))
      if (!/^\d{10,15}$/.test(phone)) {
        console.log(chalk.red('❌ Número inválido.'))
        continue
      }
      break
    }

    console.log(chalk.blue('\n🔄 Generando código...'))
    try {
      const code = await sock.requestPairingCode(phone)
      if (code) {
        console.log(chalk.greenBright(`✅ Código generado para +${phone}`))
        console.log(chalk.magentaBright(`🔢 Tu código es: ${code}`))
        console.log(chalk.cyanBright('\n📲 WhatsApp → Dispositivos vinculados → Vincular con código'))
      }
    } catch (e) {
      console.error(chalk.red('❌ Error al generar el código:'), e)
    }
  }

  sock.ev.on('creds.update', saveCreds)

  // 💬 Registro de mensajes y ejecución modular
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    if (!m.message) return

    const sender = m.key.remoteJid
    const text =
      (
        m.message.conversation ||
        m.message.extendedTextMessage?.text ||
        m.message.buttonsResponseMessage?.selectedButtonId ||
        ''
      ).trim()

    if (!text) return

    // 🧾 Mostrar en consola
    console.log(
      chalk.yellow(`[📩 MENSAJE] ${moment().format('HH:mm:ss')} - ${sender}:`),
      chalk.white(text)
    )

    // 🧩 Ejecutar plugins simples
    for (const name in plugins) {
      const plugin = plugins[name]
      if (plugin && typeof plugin === 'function') {
        await plugin(sock, m, text)
      }
    }

    // ⚙️ Ejecutar comandos (prefijo “!”)
    if (text.startsWith('!')) {
      const [cmd, ...args] = text.slice(1).split(' ')
      const comando = comandos[cmd]
      if (comando && typeof comando === 'function') {
        await comando(sock, m, args)
        return
      }
    }

    // 🛍️ Menú principal
    if (text.toLowerCase() === 'menu') {
      if (catalogos.menuPrincipal) {
        const data = catalogos.menuPrincipal()
        await sock.sendMessage(sender, data)
      } else {
        await sock.sendMessage(sender, { text: '⚠️ No se encontró el catálogo principal.' })
      }
    }

    // 🧩 Botones del catálogo (responden automáticamente)
    if (text === 'ropa' && plugins.ropa) await plugins.ropa(sock, m, text)
    if (text === 'zapatillas' && plugins.zapatillas) await plugins.zapatillas(sock, m, text)
    if (text === 'accesorios' && plugins.accesorios) await plugins.accesorios(sock, m, text)
  })
}

startBot()