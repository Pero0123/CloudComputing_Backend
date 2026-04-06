const express = require('express');
const { body } = require('express-validator');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('unit').isIn(['kg', 'g', 'bunch', 'head', 'each']).withMessage('Invalid unit'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
];

// Public
router.get('/', getProducts);
router.get('/:id', getProduct);

// Admin only
router.post('/', protect, adminOnly, productValidation, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
