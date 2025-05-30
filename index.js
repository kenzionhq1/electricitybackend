const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/auth");
const usageRoutes = require("./routes/usage");
const paymentRoutes = require("./routes/payment");
const userRoutes = require("./routes/user");
const userRoutes = require("./routes/webhook");
app.use("/api/auth", authRoutes);
app.use("/api/usage", usageRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/user", userRoutes);
app.use("/api/webhook", webhookRoutes);

app.get("/", (req, res) => {
  res.send("⚡ Electricity Payment API is live");
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => console.error("❌ MongoDB Connection Failed:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));




// Webhook first for raw body
app.use("/api/webhook", require("./routes/webhook"));

