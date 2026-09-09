require("dotenv").config();

const mongoose = require("mongoose");
const Medicine = require("./models/Medicine");

const medicines = [
  {
    genericName: "Paracetamol",
    brandName: "Crocin",
    manufacturer: "GlaxoSmithKline",
    dosageForm: "Tablet",
    strength: "500 mg",
    category: "Analgesic / Antipyretic",
    storageConditions: "Store at room temperature",
    prescriptionRequired: false,
    essentialMedicine: true,
    source: "NLEM 2022",
    sourceReference: "National List of Essential Medicines 2022",
    active: true
  },
  {
    genericName: "Ibuprofen",
    brandName: "Brufen",
    manufacturer: "Abbott",
    dosageForm: "Tablet",
    strength: "400 mg",
    category: "NSAID",
    storageConditions: "Store at room temperature",
    prescriptionRequired: false,
    essentialMedicine: true,
    source: "NLEM 2022",
    sourceReference: "National List of Essential Medicines 2022",
    active: true
  },
  {
    genericName: "Amoxicillin",
    brandName: "Mox",
    manufacturer: "Sun Pharmaceutical",
    dosageForm: "Capsule",
    strength: "500 mg",
    category: "Antibiotic",
    storageConditions: "Store in a cool, dry place",
    prescriptionRequired: true,
    essentialMedicine: true,
    source: "NLEM 2022",
    sourceReference: "National List of Essential Medicines 2022",
    active: true
  },
  {
    genericName: "Azithromycin",
    brandName: "Azithral",
    manufacturer: "Alembic Pharmaceuticals",
    dosageForm: "Tablet",
    strength: "500 mg",
    category: "Antibiotic",
    storageConditions: "Store at room temperature",
    prescriptionRequired: true,
    essentialMedicine: true,
    source: "NLEM 2022",
    sourceReference: "National List of Essential Medicines 2022",
    active: true
  },
  {
    genericName: "Amlodipine",
    brandName: "Amlong",
    manufacturer: "Micro Labs",
    dosageForm: "Tablet",
    strength: "5 mg",
    category: "Antihypertensive",
    storageConditions: "Store at room temperature",
    prescriptionRequired: true,
    essentialMedicine: true,
    source: "NLEM 2022",
    sourceReference: "National List of Essential Medicines 2022",
    active: true
  },
  {
    genericName: "Metformin",
    brandName: "Glycomet",
    manufacturer: "USV",
    dosageForm: "Tablet",
    strength: "500 mg",
    category: "Antidiabetic",
    storageConditions: "Store at room temperature",
    prescriptionRequired: true,
    essentialMedicine: true,
    source: "NLEM 2022",
    sourceReference: "National List of Essential Medicines 2022",
    active: true
  },
  {
    genericName: "Omeprazole",
    brandName: "Omez",
    manufacturer: "Dr. Reddy's Laboratories",
    dosageForm: "Capsule",
    strength: "20 mg",
    category: "Gastrointestinal",
    storageConditions: "Store below 25°C",
    prescriptionRequired: true,
    essentialMedicine: true,
    source: "NLEM 2022",
    sourceReference: "National List of Essential Medicines 2022",
    active: true
  },
  {
    genericName: "Cetirizine",
    brandName: "Cetzine",
    manufacturer: "Dr. Reddy's Laboratories",
    dosageForm: "Tablet",
    strength: "10 mg",
    category: "Antihistamine",
    storageConditions: "Store at room temperature",
    prescriptionRequired: false,
    essentialMedicine: false,
    source: "MediChain Reference",
    sourceReference: "",
    active: true
  },
  {
    genericName: "Salbutamol",
    brandName: "Asthalin",
    manufacturer: "Cipla",
    dosageForm: "Inhaler",
    strength: "100 mcg/dose",
    category: "Bronchodilator",
    storageConditions: "Store below 25°C",
    prescriptionRequired: true,
    essentialMedicine: true,
    source: "NLEM 2022",
    sourceReference: "National List of Essential Medicines 2022",
    active: true
  },
  {
    genericName: "Insulin Human",
    brandName: "Actrapid",
    manufacturer: "Novo Nordisk",
    dosageForm: "Injection",
    strength: "40 IU/mL",
    category: "Antidiabetic",
    storageConditions: "Store at 2°C to 8°C",
    prescriptionRequired: true,
    essentialMedicine: true,
    source: "NLEM 2022",
    sourceReference: "National List of Essential Medicines 2022",
    active: true
  }
];

async function seedMedicines() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    await Medicine.deleteMany({});

    const inserted = await Medicine.insertMany(medicines);

    console.log(`Inserted ${inserted.length} medicines`);

    await mongoose.disconnect();

    console.log("Medicine seed completed");
  } catch (error) {
    console.error("Medicine seed error:", error);
    process.exit(1);
  }
}

seedMedicines();
