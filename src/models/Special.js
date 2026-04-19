const mongoose = require('mongoose');

const specialSchema = new mongoose.Schema({
  popular: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  overstocked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  random: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  generatedAt: { type: Date, required: true },
});

module.exports = mongoose.model('Special', specialSchema);
