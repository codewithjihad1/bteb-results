const { validationResult } = require("express-validator");
const Institute = require("../models/Institute");
const Student = require("../models/Student");

// Get all institutes
exports.getAllInstitutes = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            sortBy = "instituteCode",
            order = "asc",
        } = req.query;

        const skip = (page - 1) * limit;
        const sortOrder = order === "desc" ? -1 : 1;

        const institutes = await Institute.find()
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await Institute.countDocuments();

        res.status(200).json({
            success: true,
            data: institutes,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        console.error("Error in getAllInstitutes:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// Get institute by code
exports.getInstituteByCode = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array(),
            });
        }

        const { instituteCode } = req.params;

        const institute = await Institute.findOne({ instituteCode });

        if (!institute) {
            return res.status(404).json({
                success: false,
                message: "Institute not found",
            });
        }

        res.status(200).json({
            success: true,
            data: institute,
        });
    } catch (error) {
        console.error("Error in getInstituteByCode:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// Get institute results (all students)
exports.getInstituteResults = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array(),
            });
        }

        const { instituteCode } = req.params;
        const { status, page = 1, limit = 20 } = req.query;

        const query = { instituteCode };
        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const students = await Student.find(query)
            .sort({ rollNumber: 1 })
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
        });
    } catch (error) {
        console.error("Error in getInstituteResults:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// Get institute statistics
exports.getInstituteStatistics = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array(),
            });
        }

        const { instituteCode } = req.params;

        const institute = await Institute.findOne({ instituteCode });

        if (!institute) {
            return res.status(404).json({
                success: false,
                message: "Institute not found",
            });
        }

        const totalStudents = await Student.countDocuments({ instituteCode });
        const passedStudents = await Student.countDocuments({
            instituteCode,
            status: "PASSED",
        });
        const referredStudents = await Student.countDocuments({
            instituteCode,
            status: "REFERRED",
        });
        const withheldStudents = await Student.countDocuments({
            instituteCode,
            status: "WITHHELD",
        });

        // Get average GPA for institute
        const avgGpaResult = await Student.aggregate([
            { $match: { instituteCode } },
            {
                $group: {
                    _id: null,
                    avgGpa: { $avg: "$gpaData.gpa6" },
                },
            },
        ]);

        // Get top performers
        const topPerformers = await Student.find({ instituteCode })
            .sort({ "gpaData.gpa6": -1 })
            .limit(5)
            .lean();

        const statistics = {
            institute: {
                code: institute.instituteCode,
                name: institute.instituteName,
                location: institute.location,
            },
            students: {
                total: totalStudents,
                passed: passedStudents,
                referred: referredStudents,
                withheld: withheldStudents,
                passPercentage:
                    totalStudents > 0
                        ? ((passedStudents / totalStudents) * 100).toFixed(2)
                        : 0,
            },
            averageGpa:
                avgGpaResult.length > 0 ? avgGpaResult[0].avgGpa.toFixed(2) : 0,
            topPerformers,
        };

        res.status(200).json({
            success: true,
            data: statistics,
        });
    } catch (error) {
        console.error("Error in getInstituteStatistics:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// Search institutes
exports.searchInstitutes = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array(),
            });
        }

        const { name, location, page = 1, limit = 20 } = req.query;

        const query = {};

        if (name) {
            query.instituteName = new RegExp(name, "i");
        }

        if (location) {
            query.location = new RegExp(location, "i");
        }

        const skip = (page - 1) * limit;

        const institutes = await Institute.find(query)
            .sort({ instituteName: 1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await Institute.countDocuments(query);

        res.status(200).json({
            success: true,
            data: institutes,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        console.error("Error in searchInstitutes:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// Get top performing institutes
exports.getTopInstitutes = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const institutes = await Institute.find()
            .sort({ passPercentage: -1, totalStudents: -1 })
            .limit(parseInt(limit))
            .lean();

        res.status(200).json({
            success: true,
            data: institutes,
            count: institutes.length,
        });
    } catch (error) {
        console.error("Error in getTopInstitutes:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};
