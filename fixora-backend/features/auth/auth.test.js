const request = require('supertest');
const app = require('../../app');
const db = require('../../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Ensure a clean test user exists before tests run
beforeAll(() => {
  db.prepare('DELETE FROM users WHERE email IN (?, ?)').run(
    'teststu@test.com', 'testadm@test.com'
  );
  const hash = bcrypt.hashSync('pass1234', 10);
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
    'Test Student', 'teststu@test.com', hash, 'student'
  );
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
    'Test Admin', 'testadm@test.com', hash, 'admin'
  );
});

afterAll(() => {
  db.prepare('DELETE FROM users WHERE email IN (?, ?)').run(
    'teststu@test.com', 'testadm@test.com'
  );
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('returns 200 + token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teststu@test.com', password: 'pass1234' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('student');
    expect(res.body.user.roleLabel).toBe('Student');
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teststu@test.com', password: 'wrongpass' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  it('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@nowhere.com', password: 'pass1234' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'pass1234' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teststu@test.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  let studentToken, adminToken;

  beforeAll(() => {
    const res1 = db.prepare('SELECT * FROM users WHERE email = ?').get('teststu@test.com');
    studentToken = jwt.sign({ id: res1.id, name: res1.name, role: res1.role }, process.env.JWT_SECRET);
    const res2 = db.prepare('SELECT * FROM users WHERE email = ?').get('testadm@test.com');
    adminToken = jwt.sign({ id: res2.id, name: res2.name, role: res2.role }, process.env.JWT_SECRET);
  });

  it('returns 200 + profile with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('teststu@test.com');
    expect(res.body.role).toBe('student');
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer notavalidtoken');

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });
});
