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

// 🧠 Lectura desde consola
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
  if (!fs.existsSync(folder)) {
    console.log(chalk.red(`⚠️ Carpeta no encontrada: ${dir}`))
    return modules
  }

  console.log(chalk.blueBright(`🔍 Cargando módulos desde: ${dir}`))
  for (const file of fs.readdirSync(folder)) {
    if (file.endsWith('.js')) {
      try {
        const mod = await import(path.join('file://', folder, file))
        modules[file.replace('.js', '')] = mod.default || mod
        console.log(chalk.green(`✅ Módulo cargado: ${file}`))
      } catch (err) {
        console.log(chalk.red(`❌ Error al cargar ${file}:`), err.message)
      }
    }
  }
  return modules
}

// ⚙️ Reconexión automática con espera
const delay = (ms) => new Promise((res) => setTimeout(res, ms))

// 🚀 Función principal
async function startBot(auto = false) {
  const { state, saveCreds } = await useMultiFileAuthState('./session')
  const { version } = await fetchLatestBaileysVersion()

  if (!auto) {
    console.clear()
    console.log(chalk.magentaBright('╭━━━〔 𝙆𝘼𝙉𝙀𝙆𝙄 𝙑𝙀𝙉𝙏𝘼𝙎 🗿 〕━━⬣'))
    console.log(chalk.cyan('┃ 🚀 Bot iniciado'))
    console.log(chalk.cyan('┃ 📦 Cargando módulos y comandos...'))
    console.log(chalk.magentaBright('╰━━━━━━━━━━━━━━━━━━━━━━⬣\n'))
  }

  const catalogos = await loadModules('./catalogos')
  const plugins = await loadModules('./plugins')
  const comandos = await loadModules('./comandos')

  console.log(chalk.greenBright('\n✅ Módulos cargados correctamente.'))
  console.log(chalk.yellowBright('----------------------------------------------'))

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ['Kaneki Ventas', 'Chrome', '1.0.0'],
    syncFullHistory: false
  })

  // 🟢 Evento de conexión
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log(chalk.green('\n📱 Escanea este código QR para vincular tu WhatsApp:\n'))
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'connecting') {
      console.log(chalk.yellowBright(`[${moment().format('HH:mm:ss')}] 🔄 Conectando a WhatsApp...`))
    }

    if (connection === 'open') {
      console.log(chalk.greenBright(`\n✅ Conectado correctamente a WhatsApp`))
      console.log(chalk.cyanBright(`📅 Sesión iniciada: ${moment().format('DD/MM/YYYY HH:mm:ss')}`))
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode || 'desconocido'
      console.log(chalk.red(`⚠️ Conexión cerrada (${reason})`))

      if (reason === DisconnectReason.loggedOut) {
        console.log(chalk.red('🧹 La sesión fue cerrada. Borra /session y vuelve a vincular.'))
      } else {
        console.log(chalk.yellow('♻️ Intentando reconectar automáticamente en 5 segundos...'))
        await delay(5000)
        startBot(true) // 🔁 Reconexión automática
      }
    }
  })

  sock.ev.on('creds.update', saveCreds)

  // 💬 Registro de mensajes
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

    const hora = moment().format('HH:mm:ss')
    console.log(chalk.yellow(`\n[${hora}] 💬 ${sender}:`), chalk.white(text))

    // 🔩 Plugins automáticos
    for (const name in plugins) {
      const plugin = plugins[name]
      if (plugin && typeof plugin === 'function') {
        try {
          await plugin(sock, m, text)
        } catch (err) {
          console.log(chalk.red(`❌ Error en plugin "${name}":`), err.message)
        }
      }
    }

    // ⚙️ Comandos (prefijo !)
    if (text.startsWith('!')) {
      const [cmd, ...args] = text.slice(1).split(' ')
      const comando = comandos[cmd]
      if (comando && typeof comando === 'function') {
        console.log(chalk.cyan(`🧠 Ejecutando comando: !${cmd}`))
        await comando(sock, m, args)
        return
      } else {
        console.log(chalk.red(`❌ Comando no encontrado: !${cmd}`))
      }
    }

    // 🛍️ Menú principal
    if (text.toLowerCase() === 'menu' && catalogos.menuPrincipal) {
      console.log(chalk.blue('📦 Enviando menú principal...'))
      const data = catalogos.menuPrincipal()
      await sock.sendMessage(sender, data)
    }

    // 🧩 Botones de catálogo
    if (text.toLowerCase() === 'ropa' && plugins.ropa) await plugins.ropa(sock, m, text)
    if (text.toLowerCase() === 'zapatillas' && plugins.zapatillas) await plugins.zapatillas(sock, m, text)
    if (text.toLowerCase() === 'accesorios' && plugins.accesorios) await plugins.accesorios(sock, m, text)
  })
}

// 🟢 Iniciar con autoconexión si hay sesión guardada
if (fs.existsSync('./session/creds.json')) {
  console.log(chalk.cyanBright('🔁 Sesión detectada, conectando automáticamente...'))
  startBot(true)
} else {
  startBot()
}