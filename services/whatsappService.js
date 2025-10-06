const templates = require('../utils/messageTemplates');

exports.sendWelcomeMessage = async (to, client) => {
    await client.sendMessage(to, templates.welcome);
};

exports.sendCatalog = async (to, client) => {
    await client.sendMessage(to, templates.catalog);
};

exports.sendPurchaseInstructions = async (to, client) => {
    await client.sendMessage(to, templates.purchaseInstructions);
};

exports.sendDefaultReply = async (to, client) => {
    await client.sendMessage(to, templates.defaultReply);
};