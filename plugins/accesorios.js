export default async function accesorios(sock, m, text) {
  if (text.toLowerCase() !== 'accesorios') return

  const mensaje = {
    image: { url: 'https://h.uguu.se/wzOFAoph.png' },
    caption: `
💍 *Catálogo de Accesorios - Kaneki Ventas*  

⌚ Relojes desde *S/ 59.90*  
🕶️ Lentes desde *S/ 39.90*  
🎒 Mochilas desde *S/ 49.90*

🎁 Perfectos para regalo 🎀  
🛒 Escribe *comprar accesorios* para adquirir.
    `,
    footer: '💎 Kaneki Ventas | Brilla con estilo',
  }

  await sock.sendMessage(m.key.remoteJid, mensaje)
}