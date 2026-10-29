const { Router } = require('express');
const { verifyJwt, requireRole } = require('../../middleware/auth');
const { asyncHandler } = require('../../middleware/errorHandler');
const { getStaff } = require('./staff.service');

const router = Router();

router.get(
  '/',
  verifyJwt, requireRole('admin'),
  asyncHandler(async (req, res) => {
    res.json(getStaff());
  })
);

module.exports = router;
