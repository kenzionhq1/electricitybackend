const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Transaction = require("../models/Transaction");

const FLW_SECRET_HASH = process.env.FLW_SECRET_HASH;

// Receive webhook
router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
  const signature = req.headers["verif-hash"];
  if (!signature || signature !== FLW_SECRET_HASH) return res.status(401).send("Invalid signature");

  const payload = JSON.parse(req.body);

  if (payload.event !== "charge.completed" || payload.data.status !== "successful") {
    return res.status(200).send("Ignored");
  }

  const { amount, tx_ref, customer } = payload.data;
  const email = customer.email;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).send("User not found");

  user.balance += amount;
  await user.save();

  await Transaction.create({
    userId: user._id,
    amount,
    type: "topup",
    reference: tx_ref
  });

  res.sendStatus(200);
});

module.exports = router;
