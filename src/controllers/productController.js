const { validationResult } = require('express-validator');
const Product = require('../models/Product');
const { generateSpecials } = require('./specialsController');

const regenSpecials = () => generateSpecials().catch(err => console.error('specials regen failed:', err.message));

//Get /backend/products
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

//Get /backend/products/:id
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

//Post /backend/products. admin
const createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  

  try {
    const { name, description, category, unit, price, image, stock } = req.body;
    const product = await Product.create({ name, description, category, unit, price, image, stock });
    regenSpecials();
    return res.status(201).json(product);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

//Put /backend/products/:id. admin route
const updateProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, category, unit, price, image, stock, isActive } = req.body;
    const updates = { name, description, category, unit, price, image, stock, isActive };
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    regenSpecials();
    return res.json(product);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

//Delete /backend/products/:id admin. remove but not delete.
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });
    regenSpecials();
    return res.json({ message: 'Product removed' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct };
