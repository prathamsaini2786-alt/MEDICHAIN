const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    genericName: {
      type: String,
      required: true,
      trim: true
    },

    brandName: {
      type: String,
      default: "",
      trim: true
    },

    manufacturer: {
      type: String,
      default: "",
      trim: true
    },

    dosageForm: {
      type: String,
      default: "",
      trim: true
    },

    strength: {
      type: String,
      default: "",
      trim: true
    },

    category: {
      type: String,
      default: "",
      trim: true
    },

    storageConditions: {
      type: String,
      default: "Store at room temperature",
      trim: true
    },

    prescriptionRequired: {
      type: Boolean,
      default: false
    },

    essentialMedicine: {
      type: Boolean,
      default: false
    },

    source: {
      type: String,
      default: "MediChain",
      trim: true
    },

    sourceReference: {
      type: String,
      default: "",
      trim: true
    },

    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

medicineSchema.index({
  genericName: 1,
  strength: 1,
  dosageForm: 1
});

module.exports = mongoose.model(
  "Medicine",
  medicineSchema
);
