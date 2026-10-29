const request = require('supertest');
const app = require('../../app');
const db = require('../../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

let adminToken, studentToken, studentId;

beforeAll(() => {
  db.prepare('DELETE FROM users WHERE email IN (?, ?)').run('rpt-adm@fix.test', 'rpt-stu@fix.test');
  const hash = bcrypt.hashSync('pass1234', 10);
  const a = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Report Admin', 'rpt-adm@fix.test', hash, 'admin');
  const s = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Report Student', 'rpt-stu@fix.test', hash, 'student');
  studentId    = s.lastInsertRowid;
  adminToken   = jwt.sign({ id: a.lastInsertRowid, name: 'Report Admin',   role: 'admin'   }, process.env.JWT_SECRET);
  studentToken = jwt.sign({ id: studentId,         name: 'Report Student', role: 'student' }, process.env.JWT_SECRET);

  // Seed two open complaints at the same location so recurring fires
  const insert = db.prepare(
    `INSERT INTO complaints (code, title, description, category, location, priority, reported_by)
     VALUES (?, ?, ?, ?, ?, 'Low', ?)`
  );
  const loc = 'RPT-TestLoc';
  db.prepare('DELETE FROM complaints WHERE location = ?').run(loc);
  insert.run('C-RPT1', 'RPT open 1', 'desc', 'Other', loc, studentId);
  insert.run('C-RPT2', 'RPT open 2', 'desc', 'Other', loc, studentId);
});

afterAll(() => {
  db.prepare('DELETE FROM complaints WHERE code IN (?, ?)').run('C-RPT1', 'C-RPT2');
  db.prepare('DELETE FROM users WHERE email IN (?, ?)').run('rpt-adm@fix.test', 'rpt-stu@fix.test');
});

describe('GET /api/reports/recurring', () => {
  it('returns array of strings for admin', async () => {
    const res = await request(app)
      .get('/api/reports/recurring')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // Property 10: every location in result has >= 2 open complaints
  it('Property 10: every returned location has >= 2 open complaints', async () => {
    const res = await request(app)
      .get('/api/reports/recurring')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    for (const entry of res.body) {
      // format: "Some Location: N open complaints"
      const match = entry.match(/:\s*(\d+) open/);
      expect(match).not.toBeNull();
      expect(parseInt(match[1])).toBeGreaterThanOrEqual(2);
    }
  });

  it('includes the seeded recurring location', async () => {
    const res = await request(app)
      .get('/api/reports/recurring')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const found = res.body.some(s => s.includes('RPT-TestLoc'));
    expect(found).toBe(true);
  });

  it('returns 403 for student', async () => {
    const res = await request(app)
      .get('/api/reports/recurring')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/reports/recurring');
    expect(res.status).toBe(401);
  });
});
