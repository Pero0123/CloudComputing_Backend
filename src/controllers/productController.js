const { validationResult } = require('express-validator');
const Product = require('../models/Product');

// GET /api/products
const getProducts = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.category) filter.category = req.query.category;

    const products = await Product.find(filter).sort({ name: 1 });
    return res.json(products);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/products/:id
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json(product);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/products  (admin)
const createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const product = await Product.create(req.body);
    return res.status(201).json(product);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/products/:id  (admin)
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    return res.json(product);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/products/:id  (admin) — soft delete
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });
    return res.json({ message: 'Product removed' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct };
