const express = require("express");
const router = express.Router();

const Medicine = require("../models/Medicine");
const { protect } = require("../middleware/authMiddleware");

// GET all medicines
router.get("/", protect, async (req, res) => {
  try {
    const medicines = await Medicine.find({ active: true })
      .sort({ genericName: 1 });

    res.json(medicines);
  } catch (error) {
    console.error("Get medicines error:", error);
    res.status(500).json({
      message: "Failed to fetch medicines"
    });
  }
});

// GET single medicine
router.get("/:id", protect, async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        message: "Medicine not found"
      });
    }

    res.json(medicine);
  } catch (error) {
    console.error("Get medicine error:", error);
    res.status(500).json({
      message: "Failed to fetch medicine"
    });
  }
});

// CREATE medicine
router.post("/", protect, async (req, res) => {
  try {
    const medicine = await Medicine.create(req.body);

    res.status(201).json({
      message: "Medicine created successfully",
      medicine
    });
  } catch (error) {
    console.error("Create medicine error:", error);

    res.status(400).json({
      message: error.message || "Failed to create medicine"
    });
  }
});

// UPDATE medicine
router.put("/:id", protect, async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!medicine) {
      return res.status(404).json({
        message: "Medicine not found"
      });
    }

    res.json({
      message: "Medicine updated successfully",
      medicine
    });
  } catch (error) {
    console.error("Update medicine error:", error);

    res.status(400).json({
      message: error.message || "Failed to update medicine"
    });
  }
});

// DELETE medicine
router.delete("/:id", protect, async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );

    if (!medicine) {
      return res.status(404).json({
        message: "Medicine not found"
      });
    }

    res.json({
      message: "Medicine deactivated successfully"
    });
  } catch (error) {
    console.error("Delete medicine error:", error);

    res.status(500).json({
      message: "Failed to delete medicine"
    });
  }
});

module.exports = router;
