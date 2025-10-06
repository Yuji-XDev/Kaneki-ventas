import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  jidNormalizedUser
} from '@whiskeysockets/baileys'
import qrcode from 'qrcode-terminal'
import chalk from 'chalk'
import moment from 'moment-timezone'
import readline from 'readline'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

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

const delay = (ms) => new Promise((res) => setTimeout(res, ms))

async function resolveLidToRealJid(lidJid, conn, maxRetries = 3, retryDelay = 1000) {
  if (!lidJid?.includes('@lid')) return lidJid
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await conn.onWhatsApp(lidJid)
      if (result?.[0]?.jid) return result[0].jid
    } catch {
      if (i < maxRetries - 1) await delay(retryDelay)
    }
  }
  return lidJid
}

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
      const userJid = jidNormalizedUser(sock.user?.id)
      const userName = sock.user?.name || sock.user?.verifiedName || 'Desconocido'
      console.log(chalk.greenBright(`\n✅ Conectado correctamente a WhatsApp`))
      console.log(chalk.cyanBright(`📅 Sesión iniciada: ${moment().format('DD/MM/YYYY HH:mm:ss')}`))
      console.log(chalk.greenBright(`👤 Usuario: ${userName} (${userJid})`))
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode || 'desconocido'
      console.log(chalk.red(`⚠️ Conexión cerrada (${reason})`))

      if (reason === DisconnectReason.loggedOut) {
        console.log(chalk.red('🧹 La sesión fue cerrada. Borra /session y vuelve a vincular.'))
      } else {
        console.log(chalk.yellow('♻️ Intentando reconectar automáticamente en 5 segundos...'))
        await delay(5000)
        startBot(true)
      }
    }
  })

  sock.ev.on('creds.update', saveCreds)

  // 💬 Manejo de mensajes
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    if (!m.message) return

    const sender = await resolveLidToRealJid(m.key.remoteJid, sock)
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

    // ⚙️ Comandos
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

    // 🔄 Comando !update
    if (text.toLowerCase() === 'update') {
      await sock.sendMessage(sender, { text: '♻️ Actualizando bot desde Git...' })
      const { exec } = await import('child_process')
      exec('git pull', (err, stdout, stderr) => {
        if (err) {
          console.log(chalk.red('❌ Error al actualizar:'), err.message)
          sock.sendMessage(sender, { text: `❌ Error al actualizar:\n${err.message}` })
          return
        }
        const output = stdout || stderr || '✅ Bot actualizado correctamente.'
        console.log(chalk.greenBright('✅ Git Pull ejecutado'))
        sock.sendMessage(sender, { text: `📦 Resultado de la actualización:\n\n${output}` })
      })
    }

    if (text.toLowerCase() === 'menu' && catalogos.menuPrincipal) {
      console.log(chalk.blue('📦 Enviando menú principal...'))
      const data = catalogos.menuPrincipal()
      await sock.sendMessage(sender, data)
    }

    if (text.toLowerCase() === 'ropa' && plugins.ropa) await plugins.ropa(sock, m, text)
    if (text.toLowerCase() === 'zapatillas' && plugins.zapatillas) await plugins.zapatillas(sock, m, text)
    if (text.toLowerCase() === 'accesorios' && plugins.accesorios) await plugins.accesorios(sock, m, text)
  })

  return sock
}

if (fs.existsSync('./session/creds.json')) {
  console.log(chalk.cyanBright('🔁 Sesión detectada, conectando automáticamente...'))
  startBot(true)
} else {
  console.clear()
  console.log(chalk.magentaBright('╭━━━〔 🕸️ 𝙆𝘼𝙉𝙀𝙆𝙄 𝙑𝙀𝙉𝙏𝘼𝙎 🗿 〕━━⬣'))
  console.log(chalk.cyan('┃ 🔗 No hay sesión activa'))
  console.log(chalk.cyan('┃ 1️⃣ Vincular con código QR'))
  console.log(chalk.cyan('┃ 2️⃣ Vincular con código de 8 dígitos'))
  console.log(chalk.magentaBright('╰━━━━━━━━━━━━━━━━━━━━━━⬣\n'))

  const choice = await ask('👉 Elige el método de vinculación (1 o 2): ')

  if (choice === '2') {
    const { state, saveCreds } = await useMultiFileAuthState('./session')
    const { version } = await fetchLatestBaileysVersion()
    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      browser: ['Kaneki Ventas', 'Chrome', '1.0.0']
    })

    const phoneNumber = await ask('📞 Ingresa tu número de WhatsApp con código de país (sin +): ')
    console.log(chalk.yellow('\n⌛ Generando código de vinculación...'))

    let code = await sock.requestPairingCode(`+${phoneNumber}`)
    code = code?.match(/.{1,4}/g)?.join('-') || code

    console.log(chalk.greenBright(`✅ Tu código de vinculación es: ${code}`))
    console.log(chalk.cyanBright('\n📱 Abre WhatsApp > Dispositivos vinculados > Vincular dispositivo > Ingresa el código.'))

    sock.ev.on('connection.update', async (update) => {
      const { connection } = update
      if (connection === 'open') {
        try {
          await sock.sendMessage(`${phoneNumber}@s.whatsapp.net`, {
            text: `🌸 Hola! Tu código de vinculación con *Kaneki Ventas* es:\n\n🔢 *${code}*\n\nÚsalo en WhatsApp > Dispositivos vinculados para conectar tu cuenta.`
          })
          console.log(chalk.greenBright('📩 Notificación enviada correctamente al número vinculado.'))
        } catch {
          console.log(chalk.red('⚠️ No se pudo enviar el mensaje de notificación al número.'))
        }
      }
    })

    sock.ev.on('creds.update', saveCreds)
  } else {
    startBot()
  }
}