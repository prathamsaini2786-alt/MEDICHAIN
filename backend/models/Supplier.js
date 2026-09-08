const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    onTimeRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    activeOrders: {
      type: Number,
      default: 0,
      min: 0,
    },

    reliability: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Supplier", supplierSchema);
