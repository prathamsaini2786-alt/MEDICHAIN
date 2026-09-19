const mongoose = require("mongoose");

const stockMovementSchema = new mongoose.Schema(
  {
    drug: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Drug",
      required: true
    },

    batchNumber: {
      type: String,
      required: true
    },

    fromLocation: {
      type: String,
      required: true
    },

    toLocation: {
      type: String,
      required: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 1
    },

    status: {
      type: String,
      enum: ["Pending", "In Transit", "Delivered", "Cancelled"],
      default: "Pending"
    },

    movedBy: {
      type: String,
      required: true
    },

    notes: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("StockMovement", stockMovementSchema);