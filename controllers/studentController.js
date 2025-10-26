const { validationResult } = require("express-validator");
const Student = require("../models/Student");
const BTEBResultParser = require("../utils/pdfParser");
const path = require("path");

// Get student result from PDF and save to MongoDB
exports.getStudentFromPDF = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array(),
            });
        }

        const { rollNumber } = req.params;
        const { semester, regulation } = req.query;

        // Check if student already exists in database
        let student = await Student.findByRollNumber(
            rollNumber,
            semester,
            regulation
        );

        if (student) {
            return res.status(200).json({
                success: true,
                message: "Student found in database",
                data: student,
                source: "database",
            });
        }

        // Determine PDF path based on parameters
        const pdfFileName = this.determinePDFFileName(semester, regulation);
        const pdfPath = path.join(__dirname, "../data", pdfFileName);

        // Check if PDF file exists
        const fs = require("fs");
        if (!fs.existsSync(pdfPath)) {
            return res.status(404).json({
                success: false,
                message: `PDF file not found for semester ${
                    semester || "N/A"
                }, regulation ${regulation || "N/A"}`,
                pdfFileName,
            });
        }

        const parser = new BTEBResultParser();

        console.log(
            `Parsing PDF: ${pdfFileName} for roll number: ${rollNumber}`
        );
        const { students, institutes } = await parser.parsePDF(pdfPath);

        // Find the specific student in parsed data
        const foundStudent = students.find((s) => s.rollNumber === rollNumber);

        if (!foundStudent) {
            return res.status(404).json({
                success: false,
                message: "Student not found in PDF",
                rollNumber: rollNumber,
            });
        }

        // Save student to database
        student = new Student(foundStudent);
        await student.save();

        console.log(`Student ${rollNumber} saved to database`);

        res.status(201).json({
            success: true,
            message: "Student found in PDF and saved to database",
            data: student,
            source: "pdf",
        });
    } catch (error) {
        console.error("Error in getStudentFromPDF:", error);
        res.status(500).json({
            success: false,
            message: "Server error while processing PDF",
            error: error.message,
        });
    }
};

// Helper function to determine PDF filename
exports.determinePDFFileName = (semester, regulation) => {
    const sem = semester || "1";
    const reg = regulation || "2022";

    // Convert semester number to ordinal
    const ordinals = {
        1: "1st",
        2: "2nd",
        3: "3rd",
        4: "4th",
        5: "5th",
        6: "6th",
        7: "7th",
        8: "8th",
    };
    const semesterOrdinal = ordinals[sem] || `${sem}th`;

    return `RESULT_${semesterOrdinal}_${reg}_Regulation.pdf`;
};

// Batch import all students from PDF to MongoDB
exports.importAllStudentsFromPDF = async (req, res) => {
    try {
        const { semester, regulation } = req.body;

        // Determine PDF path
        const pdfFileName = exports.determinePDFFileName(semester, regulation);
        const pdfPath = path.join(__dirname, "../data", pdfFileName);

        // Check if PDF file exists
        const fs = require("fs");
        if (!fs.existsSync(pdfPath)) {
            return res.status(404).json({
                success: false,
                message: `PDF file not found: ${pdfFileName}`,
            });
        }

        const parser = new BTEBResultParser();

        console.log(`Starting batch import from PDF: ${pdfFileName}...`);
        const { students, institutes } = await parser.parsePDF(pdfPath);

        console.log(`Found ${students.length} students in PDF`);

        // Use bulkWrite for efficient insertion with upsert
        const operations = students.map((student) => ({
            updateOne: {
                filter: {
                    rollNumber: student.rollNumber,
                    semester: student.semester,
                    regulation: student.regulation,
                },
                update: { $set: student },
                upsert: true,
            },
        }));

        const result = await Student.bulkWrite(operations);

        console.log(
            `Batch import completed. Inserted: ${result.upsertedCount}, Updated: ${result.modifiedCount}`
        );

        res.status(200).json({
            success: true,
            message: "Batch import completed successfully",
            pdfFile: pdfFileName,
            statistics: {
                totalStudentsInPDF: students.length,
                inserted: result.upsertedCount,
                updated: result.modifiedCount,
                matched: result.matchedCount,
            },
        });
    } catch (error) {
        console.error("Error in importAllStudentsFromPDF:", error);
        res.status(500).json({
            success: false,
            message: "Server error during batch import",
            error: error.message,
        });
    }
};

// Get student by roll number
exports.getStudentByRoll = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array(),
            });
        }

        const { rollNumber } = req.params;
        const { semester, regulation } = req.query;

        const student = await Student.findByRollNumber(
            rollNumber,
            semester,
            regulation
        );

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found with this roll number",
                filters: { rollNumber, semester, regulation },
            });
        }

        // If no specific semester/regulation provided, return all results for this roll
        if (!semester && !regulation && Array.isArray(student)) {
            return res.status(200).json({
                success: true,
                message: "Multiple results found for this roll number",
                count: student.length,
                data: student,
            });
        }

        res.status(200).json({
            success: true,
            data: student,
        });
    } catch (error) {
        console.error("Error in getStudentByRoll:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// Search students with multiple filters
exports.searchStudents = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array(),
            });
        }

        const {
            rollNumber,
            instituteCode,
            instituteName,
            status,
            semester,
            regulation,
            minGpa,
            maxGpa,
            page = 1,
            limit = 20,
        } = req.query;

        // Build query
        const query = {};

        if (rollNumber) {
            query.rollNumber = new RegExp(rollNumber, "i");
        }

        if (instituteCode) {
            query.instituteCode = instituteCode;
        }

        if (instituteName) {
            query.instituteName = new RegExp(instituteName, "i");
        }

        if (status) {
            query.status = status;
        }

        if (semester) {
            query.semester = parseInt(semester);
        }

        if (regulation) {
            query.regulation = regulation;
        }

        // Dynamic GPA filtering based on semester
        if (minGpa || maxGpa) {
            const gpaField = semester ? `gpaData.gpa${semester}` : "cgpa";
            query[gpaField] = {};
            if (minGpa) query[gpaField].$gte = parseFloat(minGpa);
            if (maxGpa) query[gpaField].$lte = parseFloat(maxGpa);
        }

        const skip = (page - 1) * limit;

        // Sort by semester-specific GPA or CGPA
        const sortField = semester ? `gpaData.gpa${semester}` : "cgpa";
        const students = await Student.find(query)
            .sort({ [sortField]: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await Student.countDocuments(query);

        res.status(200).json({
            success: true,
            data: students,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit: parseInt(limit),
            },
            filters: { semester, regulation, status, instituteCode },
        });
    } catch (error) {
        console.error("Error in searchStudents:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// Get all students with pagination
exports.getAllStudents = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            sortBy = "rollNumber",
            order = "asc",
        } = req.query;

        const skip = (page - 1) * limit;
        const sortOrder = order === "desc" ? -1 : 1;

        const students = await Student.find()
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await Student.countDocuments();

        res.status(200).json({
            success: true,
            data: students,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        console.error("Error in getAllStudents:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// Get top performing students
exports.getTopPerformers = async (req, res) => {
    try {
        const { limit = 10, instituteCode } = req.query;

        const query = instituteCode ? { instituteCode } : {};

        const students = await Student.find(query)
            .sort({ "gpaData.gpa6": -1, cgpa: -1 })
            .limit(parseInt(limit))
            .lean();

        res.status(200).json({
            success: true,
            data: students,
            count: students.length,
        });
    } catch (error) {
        console.error("Error in getTopPerformers:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// Get students by status
exports.getStudentsByStatus = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array(),
            });
        }

        const { status } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const skip = (page - 1) * limit;

        const students = await Student.find({ status })
            .sort({ rollNumber: 1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await Student.countDocuments({ status });

        res.status(200).json({
            success: true,
            data: students,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        console.error("Error in getStudentsByStatus:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// Get student statistics
exports.getStudentStatistics = async (req, res) => {
    try {
        const { semester, regulation } = req.query;
        const query = {};

        if (semester) query.semester = parseInt(semester);
        if (regulation) query.regulation = regulation;

        const totalStudents = await Student.countDocuments(query);
        const passedStudents = await Student.countDocuments({
            ...query,
            status: "PASSED",
        });
        const referredStudents = await Student.countDocuments({
            ...query,
            status: "REFERRED",
        });
        const withheldStudents = await Student.countDocuments({
            ...query,
            status: "WITHHELD",
        });
        const absentStudents = await Student.countDocuments({
            ...query,
            status: "ABSENT",
        });

        // Get GPA distribution for specific semester or overall
        const gpaField = semester ? `gpaData.gpa${semester}` : "cgpa";
        const gpaDistribution = await Student.aggregate([
            { $match: query },
            {
                $bucket: {
                    groupBy: `$${gpaField}`,
                    boundaries: [0, 2.0, 2.5, 3.0, 3.5, 4.0, 5.0],
                    default: "Other",
                    output: {
                        count: { $sum: 1 },
                    },
                },
            },
        ]);

        // Get average GPA
        const avgGpaResult = await Student.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    avgGpa: { $avg: `$${gpaField}` },
                },
            },
        ]);

        const statistics = {
            filters: { semester, regulation },
            total: totalStudents,
            passed: passedStudents,
            referred: referredStudents,
            withheld: withheldStudents,
            absent: absentStudents,
            passPercentage:
                totalStudents > 0
                    ? ((passedStudents / totalStudents) * 100).toFixed(2)
                    : 0,
            averageGpa:
                avgGpaResult.length > 0 ? avgGpaResult[0].avgGpa.toFixed(2) : 0,
            gpaDistribution,
        };

        res.status(200).json({
            success: true,
            data: statistics,
        });
    } catch (error) {
        console.error("Error in getStudentStatistics:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// Get available PDF files and their metadata
exports.getAvailablePDFs = async (req, res) => {
    try {
        const fs = require("fs");
        const dataPath = path.join(__dirname, "../data");

        // Read all PDF files in data directory
        const files = fs
            .readdirSync(dataPath)
            .filter((file) => file.endsWith(".pdf"));

        const pdfMetadata = files
            .map((file) => {
                const semesterMatch = file.match(/(\d)(?:st|nd|rd|th)/i);
                const regulationMatch = file.match(/(\d{4})/);

                return {
                    fileName: file,
                    semester: semesterMatch ? parseInt(semesterMatch[1]) : null,
                    regulation: regulationMatch ? regulationMatch[1] : null,
                    path: `/data/${file}`,
                };
            })
            .filter((meta) => meta.semester && meta.regulation);

        res.status(200).json({
            success: true,
            count: pdfMetadata.length,
            data: pdfMetadata,
        });
    } catch (error) {
        console.error("Error in getAvailablePDFs:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};
