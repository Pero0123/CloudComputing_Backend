const mongoose = require('mongoose');

const specialSchema = new mongoose.Schema({
  popular: [{ type: mongoose.Schema.Types.ObjectId }],
  overstocked: [{ type: mongoose.Schema.Types.ObjectId }],
  random: { type: mongoose.Schema.Types.ObjectId, required: true },
  generatedAt: { type: Date, required: true },
});

module.exports = mongoose.model('Special', specialSchema);
