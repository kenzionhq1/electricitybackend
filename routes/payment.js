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

    await user.findByIdAndUpdate(req.user.id, {
      $inc: { balance: -amount }
    });
    const updatedUser = await User.findById(req.user.id);

    res.status(201).json({
      message: "Payment recorded successfully.",
      balance: updatedUser.balance
    });
  } catch (err) {
    res.status(500).json({ message: "Payment failed", error: err.message });
  }
});



const Transaction = require("../models/Transaction");

// GET /api/payment/history
router.get("/history", auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id }).sort({ timestamp: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: "Failed to load history", error: err.message });
  }
});


module.exports = router;
