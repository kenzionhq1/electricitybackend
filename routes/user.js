const express = require("express");
const auth = require("../middleware/auth"); // Import the auth middleware

const router = express.Router(); // Use express.Router()

// Example protected route
router.get("/me", auth, async (req, res) => {
  try {
    res.json({ message: "User data retrieved successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;