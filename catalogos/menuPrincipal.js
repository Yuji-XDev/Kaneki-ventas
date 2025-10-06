export default function menuPrincipal() {
  return {
    image: {
      url: 'https://i.pinimg.com/originals/e0/98/ba/e098bac73c8ae72243f66c7bf712045a.jpg' // imagen decorativa del catálogo
    },
    caption: `
🌸 *Catálogo Kaneki Ventas* 🌸

👋 ¡Bienvenido! Selecciona una categoría para ver nuestros productos:

1️⃣ Ropa 👕  
2️⃣ Zapatillas 👟  
3️⃣ Accesorios 💍

Toca un botón para explorar.
    `,
    footer: '🛍️ Kaneki Ventas | Calidad y estilo asegurado ✨',
    buttons: [
      { buttonId: 'ropa', buttonText: { displayText: '👕 Ropa' }, type: 1 },
      { buttonId: 'zapatillas', buttonText: { displayText: '👟 Zapatillas' }, type: 1 },
      { buttonId: 'accesorios', buttonText: { displayText: '💍 Accesorios' }, type: 1 }
    ],
    headerType: 4
  }
}