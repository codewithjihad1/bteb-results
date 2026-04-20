const BTEBResultParser = require("./utils/pdfParser");
const path = require("path");

/**
 * Diagnostic script to check PDF content and find valid roll numbers
 */
async function diagnosePDF() {
    console.log("🔍 Diagnosing PDF file...\n");

    try {
        const pdfPath = path.join(
            __dirname,
            "data/RESULT_6th_2022_Regulation.pdf"
        );
        console.log(`📄 PDF Path: ${pdfPath}\n`);

        const parser = new BTEBResultParser();
        console.log("⏳ Parsing PDF... (this may take a moment)\n");

        const { students, institutes } = await parser.parsePDF(pdfPath);

        console.log("✅ PDF Parsed Successfully!\n");
        console.log("=".repeat(60));
        console.log("📊 STATISTICS");
        console.log("=".repeat(60));
        console.log(`Total Students Found: ${students.length}`);
        console.log(`Total Institutes Found: ${institutes.length}`);
        console.log("");

        // Status breakdown
        const statusCount = students.reduce((acc, s) => {
            acc[s.status] = (acc[s.status] || 0) + 1;
            return acc;
        }, {});

        console.log("📈 Student Status Breakdown:");
        Object.entries(statusCount).forEach(([status, count]) => {
            console.log(`  ${status}: ${count}`);
        });
        console.log("");

        // Show first 10 students
        console.log("=".repeat(60));
        console.log("🎓 FIRST 10 STUDENTS (Sample Roll Numbers)");
        console.log("=".repeat(60));
        students.slice(0, 10).forEach((student, index) => {
            console.log(
                `${index + 1}. Roll: ${student.rollNumber} | Status: ${
                    student.status
                } | Institute: ${student.instituteCode}`
            );
        });
        console.log("");

        // Show passed students
        const passedStudents = students.filter((s) => s.status === "PASSED");
        if (passedStudents.length > 0) {
            console.log("=".repeat(60));
            console.log("✅ SAMPLE PASSED STUDENTS");
            console.log("=".repeat(60));
            passedStudents.slice(0, 5).forEach((student, index) => {
                console.log(`${index + 1}. Roll: ${student.rollNumber}`);
                console.log(`   Institute: ${student.instituteName}`);
                console.log(`   GPA (Sem 6): ${student.gpaData.gpa6}`);
                console.log("");
            });
        }

        // Show referred students
        const referredStudents = students.filter(
            (s) => s.status === "REFERRED"
        );
        if (referredStudents.length > 0) {
            console.log("=".repeat(60));
            console.log("📝 SAMPLE REFERRED STUDENTS");
            console.log("=".repeat(60));
            referredStudents.slice(0, 5).forEach((student, index) => {
                console.log(`${index + 1}. Roll: ${student.rollNumber}`);
                console.log(`   Institute: ${student.instituteName}`);
                console.log(
                    `   Referred Subjects: ${student.referredSubjects.length}`
                );
                console.log("");
            });
        }

        // Check if specific roll number exists
        console.log("=".repeat(60));
        console.log("🔍 CHECKING SPECIFIC ROLL NUMBER: 190002");
        console.log("=".repeat(60));
        const student190002 = students.find((s) => s.rollNumber === "190002");
        if (student190002) {
            console.log("✅ FOUND!");
            console.log(JSON.stringify(student190002, null, 2));
        } else {
            console.log("❌ NOT FOUND in parsed data");
            console.log(
                "\n💡 Suggestion: Try one of the roll numbers listed above"
            );
        }
        console.log("");

        // Show institutes
        console.log("=".repeat(60));
        console.log("🏫 FIRST 5 INSTITUTES");
        console.log("=".repeat(60));
        institutes.slice(0, 5).forEach((inst, index) => {
            const instStudents = students.filter(
                (s) => s.instituteCode === inst.instituteCode
            );
            console.log(`${index + 1}. Code: ${inst.instituteCode}`);
            console.log(`   Name: ${inst.instituteName}`);
            console.log(`   Students: ${instStudents.length}`);
            console.log("");
        });

        // Suggest valid roll numbers
        console.log("=".repeat(60));
        console.log("💡 VALID ROLL NUMBERS TO TEST");
        console.log("=".repeat(60));
        const testRolls = students.slice(0, 10).map((s) => s.rollNumber);
        console.log("Use any of these roll numbers in your API test:");
        testRolls.forEach((roll) => console.log(`  - ${roll}`));
        console.log("");
    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error(error);
    }
}

// Run diagnosis
diagnosePDF();
