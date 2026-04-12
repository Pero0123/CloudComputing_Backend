const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const Basket = require('../models/Basket');
const Product = require('../models/Product');
const { fetchTracking, normalizeTracking } = require('../services/trackingService');

// GET /api/orders  — users see own orders, admins see all
const getOrders = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { user: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/orders/:id
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (req.user.role !== 'admin' && (!order.user || order.user._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorised to view this order' });
    }

    return res.json(order);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/orders
// Converts the user's current basket into an order.
// If skipApproval is true the order goes straight to 'confirmed'.
// Otherwise the order starts as 'awaiting_photo' — admin picks, photographs, customer approves.
const createOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { deliveryAddress, notes, skipApproval = false } = req.body;

  try {
    const basket = await Basket.findOne({ user: req.user._id }).populate(
      'items.product',
      'name price isActive stock'
    );

    if (!basket || basket.items.length === 0) {
      return res.status(400).json({ message: 'Your basket is empty' });
    }

    // Ensure all products are still active
    const inactiveItems = basket.items.filter(
      (item) => !item.product || !item.product.isActive
    );
    if (inactiveItems.length > 0) {
      return res.status(400).json({
        message: 'Some items in your basket are no longer available. Please review your basket.',
      });
    }

    // Pre-check stock (readable error for the common case)
    const insufficientStock = basket.items.filter(
      (item) => item.product.stock < item.quantity
    );
    if (insufficientStock.length > 0) {
      return res.status(400).json({
        message: 'Insufficient stock for some items',
        items: insufficientStock.map((i) => ({
          productId: i.product._id,
          productName: i.product.name,
          requested: i.quantity,
          available: i.product.stock,
        })),
      });
    }

    // Atomic stock deduction with rollback
    const deducted = [];
    try {
      for (const item of basket.items) {
        const updated = await Product.findOneAndUpdate(
          { _id: item.product._id, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true }
        );
        if (!updated) {
          await Promise.all(
            deducted.map(({ productId, qty }) =>
              Product.findByIdAndUpdate(productId, { $inc: { stock: qty } })
            )
          );
          return res.status(409).json({
            message: `"${item.product.name}" is out of stock or stock is insufficient. Please update your basket.`,
          });
        }
        deducted.push({ productId: item.product._id, qty: item.quantity });
      }
    } catch (err) {
      await Promise.all(
        deducted.map(({ productId, qty }) =>
          Product.findByIdAndUpdate(productId, { $inc: { stock: qty } })
        )
      ).catch(console.error);
      return res.status(500).json({ message: 'Server error', error: err.message });
    }

    // Build order items with price snapshots
    let totalPrice = 0;
    const orderItems = basket.items.map((item) => {
      const lineTotal = parseFloat((item.product.price * item.quantity).toFixed(2));
      totalPrice += lineTotal;
      return {
        product: item.product._id,
        productName: item.product.name,
        quantity: item.quantity,
        pricePerUnit: item.product.price,
        lineTotal,
      };
    });

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalPrice: parseFloat(totalPrice.toFixed(2)),
      deliveryAddress,
      notes,
      skipApproval,
      status: skipApproval ? 'confirmed' : 'awaiting_photo',
    });

    // Clear basket after successful order creation
    await Basket.findOneAndUpdate({ user: req.user._id }, { items: [] });

    return res.status(201).json(order);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/orders/:id/photo  (admin)
// Admin uploads a photo of the picked/packed order.
// Moves status from 'awaiting_photo' or 'denied' → 'photo_review'.
const uploadPhoto = async (req, res) => {
  const { photo } = req.body; // Base64 string or URL
  if (!photo) return res.status(400).json({ message: 'Photo is required' });

  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (!['awaiting_photo', 'denied'].includes(order.status)) {
      return res.status(400).json({
        message: `Cannot upload photo for an order with status '${order.status}'`,
      });
    }

    order.adminPhoto = photo;
    order.status = 'photo_review';
    await order.save();

    return res.json(order);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/orders/:id/approval  (customer — own order only)
// Customer approves or denies the admin's photo.
const reviewPhoto = async (req, res) => {
  const { approved } = req.body;
  if (typeof approved !== 'boolean') {
    return res.status(400).json({ message: "'approved' must be true or false" });
  }

  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorised' });
    }

    if (order.status !== 'photo_review') {
      return res.status(400).json({
        message: `Order is not awaiting approval (current status: '${order.status}')`,
      });
    }

    order.status = approved ? 'confirmed' : 'denied';
    await order.save();

    return res.json({
      message: approved ? 'Order approved' : 'Order denied — admin will re-pick',
      order,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/orders/:id/status  (admin)
// Advances order through confirmed → shipped → delivered, or cancels.
const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const adminStatuses = ['confirmed', 'shipped', 'delivered', 'cancelled'];

  if (!adminStatuses.includes(status)) {
    return res.status(400).json({
      message: `Admin can set status to one of: ${adminStatuses.join(', ')}`,
    });
  }

  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (status === 'cancelled' && order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }

    const previousStatus = order.status;
    order.status = status;
    await order.save();

    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      await Promise.all(
        order.items.map((item) =>
          Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } })
        )
      );
    }

    return res.json(order);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/orders/:id/tracking  (admin)
const updateTracking = async (req, res) => {
  const { trackingNumber } = req.body;

  if (!trackingNumber) {
    return res.status(400).json({ message: 'trackingNumber is required' });
  }

  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    let delivery;
    try {
      const apiData = await fetchTracking(trackingNumber);
      delivery = normalizeTracking(apiData, trackingNumber);
    } catch (apiErr) {
      return res.status(502).json({ message: `Tracking API error: ${apiErr.message}` });
    }

    order.delivery = delivery;

    if (order.status === 'confirmed') {
      order.status = 'shipped';
    }

    await order.save();
    return res.json(order);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/orders/:id/tracking
const getTracking = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).select('delivery status user');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorised' });
    }

    if (!order.delivery?.trackingId) {
      return res.json({ message: 'No tracking information available yet', status: order.status });
    }

    try {
      const apiData = await fetchTracking(order.delivery.trackingId);
      const delivery = normalizeTracking(apiData, order.delivery.trackingId);
      return res.json({ status: order.status, delivery });
    } catch (apiErr) {
      return res.json({ status: order.status, delivery: order.delivery, cached: true });
    }
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  getOrders,
  getOrder,
  createOrder,
  uploadPhoto,
  reviewPhoto,
  updateOrderStatus,
  updateTracking,
  getTracking,
};
