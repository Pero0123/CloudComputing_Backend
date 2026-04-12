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

const productCreateValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('unit').isIn(['kg', 'g', 'bunch', 'head', 'each']).withMessage('Invalid unit'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').isFloat({ min: 0 }).withMessage('Stock must be a non-negative number'),
  body('image').optional().isString().withMessage('Image must be a string'),
];

const productUpdateValidation = [
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be blank'),
  body('unit').optional().isIn(['kg', 'g', 'bunch', 'head', 'each']).withMessage('Invalid unit'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').optional().isFloat({ min: 0 }).withMessage('Stock must be a non-negative number'),
  body('image').optional().isString().withMessage('Image must be a string'),
];

// Public
router.get('/', getProducts);
router.get('/:id', getProduct);

// Admin only
router.post('/', protect, adminOnly, productCreateValidation, createProduct);
router.put('/:id', protect, adminOnly, productUpdateValidation, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
