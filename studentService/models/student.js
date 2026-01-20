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

studentSchema.pre("save", async function (next) {
   console.log("Pre-save hook triggered for:", this.email); // Check if this prints
    
    if (!this.isModified('password')) {
        console.log("Password not modified, skipping hash.");
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log("Password successfully hashed.");
    next();
});

// Create the Student model
const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
