/**
 * Utility script to seed the database with sample verification data
 * Run with: node utils/seedDummyData.js
 */

require("dotenv").config({ path: ".env" });
const mongoose = require("mongoose");
const connectDb = require("../config/db");

// Sample data
const dummyVerificationData = [
  {
    idNumber: "ID12345678",
    firstName: "John",
    lastName: "Doe",
    dateOfBirth: "1990-01-15",
    address: {
      street: "123 Main St",
      city: "Anytown",
      state: "California",
      postalCode: "12345",
      country: "USA",
    },
    isValid: true,
  },
  {
    idNumber: "ID87654321",
    firstName: "Jane",
    lastName: "Smith",
    dateOfBirth: "1992-05-20",
    address: {
      street: "456 Oak Ave",
      city: "Somewhere",
      state: "New York",
      postalCode: "54321",
      country: "USA",
    },
    isValid: true,
  },
  {
    idNumber: "ID11223344",
    firstName: "Alice",
    lastName: "Johnson",
    dateOfBirth: "1988-11-30",
    address: {
      street: "789 Pine Rd",
      city: "Elsewhere",
      state: "Texas",
      postalCode: "67890",
      country: "USA",
    },
    isValid: true,
  },
  {
    idNumber: "ID99887766",
    firstName: "Bob",
    lastName: "Williams",
    dateOfBirth: "1995-07-08",
    address: {
      street: "321 Elm St",
      city: "Nowhere",
      state: "Florida",
      postalCode: "13579",
      country: "USA",
    },
    isValid: false, // Example of an invalid ID
  },
];

// Define the dummy verification schema
const DummyVerificationSchema = new mongoose.Schema({
  idNumber: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  isValid: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Function to seed data
const seedData = async () => {
  try {
    // Connect to database
    await connectDb();
    console.log("Connected to database");

    // Get or create the model
    const DummyVerification =
      mongoose.models.DummyVerification ||
      mongoose.model("DummyVerification", DummyVerificationSchema);

    // Clear existing data
    await DummyVerification.deleteMany({});
    console.log("Cleared existing dummy verification data");

    // Insert new data
    await DummyVerification.insertMany(dummyVerificationData);
    console.log(
      `Successfully added ${dummyVerificationData.length} dummy verification records`
    );

    // Disconnect
    await mongoose.disconnect();
    console.log("Disconnected from database");

    console.log("Seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

// Run the seeding function
seedData();
