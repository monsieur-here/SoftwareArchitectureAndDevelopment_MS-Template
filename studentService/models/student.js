const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const autoIncrement = require("mongoose-sequence")(mongoose);

// Define the Student Schema
const studentSchema = new mongoose.Schema({
    student_id: {
        type: Number,
        unique:true,
    },

    name: {
        type: String,
        required: true,
        trim:true, // Remove leading/trailing whitespace
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },

    password: {
        type: String,
        required: true,
        minLength: 6,
    },
});

studentSchema.plugin(autoIncrement, {inc_field: 'student_id'});

// Create the Student model
const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
