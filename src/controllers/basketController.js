const Basket = require('../models/Basket');
const Product = require('../models/Product');

// GET /api/basket
const getBasket = async (req, res) => {
  try {
    const basket = await Basket.findOne({ user: req.user._id }).populate(
      'items.product',
      'name price unit image isActive stock'
    );

    if (!basket) return res.json({ user: req.user._id, items: [], total: 0 });

    // Filter out any items whose product has since been deactivated
    const activeItems = basket.items.filter(
      (item) => item.product && item.product.isActive
    );

    const total = parseFloat(
      activeItems
        .reduce((sum, item) => sum + item.product.price * item.quantity, 0)
        .toFixed(2)
    );

    return res.json({ user: req.user._id, items: activeItems, total });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/basket/items  — add or increment a product
const addItem = async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) return res.status(400).json({ message: 'productId is required' });
  if (quantity < 1) return res.status(400).json({ message: 'Quantity must be at least 1' });

  try {
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let basket = await Basket.findOne({ user: req.user._id });

    if (!basket) {
      basket = await Basket.create({
        user: req.user._id,
        items: [{ product: productId, quantity }],
      });
    } else {
      const existing = basket.items.find(
        (item) => item.product.toString() === productId
      );
      if (existing) {
        existing.quantity += quantity;
      } else {
        basket.items.push({ product: productId, quantity });
      }
      await basket.save();
    }

    await basket.populate('items.product', 'name price unit image stock');
    return res.json(basket);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/basket/items/:productId  — set exact quantity
const updateItem = async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) {
    return res.status(400).json({ message: 'Quantity must be at least 1' });
  }

  try {
    const basket = await Basket.findOne({ user: req.user._id });
    if (!basket) return res.status(404).json({ message: 'Basket not found' });

    const item = basket.items.find(
      (i) => i.product.toString() === req.params.productId
    );
    if (!item) return res.status(404).json({ message: 'Item not in basket' });

    item.quantity = quantity;
    await basket.save();
    await basket.populate('items.product', 'name price unit image stock');
    return res.json(basket);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/basket/items/:productId  — remove a single product
const removeItem = async (req, res) => {
  try {
    const basket = await Basket.findOne({ user: req.user._id });
    if (!basket) return res.status(404).json({ message: 'Basket not found' });

    basket.items = basket.items.filter(
      (item) => item.product.toString() !== req.params.productId
    );
    await basket.save();
    await basket.populate('items.product', 'name price unit image stock');
    return res.json(basket);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/basket  — clear the whole basket
const clearBasket = async (req, res) => {
  try {
    await Basket.findOneAndUpdate(
      { user: req.user._id },
      { items: [] }
    );
    return res.json({ message: 'Basket cleared' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getBasket, addItem, updateItem, removeItem, clearBasket };
