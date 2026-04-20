const mongoose = require("mongoose");

const semesterGpaSchema = new mongoose.Schema(
    {
        gpa1: { type: Number, default: null },
        gpa2: { type: Number, default: null },
        gpa3: { type: Number, default: null },
        gpa4: { type: Number, default: null },
        gpa5: { type: Number, default: null },
        gpa6: { type: Number, default: null },
        gpa7: { type: Number, default: null },
        gpa8: { type: Number, default: null },
    },
    { _id: false }
);

const referredSubjectSchema = new mongoose.Schema(
    {
        subjectCode: { type: String, required: true },
        subjectType: { type: String, enum: ["T", "P"], default: "T" },
    },
    { _id: false }
);

const studentSchema = new mongoose.Schema(
    {
        rollNumber: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
        },
        instituteCode: {
            type: String,
            required: true,
            index: true,
            trim: true,
        },
        instituteName: {
            type: String,
            required: true,
            trim: true,
        },
        semester: {
            type: Number,
            required: true,
            min: 1,
            max: 8,
            index: true,
        },
        regulation: {
            type: String,
            required: true,
            enum: ["2016", "2022"],
            index: true,
        },
        examYear: {
            type: Number,
            required: true,
            default: 2024,
        },
        status: {
            type: String,
            enum: ["PASSED", "REFERRED", "WITHHELD", "ABSENT"],
            required: true,
            index: true,
        },
        gpaData: {
            type: semesterGpaSchema,
            required: true,
        },
        cgpa: {
            type: Number,
            default: null,
        },
        referredSubjects: {
            type: [referredSubjectSchema],
            default: [],
        },
        passedAllSubjects: {
            type: Boolean,
            default: false,
        },
        technology: {
            type: String,
            trim: true,
            index: true,
        },
        shift: {
            type: String,
            enum: ["DAY", "EVENING"],
            default: "DAY",
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes for fast search
studentSchema.index(
    { rollNumber: 1, semester: 1, regulation: 1 },
    { unique: true }
);
studentSchema.index({ instituteCode: 1, semester: 1, regulation: 1 });
studentSchema.index({ instituteName: "text" });
studentSchema.index({ status: 1, instituteCode: 1 });
studentSchema.index({ semester: 1, regulation: 1 });
studentSchema.index({ "gpaData.gpa6": -1 });
studentSchema.index({ "gpaData.gpa7": -1 });

// Virtual for calculating average GPA
studentSchema.virtual("averageGpa").get(function () {
    const gpas = [
        this.gpaData.gpa1,
        this.gpaData.gpa2,
        this.gpaData.gpa3,
        this.gpaData.gpa4,
        this.gpaData.gpa5,
        this.gpaData.gpa6,
        this.gpaData.gpa7,
        this.gpaData.gpa8,
    ].filter(
        (gpa) =>
            gpa !== null &&
            gpa !== undefined &&
            typeof gpa === "number" &&
            !isNaN(gpa)
    );

    if (gpas.length === 0) return null;
    return (gpas.reduce((sum, gpa) => sum + gpa, 0) / gpas.length).toFixed(2);
});

// Virtual for getting current semester GPA
studentSchema.virtual("currentSemesterGpa").get(function () {
    const gpaKey = `gpa${this.semester}`;
    return this.gpaData[gpaKey] || null;
});

// Method to check if student has referred subjects
studentSchema.methods.hasReferredSubjects = function () {
    return this.referredSubjects && this.referredSubjects.length > 0;
};

// Static method to find by roll number (with optional semester and regulation)
studentSchema.statics.findByRollNumber = function (
    rollNumber,
    semester = null,
    regulation = null
) {
    const query = { rollNumber: rollNumber.toString().trim() };
    if (semester) query.semester = parseInt(semester);
    if (regulation) query.regulation = regulation;
    return semester || regulation ? this.findOne(query) : this.find(query);
};

// Static method to find by institute
studentSchema.statics.findByInstitute = function (instituteCode) {
    return this.find({ instituteCode: instituteCode.toString().trim() });
};

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
