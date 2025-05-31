const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const axios = require("axios");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;

// Meter Verification
router.post("/verify", auth, async (req, res) => {
  const { meter, disco } = req.body;
  if (!meter || !disco) return res.status(400).json({ message: "Missing meter or disco" });

  try {
    const flwRes = await axios.post(
      "https://api.flutterwave.com/v3/bill-items/validate",
      { item_code: disco, code: meter },
      { headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` } }
    );

    const data = flwRes.data.data;
    res.json({
      customer_name: data.customer_name,
      meter_type: data.type,
      debt: data.debt || 0
    });
  } catch (err) {
    console.error("Verification error:", err.response?.data || err.message);
    res.status(500).json({ message: "Verification failed" });
  }
});

// Pay Bill
router.post("/", auth, async (req, res) => {
  const { meter, amount, disco } = req.body;
  if (!meter || !amount || !disco) return res.status(400).json({ message: "Missing fields" });

  try {
    const user = await User.findById(req.user.id);
    if (!user || user.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    user.balance -= amount;
    await user.save();

    const reference = `epay_${Date.now()}`;

    const flwRes = await axios.post(
      "https://api.flutterwave.com/v3/bills",
      {
        country: "NG",
        customer: meter,
        amount,
        recurrence: "ONCE",
        type: "PREPAID",
        reference,
        bill_item_code: disco
      },
      { headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` } }
    );

    await Transaction.create({
      userId: user._id,
      meter,
      amount,
      type: "payment",
      reference
    });

    res.json({ message: "Payment successful", data: flwRes.data });
  } catch (err) {
    console.error("Payment error:", err.response?.data || err.message);
    res.status(500).json({ message: "Payment failed" });
  }
});

// Payment History
router.get("/history", auth, async (req, res) => {
  try {
    const history = await Transaction.find({ userId: req.user.id }).sort({ timestamp: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch history" });
  }
});

module.exports = router;
