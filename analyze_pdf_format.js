const fs = require("fs").promises;
const pdfParse = require("pdf-parse");
const path = require("path");

/**
 * Extract and display raw PDF text to understand the format
 */
async function analyzePDFFormat() {
    console.log("🔍 Analyzing PDF Format...\n");

    try {
        const pdfPath = path.join(
            __dirname,
            "data/RESULT_6th_2022_Regulation.pdf"
        );
        const dataBuffer = await fs.readFile(pdfPath);
        const data = await pdfParse(dataBuffer);

        console.log("=".repeat(80));
        console.log("📄 PDF TEXT SAMPLE (First 3000 characters)");
        console.log("=".repeat(80));
        console.log(data.text.substring(0, 3000));
        console.log("\n...(truncated)\n");

        console.log("=".repeat(80));
        console.log("📊 PDF STATISTICS");
        console.log("=".repeat(80));
        console.log(`Total Pages: ${data.numpages}`);
        console.log(`Total Characters: ${data.text.length}`);
        console.log(`Total Lines: ${data.text.split("\n").length}`);
        console.log("");

        // Find lines that look like roll numbers (6 digits)
        console.log("=".repeat(80));
        console.log("🔍 SEARCHING FOR ROLL NUMBER PATTERNS");
        console.log("=".repeat(80));
        const lines = data.text.split("\n");
        const rollNumberPattern = /\b\d{6}\b/;
        const linesWithRollNumbers = [];

        for (
            let i = 0;
            i < lines.length && linesWithRollNumbers.length < 10;
            i++
        ) {
            if (rollNumberPattern.test(lines[i])) {
                linesWithRollNumbers.push({
                    lineNumber: i + 1,
                    content: lines[i].trim(),
                });
            }
        }

        if (linesWithRollNumbers.length > 0) {
            console.log("Found lines with 6-digit patterns:");
            linesWithRollNumbers.forEach(({ lineNumber, content }) => {
                console.log(`\nLine ${lineNumber}:`);
                console.log(`"${content}"`);
            });
        } else {
            console.log("❌ No 6-digit roll number patterns found");
        }

        // Look for institute patterns
        console.log("\n" + "=".repeat(80));
        console.log("🏫 SEARCHING FOR INSTITUTE PATTERNS");
        console.log("=".repeat(80));
        const institutePattern = /\d{5}\s*-\s*.+/;
        const linesWithInstitutes = [];

        for (
            let i = 0;
            i < lines.length && linesWithInstitutes.length < 5;
            i++
        ) {
            if (institutePattern.test(lines[i])) {
                linesWithInstitutes.push({
                    lineNumber: i + 1,
                    content: lines[i].trim(),
                });
            }
        }

        if (linesWithInstitutes.length > 0) {
            console.log("Found lines with institute patterns:");
            linesWithInstitutes.forEach(({ lineNumber, content }) => {
                console.log(`\nLine ${lineNumber}:`);
                console.log(`"${content}"`);
            });
        }

        // Look for GPA patterns
        console.log("\n" + "=".repeat(80));
        console.log("📊 SEARCHING FOR GPA PATTERNS");
        console.log("=".repeat(80));
        const gpaPattern = /gpa\d?:\s*[\d.]+/i;
        const linesWithGPA = [];

        for (let i = 0; i < lines.length && linesWithGPA.length < 10; i++) {
            if (gpaPattern.test(lines[i])) {
                linesWithGPA.push({
                    lineNumber: i + 1,
                    content: lines[i].trim(),
                });
            }
        }

        if (linesWithGPA.length > 0) {
            console.log("Found lines with GPA patterns:");
            linesWithGPA.forEach(({ lineNumber, content }) => {
                console.log(`\nLine ${lineNumber}:`);
                console.log(`"${content}"`);
            });
        }

        // Save a portion to file for manual inspection
        console.log("\n" + "=".repeat(80));
        console.log("💾 SAVING SAMPLE TO FILE");
        console.log("=".repeat(80));
        const samplePath = path.join(__dirname, "data/pdf_text_sample.txt");
        await fs.writeFile(samplePath, data.text.substring(0, 10000), "utf-8");
        console.log(`✅ Saved first 10,000 characters to: ${samplePath}`);
        console.log(
            "You can open this file to see the exact format of the PDF text."
        );
    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error(error);
    }
}

// Run analysis
analyzePDFFormat();
