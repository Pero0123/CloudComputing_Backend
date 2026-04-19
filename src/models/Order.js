const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String, 
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    pricePerUnit: {
      type: Number,
      required: true,
    },
    lineTotal: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const deliveryTrackingSchema = new mongoose.Schema(
  {
    provider: String,
    trackingId: String,
    carrier: String,
    trackingUrl: String,
    estimatedDelivery: Date,
    events: [
      {
        timestamp: Date,
        status: String,
        location: String,
        description: String,
      },
    ],
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        'awaiting_photo', 
        'photo_review',   
        'approved',       
        'denied',         
        'confirmed',      
        'shipped',
        'delivered',
        'cancelled',
      ],
      default: 'awaiting_photo',
    },
    skipApproval: {
      type: Boolean,
      default: false, // if true order will jumps straight to confirmed on creation
    },
    adminPhoto: {
      type: String, // base 64 encoded image
      default: null,
    },
    deliveryAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      postcode: { type: String, required: true },
      country: { type: String, default: 'Ireland' },
    },
    notes: {
      type: String,
      trim: true,
    },
    delivery: {
      type: deliveryTrackingSchema,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
