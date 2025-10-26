const mongoose = require("mongoose");

const instituteSchema = new mongoose.Schema(
    {
        instituteCode: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
        },
        instituteName: {
            type: String,
            required: true,
            trim: true,
        },
        location: {
            type: String,
            trim: true,
        },
        totalStudents: {
            type: Number,
            default: 0,
        },
        passedStudents: {
            type: Number,
            default: 0,
        },
        referredStudents: {
            type: Number,
            default: 0,
        },
        passPercentage: {
            type: Number,
            default: 0,
        },
        technologies: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

// Index for text search
instituteSchema.index({ instituteName: "text", location: "text" });

// Method to update statistics
instituteSchema.methods.updateStatistics = async function () {
    const Student = mongoose.model("Student");

    const total = await Student.countDocuments({
        instituteCode: this.instituteCode,
    });
    const passed = await Student.countDocuments({
        instituteCode: this.instituteCode,
        status: "PASSED",
    });
    const referred = await Student.countDocuments({
        instituteCode: this.instituteCode,
        status: "REFERRED",
    });

    this.totalStudents = total;
    this.passedStudents = passed;
    this.referredStudents = referred;
    this.passPercentage = total > 0 ? ((passed / total) * 100).toFixed(2) : 0;

    return this.save();
};

const Institute = mongoose.model("Institute", instituteSchema);

module.exports = Institute;
