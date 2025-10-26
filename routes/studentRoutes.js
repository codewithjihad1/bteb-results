const express = require("express");
const router = express.Router();
const { query, param } = require("express-validator");
const studentController = require("../controllers/studentController");

// Get student result from PDF and save to MongoDB
router.get(
    "/pdf/:rollNumber",
    [
        param("rollNumber")
            .notEmpty()
            .withMessage("Roll number is required")
            .isNumeric()
            .withMessage("Roll number must be numeric")
            .isLength({ min: 6, max: 6 })
            .withMessage("Roll number must be 6 digits"),
    ],
    studentController.getStudentFromPDF
);

// Batch import all students from PDF to MongoDB
router.post("/import-from-pdf", studentController.importAllStudentsFromPDF);

// Get individual student result by roll number
router.get(
    "/roll/:rollNumber",
    [
        param("rollNumber")
            .notEmpty()
            .withMessage("Roll number is required")
            .isNumeric()
            .withMessage("Roll number must be numeric"),
    ],
    studentController.getStudentByRoll
);

// Search students with filters
router.get(
    "/search",
    [
        query("rollNumber").optional().isString(),
        query("instituteCode").optional().isString(),
        query("instituteName").optional().isString(),
        query("status")
            .optional()
            .isIn(["PASSED", "REFERRED", "WITHHELD", "ABSENT"]),
        query("minGpa").optional().isFloat({ min: 0, max: 4 }),
        query("maxGpa").optional().isFloat({ min: 0, max: 4 }),
        query("page").optional().isInt({ min: 1 }).toInt(),
        query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    ],
    studentController.searchStudents
);

// Get all students with pagination
router.get(
    "/",
    [
        query("page").optional().isInt({ min: 1 }).toInt(),
        query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
        query("sortBy").optional().isString(),
        query("order").optional().isIn(["asc", "desc"]),
    ],
    studentController.getAllStudents
);

// Get top performing students
router.get(
    "/top-performers",
    [
        query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
        query("instituteCode").optional().isString(),
    ],
    studentController.getTopPerformers
);

// Get students by status
router.get(
    "/status/:status",
    [
        param("status").isIn(["PASSED", "REFERRED", "WITHHELD", "ABSENT"]),
        query("page").optional().isInt({ min: 1 }).toInt(),
        query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    ],
    studentController.getStudentsByStatus
);

// Get student statistics
router.get("/stats/overview", studentController.getStudentStatistics);

module.exports = router;
