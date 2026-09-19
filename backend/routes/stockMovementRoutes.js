const express = require("express");
const mongoose = require("mongoose");
const StockMovement = require("../models/StockMovement");
const Drug = require("../models/Drug");
const Warehouse = require("../models/Warehouse");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// GET all stock movements
router.get("/", protect, async (req, res) => {
  try {
    const movements = await StockMovement.find()
      .populate("drug")
      .sort({ createdAt: -1 });

    res.json(movements);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch stock movements",
      error: error.message
    });
  }
});

// GET a single stock movement
router.get("/:id", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid stock movement ID"
      });
    }

    const movement = await StockMovement.findById(req.params.id)
      .populate("drug");

    if (!movement) {
      return res.status(404).json({
        message: "Stock movement not found"
      });
    }

    res.json(movement);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch stock movement",
      error: error.message
    });
  }
});

// CREATE a stock movement
router.post(
  "/",
  protect,
  authorize("Admin", "Supplier", "Distributor", "Pharmacy"),
  async (req, res) => {
    try {
      const {
        drug,
        batchNumber,
        fromLocation,
        toLocation,
        quantity,
        movedBy,
        notes
      } = req.body;

      // Validate drug ID
      if (!mongoose.Types.ObjectId.isValid(drug)) {
        return res.status(400).json({
          message: "Invalid drug ID"
        });
      }

      // Validate quantity
      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          message: "Quantity must be a positive whole number"
        });
      }

      // Validate locations
      if (!fromLocation || !toLocation) {
        return res.status(400).json({
          message: "Source and destination locations are required"
        });
      }

      if (fromLocation === toLocation) {
        return res.status(400).json({
          message: "Source and destination locations must be different"
        });
      }

      // Check drug
      const existingDrug = await Drug.findById(drug);

      if (!existingDrug) {
        return res.status(404).json({
          message: "Drug not found"
        });
      }

      // Verify batch number
      if (
        batchNumber &&
        existingDrug.batchNumber !== batchNumber
      ) {
        return res.status(400).json({
          message: "Batch number does not match the selected drug"
        });
      }

      // Verify source location
      if (existingDrug.location !== fromLocation) {
        return res.status(400).json({
          message: `Drug is currently at ${existingDrug.location}, not ${fromLocation}`
        });
      }

      // Check stock
      if (quantity > existingDrug.quantity) {
        return res.status(400).json({
          message: "Insufficient stock available"
        });
      }

      // Check source warehouse
      const sourceWarehouse = await Warehouse.findOne({
        name: fromLocation
      });

      if (!sourceWarehouse) {
        return res.status(404).json({
          message: "Source warehouse not found"
        });
      }

      // Check destination warehouse
      const destinationWarehouse = await Warehouse.findOne({
        name: toLocation
      });

      if (!destinationWarehouse) {
        return res.status(404).json({
          message: "Destination warehouse not found"
        });
      }

      // Check capacity
      if (
        destinationWarehouse.currentStock + quantity >
        destinationWarehouse.capacity
      ) {
        return res.status(400).json({
          message: "Destination warehouse does not have enough capacity"
        });
      }

      const newMovement = new StockMovement({
        drug,
        batchNumber: batchNumber || existingDrug.batchNumber,
        fromLocation,
        toLocation,
        quantity,
        movedBy,
        notes,
        status: "Pending"
      });

      const savedMovement = await newMovement.save();

      res.status(201).json({
        message: "Stock movement created successfully",
        movement: savedMovement
      });

    } catch (error) {
      res.status(400).json({
        message: "Failed to create stock movement",
        error: error.message
      });
    }
  }
);

// UPDATE movement status
router.put(
  "/:id/status",
  protect,
  authorize("Admin", "Distributor", "Pharmacy"),
  async (req, res) => {
    try {
      // Validate movement ID
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "Invalid stock movement ID"
        });
      }

      const { status } = req.body;

      const allowedStatuses = [
        "Pending",
        "In Transit",
        "Delivered",
        "Cancelled"
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid status"
        });
      }

      const movement = await StockMovement.findById(req.params.id);

      if (!movement) {
        return res.status(404).json({
          message: "Stock movement not found"
        });
      }

      // Prevent changes after final state
      if (
        movement.status === "Delivered" ||
        movement.status === "Cancelled"
      ) {
        return res.status(400).json({
          message: `Movement is already ${movement.status}`
        });
      }

      // Prevent skipping In Transit
      if (
        movement.status === "Pending" &&
        status === "Delivered"
      ) {
        return res.status(400).json({
          message: "Movement must be In Transit before Delivered"
        });
      }

      // Delivery updates inventory
      if (status === "Delivered") {
        const drug = await Drug.findById(movement.drug);

        if (!drug) {
          return res.status(404).json({
            message: "Drug not found"
          });
        }

        // Verify source location
        if (drug.location !== movement.fromLocation) {
          return res.status(400).json({
            message: `Drug is no longer at ${movement.fromLocation}`
          });
        }

        // Verify stock
        if (movement.quantity > drug.quantity) {
          return res.status(400).json({
            message: "Insufficient stock available"
          });
        }

        // Find warehouses
        const fromWarehouse = await Warehouse.findOne({
          name: movement.fromLocation
        });

        const toWarehouse = await Warehouse.findOne({
          name: movement.toLocation
        });

        if (!fromWarehouse) {
          return res.status(404).json({
            message: "Source warehouse not found"
          });
        }

        if (!toWarehouse) {
          return res.status(404).json({
            message: "Destination warehouse not found"
          });
        }

        // Verify destination capacity
        if (
          toWarehouse.currentStock + movement.quantity >
          toWarehouse.capacity
        ) {
          return res.status(400).json({
            message: "Destination warehouse does not have enough capacity"
          });
        }

        // -----------------------------------------
        // PARTIAL TRANSFER
        // -----------------------------------------
        if (movement.quantity < drug.quantity) {
          drug.quantity -= movement.quantity;

          drug.status =
            drug.quantity <= 0
              ? "Out of Stock"
              : drug.quantity <= drug.reorderLevel
                ? "Low Stock"
                : "Available";

          await drug.save();

          /*
           * IMPORTANT:
           * Drug.batchNumber is unique.
           * Therefore we cannot create another Drug
           * document with the same batch number.
           *
           * For now, keep the transferred quantity represented
           * by the movement record. The destination inventory
           * will be handled as part of the final inventory model.
           */
        } else {
          // -----------------------------------------
          // FULL TRANSFER
          // -----------------------------------------

          drug.location = movement.toLocation;

          drug.status =
            drug.quantity <= drug.reorderLevel
              ? "Low Stock"
              : "Available";

          await drug.save();
        }

        // Update source warehouse stock
        fromWarehouse.currentStock = Math.max(
          0,
          fromWarehouse.currentStock - movement.quantity
        );

        // Update destination warehouse stock
        toWarehouse.currentStock += movement.quantity;

        await fromWarehouse.save();
        await toWarehouse.save();
      }

      movement.status = status;

      const updatedMovement = await movement.save();

      res.json({
        message: "Movement status updated successfully",
        movement: updatedMovement
      });

    } catch (error) {
      res.status(400).json({
        message: "Failed to update movement status",
        error: error.message
      });
    }
  }
);

module.exports = router;