export default async function (sock, m, text) {
  if (text.toLowerCase().includes('hola')) {
    await sock.sendMessage(m.key.remoteJid, {
      text: '👋 ¡Hola! Bienvenido a *Kaneki Ventas* 🛒\nEscribe *menu* para ver nuestros productos.'
    })
  }
}