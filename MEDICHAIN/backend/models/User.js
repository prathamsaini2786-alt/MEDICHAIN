const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },

    password: {
      type: String,
      required: true,
      minlength: 6
    },

    role: {
      type: String,
      enum: ["Admin", "Supplier", "Distributor", "Pharmacy"],
      default: "Pharmacy"
    },

    notifications: {
      lowStock: {
        type: Boolean,
        default: true
      },
      expiry: {
        type: Boolean,
        default: true
      },
      orderUpdates: {
        type: Boolean,
        default: true
      },
      shipmentUpdates: {
        type: Boolean,
        default: true
      }
    },

    workspace: {
      name: {
        type: String,
        default: "North Region"
      },
      region: {
        type: String,
        default: "North Region"
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);