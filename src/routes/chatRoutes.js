const express = require('express');
const { chat } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

//post /api/chat
router.post('/', chat);

module.exports = router;
