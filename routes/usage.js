const express = require("express");
const router = express.Router();
const authMiddleware = require("./middleware/auth");

router.get("/", authMiddleware, (req, res) => {
  const data = {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    monthUsage: [80, 90, 95, 85, 100, 110],
    week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    dailySpend: [300, 420, 400, 390, 450, 470, 500]
  };

  res.json({
    monthlyUsage: data.monthUsage,
    dailySpend: data.dailySpend,
    months: data.months,
    week: data.week
  });
});

module.exports = router;
