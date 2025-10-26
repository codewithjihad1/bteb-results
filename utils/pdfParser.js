const fs = require("fs").promises;
const pdfParse = require("pdf-parse");

/**
 * Parse BTEB result PDF and extract student data
 */
class BTEBResultParser {
    constructor() {
        this.institutePattern = /(\d{5})\s*-\s*(.+?)(?=\s+\d{6}|$)/;
        this.passedPattern =
            /(\d{6})\s*\(gpa6:\s*([\d.]+),\s*gpa5:\s*([\d.]+),\s*gpa4:\s*([\d.]+),\s*gpa3:\s*([\d.]+),\s*gpa2:\s*([\d.]+),\s*gpa1:\s*([\d.]+)\)/g;
        this.referredPattern =
            /(\d{6})\s*\{\s*gpa6:\s*([\d.ref]+),\s*gpa5:\s*([\d.ref]+),\s*gpa4:\s*([\d.ref]+),\s*gpa3:\s*([\d.ref]+),\s*gpa2:\s*([\d.ref]+),\s*gpa1:\s*([\d.ref]+),?\s*ref_sub:\s*([^}]+)\}/g;
    }

    /**
     * Parse PDF file
     */
    async parsePDF(filePath) {
        try {
            const dataBuffer = await fs.readFile(filePath);
            const data = await pdfParse(dataBuffer);
            return this.extractStudentData(data.text);
        } catch (error) {
            console.error("Error parsing PDF:", error);
            throw error;
        }
    }

    /**
     * Extract student data from text
     */
    extractStudentData(text) {
        const students = [];
        const institutes = new Map();

        let currentInstitute = null;

        // First, normalize the text by joining multi-line student records
        // Remove extra whitespace and join lines that are part of the same record
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
            this.passedPattern.lastIndex = 0; // Reset regex
            while ((match = this.passedPattern.exec(line)) !== null) {
                if (currentInstitute) {
                    students.push(
                        this.createStudentObject(
                            match,
                            currentInstitute,
                            "PASSED",
                            []
                        )
                    );
                }
            }

            // Match referred students
            this.referredPattern.lastIndex = 0; // Reset regex
            while ((match = this.referredPattern.exec(line)) !== null) {
                if (currentInstitute) {
                    const refSubjects = this.parseReferredSubjects(match[8]);
                    students.push(
                        this.createStudentObject(
                            match,
                            currentInstitute,
                            "REFERRED",
                            refSubjects
                        )
                    );
                }
            }
        }

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
    createStudentObject(match, institute, status, referredSubjects) {
        const parseGpa = (value) => {
            if (!value || value === "ref") return null;
            const parsed = parseFloat(value);
            return isNaN(parsed) ? null : parsed;
        };

        return {
            rollNumber: match[1],
            instituteCode: institute.code,
            instituteName: institute.name,
            semester: 6,
            regulation: "2022",
            examYear: 2024,
            status,
            gpaData: {
                gpa6: parseGpa(match[2]),
                gpa5: parseGpa(match[3]),
                gpa4: parseGpa(match[4]),
                gpa3: parseGpa(match[5]),
                gpa2: parseGpa(match[6]),
                gpa1: parseGpa(match[7]),
            },
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
