const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    message: {
      type: String,
      required: true,
      trim: true
    },

    severity: {
      type: String,
      enum: ["Critical", "Warning", "Info"],
      default: "Info"
    },

    category: {
      type: String,
      enum: ["Stock", "Shipment", "Compliance", "System", "Other"],
      default: "Other"
    },

    recommendation: {
      type: String,
      default: ""
    },

    reviewed: {
  type: Boolean,
  default: false
},

autoKey: {
  type: String,
  default: "",
  index: true
},

autoKey: {
  type: String,
  trim: true,
  index: true,
  sparse: true
},

    // Used for automatically generated alerts.
    // Manual alerts leave this empty.
    autoKey: {
      type: String,
      default: null,
      index: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Alert", alertSchema);
