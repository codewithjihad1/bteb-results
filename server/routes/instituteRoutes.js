const express = require("express");
const router = express.Router();
const { query, param } = require("express-validator");
const instituteController = require("../controllers/instituteController");

// Get all institutes with pagination
router.get(
    "/",
    [
        query("page").optional().isInt({ min: 1 }).toInt(),
        query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
        query("sortBy").optional().isString(),
        query("order").optional().isIn(["asc", "desc"]),
    ],
    instituteController.getAllInstitutes
);

// Get institute by code
router.get(
    "/code/:instituteCode",
    [
        param("instituteCode")
            .notEmpty()
            .withMessage("Institute code is required"),
    ],
    instituteController.getInstituteByCode
);

// Get institute results (all students of an institute)
router.get(
    "/:instituteCode/results",
    [
        param("instituteCode").notEmpty(),
        query("status")
            .optional()
            .isIn(["PASSED", "REFERRED", "WITHHELD", "ABSENT"]),
        query("page").optional().isInt({ min: 1 }).toInt(),
        query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    ],
    instituteController.getInstituteResults
);

// Get institute statistics
router.get(
    "/:instituteCode/statistics",
    [param("instituteCode").notEmpty()],
    instituteController.getInstituteStatistics
);

// Search institutes
router.get(
    "/search",
    [
        query("name").optional().isString(),
        query("location").optional().isString(),
        query("page").optional().isInt({ min: 1 }).toInt(),
        query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    ],
    instituteController.searchInstitutes
);

// Get top performing institutes
router.get(
    "/top-performers",
    [query("limit").optional().isInt({ min: 1, max: 50 }).toInt()],
    instituteController.getTopInstitutes
);

module.exports = router;
