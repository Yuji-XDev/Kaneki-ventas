const whatsappService = require('../services/whatsappService');

exports.handleMessage = async (msg, client) => {
    const { body, from } = msg;
    const lowerBody = body.toLowerCase();

    if (lowerBody.includes('hola') || lowerBody.includes('buenas')) {
        await whatsappService.sendWelcomeMessage(from, client);
    } else if (lowerBody.includes('producto') || lowerBody.includes('catalogo')) {
        await whatsappService.sendCatalog(from, client);
    } else if (lowerBody.includes('comprar')) {
        await whatsappService.sendPurchaseInstructions(from, client);
    } else {
        await whatsappService.sendDefaultReply(from, client);
    }
};