const express = require("express");
const Professor = require("../models/professor");
const { run } = require("svelte/legacy");

const { verifyRole } = require("../../studentService/routes/auth/util");
const { ROLES } = require("../../consts");

const axios = require("axios");
const bcrypt = require("bcryptjs");
const { restrictProfessorToOwnData, professorRateLimiter } = require("./auth/util");

const router = express.Router();
const {professorServiceLogger: professorLogger} = require("../../logging");

// Create a new professor
router.post("/", async (req, res) => {
  
    const professorData = Array.isArray(req.body) ? req.body : [req.body];

    // Ensure all fields are provided
    if (!professorData || professorData.length === 0) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const emailValidation = professorData.map((prof) => prof.email);
    const phoneValidation = professorData.map((prof) => prof.phone);

    try {
    // Check for duplicate email or phone
    const existingProfessor = await Professor.find({
      $or: [{ email: { $in: emailValidation } }, { phone: { $in: phoneValidation } }],
    });
    if (existingProfessor.length > 0) {
      return res.status(400).json({ message: "Email or phone already exists" });
    }

    // Create and save the professor
    // const professor = new Professor(professorData);
    const savedProfessor = await Professor.create(professorData);
    res.status(201).json({ message: "Professor created successfully", savedProfessor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Get all professors
router.get("/", professorRateLimiter, async (req, res) => {
  try {
    const professors = await Professor.find(); // Exclude password
    professorLogger.info(`Fetched all professors from the database.`);
    return res.status(200).json(professors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
    professorLogger.error(`Error fetching professors from database`);
  }
});

// Get the student details
router.get("/studentProfiles", verifyRole([ROLES.PROFESSOR]), professorRateLimiter, async(req, res) => {
  try {
    const authToken = req.headers.authorization;

    const response = await axios.get("http://localhost:5003/api/students", 
      { headers: { Authorization: authToken } });
      professorLogger.info(`Fetched all student profiles from the database.`);
      res.status(200).json(
        {
          message: "Student profiles fetched successfully",
          allStudents: response.data,
        }
      )
  } catch (error) {
    console.error("Error fetching student profiles:", error);
    res.status(500).json({ message: "Unable to fetch student profiles" });
    professorLogger.error(`Error fetching student profiles from database`);
  }
})

// Get a specific professor by ID
router.get("/:professor_id", verifyRole([ROLES.PROFESSOR]), professorRateLimiter, restrictProfessorToOwnData, async (req, res) => {
  try {
    const professor = await Professor.findOne({professor_id: req.params.professor_id}).select("-password"); // Exclude password

    if (!professor) {
      return res.status(404).json({ message: "Professor not found" });
    }
    professorLogger.info(`Fetched professor with ID: ${req.params.professor_id}`);
    res.status(200).json(professor);
  } catch (error) {
    console.error(error);
    // if (error.kind === "ObjectId") {
    //   return res.status(400).json({ message: "Invalid professor ID format" });
    // }
    res.status(500).json({ message: "Server Error", error: error.message });
    professorLogger.error(`Error fetching professor with ID: ${req.params.professor_id}`);
  }
});

router.get("/studentProfiles/:student_id", verifyRole([ROLES.PROFESSOR]), professorRateLimiter, async(req, res) => {
  try {
    const authToken = req.headers.authorization;

    const response = await axios.get(`http://localhost:5003/api/students/${req.params.student_id}`, 
      { headers: { Authorization: authToken } });
      professorLogger.info(`Fetched student data for student ID: ${req.params.student_id}`);
      res.status(200).json({
        message: "Student data fetched successfully",
        studentData: response.data
      })
  }catch (error) {
    console.error("Error fetching student data:", error);
    res.status(500).json({ message: "Unable to fetch student data" });
    professorLogger.error(`Error fetching student data for student ID: ${req.params.student_id}`);
  }
});

// Update a professor
router.put("/:professor_id", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const updatedProfessor = { name, email, phone };
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updatedProfessor.password = await bcrypt.hash(password, salt);
    }

    const professor = await Professor.findOneAndUpdate(
      { professor_id: req.params.professor_id },
      updatedProfessor,
      {
        new: true,
        runValidators: true, // Ensure the updated data adheres to the schema
      }
    );

    if (!professor) {
      return res.status(404).json({ message: "Professor not found" });
    }

    res
      .status(200)
      .json({ message: "Professor updated successfully", professor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Delete a professor
router.delete("/:professor_id", async (req, res) => {
  try {
    const deletedProfessor = await Professor.findOneAndDelete({professor_id: req.params.professor_id});

    if (!deletedProfessor) {
      return res.status(404).json({ message: "Professor not found" });
    }

    res
      .status(200)
      .json({ message: "Professor deleted successfully", deletedProfessor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to delete professor" });
  }
});

// router.delete("/cleanup", async (req, res) => {
//   try {
//     const professor = await Professor.deleteMany({
//       professor_id: { $exists: false }
//     });

//     if (!professor) {
//       return res.status(404).json({ message: "Professor not found" });
//     }

//     res.status(200).json({ 
//       message: "Professor deleted successfully", 
//       deletedCount: professor.deletedCount 
//     }); 
 
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// });

module.exports = router;
