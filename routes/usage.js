const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Transaction = require("../models/Transaction");

router.get("/", auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id });

    const monthlyUsage = Array(6).fill(0);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

    transactions.forEach((t) => {
      const month = new Date(t.timestamp).getMonth();
      if (month >= 0 && month < 6) {
        monthlyUsage[month] += t.amount;
      }
    });

    const dailySpend = [300, 420, 400, 390, 450, 470, 500];
    const week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    res.json({
      months,
      monthlyUsage,
      dailySpend,
      week,
    });
  } catch (err) {
    res.status(500).json({ message: "Usage data failed", error: err.message });
  }
});

module.exports = router;
