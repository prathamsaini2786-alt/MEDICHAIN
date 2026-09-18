const express = require("express");
const mongoose = require("mongoose");

const Order = require("../models/Order");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();


// ============================================
// GET ALL ORDERS
// ============================================

router.get("/", protect, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch orders",
      error: error.message,
    });

  }
});


// ============================================
// GET ONE ORDER
// ============================================

router.get("/:id", protect, async (req, res) => {

  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {

      return res.status(400).json({
        message: "Invalid order ID",
      });

    }

    const order = await Order.findById(req.params.id)
      .populate("createdBy", "name email role");

    if (!order) {

      return res.status(404).json({
        message: "Order not found",
      });

    }

    res.json(order);

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch order",
      error: error.message,
    });

  }

});


// ============================================
// CREATE ORDER
// ============================================

router.post(
  "/",
  protect,
  authorize("Admin", "Supplier", "Distributor", "Pharmacy"),

  async (req, res) => {

    try {

      const {
        medicine,
        drug,
        supplier,
        facility,
        destination,
        quantity,
        priority,
      } = req.body;


      // Accept either "medicine" from frontend
      // or "drug" from API clients.

      const medicineName = medicine || drug;

      const destinationName = destination || facility;


      if (!medicineName) {

        return res.status(400).json({
          message: "Medicine is required",
        });

      }


      if (!supplier) {

        return res.status(400).json({
          message: "Supplier is required",
        });

      }


      if (!destinationName) {

        return res.status(400).json({
          message: "Destination facility is required",
        });

      }


      if (!Number.isInteger(quantity) || quantity <= 0) {

        return res.status(400).json({
          message: "Quantity must be a positive whole number",
        });

      }


      const order = new Order({

        drug: medicineName,

        supplier,

        destination: destinationName,

        quantity,

        priority: priority || "Normal",

        status: "Pending",

        createdBy: req.user.id,

      });


      const savedOrder = await order.save();


      const populatedOrder = await Order.findById(savedOrder._id)
        .populate("createdBy", "name email role");


      res.status(201).json({

        message: "Order created successfully",

        order: populatedOrder,

      });


    } catch (error) {

      console.error("Create order error:", error);

      res.status(400).json({

        message: "Failed to create order",

        error: error.message,

      });

    }

  }
);


// ============================================
// UPDATE ORDER STATUS
// ============================================

router.put(
  "/:id/status",
  protect,
  authorize("Admin", "Supplier", "Distributor", "Pharmacy"),

  async (req, res) => {

    try {

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {

        return res.status(400).json({
          message: "Invalid order ID",
        });

      }


      const { status } = req.body;


      const allowedStatuses = [
        "Pending",
        "Approved",
        "Processing",
        "Completed",
        "Cancelled",
      ];


      if (!allowedStatuses.includes(status)) {

        return res.status(400).json({
          message: "Invalid order status",
        });

      }


      const order = await Order.findById(req.params.id);


      if (!order) {

        return res.status(404).json({
          message: "Order not found",
        });

      }


      if (
        order.status === "Completed" ||
        order.status === "Cancelled"
      ) {

        return res.status(400).json({
          message: `Order is already ${order.status}`,
        });

      }


      order.status = status;

      const updatedOrder = await order.save();


      res.json({

        message: "Order status updated successfully",

        order: updatedOrder,

      });


    } catch (error) {

      res.status(400).json({

        message: "Failed to update order status",

        error: error.message,

      });

    }

  }
);


// ============================================
// DELETE ORDER
// ============================================

router.delete(
  "/:id",
  protect,
  authorize("Admin"),

  async (req, res) => {

    try {

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {

        return res.status(400).json({
          message: "Invalid order ID",
        });

      }


      const order = await Order.findByIdAndDelete(req.params.id);


      if (!order) {

        return res.status(404).json({
          message: "Order not found",
        });

      }


      res.json({

        message: "Order deleted successfully",

        order,

      });


    } catch (error) {

      res.status(500).json({

        message: "Failed to delete order",

        error: error.message,

      });

    }

  }
);


module.exports = router;