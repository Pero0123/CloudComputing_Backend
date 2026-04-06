const mongoose = require('mongoose');

const basketItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
  },
  { _id: false }
);

const basketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one basket per user
      index: true,
    },
    items: {
      type: [basketItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Basket', basketSchema);
