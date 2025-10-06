export default async function info(conn, m) {
  const menuInfo = `
╭━━━〔 ℹ️ *Información del Sistema* ℹ️ 〕━━⬣
│
│🌸 *Kaneki Ventas Bot*
│🤖 Versión: 1.0.0
│📅 Actualizado: ${new Date().toLocaleDateString()}
│💬 Desarrollado por: ShadowXYZ
│
│💡 Usa el menú principal para explorar
│  todo el catálogo disponible.
│
╰━━━━━━━━━━━━━━━━━━⬣
`

  await conn.sendMessage(m.chat, {
    image: { url: 'https://i.pinimg.com/originals/e0/98/ba/e098bac73c8ae72243f66c7bf712045a.jpg' }, // imagen tipo banner
    caption: menuInfo,
    footer: '✨ Kaneki Ventas © ShadowXYZ',
    buttons: [
      { buttonId: 'menu', buttonText: { displayText: '🏠 Menú Principal' }, type: 1 },
      { buttonId: 'ayuda', buttonText: { displayText: '📘 Ayuda' }, type: 1 }
    ],
    headerType: 4
  })
}