const express = require("express");
const mongoose = require("mongoose");
const Alert = require("../models/Alert");
const Drug = require("../models/Drug");
const Shipment = require("../models/Shipment");
const Warehouse = require("../models/Warehouse");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// =========================================
// GENERATE AUTOMATED INVENTORY ALERTS
// =========================================

// =========================================
// GENERATE AUTOMATED ALERTS
// =========================================

router.post(
  "/generate",
  protect,
  authorize("Admin", "Supplier", "Distributor", "Pharmacy"),
  async (req, res) => {
    try {
      let generated = 0;

      // =====================================
      // INVENTORY ALERTS
      // =====================================

      const drugs = await Drug.find();

      for (const drug of drugs) {
        const quantity = Number(drug.quantity || 0);
        const reorderLevel = Number(drug.reorderLevel || 0);

        const expiryDate = drug.expiryDate
          ? new Date(drug.expiryDate)
          : null;

        const now = new Date();

        const daysUntilExpiry = expiryDate
          ? Math.ceil(
              (expiryDate.getTime() - now.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : null;

        // OUT OF STOCK
        if (quantity <= 0) {
          const autoKey = `stock-out-${drug._id}`;

          await Alert.findOneAndUpdate(
            { autoKey },
            {
              title: `${drug.name} is out of stock`,
              message:
                `${drug.name} has no available units at ` +
                `${drug.location || "the facility"}.`,
              severity: "Critical",
              category: "Stock",
              recommendation:
                "Replenish stock immediately or initiate an emergency transfer.",
              reviewed: false,
              autoKey,
              createdBy: req.user?._id
            },
            {
              upsert: true,
              new: true,
              setDefaultsOnInsert: true
            }
          );

          generated++;
        }

        // LOW STOCK
        else if (
          reorderLevel > 0 &&
          quantity <= reorderLevel
        ) {
          const autoKey = `low-stock-${drug._id}`;

          await Alert.findOneAndUpdate(
            { autoKey },
            {
              title: `Low stock: ${drug.name}`,
              message:
                `${drug.name} has ${quantity.toLocaleString()} units remaining, ` +
                `which is at or below the reorder level of ` +
                `${reorderLevel.toLocaleString()}.`,
              severity: "Warning",
              category: "Stock",
              recommendation:
                "Create a replenishment order or transfer stock from another facility.",
              reviewed: false,
              autoKey,
              createdBy: req.user?._id
            },
            {
              upsert: true,
              new: true,
              setDefaultsOnInsert: true
            }
          );

          generated++;
        }

        // EXPIRED
        if (
          expiryDate &&
          !Number.isNaN(expiryDate.getTime()) &&
          expiryDate < now
        ) {
          const autoKey = `expired-${drug._id}`;

          await Alert.findOneAndUpdate(
            { autoKey },
            {
              title: `Expired medicine: ${drug.name}`,
              message:
                `${drug.name} batch ${drug.batchNumber || "N/A"} ` +
                `expired on ${expiryDate.toLocaleDateString()}.`,
              severity: "Critical",
              category: "Compliance",
              recommendation:
                "Quarantine the expired stock and prevent further distribution.",
              reviewed: false,
              autoKey,
              createdBy: req.user?._id
            },
            {
              upsert: true,
              new: true,
              setDefaultsOnInsert: true
            }
          );

          generated++;
        }

        // EXPIRING SOON
        else if (
          daysUntilExpiry !== null &&
          daysUntilExpiry >= 0 &&
          daysUntilExpiry <= 30
        ) {
          const autoKey = `expiry-${drug._id}`;

          await Alert.findOneAndUpdate(
            { autoKey },
            {
              title: `Expiring soon: ${drug.name}`,
              message:
                `${drug.name} batch ${drug.batchNumber || "N/A"} ` +
                `expires in ${daysUntilExpiry} day` +
                `${daysUntilExpiry === 1 ? "" : "s"}.`,
              severity: "Warning",
              category: "Compliance",
              recommendation:
                "Prioritize this batch for distribution before expiry.",
              reviewed: false,
              autoKey,
              createdBy: req.user?._id
            },
            {
              upsert: true,
              new: true,
              setDefaultsOnInsert: true
            }
          );

          generated++;
        }
      }

      // =====================================
      // SHIPMENT ALERTS
      // =====================================

      const shipments = await Shipment.find();

      for (const shipment of shipments) {
        const status = String(shipment.status || "").toLowerCase();

        // DELAYED SHIPMENT
        if (status === "delayed") {
          const autoKey = `shipment-delayed-${shipment._id}`;

          await Alert.findOneAndUpdate(
            { autoKey },
            {
              title: `Delayed shipment: ${shipment.shipmentId || shipment._id}`,
              message:
                `Shipment ${shipment.shipmentId || shipment._id} ` +
                `from ${shipment.origin || "unknown origin"} ` +
                `to ${shipment.destination || "unknown destination"} ` +
                `is currently delayed.`,
              severity: "Critical",
              category: "Shipment",
              recommendation:
                "Review the shipment status and contact the transport operator.",
              reviewed: false,
              autoKey,
              createdBy: req.user?._id
            },
            {
              upsert: true,
              new: true,
              setDefaultsOnInsert: true
            }
          );

          generated++;
        }

        // OVERDUE ETA
        if (
          shipment.eta &&
          status !== "delivered" &&
          status !== "cancelled"
        ) {
          const eta = new Date(shipment.eta);

          if (
            !Number.isNaN(eta.getTime()) &&
            eta < new Date()
          ) {
            const autoKey = `shipment-overdue-${shipment._id}`;

            await Alert.findOneAndUpdate(
              { autoKey },
              {
                title: `Shipment overdue: ${shipment.shipmentId || shipment._id}`,
                message:
                  `Shipment ${shipment.shipmentId || shipment._id} ` +
                  `has passed its expected delivery time.`,
                severity: "Warning",
                category: "Shipment",
                recommendation:
                  "Check the latest shipment location and update its ETA.",
                reviewed: false,
                autoKey,
                createdBy: req.user?._id
              },
              {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
              }
            );

            generated++;
          }
        }
      }

      // =====================================
      // FACILITY CAPACITY ALERTS
      // =====================================

      const warehouses = await Warehouse.find();

      for (const warehouse of warehouses) {
        const capacity = Number(warehouse.capacity || 0);
        const currentStock = Number(
          warehouse.currentStock || 0
        );

        if (capacity <= 0) continue;

        const utilization =
          (currentStock / capacity) * 100;

        // CRITICAL CAPACITY
        if (utilization >= 95) {
          const autoKey = `warehouse-capacity-critical-${warehouse._id}`;

          await Alert.findOneAndUpdate(
            { autoKey },
            {
              title: `Critical capacity: ${warehouse.name}`,
              message:
                `${warehouse.name} is at ` +
                `${utilization.toFixed(1)}% capacity ` +
                `(${currentStock.toLocaleString()} / ` +
                `${capacity.toLocaleString()} units).`,
              severity: "Critical",
              category: "System",
              recommendation:
                "Move inventory to another facility before capacity is exceeded.",
              reviewed: false,
              autoKey,
              createdBy: req.user?._id
            },
            {
              upsert: true,
              new: true,
              setDefaultsOnInsert: true
            }
          );

          generated++;
        }

        // WARNING CAPACITY
        else if (utilization >= 80) {
          const autoKey = `warehouse-capacity-warning-${warehouse._id}`;

          await Alert.findOneAndUpdate(
            { autoKey },
            {
              title: `High capacity: ${warehouse.name}`,
              message:
                `${warehouse.name} is at ` +
                `${utilization.toFixed(1)}% capacity.`,
              severity: "Warning",
              category: "System",
              recommendation:
                "Monitor incoming inventory and consider redistributing stock.",
              reviewed: false,
              autoKey,
              createdBy: req.user?._id
            },
            {
              upsert: true,
              new: true,
              setDefaultsOnInsert: true
            }
          );

          generated++;
        }
      }

      res.json({
        message: "Automated alerts generated successfully",
        generated
      });

    } catch (error) {
      console.error(
        "Generate automated alerts error:",
        error
      );

      res.status(500).json({
        message: "Failed to generate automated alerts",
        error: error.message
      });
    }
  }
);

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
