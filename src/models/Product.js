const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      // e.g. 'root vegetables', 'leafy greens', 'fruit vegetables'
    },
    unit: {
      type: String,
      required: true,
      enum: ['kg', 'g', 'bunch', 'head', 'each'],
      default: 'kg',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    image: {
      type: String, // Base64 or URL
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
