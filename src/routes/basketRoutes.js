const express = require('express');
const {
  getBasket,
  addItem,
  updateItem,
  removeItem,
  clearBasket,
} = require('../controllers/basketController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getBasket);
router.post('/items', addItem);
router.put('/items/:productId', updateItem);
router.delete('/items/:productId', removeItem);
router.delete('/', clearBasket);

module.exports = router;
