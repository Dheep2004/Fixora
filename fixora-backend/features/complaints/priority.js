const HIGH_KEYWORDS   = ['spark', 'fire', 'leak', 'short circuit', 'shock', 'flood'];
const MEDIUM_KEYWORDS = ['not working', 'broken', 'overflow'];

function computePriority(title, description) {
  const text = ((title || '') + ' ' + (description || '')).toLowerCase();
  if (HIGH_KEYWORDS.some(k => text.includes(k)))   return 'High';
  if (MEDIUM_KEYWORDS.some(k => text.includes(k))) return 'Medium';
  return 'Low';
}

module.exports = { computePriority, HIGH_KEYWORDS, MEDIUM_KEYWORDS };
