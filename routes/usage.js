const express = require("express");
const authMiddleware = require("../middleware/auth"); // Import the auth middleware

const router = express.Router();

// Example protected route
router.get("usage/", authMiddleware, (req, res) => {
  res.json({ message: "Usage data retrieved successfully!" });
});

module.exports = router;