const db = require('../../db');

function getRecurring() {
  const rows = db.prepare(`
    SELECT location, COUNT(*) AS n
    FROM complaints
    WHERE status != 'Resolved'
    GROUP BY LOWER(location)
    HAVING COUNT(*) > 1
    ORDER BY n DESC
  `).all();

  return rows.map(r => `${r.location}: ${r.n} open complaint${r.n !== 1 ? 's' : ''}`);
}

module.exports = { getRecurring };
