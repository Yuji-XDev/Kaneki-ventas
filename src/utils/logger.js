// Logger simple para registrar eventos
const fs = require('fs');
const path = require('path');

function log(message) {
  const logPath = path.join(__dirname, '../../logs/bot.log');
  fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`);
}

module.exports = log;