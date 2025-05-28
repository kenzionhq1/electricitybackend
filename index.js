const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/auth");
const usageRoutes = require("./routes/usage"); // Import usage routes
const paymentRoutes = require("./routes/payment");
const userRoutes = require("./routes/user");
app.use("/api/payment", paymentRoutes);
app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/usage", usageRoutes); // Use usage routes

// DB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => console.error("❌ Mongo Error:", err));

// Default route
app.get("/", (req, res) => {
  res.send("⚡ Electricity Payment API is live");
});

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));