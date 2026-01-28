const express = require("express");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

const {
  generateJWTWithPrivateKey,
  fetchStudents,
  fetchProfessors,
} = require("./util");
const { ROLES } = require("../../../consts");

const router = express.Router();

dotenv.config();

// Student Login
router.post("/student", async (req, res) => {

  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Fetch the list of students
    const students = await fetchStudents();
    const student = students.find((s) => s.email === email);

    // Assignment 1 - Verify if the student exists
    // If not throw the correct error message
    // ----
    // Also check if the password matches. Hint: Use bcrypt.compare()
    // If not, throw the correct error message
    // ----


    const isValidPassword = await bcrypt.compare(password, student.password);

    if(!isValidPassword) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // This is a payload
    const token = generateJWTWithPrivateKey({
    id: student.student_id,
    roles: [ROLES.STUDENT]
   });

   res.status(200).json({accessToken: token, 
                        user : {
                          id: student.student_id, 
                          name: student.name
                        }
                      }
   )

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// Professor Login
router.post("/professor", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    
    const professors = await fetchProfessors();
    const professor = professors.find((p) => p.email === email);

    if (!professor) {
      return res.status(400).json({ message: "Invalid professor credentials" });
    }

    // Compare the raw password to the stored hash
    const isValidPassword = await bcrypt.compare(req.body.password, professor.password);

    if (!isValidPassword) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    // This is a payload
    const token = generateJWTWithPrivateKey({
      id: professor.professor_id,
      roles: [ROLES.PROFESSOR],
    });
    res.status(200).json({ accessToken: token, 
                          user : {
                            id: professor.professor_id,
                            name: professor.name
                          }
                       }
    );

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
