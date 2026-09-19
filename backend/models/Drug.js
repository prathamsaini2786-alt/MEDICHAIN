const mongoose = require("mongoose");

const drugSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    batchNumber: {
      type: String,
      required: true,
      
      trim: true,
    },

    manufacturer: {
      type: String,
      required: true,
      trim: true,
    },

    genericName: {
    type: String,
    required: true,
    trim: true,
},

dosageForm: {
    type: String,
    required: true,
    enum: [
        "Tablet",
        "Capsule",
        "Syrup",
        "Injection",
        "Cream",
        "Ointment",
        "Drops",
        "Inhaler",
        "Other"
    ],
},

strength: {
    type: String,
    required: true,
    trim: true,
},

storageConditions: {
    type: String,
    default: "Store at room temperature",
    trim: true,
},

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    reorderLevel: {
  type: Number,
  default: 10,
  min: 0
},

    expiryDate: {
      type: Date,
      required: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["Available", "Low Stock", "Out of Stock", "Expired"],
      default: "Available",
    },
  },
  {
    timestamps: true,
  }
);

drugSchema.index(
  { batchNumber: 1, location: 1 },
  { unique: true }
);

module.exports = mongoose.model("Drug", drugSchema);