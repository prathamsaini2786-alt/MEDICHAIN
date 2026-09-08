const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const Drug = require("../models/Drug");
const Order = require("../models/Order");
const Shipment = require("../models/Shipment");
const Supplier = require("../models/Supplier");

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    const [
      totalOrders,
      completedOrders,
      totalShipments,
      deliveredShipments,
      delayedShipments,
      totalDrugs,
      healthyDrugs,
      expiredDrugs,
      totalSuppliers,
      activeSuppliers,
      inventoryResult
    ] = await Promise.all([
      Order.countDocuments(),

      Order.countDocuments({
        status: "Completed"
      }),

      Shipment.countDocuments(),

      Shipment.countDocuments({
        status: "Delivered"
      }),

      Shipment.countDocuments({
        status: "Delayed"
      }),

      Drug.countDocuments(),

      Drug.countDocuments({
        status: "Available"
      }),

      Drug.countDocuments({
        status: "Expired"
      }),

      Supplier.countDocuments(),

      Supplier.countDocuments({
        status: "Active"
      }),

      Drug.aggregate([
        {
          $group: {
            _id: null,
            totalQuantity: {
              $sum: "$quantity"
            }
          }
        }
      ])
    ]);

    const orderFulfillment =
      totalOrders > 0
        ? (completedOrders / totalOrders) * 100
        : 0;

    const deliveryDenominator =
      deliveredShipments + delayedShipments;

    const onTimeDelivery =
      deliveryDenominator > 0
        ? (deliveredShipments / deliveryDenominator) * 100
        : 0;

    const stockHealth =
      totalDrugs > 0
        ? (healthyDrugs / totalDrugs) * 100
        : 0;

    const expiryPrevention =
      totalDrugs > 0
        ? ((totalDrugs - expiredDrugs) / totalDrugs) * 100
        : 0;

    const totalInventory =
      inventoryResult.length > 0
        ? inventoryResult[0].totalQuantity
        : 0;

    // Last 4 weeks: orders vs shipped quantities
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(
      fourWeeksAgo.getDate() - 28
    );

    const orderTrend = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: fourWeeksAgo
          }
        }
      },
      {
        $group: {
          _id: {
            $week: "$createdAt"
          },
          quantity: {
            $sum: "$quantity"
          }
        }
      },
      {
        $sort: {
          "_id": 1
        }
      }
    ]);

    const shipmentTrend = await Shipment.aggregate([
      {
        $match: {
          createdAt: {
            $gte: fourWeeksAgo
          }
        }
      },
      {
        $group: {
          _id: {
            $week: "$createdAt"
          },
          quantity: {
            $sum: "$quantity"
          }
        }
      },
      {
        $sort: {
          "_id": 1
        }
      }
    ]);

    const weeks = [];

    for (let i = 3; i >= 0; i--) {
      const date = new Date();
      date.setDate(
        date.getDate() - i * 7
      );

      weeks.push({
        label: `W${4 - i}`,
        week: getWeekNumber(date),
        demand: 0,
        supply: 0
      });
    }

    orderTrend.forEach(item => {
      const week = weeks.find(
        w => w.week === item._id
      );

      if (week) {
        week.demand = item.quantity;
      }
    });

    shipmentTrend.forEach(item => {
      const week = weeks.find(
        w => w.week === item._id
      );

      if (week) {
        week.supply = item.quantity;
      }
    });

    res.json({
      metrics: {
        orderFulfillment: Number(
          orderFulfillment.toFixed(1)
        ),

        onTimeDelivery: Number(
          onTimeDelivery.toFixed(1)
        ),

        stockHealth: Number(
          stockHealth.toFixed(1)
        ),

        expiryPrevention: Number(
          expiryPrevention.toFixed(1)
        )
      },

      inventory: {
        totalMedicines: totalDrugs,
        totalQuantity: totalInventory,
        expired: expiredDrugs
      },

      network: {
        totalSuppliers,
        activeSuppliers,
        totalShipments
      },

      trends: weeks
    });

  } catch (error) {
    console.error("Analytics error:", error);

    res.status(500).json({
      message: "Failed to fetch analytics",
      error: error.message
    });
  }
});

function getWeekNumber(date) {
  const start = new Date(
    date.getFullYear(),
    0,
    1
  );

  return Math.ceil(
    (
      (
        (date - start) /
        86400000
      ) +
      start.getDay() +
      1
    ) / 7
  );
}

module.exports = router;
