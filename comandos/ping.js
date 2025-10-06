export default async function (sock, m) {
  const start = Date.now()
  await sock.sendMessage(m.key.remoteJid, { text: '🏓 Pong!' })
  const end = Date.now()
  await sock.sendMessage(m.key.remoteJid, { text: `⚡ Velocidad: ${end - start}ms` })
}