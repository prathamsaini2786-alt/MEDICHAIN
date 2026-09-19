
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const drugRoutes = require("./routes/drugRoutes");
const stockMovementRoutes = require("./routes/stockMovementRoutes");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const warehouseRoutes = require("./routes/warehouseRoutes");
const orderRoutes = require("./routes/orderRoutes");

require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(cors({
  origin: "http://127.0.0.1:5501"
}));
app.use("/api/drugs", drugRoutes);
app.use("/api/movements", stockMovementRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/orders", orderRoutes);

// Test route
app.get("/", (req, res) => {
    res.json({
        message: "MediChain backend is running!"
    });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");

        app.listen(PORT, () => {
            console.log(`MediChain server running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
    });