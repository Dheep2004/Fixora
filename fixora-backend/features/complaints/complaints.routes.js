const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const { verifyJwt, requireRole } = require('../../middleware/auth');
const { asyncHandler } = require('../../middleware/errorHandler');
const svc = require('./complaints.service');

const router = Router();

// ── File upload setup ─────────────────────────────────────────────────────────

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 3 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) return cb(null, true);
    cb(Object.assign(new Error('Invalid file type'), { status: 400 }));
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const validateBody = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: errors.array()[0].msg });
    return false;
  }
  return true;
};

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/complaints  (admin)
router.get(
  '/',
  verifyJwt, requireRole('admin'),
  asyncHandler(async (req, res) => {
    const result = svc.listComplaints(req.query);
    res.json(result);
  })
);

// GET /api/complaints/mine  (student)
router.get(
  '/mine',
  verifyJwt, requireRole('student'),
  asyncHandler(async (req, res) => {
    const result = svc.listComplaints(req.query, false, req.user.id);
    res.json(result);
  })
);

// POST /api/complaints/check-duplicate  (student)
router.post(
  '/check-duplicate',
  verifyJwt,
  body('location').notEmpty().withMessage('location is required'),
  asyncHandler(async (req, res) => {
    if (!validateBody(req, res)) return;
    const match = svc.checkDuplicate(req.body.location);
    res.json(match);
  })
);

// POST /api/complaints  (student)
router.post(
  '/',
  verifyJwt, requireRole('student'),
  upload.array('photos', 3),
  body('title').notEmpty().withMessage('title is required'),
  body('description').notEmpty().withMessage('description is required'),
  body('category').notEmpty().withMessage('category is required'),
  body('location').notEmpty().withMessage('location is required'),
  asyncHandler(async (req, res) => {
    if (!validateBody(req, res)) return;
    const photos = (req.files || []).map(f => ({ filename: f.filename, mimetype: f.mimetype }));
    const complaint = svc.createComplaint(req.body, req.user.id, photos);
    res.status(201).json(complaint);
  })
);

// GET /api/complaints/:id  (any auth)
router.get(
  '/:id',
  verifyJwt,
  asyncHandler(async (req, res) => {
    const complaint = svc.getComplaintByCode(req.params.id, req.user);
    res.json(complaint);
  })
);

// PATCH /api/complaints/:id/assign  (admin)
router.patch(
  '/:id/assign',
  verifyJwt, requireRole('admin'),
  body('staff').notEmpty().withMessage('staff key is required'),
  asyncHandler(async (req, res) => {
    if (!validateBody(req, res)) return;
    const complaint = svc.assignStaff(req.params.id, req.body.staff);
    res.json(complaint);
  })
);

// PATCH /api/complaints/:id/status  (admin)
router.patch(
  '/:id/status',
  verifyJwt, requireRole('admin'),
  body('status').notEmpty().withMessage('status is required'),
  asyncHandler(async (req, res) => {
    if (!validateBody(req, res)) return;
    const complaint = svc.updateStatus(req.params.id, req.body.status);
    res.json(complaint);
  })
);

// POST /api/complaints/:id/escalate  (admin)
router.post(
  '/:id/escalate',
  verifyJwt, requireRole('admin'),
  asyncHandler(async (req, res) => {
    const complaint = svc.escalate(req.params.id);
    res.json(complaint);
  })
);

module.exports = router;
