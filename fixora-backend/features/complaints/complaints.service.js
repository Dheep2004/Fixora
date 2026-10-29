const db = require('../../db');
const { computePriority } = require('./priority');

const VALID_CATEGORIES = ['Electrical', 'Plumbing', 'Sanitation', 'Classroom', 'Lab equipment', 'Hostel', 'Other'];

const ALLOWED_TRANSITIONS = {
  'Pending':     ['In progress'],
  'In progress': ['Resolved'],
  'Resolved':    [],
};

function nextCode() {
  const row = db.prepare('SELECT MAX(CAST(SUBSTR(code, 3) AS INTEGER)) AS n FROM complaints').get();
  const n = (row.n ?? 1000) + 1;
  return 'C-' + n;
}

function assertTransition(current, next) {
  if (!ALLOWED_TRANSITIONS[current]?.includes(next)) {
    const err = new Error(`Cannot transition from ${current} to ${next}`);
    err.status = 422;
    throw err;
  }
}

function formatComplaint(row) {
  if (!row) return null;
  return {
    id:          row.code,
    title:       row.title,
    description: row.description,
    category:    row.category,
    location:    row.location,
    priority:    row.priority,
    status:      row.status,
    assignedTo:  row.assigned_to ?? null,
    reportedBy:  row.reporter_name ?? null,
    createdAt:   row.created_at,
    comments:    [],
  };
}

function createComplaint({ title, description, category, location }, userId, photoFilenames = []) {
  if (!VALID_CATEGORIES.includes(category)) {
    const err = new Error(`Invalid category: ${category}`);
    err.status = 400;
    throw err;
  }

  const priority = computePriority(title, description);
  const code = nextCode();

  const insert = db.transaction(() => {
    const info = db.prepare(
      'INSERT INTO complaints (code, title, description, category, location, priority, reported_by) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(code, title, description, category, location, priority, userId);

    const complaintId = info.lastInsertRowid;

    for (const { filename, mimetype } of photoFilenames) {
      db.prepare(
        'INSERT INTO attachments (complaint_id, filename, mime_type) VALUES (?, ?, ?)'
      ).run(complaintId, filename, mimetype);
    }

    return db.prepare(
      `SELECT c.*, u.name AS reporter_name
       FROM complaints c JOIN users u ON u.id = c.reported_by
       WHERE c.id = ?`
    ).get(complaintId);
  });

  return formatComplaint(insert());
}

function getComplaintByCode(code, requestingUser) {
  const row = db.prepare(
    `SELECT c.*, u.name AS reporter_name
     FROM complaints c JOIN users u ON u.id = c.reported_by
     WHERE c.code = ?`
  ).get(code);

  if (!row) {
    const err = new Error('Complaint not found');
    err.status = 404;
    throw err;
  }

  if (requestingUser.role === 'student' && row.reported_by !== requestingUser.id) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }

  return formatComplaint(row);
}

function listComplaints({ status, category, priority, page = 1, limit = 20 }, adminOnly = true, userId = null) {
  const conditions = [];
  const params = [];

  if (userId) {
    conditions.push('c.reported_by = ?');
    params.push(userId);
  }
  if (status)   { conditions.push('c.status = ?');   params.push(status); }
  if (category) { conditions.push('c.category = ?'); params.push(category); }
  if (priority) { conditions.push('c.priority = ?'); params.push(priority); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const base = `FROM complaints c JOIN users u ON u.id = c.reported_by ${where}`;

  const total = db.prepare(`SELECT COUNT(*) AS n ${base}`).get(...params).n;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.max(1, parseInt(limit) || 20);
  const offset = (pageNum - 1) * limitNum;

  const rows = db.prepare(
    `SELECT c.*, u.name AS reporter_name ${base} ORDER BY c.created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limitNum, offset);

  return {
    data:       rows.map(formatComplaint),
    total,
    page:       pageNum,
    totalPages: Math.ceil(total / limitNum),
  };
}

function assignStaff(code, staffKey) {
  const staff = db.prepare('SELECT * FROM staff WHERE key = ?').get(staffKey);
  if (!staff) {
    const err = new Error('Staff not found');
    err.status = 400;
    throw err;
  }

  const complaint = db.prepare('SELECT * FROM complaints WHERE code = ?').get(code);
  if (!complaint) {
    const err = new Error('Complaint not found');
    err.status = 404;
    throw err;
  }

  const newStatus = complaint.status === 'Pending' ? 'In progress' : complaint.status;
  db.prepare('UPDATE complaints SET assigned_to = ?, status = ? WHERE code = ?').run(staffKey, newStatus, code);

  return getComplaintByCode(code, { role: 'admin' });
}

function updateStatus(code, newStatus) {
  const complaint = db.prepare('SELECT * FROM complaints WHERE code = ?').get(code);
  if (!complaint) {
    const err = new Error('Complaint not found');
    err.status = 404;
    throw err;
  }
  assertTransition(complaint.status, newStatus);
  db.prepare('UPDATE complaints SET status = ? WHERE code = ?').run(newStatus, code);
  return getComplaintByCode(code, { role: 'admin' });
}

function escalate(code) {
  const complaint = db.prepare('SELECT * FROM complaints WHERE code = ?').get(code);
  if (!complaint) {
    const err = new Error('Complaint not found');
    err.status = 404;
    throw err;
  }
  db.prepare("UPDATE complaints SET priority = 'High' WHERE code = ?").run(code);
  return getComplaintByCode(code, { role: 'admin' });
}

function checkDuplicate(location) {
  const row = db.prepare(
    `SELECT c.*, u.name AS reporter_name
     FROM complaints c JOIN users u ON u.id = c.reported_by
     WHERE LOWER(c.location) = LOWER(?) AND c.status != 'Resolved'
     LIMIT 1`
  ).get(location);
  return row ? formatComplaint(row) : null;
}

module.exports = {
  createComplaint,
  getComplaintByCode,
  listComplaints,
  assignStaff,
  updateStatus,
  escalate,
  checkDuplicate,
  assertTransition,
  nextCode,
  VALID_CATEGORIES,
};
