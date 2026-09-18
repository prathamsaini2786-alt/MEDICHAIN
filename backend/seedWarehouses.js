const mongoose = require("mongoose");
const Warehouse = require("./models/Warehouse");

require("dotenv").config();

const warehouses = [
  {
    name: "Delhi Central Warehouse",
    code: "WH-DEL-001",
    location: "New Delhi, Delhi",
    capacity: 10000,
    currentStock: 2450,
    storageConditions: "Store at room temperature",
    status: "Operational",
  },
  {
    name: "Mumbai Medical Warehouse",
    code: "WH-MUM-002",
    location: "Mumbai, Maharashtra",
    capacity: 12000,
    currentStock: 3800,
    storageConditions: "Store at room temperature",
    status: "Operational",
  },
  {
    name: "Bangalore Distribution Center",
    code: "WH-BLR-003",
    location: "Bangalore, Karnataka",
    capacity: 8000,
    currentStock: 2100,
    storageConditions: "Store at room temperature",
    status: "Operational",
  },
  {
    name: "Hyderabad Pharma Warehouse",
    code: "WH-HYD-004",
    location: "Hyderabad, Telangana",
    capacity: 9000,
    currentStock: 1950,
    storageConditions: "Refrigerated storage available",
    status: "Operational",
  },
  {
    name: "Chennai Regional Warehouse",
    code: "WH-CHE-005",
    location: "Chennai, Tamil Nadu",
    capacity: 7500,
    currentStock: 1200,
    storageConditions: "Store at room temperature",
    status: "Operational",
  },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    await Warehouse.deleteMany({});

    await Warehouse.insertMany(warehouses);

    console.log(`${warehouses.length} warehouses added successfully`);

    await mongoose.connection.close();

    console.log("Database connection closed");
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
};

seedDatabase();