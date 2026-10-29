require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

const USERS = [
  { name: 'Dheeptha Kansal', email: 'student@college.edu', password: 'student123', role: 'student' },
  { name: 'Admin User',      email: 'admin@college.edu',   password: 'admin123',   role: 'admin'   },
];

const STAFF = [
  { name: 'R. Kumar',          trade: 'Plumber',                  phone: '9800000001', key: 'R. Kumar (Plumber)'       },
  { name: 'S. Verma',          trade: 'AV technician',            phone: '9800000002', key: 'S. Verma (AV)'            },
  { name: 'M. Singh',          trade: 'Electrician',              phone: '9800000003', key: 'M. Singh (Electrician)'   },
  { name: 'Housekeeping team', trade: 'Cleaning and sanitation',  phone: '9800000004', key: 'Housekeeping'             },
];

function seed() {
  const insertUser = db.prepare(
    'INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
  );
  const insertStaff = db.prepare(
    'INSERT OR IGNORE INTO staff (name, trade, phone, key) VALUES (?, ?, ?, ?)'
  );

  const seedAll = db.transaction(() => {
    for (const u of USERS) {
      const hash = bcrypt.hashSync(u.password, 10);
      const result = insertUser.run(u.name, u.email, hash, u.role);
      if (result.changes > 0) {
        console.log(`Created user: ${u.email} (${u.role})`);
      } else {
        console.log(`Skipped existing user: ${u.email}`);
      }
    }

    for (const s of STAFF) {
      const result = insertStaff.run(s.name, s.trade, s.phone, s.key);
      if (result.changes > 0) {
        console.log(`Created staff: ${s.key}`);
      } else {
        console.log(`Skipped existing staff: ${s.key}`);
      }
    }
  });

  seedAll();
  console.log('Seed complete.');
}

seed();
