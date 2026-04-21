const express = require('express');
const { getMessages, sendMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

// Mounted at /backend/orders/:orderId/messages
const router = express.Router({ mergeParams: true });

router.use(protect);

router.get('/', getMessages);
router.post('/', sendMessage);

module.exports = router;
