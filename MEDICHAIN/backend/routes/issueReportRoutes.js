const express = require("express");

const IssueReport = require("../models/IssueReport");
const Shipment = require("../models/Shipment");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();


// ============================================
// GET ALL ISSUE REPORTS
// ============================================

router.get("/", protect, async (req, res) => {
  try {
    const reports = await IssueReport.find()
      .populate("reportedBy", "name email role")
      .sort({ createdAt: -1 });

    res.json(reports);

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch issue reports",
      error: error.message
    });
  }
});


// ============================================
// CREATE ISSUE REPORT
// ============================================

router.post("/", protect, async (req, res) => {
  try {

    const {
      shipmentId,
      issueType,
      comment
    } = req.body;


    if (!shipmentId) {
      return res.status(400).json({
        message: "Shipment ID is required"
      });
    }


    if (!comment || !comment.trim()) {
      return res.status(400).json({
        message: "Please provide a comment"
      });
    }


    const shipment = await Shipment.findOne({
      shipmentId
    });


    if (!shipment) {
      return res.status(404).json({
        message: "Shipment not found"
      });
    }


    const report = await IssueReport.create({
      shipment: shipment._id,
      shipmentId: shipment.shipmentId,

      reportedBy: req.user._id,
      reporterName: req.user.name,

      issueType: issueType || "Other",

      comment: comment.trim(),

      status: "Open"
    });


    const populatedReport =
      await IssueReport.findById(report._id)
        .populate("reportedBy", "name email role");


    res.status(201).json({
      message: "Issue reported successfully",
      report: populatedReport
    });

  } catch (error) {

    console.error("Create issue report error:", error);

    res.status(500).json({
      message: "Failed to create issue report",
      error: error.message
    });
  }
});


module.exports = router;
