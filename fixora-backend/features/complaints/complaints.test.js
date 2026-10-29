const request = require('supertest');
const fc = require('fast-check');
const app = require('../../app');
const db = require('../../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { computePriority, HIGH_KEYWORDS, MEDIUM_KEYWORDS } = require('./priority');
const { assertTransition, nextCode } = require('./complaints.service');

// ── Test fixtures ─────────────────────────────────────────────────────────────

let studentToken, adminToken, studentId, adminId, otherStudentToken, otherStudentId;

beforeAll(() => {
  db.prepare('DELETE FROM complaints WHERE title LIKE ?').run('TEST:%');
  db.prepare('DELETE FROM users WHERE email LIKE ?').run('test-%@fix.test');

  const hash = bcrypt.hashSync('pass1234', 10);

  const s1 = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Student One', 'test-s1@fix.test', hash, 'student');
  studentId = s1.lastInsertRowid;
  const s2 = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Student Two', 'test-s2@fix.test', hash, 'student');
  otherStudentId = s2.lastInsertRowid;
  const a1 = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Admin One', 'test-a1@fix.test', hash, 'admin');
  adminId = a1.lastInsertRowid;

  studentToken = jwt.sign({ id: studentId, name: 'Student One', role: 'student' }, process.env.JWT_SECRET);
  otherStudentToken = jwt.sign({ id: otherStudentId, name: 'Student Two', role: 'student' }, process.env.JWT_SECRET);
  adminToken = jwt.sign({ id: adminId, name: 'Admin One', role: 'admin' }, process.env.JWT_SECRET);
});

afterAll(() => {
  db.prepare('DELETE FROM complaints WHERE reported_by IN (SELECT id FROM users WHERE email LIKE ?)').run('test-%@fix.test');
  db.prepare('DELETE FROM users WHERE email LIKE ?').run('test-%@fix.test');
});

const validPayload = () => ({
  title: 'TEST: Sparking wire',
  description: 'Sparks near socket',
  category: 'Electrical',
  location: 'Lab 1',
});

// ── Property 1: Priority computation is keyword-deterministic ─────────────────

describe('Property 1: computePriority — keyword-deterministic', () => {
  it('returns High for any text containing a high keyword', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), fc.constantFrom(...HIGH_KEYWORDS), (pre, post, kw) => {
        expect(computePriority(pre + ' ' + kw + ' ' + post, '')).toBe('High');
      })
    );
  });

  it('returns Medium for medium keyword when no high keyword present', () => {
    fc.assert(
      fc.property(fc.string(), fc.constantFrom(...MEDIUM_KEYWORDS), (pre, kw) => {
        // ensure no high keyword bleeds in
        const safe = pre.replace(/spark|fire|leak|short circuit|shock|flood/gi, '');
        expect(computePriority(safe + ' ' + kw, '')).toBe('Medium');
      })
    );
  });

  it('returns Low when no priority keywords present', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (t, d) => {
        const noKw = (t + d).replace(/spark|fire|leak|short circuit|shock|flood|not working|broken|overflow/gi, '');
        expect(computePriority(noKw, '')).toBe('Low');
      })
    );
  });
});

// ── Property 3: Status transition guard ───────────────────────────────────────

describe('Property 3: assertTransition', () => {
  const valid = [
    ['Pending', 'In progress'],
    ['In progress', 'Resolved'],
  ];
  const allStatuses = ['Pending', 'In progress', 'Resolved'];

  it('allows only valid transitions', () => {
    for (const [from, to] of valid) {
      expect(() => assertTransition(from, to)).not.toThrow();
    }
  });

  it('throws 422 for every invalid (from, to) pair', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...allStatuses),
        fc.constantFrom(...allStatuses),
        (from, to) => {
          const isValid = valid.some(([f, t]) => f === from && t === to);
          if (!isValid) {
            let threw = false;
            try { assertTransition(from, to); } catch (e) {
              threw = true;
              expect(e.status).toBe(422);
            }
            expect(threw).toBe(true);
          }
        }
      )
    );
  });
});

// ── POST /api/complaints ──────────────────────────────────────────────────────

describe('POST /api/complaints', () => {
  it('creates complaint and returns 201 with correct shape', async () => {
    const res = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(validPayload());

    expect(res.status).toBe(201);
    expect(res.body.id).toMatch(/^C-\d+$/);
    expect(res.body.priority).toBe('High'); // 'spark' keyword
    expect(res.body.status).toBe('Pending');
    expect(res.body.assignedTo).toBeNull();
    expect(res.body.comments).toEqual([]);
  });

  it('returns 400 when title is missing', async () => {
    const { title, ...body } = validPayload();
    const res = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 for invalid category', async () => {
    const res = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ ...validPayload(), category: 'InvalidCat' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 403 when an admin tries to create a complaint', async () => {
    const res = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validPayload());
    expect(res.status).toBe(403);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/complaints').send(validPayload());
    expect(res.status).toBe(401);
  });
});

// ── Property 2: Complaint code format and uniqueness ─────────────────────────

describe('Property 2: complaint code format and uniqueness', () => {
  it('all codes match C-\\d+ and are unique across multiple inserts', async () => {
    const codes = [];
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ ...validPayload(), title: `TEST: code-check-${i}` });
      expect(res.status).toBe(201);
      expect(res.body.id).toMatch(/^C-\d+$/);
      codes.push(res.body.id);
    }
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
  });
});

// ── GET /api/complaints/:id ───────────────────────────────────────────────────

describe('GET /api/complaints/:id', () => {
  let complaintCode;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ ...validPayload(), title: 'TEST: detail test' });
    complaintCode = res.body.id;
  });

  it('owner student can fetch their complaint', async () => {
    const res = await request(app)
      .get(`/api/complaints/${complaintCode}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(complaintCode);
  });

  it('admin can fetch any complaint', async () => {
    const res = await request(app)
      .get(`/api/complaints/${complaintCode}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('returns 404 for unknown complaint code', async () => {
    const res = await request(app)
      .get('/api/complaints/C-9999')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  // Property 4: Student ownership isolation
  it('Property 4: student B cannot read student A complaint → 403', async () => {
    const res = await request(app)
      .get(`/api/complaints/${complaintCode}`)
      .set('Authorization', `Bearer ${otherStudentToken}`);
    expect(res.status).toBe(403);
  });
});

// ── GET /api/complaints and /mine ─────────────────────────────────────────────

describe('GET /api/complaints (admin) + /mine (student)', () => {
  beforeAll(async () => {
    // Create one complaint for each student for isolation tests
    await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ ...validPayload(), title: 'TEST: list-s1', location: 'ListLoc' });
    await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${otherStudentToken}`)
      .send({ ...validPayload(), title: 'TEST: list-s2', location: 'ListLoc' });
  });

  it('admin GET /complaints returns pagination envelope', async () => {
    const res = await request(app)
      .get('/api/complaints')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(typeof res.body.total).toBe('number');
    expect(typeof res.body.page).toBe('number');
    expect(typeof res.body.totalPages).toBe('number');
  });

  it('student cannot access GET /complaints', async () => {
    const res = await request(app)
      .get('/api/complaints')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  // Property 9: /mine isolation
  it('Property 9: /mine returns only the requesting student complaints', async () => {
    const res = await request(app)
      .get('/api/complaints/mine')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    const allMine = res.body.data.every(c => c.reportedBy === 'Student One');
    expect(allMine).toBe(true);
  });

  // Property 7: Pagination bounds and envelope
  it('Property 7: pagination bounds — data.length <= limit, totalPages correct', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }),
        fc.integer({ min: 1, max: 5 }),
        async (page, limit) => {
          const res = await request(app)
            .get(`/api/complaints?page=${page}&limit=${limit}`)
            .set('Authorization', `Bearer ${adminToken}`);
          expect(res.status).toBe(200);
          expect(res.body.data.length).toBeLessThanOrEqual(limit);
          expect(res.body.totalPages).toBe(Math.ceil(res.body.total / limit));
        }
      ),
      { numRuns: 10 }
    );
  });

  // Property 8: Filter correctness
  it('Property 8: status filter — every result matches the filter value', async () => {
    const res = await request(app)
      .get('/api/complaints?status=Pending')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const allMatch = res.body.data.every(c => c.status === 'Pending');
    expect(allMatch).toBe(true);
  });
});

// ── PATCH assign, status, escalate ───────────────────────────────────────────

describe('PATCH /api/complaints/:id/assign + /status, POST /escalate', () => {
  let code;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ ...validPayload(), title: 'TEST: assignment test', description: 'normal issue' });
    code = res.body.id;
  });

  it('assigns staff and transitions Pending → In progress', async () => {
    const res = await request(app)
      .patch(`/api/complaints/${code}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ staff: 'R. Kumar (Plumber)' });
    expect(res.status).toBe(200);
    expect(res.body.assignedTo).toBe('R. Kumar (Plumber)');
    expect(res.body.status).toBe('In progress');
  });

  it('returns 400 for non-existent staff key', async () => {
    const res = await request(app)
      .patch(`/api/complaints/${code}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ staff: 'Nobody (Unknown)' });
    expect(res.status).toBe(400);
  });

  it('non-admin assign → 403', async () => {
    const res = await request(app)
      .patch(`/api/complaints/${code}/assign`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ staff: 'R. Kumar (Plumber)' });
    expect(res.status).toBe(403);
  });

  it('transitions In progress → Resolved', async () => {
    const res = await request(app)
      .patch(`/api/complaints/${code}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Resolved' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Resolved');
  });

  it('returns 422 for invalid transition Resolved → Pending', async () => {
    const res = await request(app)
      .patch(`/api/complaints/${code}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Pending' });
    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/Cannot transition/);
  });

  // Property 5: Escalation idempotency
  it('Property 5: escalating N times always yields priority = High', async () => {
    const res1 = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ ...validPayload(), title: 'TEST: escalate idempotent', description: 'normal' });
    const ec = res1.body.id;

    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post(`/api/complaints/${ec}/escalate`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.priority).toBe('High');
    }
  });
});

// ── POST /check-duplicate ─────────────────────────────────────────────────────

describe('Property 6: check-duplicate correctness', () => {
  const loc = 'DupTestLoc-' + Date.now();

  beforeAll(async () => {
    await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ ...validPayload(), title: 'TEST: dup open', location: loc });
  });

  it('returns a complaint when open complaint exists at location', async () => {
    const res = await request(app)
      .post('/api/complaints/check-duplicate')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ location: loc });
    expect(res.status).toBe(200);
    expect(res.body).not.toBeNull();
    expect(res.body.id).toMatch(/^C-\d+$/);
  });

  it('is case-insensitive', async () => {
    const res = await request(app)
      .post('/api/complaints/check-duplicate')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ location: loc.toUpperCase() });
    expect(res.status).toBe(200);
    expect(res.body).not.toBeNull();
  });

  it('returns null when no open complaint at location', async () => {
    const res = await request(app)
      .post('/api/complaints/check-duplicate')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ location: 'NoSuchLocation-xyz-999' });
    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });
});

// ── Property 11: Error response shape ────────────────────────────────────────

describe('Property 11: all error responses have { error: string } shape', () => {
  const cases = [
    () => request(app).get('/api/complaints'),                                                      // 401
    () => request(app).get('/api/complaints').set('Authorization', `Bearer ${studentToken}`),       // 403
    () => request(app).get('/api/complaints/C-9999').set('Authorization', `Bearer ${adminToken}`),  // 404
    () => request(app).post('/api/complaints').set('Authorization', `Bearer ${studentToken}`).send({}), // 400
  ];

  it('every error response body has error key with string value and no stack key', async () => {
    for (const makeReq of cases) {
      const res = await makeReq();
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(typeof res.body.error).toBe('string');
      expect(res.body.error.length).toBeGreaterThan(0);
      expect(res.body.stack).toBeUndefined();
    }
  });
});
