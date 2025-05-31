const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const axios = require("axios");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

const VTPASS_USERNAME = process.env.VTPASS_USERNAME;
const VTPASS_PASSWORD = process.env.VTPASS_PASSWORD;
const VTPASS_API = "https://sandbox.vtpass.com/api";

const headers = {
  "api-key": VTPASS_USERNAME,
  "secret-key": VTPASS_PASSWORD,
  "Content-Type": "application/json"
};

router.post("/verify", auth, async (req, res) => {
  const { meter, disco } = req.body;
  try {
    const response = await axios.post(`${VTPASS_API}/merchant-verify`, {
      billersCode: meter,
      serviceID: disco,
      type: "prepaid"
    }, { headers });

    const data = response.data.content;
    res.json({
      customer_name: data.Customer_Name,
      meter_number: meter,
      meter_type: data.meterType,
      debt: data.outstanding || 0
    });
  } catch {
    res.status(500).json({ message: "VTPass verification failed" });
  }
});

router.post("/", auth, async (req, res) => {
  const { meter, amount, disco, phone } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (user.balance < amount) return res.status(400).json({ message: "Insufficient balance" });

    const reference = `epay_${Date.now()}`;
    const purchase = await axios.post(`${VTPASS_API}/pay`, {
      request_id: reference,
      serviceID: disco,
      billersCode: meter,
      variation_code: "prepaid",
      amount,
      phone
    }, { headers });

    if (purchase.data.code !== "000") {
      return res.status(400).json({ message: "Payment failed", response: purchase.data });
    }

    user.balance -= amount;
    await user.save();

    await Transaction.create({
      userId: user._id,
      meter,
      amount,
      type: "payment",
      reference
    });

    res.json({ message: "Payment successful", response: purchase.data });
  } catch {
    res.status(500).json({ message: "Payment error" });
  }
});

router.get("/history", auth, async (req, res) => {
  const history = await Transaction.find({ userId: req.user.id }).sort({ timestamp: -1 });
  res.json(history);
});

module.exports = router;
