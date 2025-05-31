const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 },

  // New fields for Paystack virtual account
  paystack_customer_code: { type: String },
  virtual_account_number: { type: String },
  virtual_account_bank: { type: String },
  virtual_account_name: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
