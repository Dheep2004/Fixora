// Small helper functions shared by many pages

export function countBy(list, field, value) {
  return list.filter((item) => item[field] === value).length;
}

// Where each role lands after login
export function homePath(role) {
  return role === 'admin' ? '/admin' : '/student';
}

// Simple keyword-based priority suggestion (the real backend should do this too)
export function suggestPriority(text) {
  const t = text.toLowerCase();
  if (/(spark|fire|leak|short circuit|shock|flood)/.test(t)) return 'High';
  if (/(not working|broken|overflow)/.test(t)) return 'Medium';
  return 'Low';
}
