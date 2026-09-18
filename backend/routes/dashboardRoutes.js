const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const Drug = require("../models/Drug");
const Warehouse = require("../models/Warehouse");
const StockMovement = require("../models/StockMovement");

const router = express.Router();

// GET dashboard statistics
router.get("/", protect, async (req, res) => {
  try {
    // Basic counts
    const totalMedicines = await Drug.countDocuments();
    const totalWarehouses = await Warehouse.countDocuments();

    // Medicine stock statistics
    const lowStockMedicines = await Drug.countDocuments({
      status: "Low Stock"
    });

    const outOfStockMedicines = await Drug.countDocuments({
      status: "Out of Stock"
    });

    const availableMedicines = await Drug.countDocuments({
      status: "Available"
    });

    // Shipment statistics
    const pendingShipments = await StockMovement.countDocuments({
      status: "Pending"
    });

    const inTransitShipments = await StockMovement.countDocuments({
      status: "In Transit"
    });

    const deliveredShipments = await StockMovement.countDocuments({
      status: "Delivered"
    });

    const cancelledShipments = await StockMovement.countDocuments({
      status: "Cancelled"
    });

    const activeShipments =
      pendingShipments + inTransitShipments;

    // Total quantity of medicines in inventory
    const inventoryResult = await Drug.aggregate([
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: "$quantity" }
        }
      }
    ]);

    const totalInventory =
      inventoryResult.length > 0
        ? inventoryResult[0].totalQuantity
        : 0;

    res.json({
      medicines: {
        total: totalMedicines,
        available: availableMedicines,
        lowStock: lowStockMedicines,
        outOfStock: outOfStockMedicines,
        totalInventory
      },

      warehouses: {
        total: totalWarehouses
      },

      shipments: {
        active: activeShipments,
        pending: pendingShipments,
        inTransit: inTransitShipments,
        delivered: deliveredShipments,
        cancelled: cancelledShipments
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch dashboard statistics",
      error: error.message
    });
  }
});

module.exports = router;