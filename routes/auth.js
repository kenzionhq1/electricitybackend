const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const User = require("../models/User");
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;

// Register Route
router.post("/signup", async (req, res) => {
  const { username, email, phone, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, email, phone, password: hashed });
    await user.save();

    // Step 1: Create customer on Paystack
    const customerRes = await axios.post(
      "https://api.paystack.co/customer",
      { email, first_name: username, phone },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
    );

    const customer_code = customerRes.data.data.customer_code;

    // Step 2: Create virtual account
    const acctRes = await axios.post(
      "https://api.paystack.co/dedicated_account",
      {
        customer: customer_code,
        preferred_bank: "wema-bank" // or "test-bank" for test mode
      },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
    );

    const acctData = acctRes.data.data;

    user.paystack_customer_code = customer_code;
    user.virtual_account_number = acctData.account_number;
    user.virtual_account_bank = acctData.bank.name;
    user.virtual_account_name = acctData.account_name;
    await user.save();

    res.status(201).json({ message: "User created", account: acctData });
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({ message: "Signup failed" });
  }
});

module.exports = router;
