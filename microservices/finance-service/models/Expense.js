const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  truckId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['fuel', 'def', 'maintenance', 'other'],
    index: true
  },
  quantity: {
    type: Number,
    default: 0
  },
  pricePerUnit: {
    type: Number,
    default: 0
  },
  station: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Expense', expenseSchema);
