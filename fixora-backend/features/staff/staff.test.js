const request = require('supertest');
const app = require('../../app');
const db = require('../../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

let adminToken, studentToken;

beforeAll(() => {
  db.prepare('DELETE FROM users WHERE email IN (?, ?)').run('stafftest-adm@fix.test', 'stafftest-stu@fix.test');
  const hash = bcrypt.hashSync('pass1234', 10);
  const a = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Staff Admin', 'stafftest-adm@fix.test', hash, 'admin');
  const s = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Staff Student', 'stafftest-stu@fix.test', hash, 'student');
  adminToken   = jwt.sign({ id: a.lastInsertRowid, name: 'Staff Admin',   role: 'admin'   }, process.env.JWT_SECRET);
  studentToken = jwt.sign({ id: s.lastInsertRowid, name: 'Staff Student', role: 'student' }, process.env.JWT_SECRET);
});

afterAll(() => {
  db.prepare('DELETE FROM users WHERE email IN (?, ?)').run('stafftest-adm@fix.test', 'stafftest-stu@fix.test');
});

describe('GET /api/staff', () => {
  it('returns all staff records for admin', async () => {
    const res = await request(app)
      .get('/api/staff')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const keys = Object.keys(res.body[0]);
    expect(keys).toEqual(expect.arrayContaining(['name', 'trade', 'phone', 'key']));
  });

  it('returns 403 for student', async () => {
    const res = await request(app)
      .get('/api/staff')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/staff');
    expect(res.status).toBe(401);
  });
});
