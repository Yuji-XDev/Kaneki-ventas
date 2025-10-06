let handler = async (m, { conn, text }) => {
  // Detecta si el usuario escribió o presionó "ropa"
  const userMsg = (text || m.text || '').toLowerCase()
  if (!userMsg.includes('ropa')) return

  const mensaje = {
    image: { url: 'https://n.uguu.se/vqJnHBPm.jpg' },
    caption: `
╭━━━〔 👕 *CATÁLOGO DE ROPA* 〕━━⬣
│ 👚 *Polos:* desde _S/ 29.90_
│ 👖 *Jeans:* desde _S/ 59.90_
│ 🧢 *Gorras:* desde _S/ 19.90_
│
│ 📦 Envíos a todo el Perú 🇵🇪
│ 🛒 Escribe *comprar ropa* para hacer tu pedido.
╰━━━━━━━━━━━━━━━━━━⬣
    `,
    footer: '✨ Calidad Kaneki garantizada',
  }

  await conn.sendMessage(m.chat, mensaje)
}

handler.command = /^(ropa)$/i
export default handler