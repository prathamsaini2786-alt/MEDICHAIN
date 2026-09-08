const express = require("express");
const mongoose = require("mongoose");

const Shipment = require("../models/Shipment");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();


// ============================================
// GENERATE SHIPMENT ID
// ============================================

function generateShipmentId() {
  return `MC-${Math.floor(10000 + Math.random() * 90000)}`;
}


// ============================================
// GET ALL SHIPMENTS
// ============================================

router.get("/", protect, async (req, res) => {

  try {

    const shipments = await Shipment.find()
      .populate("createdBy", "name email role")
      .populate("order")
      .sort({ createdAt: -1 });

    res.json(shipments);

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch shipments",
      error: error.message,
    });

  }

});


// ============================================
// GET ONE SHIPMENT
// ============================================

router.get("/:id", protect, async (req, res) => {

  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {

      return res.status(400).json({
        message: "Invalid shipment ID",
      });

    }

    const shipment = await Shipment.findById(req.params.id)
      .populate("createdBy", "name email role")
      .populate("order");

    if (!shipment) {

      return res.status(404).json({
        message: "Shipment not found",
      });

    }

    res.json(shipment);

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch shipment",
      error: error.message,
    });

  }

});


// ============================================
// CREATE SHIPMENT
// ============================================

router.post(
  "/",
  protect,
  authorize("Admin", "Supplier", "Distributor", "Pharmacy"),

  async (req, res) => {

    try {

      const {
        order,
        origin,
        destination,
        quantity,
        eta,
        temperature,
        driver,
        vehicle,
      } = req.body;


      if (!origin) {

        return res.status(400).json({
          message: "Origin is required",
        });

      }


      if (!destination) {

        return res.status(400).json({
          message: "Destination is required",
        });

      }


      if (!Number.isInteger(quantity) || quantity <= 0) {

        return res.status(400).json({
          message: "Quantity must be a positive whole number",
        });

      }


      if (
        order &&
        !mongoose.Types.ObjectId.isValid(order)
      ) {

        return res.status(400).json({
          message: "Invalid order ID",
        });

      }


      let shipmentId = generateShipmentId();

      // Extremely unlikely collision protection
      while (await Shipment.exists({ shipmentId })) {
        shipmentId = generateShipmentId();
      }


      const shipment = new Shipment({

        shipmentId,

        order: order || null,

        origin,

        destination,

        quantity,

        status: "Pending",

        progress: 0,

        eta: eta || "—",

        temperature:
          temperature !== undefined &&
          temperature !== ""
            ? Number(temperature)
            : null,

        driver: driver || "—",

        vehicle: vehicle || "—",

        createdBy: req.user.id,

      });


      const savedShipment =
        await shipment.save();


      const populatedShipment =
        await Shipment.findById(savedShipment._id)
          .populate("createdBy", "name email role")
          .populate("order");


      res.status(201).json({

        message: "Shipment created successfully",

        shipment: populatedShipment,

      });

    } catch (error) {

      console.error(
        "Create shipment error:",
        error
      );

      res.status(400).json({

        message: "Failed to create shipment",

        error: error.message,

      });

    }

  }
);


// ============================================
// UPDATE SHIPMENT STATUS
// ============================================

router.put(
  "/:id/status",
  protect,
  authorize("Admin", "Supplier", "Distributor", "Pharmacy"),

  async (req, res) => {

    try {

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {

        return res.status(400).json({
          message: "Invalid shipment ID",
        });

      }


      const {
        status,
        progress,
        eta,
        temperature,
        driver,
        vehicle,
      } = req.body;


      const allowedStatuses = [
        "Pending",
        "In transit",
        "Delivered",
        "Delayed",
        "Cancelled",
      ];


      if (
        status &&
        !allowedStatuses.includes(status)
      ) {

        return res.status(400).json({
          message: "Invalid shipment status",
        });

      }


      const shipment =
        await Shipment.findById(
          req.params.id
        );


      if (!shipment) {

        return res.status(404).json({
          message: "Shipment not found",
        });

      }


      if (status) {
        shipment.status = status;
      }


      if (
        progress !== undefined
      ) {

        const numericProgress =
          Number(progress);

        if (
          !Number.isFinite(
            numericProgress
          ) ||
          numericProgress < 0 ||
          numericProgress > 100
        ) {

          return res.status(400).json({
            message:
              "Progress must be between 0 and 100",
          });

        }

        shipment.progress =
          numericProgress;

      }


      if (eta !== undefined) {
        shipment.eta = eta;
      }


      if (temperature !== undefined) {

        shipment.temperature =
          temperature === ""
            ? null
            : Number(temperature);

      }


      if (driver !== undefined) {
        shipment.driver = driver;
      }


      if (vehicle !== undefined) {
        shipment.vehicle = vehicle;
      }


      // Automatically complete progress
      if (shipment.status === "Delivered") {
        shipment.progress = 100;
      }

      if (
        shipment.status === "In transit" &&
        shipment.progress === 0
      ) {
        shipment.progress = 1;
      }


      const updatedShipment =
        await shipment.save();


      const populatedShipment =
        await Shipment.findById(
          updatedShipment._id
        )
          .populate(
            "createdBy",
            "name email role"
          )
          .populate("order");


      res.json({

        message:
          "Shipment updated successfully",

        shipment: populatedShipment,

      });

    } catch (error) {

      res.status(400).json({

        message:
          "Failed to update shipment",

        error: error.message,

      });

    }

  }
);


// ============================================
// DELETE SHIPMENT
// ============================================

router.delete(
  "/:id",
  protect,
  authorize("Admin"),

  async (req, res) => {

    try {

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {

        return res.status(400).json({
          message: "Invalid shipment ID",
        });

      }


      const shipment =
        await Shipment.findById(
          req.params.id
        );


      if (!shipment) {

        return res.status(404).json({
          message: "Shipment not found",
        });

      }


      await Shipment.findByIdAndDelete(
        req.params.id
      );


      res.json({

        message:
          "Shipment deleted successfully",

        shipment,

      });

    } catch (error) {

      res.status(500).json({

        message:
          "Failed to delete shipment",

        error: error.message,

      });

    }

  }
);


module.exports = router;
