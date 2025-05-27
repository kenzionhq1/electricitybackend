const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Transaction = require("../models/Transaction");

router.post("/", auth, async (req, res) => {
  const { meter, amount } = req.body;

  if (!meter || !amount) {
    return res.status(400).json({ message: "Meter and amount are required." });
  }

  try {
    const newTransaction = new Transaction({
      userId: req.user.id,
      meter,
      amount
    });

    await newTransaction.save();
    res.status(201).json({ message: "Payment recorded successfully." });
  } catch (err) {
    res.status(500).json({ message: "Payment failed", error: err.message });
  }
});

module.exports = router;
