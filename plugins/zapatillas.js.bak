export default async function zapatillas(sock, m, text) {
  if (text.toLowerCase() !== 'zapatillas') return

  const mensaje = {
    image: { url: 'https://n.uguu.se/vqJnHBPm.jpg' },
    caption: `
👟 *Catálogo de Zapatillas - Kaneki Ventas*  

🏃 Nike Air - *S/ 199.90*  
🔥 Adidas Classic - *S/ 179.90*  
⚡ Puma Street - *S/ 189.90*

📦 Envíos gratis por compras mayores a S/150  
💬 Escribe *comprar zapatillas* para ordenar.
    `,
    footer: '🖤 Estilo y comodidad con Kaneki',
  }

  await sock.sendMessage(m.key.remoteJid, mensaje)
}