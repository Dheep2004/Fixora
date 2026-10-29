const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../db');

const ROLE_LABELS = { student: 'Student', admin: 'Admin' };

function loginUser(email, password) {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }
  const payload = { id: user.id, name: user.name, role: user.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET);
  return {
    token,
    user: { id: user.id, name: user.name, role: user.role, roleLabel: ROLE_LABELS[user.role] },
  };
}

function getProfile(userId) {
  const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return { id: user.id, name: user.name, email: user.email, role: user.role, roleLabel: ROLE_LABELS[user.role] };
}

module.exports = { loginUser, getProfile };
