export default async function ropa(sock, m, text) {
  if (text.toLowerCase() !== 'ropa') return

  const mensaje = {
    image: { url: 'https://n.uguu.se/vqJnHBPm.jpg' },
    caption: `
🧥 *Catálogo de Ropa - Kaneki Ventas* 👕  

👚 Polos desde *S/ 29.90*  
👖 Jeans desde *S/ 59.90*  
🧢 Gorras desde *S/ 19.90*

📦 Envíos a todo el Perú 🇵🇪  
🛒 Escribe *comprar ropa* para hacer tu pedido.
    `,
    footer: '✨ Calidad Kaneki garantizada',
  }

  await sock.sendMessage(m.key.remoteJid, mensaje)
}