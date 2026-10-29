require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5500'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { errorHandler } = require('./middleware/errorHandler');

app.get('/api', (req, res) => {
  res.json({ message: 'Fixora backend is running' });
});

app.use('/api/auth', require('./features/auth/auth.routes'));
app.use('/api/complaints', require('./features/complaints/complaints.routes'));
app.use('/api/staff', require('./features/staff/staff.routes'));
app.use('/api/reports', require('./features/reports/reports.routes'));

app.use(errorHandler);

module.exports = app;
