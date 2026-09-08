const express = require("express");
const mongoose = require("mongoose");
const Alert = require("../models/Alert");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// GET all alerts
router.get("/", protect, async (req, res) => {
  try {
    const alerts = await Alert.find()
      .sort({ reviewed: 1, createdAt: -1 });

    res.json(alerts);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch alerts",
      error: error.message
    });
  }
});

// GET single alert
router.get("/:id", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid alert ID"
      });
    }

    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        message: "Alert not found"
      });
    }

    res.json(alert);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch alert",
      error: error.message
    });
  }
});

// CREATE alert
router.post(
  "/",
  protect,
  authorize("Admin", "Supplier", "Distributor", "Pharmacy"),
  async (req, res) => {
    try {
      const {
        title,
        message,
        severity,
        category,
        recommendation
      } = req.body;

      if (!title || !message) {
        return res.status(400).json({
          message: "Title and message are required"
        });
      }

      const alert = new Alert({
        title,
        message,
        severity,
        category,
        recommendation,
        createdBy: req.user?._id
      });

      const savedAlert = await alert.save();

      res.status(201).json({
        message: "Alert created successfully",
        alert: savedAlert
      });
    } catch (error) {
      res.status(400).json({
        message: "Failed to create alert",
        error: error.message
      });
    }
  }
);

// MARK ALERT AS REVIEWED
router.put(
  "/:id/review",
  protect,
  authorize("Admin", "Supplier", "Distributor", "Pharmacy"),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "Invalid alert ID"
        });
      }

      const alert = await Alert.findByIdAndUpdate(
        req.params.id,
        { reviewed: true },
        { new: true }
      );

      if (!alert) {
        return res.status(404).json({
          message: "Alert not found"
        });
      }

      res.json({
        message: "Alert marked as reviewed",
        alert
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to review alert",
        error: error.message
      });
    }
  }
);

// MARK ALL ALERTS AS REVIEWED
router.put(
  "/review-all",
  protect,
  authorize("Admin", "Supplier", "Distributor", "Pharmacy"),
  async (req, res) => {
    try {
      const result = await Alert.updateMany(
        { reviewed: false },
        { reviewed: true }
      );

      res.json({
        message: "All alerts marked as reviewed",
        modifiedCount: result.modifiedCount
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to review all alerts",
        error: error.message
      });
    }
  }
);

module.exports = router;
