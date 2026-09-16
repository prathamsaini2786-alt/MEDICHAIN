const mongoose = require("mongoose");

const issueReportSchema = new mongoose.Schema(
  {
    shipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
      required: true
    },

    shipmentId: {
      type: String,
      required: true
    },

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    reporterName: {
      type: String,
      required: true
    },

    issueType: {
      type: String,
      enum: [
        "Temperature",
        "Delay",
        "Damaged package",
        "Incorrect quantity",
        "Route issue",
        "Other"
      ],
      default: "Other"
    },

    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },

    status: {
      type: String,
      enum: ["Open", "In Review", "Resolved"],
      default: "Open"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("IssueReport", issueReportSchema);
