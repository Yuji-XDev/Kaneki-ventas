// Controlador de mensajes: responde según la lógica de ventas
const products = require('../models/products');

module.exports = async function handleMessage(sock, msg) {
  const text = msg.message.conversation.toLowerCase();

  let reply = "¡Hola! 👋 ¿En qué producto estás interesado?";
  if (text.includes("precio")) {
    reply = "Estos son nuestros productos:\n" + products.list.map(p => `- ${p.name}: $${p.price}`).join('\n');
  } else if (text.includes("catalogo") || text.includes("catálogo")) {
    reply = "Aquí tienes nuestro catálogo:\n" + products.list.map(p => `- ${p.name}`).join('\n');
  }

  await sock.sendMessage(msg.key.remoteJid, { text: reply });
}