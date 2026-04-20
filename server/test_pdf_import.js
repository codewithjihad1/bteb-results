/**
 * Test script for PDF import functionality
 *
 * This script tests:
 * 1. Getting a single student result from PDF and saving to MongoDB
 * 2. Batch importing all students from PDF
 */

const axios = require("axios");

const BASE_URL = "http://localhost:5000/api/students";

// Test colors for console output
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

// Test 1: Get single student from PDF
async function testGetSingleStudent(rollNumber) {
    try {
        log(
            `\n📝 Test 1: Getting student ${rollNumber} from PDF...`,
            colors.blue
        );

        const response = await axios.get(`${BASE_URL}/pdf/${rollNumber}`);

        if (response.data.success) {
            log(`✅ SUCCESS: Student found and saved!`, colors.green);
            log(`Source: ${response.data.source}`);
            log(`Roll Number: ${response.data.data.rollNumber}`);
            log(`Institute: ${response.data.data.instituteName}`);
            log(`Status: ${response.data.data.status}`);
            log(`GPA (Semester 6): ${response.data.data.gpaData.gpa6}`);

            if (
                response.data.data.referredSubjects &&
                response.data.data.referredSubjects.length > 0
            ) {
                log(
                    `Referred Subjects: ${JSON.stringify(
                        response.data.data.referredSubjects
                    )}`
                );
            }
        } else {
            log(`❌ FAILED: ${response.data.message}`, colors.red);
        }

        return response.data;
    } catch (error) {
        if (error.response) {
            log(`❌ ERROR: ${error.response.data.message}`, colors.red);
            if (error.response.data.errors) {
                error.response.data.errors.forEach((err) => {
                    log(`   - ${err.msg}`, colors.red);
                });
            }
        } else {
            log(`❌ ERROR: ${error.message}`, colors.red);
        }
        return null;
    }
}

// Test 2: Batch import all students
async function testBatchImport() {
    try {
        log(
            `\n📦 Test 2: Batch importing all students from PDF...`,
            colors.blue
        );

        const response = await axios.post(`${BASE_URL}/import-from-pdf`);

        if (response.data.success) {
            log(`✅ SUCCESS: Batch import completed!`, colors.green);
            log(
                `Total students in PDF: ${response.data.statistics.totalStudentsInPDF}`
            );
            log(`Inserted: ${response.data.statistics.inserted}`);
            log(`Updated: ${response.data.statistics.updated}`);
            log(`Matched: ${response.data.statistics.matched}`);
        } else {
            log(`❌ FAILED: ${response.data.message}`, colors.red);
        }

        return response.data;
    } catch (error) {
        if (error.response) {
            log(`❌ ERROR: ${error.response.data.message}`, colors.red);
        } else {
            log(`❌ ERROR: ${error.message}`, colors.red);
        }
        return null;
    }
}

// Test 3: Verify student exists in database
async function testGetStudentFromDatabase(rollNumber) {
    try {
        log(
            `\n🔍 Test 3: Verifying student ${rollNumber} exists in database...`,
            colors.blue
        );

        const response = await axios.get(`${BASE_URL}/roll/${rollNumber}`);

        if (response.data.success) {
            log(`✅ SUCCESS: Student found in database!`, colors.green);
            log(`Roll Number: ${response.data.data.rollNumber}`);
            log(`Institute: ${response.data.data.instituteName}`);
            log(`Status: ${response.data.data.status}`);
        } else {
            log(`❌ FAILED: ${response.data.message}`, colors.red);
        }

        return response.data;
    } catch (error) {
        if (error.response) {
            log(`❌ ERROR: ${error.response.data.message}`, colors.red);
        } else {
            log(`❌ ERROR: ${error.message}`, colors.red);
        }
        return null;
    }
}

// Main test runner
async function runTests() {
    log("\n" + "=".repeat(60), colors.yellow);
    log("  BTEB PDF Import Test Suite", colors.yellow);
    log("=".repeat(60) + "\n", colors.yellow);

    // Test with a sample roll number
    const testRollNumber = "123456"; // Replace with actual roll number from PDF

    // Run tests sequentially
    await testGetSingleStudent(testRollNumber);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second

    await testGetStudentFromDatabase(testRollNumber);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second

    // Uncomment to test batch import (this will import ALL students)
    // await testBatchImport();

    log("\n" + "=".repeat(60), colors.yellow);
    log("  Test Suite Completed", colors.yellow);
    log("=".repeat(60) + "\n", colors.yellow);
}

// Check if axios is available
if (!axios) {
    console.error("Please install axios: npm install axios");
    process.exit(1);
}

// Run tests
runTests().catch((error) => {
    console.error("Test suite failed:", error);
    process.exit(1);
});
