const express = require('express');
const { chat } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// POST /api/chat
router.post('/', chat);

module.exports = router;
