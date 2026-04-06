const mongoose = require('mongoose');

// Chat messages are scoped to an order.
// Both the customer and admin can send messages on any order.
const messageSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['user', 'admin'],
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
