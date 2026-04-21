const express = require('express');
const { getSpecials, regenerateSpecials } = require('../controllers/specialsController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// GET /backend/specials
router.get('/', getSpecials);

// POST /backend/specials/regenerate
router.post('/regenerate', adminOnly, regenerateSpecials);

module.exports = router;
