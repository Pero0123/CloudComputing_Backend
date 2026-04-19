const Message = require('../models/Message');
const Order = require('../models/Order');

// check if the loggedi n user has acces to this order. user/admin
const canAccessOrder = async (orderId, user) => {
  const order = await Order.findById(orderId).select('user');
  if (!order) return null;
  if (user.role === 'admin') return order;
  if (order.user.toString() === user._id.toString()) return order;
  return null;
};

//Get /api/orders/:orderId/messages
const getMessages = async (req, res) => {
  try {
    const order = await canAccessOrder(req.params.orderId, req.user);
    if (!order) return res.status(404).json({ message: 'Order not found or access denied' });

    const messages = await Message.find({ order: req.params.orderId })
      .populate('sender', 'name role')
      .sort({ createdAt: 1 });

    return res.json(messages);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

//Post /api/orders/:orderId/messages
const sendMessage = async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ message: 'Message text is required' });
  }

  try {
    const order = await canAccessOrder(req.params.orderId, req.user);
    if (!order) return res.status(404).json({ message: 'Order not found or access denied' });

    const message = await Message.create({
      order: req.params.orderId,
      sender: req.user._id,
      senderRole: req.user.role,
      text: text.trim(),
    });

    await message.populate('sender', 'name role');
    return res.status(201).json(message);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getMessages, sendMessage };
