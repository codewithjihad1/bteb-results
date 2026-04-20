// Test script for multi-semester API updates
// Run with: node test_multi_semester.js

const BASE_URL = "http://localhost:5000/api";

// Color codes for console output
const colors = {
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[36m",
    reset: "\x1b[0m",
};

function log(message, color = "reset") {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, url, method = "GET", body = null) {
    log(`\nTesting: ${name}`, "blue");
    log(`URL: ${url}`);

    try {
        const options = { method };
        if (body) {
            options.headers = { "Content-Type": "application/json" };
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        const data = await response.json();

        if (data.success) {
            log(`✓ PASS`, "green");
            return data;
        } else {
            log(`✗ FAIL: ${data.message}`, "red");
            return null;
        }
    } catch (error) {
        log(`✗ ERROR: ${error.message}`, "red");
        return null;
    }
}

async function runTests() {
    log("\n========================================", "yellow");
    log("  Multi-Semester API Test Suite", "yellow");
    log("========================================\n", "yellow");

    // Test 1: Get available PDFs
    const pdfs = await testEndpoint(
        "Get Available PDFs",
        `${BASE_URL}/students/pdfs/available`
    );

    if (pdfs && pdfs.data && pdfs.data.length > 0) {
        log(`Found ${pdfs.count} PDF files:`, "green");
        pdfs.data.forEach((pdf) => {
            log(
                `  - ${pdf.fileName} (Semester ${pdf.semester}, Regulation ${pdf.regulation})`,
                "green"
            );
        });
    }

    // Test 2: Import from PDF (5th semester)
    await testEndpoint(
        "Import 5th Semester Students",
        `${BASE_URL}/students/import-from-pdf?semester=5&regulation=2022`,
        "POST"
    );

    // Test 3: Import from PDF (6th semester)
    await testEndpoint(
        "Import 6th Semester Students",
        `${BASE_URL}/students/import-from-pdf?semester=6&regulation=2022`,
        "POST"
    );

    // Test 4: Import from PDF (7th semester)
    await testEndpoint(
        "Import 7th Semester Students",
        `${BASE_URL}/students/import-from-pdf?semester=7&regulation=2022`,
        "POST"
    );

    // Test 5: Get student by roll (all semesters)
    const allResults = await testEndpoint(
        "Get Student All Semesters",
        `${BASE_URL}/students/roll/190002`
    );

    if (allResults && allResults.data) {
        if (Array.isArray(allResults.data)) {
            log(
                `Found ${allResults.count} semester results for student 190002`,
                "green"
            );
        }
    }

    // Test 6: Get student by roll (specific semester)
    await testEndpoint(
        "Get Student 6th Semester",
        `${BASE_URL}/students/roll/190002?semester=6&regulation=2022`
    );

    // Test 7: Search students with semester filter
    const searchResults = await testEndpoint(
        "Search 5th Semester Students (GPA > 3.5)",
        `${BASE_URL}/students/search?semester=5&regulation=2022&minGpa=3.5&limit=5`
    );

    if (searchResults && searchResults.data) {
        log(`Found ${searchResults.pagination.totalRecords} students`, "green");
    }

    // Test 8: Get statistics for 5th semester
    await testEndpoint(
        "Statistics for 5th Semester",
        `${BASE_URL}/students/stats/overview?semester=5&regulation=2022`
    );

    // Test 9: Get statistics for 6th semester
    await testEndpoint(
        "Statistics for 6th Semester",
        `${BASE_URL}/students/stats/overview?semester=6&regulation=2022`
    );

    // Test 10: Get statistics for 7th semester
    await testEndpoint(
        "Statistics for 7th Semester",
        `${BASE_URL}/students/stats/overview?semester=7&regulation=2022`
    );

    // Test 11: Get overall statistics (all semesters)
    await testEndpoint(
        "Overall Statistics",
        `${BASE_URL}/students/stats/overview`
    );

    // Test 12: Search by institute across semesters
    await testEndpoint(
        "Search by Institute (All Semesters)",
        `${BASE_URL}/students/search?instituteCode=11044&limit=10`
    );

    // Test 13: Get top performers (6th semester)
    await testEndpoint(
        "Top 10 Performers",
        `${BASE_URL}/students/top-performers?limit=10`
    );

    log("\n========================================", "yellow");
    log("  Test Suite Complete!", "yellow");
    log("========================================\n", "yellow");
}

// Run the tests
runTests().catch((error) => {
    log(`\nTest suite failed: ${error.message}`, "red");
    process.exit(1);
});
