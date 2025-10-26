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
        query("semester")
            .optional()
            .isInt({ min: 3, max: 8 })
            .withMessage("Semester must be between 3 and 8"),
        query("regulation")
            .optional()
            .isIn(["2016", "2022"])
            .withMessage("Regulation must be 2016 or 2022"),
    ],
    studentController.getStudentFromPDF
);

// Batch import all students from PDF to MongoDB
router.post(
    "/import-from-pdf",
    [
        query("semester")
            .optional()
            .isInt({ min: 3, max: 8 })
            .withMessage("Semester must be between 3 and 8"),
        query("regulation")
            .optional()
            .isIn(["2016", "2022"])
            .withMessage("Regulation must be 2016 or 2022"),
    ],
    studentController.importAllStudentsFromPDF
);

// Get individual student result by roll number
router.get(
    "/roll/:rollNumber",
    [
        param("rollNumber")
            .notEmpty()
            .withMessage("Roll number is required")
            .isNumeric()
            .withMessage("Roll number must be numeric"),
        query("semester")
            .optional()
            .isInt({ min: 3, max: 8 })
            .withMessage("Semester must be between 3 and 8"),
        query("regulation")
            .optional()
            .isIn(["2016", "2022"])
            .withMessage("Regulation must be 2016 or 2022"),
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
        query("semester")
            .optional()
            .isInt({ min: 3, max: 8 })
            .withMessage("Semester must be between 3 and 8"),
        query("regulation")
            .optional()
            .isIn(["2016", "2022"])
            .withMessage("Regulation must be 2016 or 2022"),
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
router.get(
    "/stats/overview",
    [
        query("semester")
            .optional()
            .isInt({ min: 3, max: 8 })
            .withMessage("Semester must be between 3 and 8"),
        query("regulation")
            .optional()
            .isIn(["2016", "2022"])
            .withMessage("Regulation must be 2016 or 2022"),
    ],
    studentController.getStudentStatistics
);

// Get available PDF files
router.get("/pdfs/available", studentController.getAvailablePDFs);

module.exports = router;
