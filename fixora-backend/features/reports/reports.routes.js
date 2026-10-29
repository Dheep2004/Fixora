const { Router } = require('express');
const { verifyJwt, requireRole } = require('../../middleware/auth');
const { asyncHandler } = require('../../middleware/errorHandler');
const { getRecurring } = require('./reports.service');

const router = Router();

router.get(
  '/recurring',
  verifyJwt, requireRole('admin'),
  asyncHandler(async (req, res) => {
    res.json(getRecurring());
  })
);

module.exports = router;
