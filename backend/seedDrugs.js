const mongoose = require("mongoose");
const Drug = require("./models/Drug");

require("dotenv").config();

const drugs = [
  {
    name: "Paracetamol",
    genericName: "Paracetamol",
    manufacturer: "Sun Pharma",
    batchNumber: "PCM2026A001",
    dosageForm: "Tablet",
    strength: "500 mg",
    storageConditions: "Store at room temperature",
    quantity: 500,
    reorderLevel: 100,
    expiryDate: new Date("2027-12-31"),
    location: "Delhi Central Warehouse",
    status: "Available",
  },
  {
    name: "Amoxicillin",
    genericName: "Amoxicillin",
    manufacturer: "Cipla",
    batchNumber: "AMX2026A002",
    dosageForm: "Capsule",
    strength: "500 mg",
    storageConditions: "Store at room temperature",
    quantity: 250,
    reorderLevel: 50,
    expiryDate: new Date("2027-08-31"),
    location: "Mumbai Medical Warehouse",
    status: "Available",
  },
  {
    name: "Azithromycin",
    genericName: "Azithromycin",
    manufacturer: "Lupin",
    batchNumber: "AZM2026A003",
    dosageForm: "Tablet",
    strength: "500 mg",
    storageConditions: "Store at room temperature",
    quantity: 120,
    reorderLevel: 40,
    expiryDate: new Date("2027-06-30"),
    location: "Bangalore Distribution Center",
    status: "Available",
  },
  {
    name: "Ibuprofen",
    genericName: "Ibuprofen",
    manufacturer: "Abbott",
    batchNumber: "IBU2026A004",
    dosageForm: "Tablet",
    strength: "400 mg",
    storageConditions: "Store at room temperature",
    quantity: 80,
    reorderLevel: 100,
    expiryDate: new Date("2027-10-31"),
    location: "Delhi Central Warehouse",
    status: "Low Stock",
  },
  {
    name: "Metformin",
    genericName: "Metformin",
    manufacturer: "USV",
    batchNumber: "MET2026A005",
    dosageForm: "Tablet",
    strength: "500 mg",
    storageConditions: "Store at room temperature",
    quantity: 350,
    reorderLevel: 75,
    expiryDate: new Date("2028-03-31"),
    location: "Hyderabad Pharma Warehouse",
    status: "Available",
  },
  {
    name: "Cetirizine",
    genericName: "Cetirizine",
    manufacturer: "Dr. Reddy's",
    batchNumber: "CET2026A006",
    dosageForm: "Tablet",
    strength: "10 mg",
    storageConditions: "Store at room temperature",
    quantity: 200,
    reorderLevel: 50,
    expiryDate: new Date("2027-11-30"),
    location: "Mumbai Medical Warehouse",
    status: "Available",
  },
  {
    name: "Omeprazole",
    genericName: "Omeprazole",
    manufacturer: "Torrent Pharma",
    batchNumber: "OME2026A007",
    dosageForm: "Capsule",
    strength: "20 mg",
    storageConditions: "Store at room temperature",
    quantity: 150,
    reorderLevel: 40,
    expiryDate: new Date("2027-09-30"),
    location: "Bangalore Distribution Center",
    status: "Available",
  },
  {
    name: "Insulin",
    genericName: "Human Insulin",
    manufacturer: "Biocon",
    batchNumber: "INS2026A008",
    dosageForm: "Injection",
    strength: "100 IU/mL",
    storageConditions: "Refrigerate at 2-8°C",
    quantity: 35,
    reorderLevel: 20,
    expiryDate: new Date("2027-05-31"),
    location: "Hyderabad Pharma Warehouse",
    status: "Available",
  },
  {
    name: "Aspirin",
    genericName: "Aspirin",
    manufacturer: "Bayer",
    batchNumber: "ASP2026A009",
    dosageForm: "Tablet",
    strength: "75 mg",
    storageConditions: "Store at room temperature",
    quantity: 60,
    reorderLevel: 100,
    expiryDate: new Date("2027-07-31"),
    location: "Delhi Central Warehouse",
    status: "Low Stock",
  },
  {
    name: "ORS",
    genericName: "Oral Rehydration Salts",
    manufacturer: "Cipla",
    batchNumber: "ORS2026A010",
    dosageForm: "Other",
    strength: "21 g",
    storageConditions: "Store in a cool, dry place",
    quantity: 400,
    reorderLevel: 100,
    expiryDate: new Date("2028-01-31"),
    location: "Mumbai Medical Warehouse",
    status: "Available",
  },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    await Drug.deleteMany({});

    await Drug.insertMany(drugs);

    console.log(`${drugs.length} medicines added successfully`);

    await mongoose.connection.close();

    console.log("Database connection closed");
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
};

seedDatabase();