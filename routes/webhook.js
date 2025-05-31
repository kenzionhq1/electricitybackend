const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;

router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
  const signature = req.headers["x-paystack-signature"];
  const hash = crypto.createHmac("sha512", PAYSTACK_SECRET)
    .update(req.rawBody)
    .digest("hex");

  if (signature !== hash) return res.status(401).send("Invalid signature");

  const payload = JSON.parse(req.body);

  if (payload.event === "charge.success") {
    const { email, amount, reference } = payload.data.customer;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).send("User not found");

    user.balance += amount / 100;
    await user.save();

    await Transaction.create({
      userId: user._id,
      amount: amount / 100,
      type: "topup",
      reference
    });
  }

  res.sendStatus(200);
});

module.exports = router;
