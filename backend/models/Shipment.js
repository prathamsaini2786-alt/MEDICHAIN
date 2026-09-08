const mongoose = require("mongoose");

const shipmentSchema = new mongoose.Schema(
  {
    shipmentId: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    origin: {
      type: String,
      required: true,
      trim: true,
    },

    destination: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "In transit",
        "Delivered",
        "Delayed",
        "Cancelled",
      ],
      default: "Pending",
    },

    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    eta: {
      type: String,
      default: "—",
    },

    temperature: {
      type: Number,
      default: null,
    },

    driver: {
      type: String,
      default: "—",
      trim: true,
    },

    vehicle: {
      type: String,
      default: "—",
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Shipment", shipmentSchema);
