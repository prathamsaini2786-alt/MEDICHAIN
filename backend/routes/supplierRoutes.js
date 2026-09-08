const express = require("express");
const mongoose = require("mongoose");

const Supplier = require("../models/Supplier");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();


// ============================================
// CREATE SUPPLIER
// ============================================

router.post("/", protect, async (req, res) => {
  try {
    const supplier = new Supplier(req.body);

    await supplier.save();

    res.status(201).json(supplier);

  } catch (error) {

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Supplier code already exists",
      });
    }

    res.status(400).json({
      message: "Failed to create supplier",
      error: error.message,
    });
  }
});


// ============================================
// GET ALL SUPPLIERS
// ============================================

router.get("/", protect, async (req, res) => {
  try {

    const suppliers = await Supplier.find()
      .sort({ createdAt: -1 });

    res.status(200).json(suppliers);

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch suppliers",
      error: error.message,
    });
  }
});


// ============================================
// GET ONE SUPPLIER
// ============================================

router.get("/:id", protect, async (req, res) => {
  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid supplier ID",
      });
    }

    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        message: "Supplier not found",
      });
    }

    res.status(200).json(supplier);

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch supplier",
      error: error.message,
    });
  }
});


// ============================================
// UPDATE SUPPLIER
// ============================================

router.put("/:id", protect, async (req, res) => {
  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid supplier ID",
      });
    }

    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        message: "Supplier not found",
      });
    }

    Object.assign(supplier, req.body);

    await supplier.save();

    res.status(200).json(supplier);

  } catch (error) {

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Supplier code already exists",
      });
    }

    res.status(400).json({
      message: "Failed to update supplier",
      error: error.message,
    });
  }
});


// ============================================
// DELETE SUPPLIER
// ============================================

router.delete("/:id", protect, async (req, res) => {
  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid supplier ID",
      });
    }

    const supplier =
      await Supplier.findByIdAndDelete(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        message: "Supplier not found",
      });
    }

    res.status(200).json({
      message: "Supplier deleted successfully",
      supplier,
    });

  } catch (error) {

    res.status(500).json({
      message: "Failed to delete supplier",
      error: error.message,
    });
  }
});


module.exports = router;
