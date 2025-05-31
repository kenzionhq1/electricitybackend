const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

router.post("/signup", async (req, res) => {
  const { username, email, phone, password } = req.body;
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, email, phone, password: hashed });
    await user.save();

    res.status(201).json({ message: "User created" });
  } catch (err) {
    res.status(500).json({ message: "Signup error" });
  }
});

router.post("/signin", async (req, res) => {
  const { identifier, password } = req.body;
  try {
    const user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Wrong credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({ token, user: { username: user.username, email: user.email, balance: user.balance } });
  } catch {
    res.status(500).json({ message: "Signin failed" });
  }
});

module.exports = router;
