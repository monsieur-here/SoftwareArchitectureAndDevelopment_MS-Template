console.log("Student routes loaded");
 
const express = require("express");
 
const Student = require("../models/student");
 
const { verifyRole, restrictStudentToOwnData, jwtRateLimiter } = require("./auth/util");
const { ROLES } = require("../../consts");
 
const router = express.Router(); // Create end point for student routes
const {studentServiceLogger: logger} = require("../../logging")
 
// Create a new Student
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
 console.log("Creating student:", req.body);
    // Ensure all fields are provided
    if (!name || !email  || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
 
    // Check for duplicate email or phone
    const existingStudent = await Student.findOne({
      $or: [{ email }],
    });
    if (existingStudent) {
      return res.status(409).json({ message: "Email or phone already exists" });
    }
 
    // Create and save the Student
    const student = new Student({ name, email, password });
    await student.save();
 
    res
      .status(201)
      .json({ message: "Student created successfully", student });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});
 
// Get all Students
router.get("/",verifyRole([ROLES.ADMIN,ROLES.PROFESSOR,ROLES.AUTH_SERVICE, ROLES.ENROLLMENT_SERVICE]),jwtRateLimiter ,async (req, res) => {
  try {
    const students = await Student.find(); // Exclude password
    logger.info(`Fetched ${students.length} students`);
    return res.status(200).json(students);
  } catch (error) {
    console.error(error);
    logger.error(`Error fetching students: ${error}`);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});
 
// Get a specific student by ID
router.get("/:id",verifyRole([ROLES.ADMIN,ROLES.PROFESSOR,ROLES.AUTH_SERVICE, ROLES.STUDENT]), async (req, res) => {
  try {
    const students = await Student.findById(req.params.id).select(
      "-password"
    );
 
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
 
    res.status(200).json(student);
  } catch (error) {
    console.error(error);
    if (error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid student ID format" });
    }
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});
 
// Update a student
router.put("/:id",verifyRole([ROLES.ADMIN, ROLES.STUDENT]), async (req, res) => {
  try {
    const { name, email, password } = req.body;
 
    const updatedData = { name, email };
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updatedData.password = await bcrypt.hash(password, salt);
    }
 
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      updatedData,
      {
        new: true,
      }
    );
 
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
 
    res
      .status(200)
      .json({ message: "Student updated successfully", student });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});
 
// Delete a student
router.delete("/:id",verifyRole([ROLES.ADMIN]), async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
 
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
 
    res
      .status(200)
      .json({ message: "Student deleted successfully", student });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});
 
module.exports = router;
 
 