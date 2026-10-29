const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const { loginUser, getProfile } = require('./auth.service');
const { verifyJwt } = require('../../middleware/auth');
const { asyncHandler } = require('../../middleware/errorHandler');

const router = Router();

router.post(
  '/login',
  body('email').isEmail().withMessage('email is required'),
  body('password').notEmpty().withMessage('password is required'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    const { email, password } = req.body;
    const result = loginUser(email, password);
    res.json(result);
  })
);

router.get(
  '/me',
  verifyJwt,
  asyncHandler(async (req, res) => {
    const profile = getProfile(req.user.id);
    res.json(profile);
  })
);

module.exports = router;
