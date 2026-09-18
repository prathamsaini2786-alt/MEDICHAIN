require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Routes
const drugRoutes = require("./routes/drugRoutes");
const stockMovementRoutes = require("./routes/stockMovementRoutes");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const warehouseRoutes = require("./routes/warehouseRoutes");
const orderRoutes = require("./routes/orderRoutes");
const shipmentRoutes = require("./routes/shipmentRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const issueReportRoutes = require("./routes/issueReportRoutes");
const alertRoutes = require("./routes/alertRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const medicineRoutes = require("./routes/medicineRoutes");

const app = express();

const PORT = process.env.PORT || 5001;

// =========================
// MIDDLEWARE
// =========================

app.use(express.json());

app.use(
  cors({
    origin: [
      "http://127.0.0.1:5500",
      "http://localhost:5500",
      "http://127.0.0.1:5501",
      "http://localhost:5501",
      "http://127.0.0.1:5502",
      "http://localhost:5502",
      "https://medichain-1-obe8.onrender.com"
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// =========================
// HEALTH CHECK
// =========================

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "MediChain Backend"
  });
});

// =========================
// ROOT TEST
// =========================

app.get("/", (req, res) => {
  res.status(200).json({
    message: "MEDICHAIN BACKEND IS DEFINITELY RUNNING",
    version: "TEST-001"
  });
});

// =========================
// API ROUTES
// =========================

app.use("/api/drugs", drugRoutes);
app.use("/api/movements", stockMovementRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/issue-reports", issueReportRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/medicines", medicineRoutes);

// =========================
// 404 HANDLER
// =========================

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl
  });
});

// =========================
// MONGODB + SERVER
// =========================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `MediChain server running on 0.0.0.0:${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error(
      "MongoDB connection failed:",
      error.message
    );
  });