// Library Imports
const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
// Function Import
const connectDB = require("./config/db");
const studentRoutes = require("./routes/studentRoute");

const { correlationIdMiddleware } = require("../correlationId");

// Load environment variables from .env file
dotenv.config();

// Initialize the app
const app = express();

// Connect to the database
connectDB();

// Middleware to parse JSON requests
app.use(express.json());
app.use(correlationIdMiddleware);

// Routes
app.use("/api/students", studentRoutes);

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
    console.log(`Student Service is running on port ${PORT}`);
})