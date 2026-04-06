const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String, // snapshot so display stays correct even if product is renamed
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
    // Order lifecycle:
    //   Normal:  awaiting_photo → photo_review → approved → confirmed → shipped → delivered
    //   Denied:  photo_review → denied → awaiting_photo (admin re-picks) → ...
    //   Skipped: awaiting_photo → confirmed → shipped → delivered
    status: {
      type: String,
      enum: [
        'awaiting_photo', // customer submitted, admin needs to pick & photograph
        'photo_review',   // admin uploaded photo, customer reviewing
        'approved',       // customer approved the pick
        'denied',         // customer denied, admin must re-pick
        'confirmed',      // order confirmed — either approved or approval skipped
        'shipped',
        'delivered',
        'cancelled',
      ],
      default: 'awaiting_photo',
    },
    skipApproval: {
      type: Boolean,
      default: false, // if true, order jumps straight to confirmed on creation
    },
    adminPhoto: {
      type: String, // Base64 or URL — photo of the picked/packed order
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
