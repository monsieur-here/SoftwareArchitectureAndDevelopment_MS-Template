const express = require("express");

const Student = require("../models/student");

const { verifyRole, restrictStudentToOwnData } = require("./auth/util");
const { ROLES } = require("../../consts");
const e = require("express");

const router = express.Router();


router.post("/", async (req, res) => {
    // Object Destructuring for one user data
    // const { name, email, password } = req.body;

    // Preparing data for multiple user creation
    const studentData = Array.isArray(req.body) ? req.body : [req.body];

    // Trying to validate the incoming data
    // if(!name || !email || !password) {
    //     return res.status(400).json({message:" All credentials are required"});
    // }

    if(!studentData || studentData.length === 0) {
        return res.status(400).json({message:" All credentials are required"});
    }
    // Preparing email array for validation
    const emailValidation = studentData.map(student => student.email);

    try{
        // Trying to find if the email exists
        const existingStudent =await Student.find({email :{ $in: emailValidation}});
        if(existingStudent.length > 0){
            return res.status(400).json({message:"Student with this email already exists"});
        }

        // const newStudent = new Student({studentData});
        // console.log("Student before save: ", newStudent);

        const savedStudent = await Student.create(studentData);
        res.status(201).json(savedStudent);
    }
    catch(error){
        res.status(500).json({message: "Unable to create students"});
        console.log(error);
    }

});

router.get("/", verifyRole([ROLES.PROFESSOR, ROLES.ADMIN, ROLES.AUTH_SERVICE]), async (req, res) => {
    try{
        const students = await Student.find();
        res.status(200).json(students);
    }
    catch(error){
        res.status(500).json({message: "Unable to fetch students"});
        console.log(error);
    }
});



router.get("/:student_id", verifyRole([ROLES.STUDENT, ROLES.PROFESSOR]),
  restrictStudentToOwnData, async (req, res) => {
    try{
        
        const student = await Student.findOne({student_id: req.params.student_id});

        if(!student){
            return res.status(404).json({message: "Student not found"});
        }
        res.status(200).json(student);
    }
    catch(error){
        res.status(500).json({message: "Unable to fetch student"});
        console.log(error);
    }
});

router.put("/:student_id", async (req, res) => {
    try{
        const updatedStudent = await Student.findOneAndUpdate(
            {student_id: req.params.student_id}, 
            {name: req.body.name, email: req.body.email}, 
            {new: true});

        if(!updatedStudent){
            return res.status(404).json({message: "Student not found"});
        }
        res.status(200).json({message: "Student updated successfully", data: updatedStudent});

    }catch(error){
        res.status(500).json({message: "Unable to update student"});
        console.log(error);
    }
});

// Delete a student
router.delete("/:student_id", async (req, res) => {
    try{
        const deletedStudent = await Student.findOneAndDelete({student_id: req.params.student_id});

        if(!deletedStudent){
            return res.status(404).json({message: "Student not found"});
        }
        res.status(200).json({message: "Student deleted successfully", data: deletedStudent});

    }catch(error){
        res.status(500).json({message: "Unable to delete student"});
        console.log(error);
    }
});

// router.delete("/cleanup", async (req, res) => {
//     try{
//         const result = await Student.deleteMany({
//             student_id: {$exists : false}
//         });
//         res.status(200).json({
//             message: "All students without student ID deleted successfully",
//             deletedCount: result.deletedCount
//         });
//     }catch(error){
//         res.status(500).json({message: "Unable to delete students"});
//         console.log(error);
//     }
// });

module.exports = router;