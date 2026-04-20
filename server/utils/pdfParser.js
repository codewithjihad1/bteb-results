const fs = require("fs").promises;
const pdfParse = require("pdf-parse");

/**
 * Parse BTEB result PDF and extract student data
 */
class BTEBResultParser {
    constructor() {
        this.institutePattern = /(\d{5})\s*-\s*(.+?)(?=\s+\d{6}|$)/;
        // Dynamic patterns for all semesters (3rd to 8th)
        this.passedPatterns = {
            3: /(\d{6})\s*\(gpa3:\s*([\d.]+),\s*gpa2:\s*([\d.]+),\s*gpa1:\s*([\d.]+)\)/g,
            4: /(\d{6})\s*\(gpa4:\s*([\d.]+),\s*gpa3:\s*([\d.]+),\s*gpa2:\s*([\d.]+),\s*gpa1:\s*([\d.]+)\)/g,
            5: /(\d{6})\s*\(gpa5:\s*([\d.]+),\s*gpa4:\s*([\d.]+),\s*gpa3:\s*([\d.]+),\s*gpa2:\s*([\d.]+),\s*gpa1:\s*([\d.]+)\)/g,
            6: /(\d{6})\s*\(gpa6:\s*([\d.]+),\s*gpa5:\s*([\d.]+),\s*gpa4:\s*([\d.]+),\s*gpa3:\s*([\d.]+),\s*gpa2:\s*([\d.]+),\s*gpa1:\s*([\d.]+)\)/g,
            7: /(\d{6})\s*\(gpa7:\s*([\d.]+),\s*gpa6:\s*([\d.]+),\s*gpa5:\s*([\d.]+),\s*gpa4:\s*([\d.]+),\s*gpa3:\s*([\d.]+),\s*gpa2:\s*([\d.]+),\s*gpa1:\s*([\d.]+)\)/g,
            8: /(\d{6})\s*\(gpa8:\s*([\d.]+),\s*gpa7:\s*([\d.]+),\s*gpa6:\s*([\d.]+),\s*gpa5:\s*([\d.]+),\s*gpa4:\s*([\d.]+),\s*gpa3:\s*([\d.]+),\s*gpa2:\s*([\d.]+),\s*gpa1:\s*([\d.]+)\)/g,
        };
        this.referredPatterns = {
            3: /(\d{6})\s*\{\s*gpa3:\s*([\d.ref]+),\s*gpa2:\s*([\d.ref]+),\s*gpa1:\s*([\d.ref]+),?\s*ref_sub:\s*([^}]+)\}/g,
            4: /(\d{6})\s*\{\s*gpa4:\s*([\d.ref]+),\s*gpa3:\s*([\d.ref]+),\s*gpa2:\s*([\d.ref]+),\s*gpa1:\s*([\d.ref]+),?\s*ref_sub:\s*([^}]+)\}/g,
            5: /(\d{6})\s*\{\s*gpa5:\s*([\d.ref]+),\s*gpa4:\s*([\d.ref]+),\s*gpa3:\s*([\d.ref]+),\s*gpa2:\s*([\d.ref]+),\s*gpa1:\s*([\d.ref]+),?\s*ref_sub:\s*([^}]+)\}/g,
            6: /(\d{6})\s*\{\s*gpa6:\s*([\d.ref]+),\s*gpa5:\s*([\d.ref]+),\s*gpa4:\s*([\d.ref]+),\s*gpa3:\s*([\d.ref]+),\s*gpa2:\s*([\d.ref]+),\s*gpa1:\s*([\d.ref]+),?\s*ref_sub:\s*([^}]+)\}/g,
            7: /(\d{6})\s*\{\s*gpa7:\s*([\d.ref]+),\s*gpa6:\s*([\d.ref]+),\s*gpa5:\s*([\d.ref]+),\s*gpa4:\s*([\d.ref]+),\s*gpa3:\s*([\d.ref]+),\s*gpa2:\s*([\d.ref]+),\s*gpa1:\s*([\d.ref]+),?\s*ref_sub:\s*([^}]+)\}/g,
            8: /(\d{6})\s*\{\s*gpa8:\s*([\d.ref]+),\s*gpa7:\s*([\d.ref]+),\s*gpa6:\s*([\d.ref]+),\s*gpa5:\s*([\d.ref]+),\s*gpa4:\s*([\d.ref]+),\s*gpa3:\s*([\d.ref]+),\s*gpa2:\s*([\d.ref]+),\s*gpa1:\s*([\d.ref]+),?\s*ref_sub:\s*([^}]+)\}/g,
        };
        // Patterns to detect semester and regulation from filename or content
        this.semesterPattern = /(\d)(?:st|nd|rd|th)\s*Semester/i;
        this.regulationPattern = /(\d{4})\s*Regulation/i;
    }

    /**
     * Parse PDF file
     */
    async parsePDF(filePath) {
        try {
            const dataBuffer = await fs.readFile(filePath);
            const data = await pdfParse(dataBuffer);

            // Extract semester and regulation from filename or content
            const metadata = this.extractMetadata(filePath, data.text);

            return this.extractStudentData(data.text, metadata);
        } catch (error) {
            console.error("Error parsing PDF:", error);
            throw error;
        }
    }

    /**
     * Extract semester and regulation metadata from filename or PDF content
     */
    extractMetadata(filePath, text) {
        const metadata = {
            semester: null,
            regulation: null,
            examYear: 2024,
        };

        // Try to extract from filename first
        const filename = filePath.split(/[/\\]/).pop();

        // Extract semester from filename (e.g., RESULT_5th_2022_Regulation.pdf)
        const semesterMatch = filename.match(/(\d)(?:st|nd|rd|th)/i);
        if (semesterMatch) {
            metadata.semester = parseInt(semesterMatch[1]);
        }

        // Extract regulation from filename
        const regulationMatch = filename.match(/(\d{4})/);
        if (regulationMatch) {
            metadata.regulation = regulationMatch[1];
        }

        // If not found in filename, try content
        if (!metadata.semester) {
            const contentSemesterMatch = text.match(this.semesterPattern);
            if (contentSemesterMatch) {
                metadata.semester = parseInt(contentSemesterMatch[1]);
            }
        }

        if (!metadata.regulation) {
            const contentRegulationMatch = text.match(this.regulationPattern);
            if (contentRegulationMatch) {
                metadata.regulation = contentRegulationMatch[1];
            }
        }

        // Default values if not detected
        metadata.semester = metadata.semester || 6;
        metadata.regulation = metadata.regulation || "2022";

        console.log(
            `Detected metadata - Semester: ${metadata.semester}, Regulation: ${metadata.regulation}`
        );
        return metadata;
    }

    /**
     * Extract student data from text
     */
    extractStudentData(text, metadata) {
        const students = [];
        const institutes = new Map();

        let currentInstitute = null;
        const { semester, regulation, examYear } = metadata;

        // Get the appropriate patterns for this semester
        const passedPattern = this.passedPatterns[semester];
        const referredPattern = this.referredPatterns[semester];

        if (!passedPattern || !referredPattern) {
            console.warn(
                `No patterns defined for semester ${semester}, using defaults`
            );
            return { students: [], institutes: [] };
        }

        // First, normalize the text by joining multi-line student records
        const normalizedText = this.normalizeText(text);
        const lines = normalizedText.split("\n");

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Match institute info
            const instituteMatch = line.match(this.institutePattern);
            if (instituteMatch) {
                currentInstitute = {
                    code: instituteMatch[1],
                    name: instituteMatch[2].trim(),
                };

                if (!institutes.has(currentInstitute.code)) {
                    institutes.set(currentInstitute.code, {
                        instituteCode: currentInstitute.code,
                        instituteName: currentInstitute.name,
                        location: this.extractLocation(currentInstitute.name),
                    });
                }
            }

            // Match passed students
            let match;
            passedPattern.lastIndex = 0; // Reset regex
            while ((match = passedPattern.exec(line)) !== null) {
                if (currentInstitute) {
                    students.push(
                        this.createStudentObject(
                            match,
                            currentInstitute,
                            "PASSED",
                            [],
                            semester,
                            regulation,
                            examYear
                        )
                    );
                }
            }

            // Match referred students
            referredPattern.lastIndex = 0; // Reset regex
            while ((match = referredPattern.exec(line)) !== null) {
                if (currentInstitute) {
                    const refSubjectIndex = semester + 2; // Position of ref_sub in match array
                    const refSubjects = this.parseReferredSubjects(
                        match[refSubjectIndex]
                    );
                    students.push(
                        this.createStudentObject(
                            match,
                            currentInstitute,
                            "REFERRED",
                            refSubjects,
                            semester,
                            regulation,
                            examYear
                        )
                    );
                }
            }
        }

        console.log(
            `Extracted ${students.length} students for semester ${semester}, regulation ${regulation}`
        );
        return {
            students,
            institutes: Array.from(institutes.values()),
        };
    }

    /**
     * Normalize text by joining multi-line student records
     */
    normalizeText(text) {
        const lines = text.split("\n");
        const normalizedLines = [];
        let i = 0;

        while (i < lines.length) {
            let line = lines[i].trim();

            // Check if this line starts with a roll number (6 digits)
            if (/^\d{6}\s*[\(\{]/.test(line)) {
                // This is the start of a student record
                // Check if it's complete or spans multiple lines

                // For passed students: look for closing parenthesis
                if (line.includes("(") && !line.includes(")")) {
                    // Multi-line record, join with next line(s)
                    let j = i + 1;
                    while (j < lines.length && !lines[j].includes(")")) {
                        line += " " + lines[j].trim();
                        j++;
                    }
                    if (j < lines.length) {
                        line += " " + lines[j].trim();
                        i = j;
                    }
                }
                // For referred students: look for closing brace
                else if (line.includes("{") && !line.includes("}")) {
                    // Multi-line record, join with next line(s)
                    let j = i + 1;
                    while (j < lines.length && !lines[j].includes("}")) {
                        line += " " + lines[j].trim();
                        j++;
                    }
                    if (j < lines.length) {
                        line += " " + lines[j].trim();
                        i = j;
                    }
                }
            }

            normalizedLines.push(line);
            i++;
        }

        return normalizedLines.join("\n");
    }

    /**
     * Create student object
     */
    createStudentObject(
        match,
        institute,
        status,
        referredSubjects,
        semester,
        regulation,
        examYear
    ) {
        const parseGpa = (value) => {
            if (!value || value === "ref") return null;
            const parsed = parseFloat(value);
            return isNaN(parsed) ? null : parsed;
        };

        // Build GPA data dynamically based on semester
        const gpaData = {};
        for (let i = 1; i <= semester; i++) {
            const gpaValue = match[semester - i + 2]; // GPAs are in reverse order in match
            gpaData[`gpa${i}`] = parseGpa(gpaValue);
        }

        return {
            rollNumber: match[1],
            instituteCode: institute.code,
            instituteName: institute.name,
            semester,
            regulation,
            examYear,
            status,
            gpaData,
            referredSubjects,
            passedAllSubjects: status === "PASSED",
        };
    }

    /**
     * Parse referred subjects
     */
    parseReferredSubjects(refString) {
        if (!refString) return [];

        const subjects = [];
        const subjectPattern = /(\d{5})\(([TP])\)/g;
        let match;

        while ((match = subjectPattern.exec(refString)) !== null) {
            subjects.push({
                subjectCode: match[1],
                subjectType: match[2],
            });
        }

        return subjects;
    }

    /**
     * Extract location from institute name
     */
    extractLocation(instituteName) {
        const locations = [
            "Dhaka",
            "Chittagong",
            "Rajshahi",
            "Khulna",
            "Sylhet",
            "Barisal",
            "Rangpur",
            "Mymensingh",
            "Comilla",
            "Gazipur",
            "Narayanganj",
            "Panchagar",
            "Thakurgaon",
            "Dinajpur",
            "Bogra",
            "Jessore",
        ];

        for (const location of locations) {
            if (instituteName.includes(location)) {
                return location;
            }
        }

        // Extract last word as potential location
        const words = instituteName.split(",");
        return words.length > 1 ? words[words.length - 1].trim() : "Unknown";
    }
}

module.exports = BTEBResultParser;
