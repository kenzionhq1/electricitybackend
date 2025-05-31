const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const router = express.Router();
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET;
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// SIGN UP
router.post("/signup", async (req, res) => {
  const { username, email, phone, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Create Paystack customer
    const paystackCustomer = await axios.post(
      "https://api.paystack.co/customer",
      { email, phone, first_name: username },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );

    const customerCode = paystackCustomer.data.data.customer_code;

    // 2. Create Dedicated Account
    const acctRes = await axios.post(
      "https://api.paystack.co/dedicated_account",
      {
        customer: customerCode,
        preferred_bank: "wema-bank"
      },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );

    const acct = acctRes.data.data;

    // 3. Save new user with virtual account
    const user = new User({
      username,
      email,
      phone,
      password: hashedPassword,
      paystackCustomerCode: customerCode,
      virtualAccount: {
        bankName: acct.bank.name,
        accountNumber: acct.account_number,
        accountName: acct.account_name
      }
    });

    await user.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error("Signup error:", err.response?.data || err.message);
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
});

module.exports = router;
