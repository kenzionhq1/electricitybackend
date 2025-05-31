const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const axios = require("axios");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;

// 🔍 Meter verification
router.post("/verify", auth, async (req, res) => {
  const { meter, disco } = req.body;
  if (!meter || !disco) {
    return res.status(400).json({ message: "Meter and disco are required" });
  }

  if (!FLW_SECRET_KEY) {
    return res.status(500).json({ message: "Missing Flutterwave secret key" });
  }

  try {
    const response = await axios.post(
      "https://api.flutterwave.com/v3/bill-items/validate",
      {
        item_code: disco,
        code: meter
      },
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`
        }
      }
    );

    const data = response.data?.data;

    if (!data) {
      return res.status(502).json({ message: "Invalid response from Flutterwave" });
    }

    res.json({
      customer_name: data.customer_name || "N/A",
      meter_type: data.type || "UNKNOWN",
      debt: data.debt || 0
    });

  } catch (err) {
    console.error("❌ FLW VERIFY ERROR:", err.response?.data || err.message);
    res.status(500).json({ message: "Meter verification failed. Please try again." });
  }
});

// ✅ Pay Bill
router.post("/", auth, async (req, res) => {
  const { meter, amount, disco } = req.body;
  if (!meter || !amount || !disco) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Deduct
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
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`
        }
      }
    );

    // Log transaction
    await Transaction.create({
      userId: user._id,
      meter,
      amount,
      type: "payment",
      reference
    });

    res.json({ message: "Payment successful", data: flwRes.data });

  } catch (err) {
    console.error("❌ PAYMENT ERROR:", err.response?.data || err.message);
    res.status(500).json({ message: "Payment failed. Please try again." });
  }
});

// ✅ Transaction History
router.get("/history", auth, async (req, res) => {
  try {
    const history = await Transaction.find({ userId: req.user.id }).sort({ timestamp: -1 });
    res.json(history);
  } catch (err) {
    console.error("❌ HISTORY ERROR:", err.message);
    res.status(500).json({ message: "Unable to load history" });
  }
});

module.exports = router;
