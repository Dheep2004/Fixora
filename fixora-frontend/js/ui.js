// ===== Shared UI helpers: session, sidebar, header, tables =====

// ---- Session (replace localStorage with real auth/token handling later) ----
function saveSession(user) { localStorage.setItem('fixoraUser', JSON.stringify(user)); }
function getSession() { return JSON.parse(localStorage.getItem('fixoraUser')); }
function logout() { localStorage.removeItem('fixoraUser'); location.href = 'index.html'; }

// Redirects to login if nobody is signed in, or to the right dashboard if the role is wrong
function requireLogin(requiredRole) {
  const user = getSession();
  if (!user) { location.href = 'index.html'; return null; }
  if (requiredRole && user.role !== requiredRole) {
    location.href = user.role === 'admin' ? 'admin-dashboard.html' : 'student-dashboard.html';
    return null;
  }
  return user;
}

// ---- Small utilities ----
function esc(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}
function badge(text) {
  return `<span class="badge ${text.toLowerCase().replace(' ', '-')}">${esc(text)}</span>`;
}
function countBy(list, field, value) {
  return list.filter(item => item[field] === value).length;
}

// ---- Sidebar ----
const NAV = {
  student: [
    { label: 'Dashboard',       href: 'student-dashboard.html' },
    { label: 'New Complaint',   href: 'new-complaint.html' },
    { label: 'Track Complaint', href: 'track-complaint.html' },
  ],
  admin: [
    { label: 'Dashboard',           href: 'admin-dashboard.html' },
    { label: 'Complaint Details',   href: 'track-complaint.html' },
    { label: 'Maintenance Staff',   href: 'admin-staff.html' },
    { label: 'Reports & Analytics', href: 'admin-reports.html' },
  ],
};

function renderSidebar(activePage) {
  const user = getSession();
  const links = NAV[user.role].map(item => {
    const cls = item.disabled ? 'disabled' : item.href === activePage ? 'active' : '';
    return `<a href="${item.href}" class="${cls}">${esc(item.label)}</a>`;
  }).join('');

  document.getElementById('sidebar').innerHTML = `
    <div class="brand">
      <div class="logo"><img src="assets/fixora-logo.jpg" alt="Fixora logo"></div>
      <div>Fixora<small>Complaint &amp; Maintenance</small></div>
    </div>
    <nav class="nav">${links}</nav>
    <div class="user">
      Signed in as
      <b>${esc(user.name)}</b>
      <span>${esc(user.roleLabel)}</span>
      <button class="btn" id="logout-btn">Log out</button>
    </div>`;
  document.getElementById('logout-btn').addEventListener('click', logout);
}

// ---- Page header (title + avatar) ----
function renderHeader(title, subtitle) {
  const user = getSession();
  document.getElementById('page-header').innerHTML = `
    <div><h1>${esc(title)}</h1><div class="muted">${esc(subtitle)}</div></div>
    <div class="spacer"></div>
    <div class="avatar" title="${esc(user.name)}">${esc(user.name[0])}</div>`;
}

// ---- Stat cards: items = [{ label, value, color }] ----
function renderStats(container, items) {
  container.innerHTML = items.map(s => `
    <div class="card stat"><div class="muted">${esc(s.label)}</div>
    <div class="value" style="color:${s.color || 'inherit'}">${esc(String(s.value))}</div></div>`).join('');
}

// ---- Complaints table (used on both dashboards) ----
function renderComplaintsTable(table, list) {
  const rows = list.map(c => `
    <tr>
      <td><a href="track-complaint.html?id=${encodeURIComponent(c.id)}">${esc(c.id)}</a></td>
      <td>${esc(c.title)}</td>
      <td>${esc(c.location)}</td>
      <td>${badge(c.priority)}</td>
      <td>${badge(c.status)}</td>
      <td>${esc(c.assignedTo || 'Unassigned')}</td>
    </tr>`).join('');
  table.innerHTML = `
    <thead><tr><th>ID</th><th>ISSUE</th><th>LOCATION</th><th>PRIORITY</th><th>STATUS</th><th>ASSIGNED TO</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="6" class="muted">No complaints yet.</td></tr>'}</tbody>`;
}

// ---- Horizontal bars: rows = [{ label, value }] ----
function renderBars(container, rows) {
  const biggest = Math.max(1, ...rows.map(r => r.value));
  container.innerHTML = rows.map(r => `
    <div class="bar-row"><span>${esc(r.label)}</span>
    <div class="bar"><div style="width:${(r.value / biggest) * 100}%"></div></div>
    <b>${r.value}</b></div>`).join('');
}
