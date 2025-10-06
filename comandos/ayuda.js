import fs from 'fs'

export default async function ayuda(conn, m) {
  const menuAyuda = `
╭━━━〔 🌸 *Menú de Ayuda* 🌸 〕━━⬣
│✨ Usa los botones para navegar.
│
│💡 *Ropa*: Ver catálogo de prendas.
│💡 *Zapatillas*: Modelos y tallas.
│💡 *Accesorios*: Joyas, relojes, etc.
│💬 *Info*: Más detalles del sistema.
│💸 *Soporte*: Contactar con el vendedor.
╰━━━━━━━━━━━━━━━━━━⬣
`

  await conn.sendMessage(m.chat, {
    image: { url: 'https://i.pinimg.com/originals/e0/98/ba/e098bac73c8ae72243f66c7bf712045a.jpg' }, // imagen decorativa
    caption: menuAyuda,
    footer: '🌸 Kaneki Ventas © 2025',
    buttons: [
      { buttonId: 'menu', buttonText: { displayText: '🏠 Menú Principal' }, type: 1 },
      { buttonId: 'info', buttonText: { displayText: 'ℹ️ Información' }, type: 1 },
      { buttonId: 'soporte', buttonText: { displayText: '💬 Soporte' }, type: 1 }
    ],
    headerType: 4
  })
}