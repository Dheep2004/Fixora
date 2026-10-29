const db = require('../../db');

function getStaff() {
  return db.prepare('SELECT name, trade, phone, key FROM staff').all();
}

module.exports = { getStaff };
