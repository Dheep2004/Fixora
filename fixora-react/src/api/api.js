import { COMPLAINTS, SAMPLE_USERS, STAFF_DETAILS, RECURRING_ISSUES, SAMPLE_COMMENTS } from '../data/mockData';

// ===== API layer =====
// Every page talks to the backend ONLY through the `api` object below.
// To connect the real backend:
//   1. Set USE_MOCK = false
//   2. Set VITE_API_BASE in .env (or edit API_BASE below)
//   3. Make sure each endpoint returns the same JSON shape as the mock data in data.js

export const USE_MOCK = true;
// Set VITE_API_BASE in a .env file to change this (see README)
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

// Adds the login token (JWT) to every real backend request
function authHeaders() {
  const user = JSON.parse(localStorage.getItem('fixoraUser'));
  const headers = { 'Content-Type': 'application/json' };
  if (user && user.token) headers.Authorization = 'Bearer ' + user.token;
  return headers;
}

// Generic fetch helper for real backend calls
async function http(method, path, body) {
  const res = await fetch(API_BASE + path, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error('Request failed: ' + res.status);
  return res.json();
}

// Mock helpers: complaints are kept in localStorage so new ones survive a page refresh
function loadMock() {
  return JSON.parse(localStorage.getItem('fixoraComplaints')) || COMPLAINTS.map(c => ({ ...c }));
}
function saveMock(list) {
  localStorage.setItem('fixoraComplaints', JSON.stringify(list));
}

export const api = {
  // POST /auth/login  -> { role, name, roleLabel, token }
  login(email, password, role) {
    return USE_MOCK ? Promise.resolve(SAMPLE_USERS[role]) : http('POST', '/auth/login', { email, password, role });
  },

  // GET /complaints  (admin: all complaints)
  getComplaints() {
    return USE_MOCK ? Promise.resolve(loadMock()) : http('GET', '/complaints');
  },

  // GET /complaints/mine  (student: complaints reported by the logged-in user)
  getMyComplaints(userName) {
    return USE_MOCK
      ? Promise.resolve(loadMock().filter(c => c.reportedBy === userName))
      : http('GET', '/complaints/mine');
  },

  // GET /complaints/:id  -> complaint object (add a `comments` array if you want)
  getComplaint(id) {
    if (!USE_MOCK) return http('GET', '/complaints/' + id);
    const found = loadMock().find(c => c.id === id);
    return Promise.resolve(found ? { ...found, comments: SAMPLE_COMMENTS[id] || [] } : null);
  },

  // POST /complaints  -> created complaint (send as FormData when uploading photos)
  createComplaint(data) {
    if (!USE_MOCK) return http('POST', '/complaints', data);
    const list = loadMock();
    const nextNumber = Math.max(...list.map(c => Number(c.id.slice(2)))) + 1;
    const complaint = { id: 'C-' + nextNumber, status: 'Pending', assignedTo: null, ...data };
    list.push(complaint);
    saveMock(list);
    return Promise.resolve(complaint);
  },

  // POST /complaints/check-duplicate  -> similar open complaint or null
  checkDuplicate(location) {
    if (!USE_MOCK) return http('POST', '/complaints/check-duplicate', { location });
    const match = loadMock().find(c => c.status !== 'Resolved' && c.location.toLowerCase() === location.toLowerCase());
    return Promise.resolve(match || null);
  },

  // PATCH /complaints/:id/assign  body: { staff }
  assignStaff(id, staff) {
    if (!USE_MOCK) return http('PATCH', '/complaints/' + id + '/assign', { staff });
    const list = loadMock();
    const c = list.find(item => item.id === id);
    if (c) { c.assignedTo = staff; if (c.status === 'Pending') c.status = 'In progress'; }
    saveMock(list);
    return Promise.resolve(c);
  },

  // POST /complaints/:id/escalate
  escalate(id) {
    if (!USE_MOCK) return http('POST', '/complaints/' + id + '/escalate');
    const list = loadMock();
    const c = list.find(item => item.id === id);
    if (c) c.priority = 'High';
    saveMock(list);
    return Promise.resolve(c);
  },

  // GET /staff  -> array of { name, trade, phone, key }
  getStaff() {
    return USE_MOCK ? Promise.resolve(STAFF_DETAILS) : http('GET', '/staff');
  },

  // GET /reports/recurring  -> array of strings
  getRecurringIssues() {
    return USE_MOCK ? Promise.resolve(RECURRING_ISSUES) : http('GET', '/reports/recurring');
  },
};
