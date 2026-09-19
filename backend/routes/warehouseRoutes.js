const express = require("express");
const mongoose = require("mongoose");
const Warehouse = require("../models/Warehouse");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Create a warehouse
router.post("/", protect, async (req, res) => {
  try {
    const warehouse = new Warehouse(req.body);
    await warehouse.save();

    res.status(201).json(warehouse);
  } catch (error) {
    // Duplicate warehouse code
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Warehouse code already exists"
      });
    }

    res.status(400).json({
      message: "Failed to create warehouse",
      error: error.message
    });
  }
});

// Get all warehouses
router.get("/", protect, async (req, res) => {
  try {
    const warehouses = await Warehouse.find().sort({ createdAt: -1 });

    res.status(200).json(warehouses);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch warehouses",
      error: error.message
    });
  }
});

// Get one warehouse
router.get("/:id", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid warehouse ID"
      });
    }

    const warehouse = await Warehouse.findById(req.params.id);

    if (!warehouse) {
      return res.status(404).json({
        message: "Warehouse not found"
      });
    }

    res.status(200).json(warehouse);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch warehouse",
      error: error.message
    });
  }
});

// Update a warehouse
router.put("/:id", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid warehouse ID"
      });
    }

    const warehouse = await Warehouse.findById(req.params.id);

    if (!warehouse) {
      return res.status(404).json({
        message: "Warehouse not found"
      });
    }

    Object.assign(warehouse, req.body);
    await warehouse.save();

    res.status(200).json(warehouse);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Warehouse code already exists"
      });
    }

    res.status(400).json({
      message: "Failed to update warehouse",
      error: error.message
    });
  }
});

// Delete a warehouse
router.delete("/:id", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid warehouse ID"
      });
    }

    const warehouse = await Warehouse.findByIdAndDelete(req.params.id);

    if (!warehouse) {
      return res.status(404).json({
        message: "Warehouse not found"
      });
    }

    res.status(200).json({
      message: "Warehouse deleted successfully",
      warehouse
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete warehouse",
      error: error.message
    });
  }
});

module.exports = router;