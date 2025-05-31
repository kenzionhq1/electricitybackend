const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  meter: { type: String, default: null }, // null for topups
  amount: Number,
  type: { type: String, enum: ['payment', 'topup'], default: 'payment' },
  reference: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Transaction", transactionSchema);
