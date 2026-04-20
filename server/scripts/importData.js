const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const connectDB = require("../config/database");
const Student = require("../models/Student");
const Institute = require("../models/Institute");
const BTEBResultParser = require("../utils/pdfParser");

async function importData() {
    try {
        console.log("🚀 Starting data import...");

        // Connect to database
        await connectDB();

        // Clear existing data
        console.log("🗑️  Clearing existing data...");
        await Student.deleteMany({});
        await Institute.deleteMany({});

        // Parse PDF
        console.log("📄 Parsing PDF file...");
        const parser = new BTEBResultParser();
        const pdfPath = path.join(
            __dirname,
            "..",
            "data",
            "RESULT_6th_2022_Regulation.pdf"
        );
        const { students, institutes } = await parser.parsePDF(pdfPath);

        console.log(
            `✅ Found ${students.length} students and ${institutes.length} institutes`
        );

        // Import institutes
        if (institutes.length > 0) {
            console.log("📥 Importing institutes...");
            await Institute.insertMany(institutes);
            console.log(`✅ Imported ${institutes.length} institutes`);
        }

        // Import students in batches
        if (students.length > 0) {
            console.log("📥 Importing students...");
            const batchSize = 1000;
            let imported = 0;

            for (let i = 0; i < students.length; i += batchSize) {
                const batch = students.slice(i, i + batchSize);
                await Student.insertMany(batch, { ordered: false }).catch(
                    (err) => {
                        console.log(`Batch error (continuing): ${err.message}`);
                    }
                );
                imported += batch.length;
                console.log(
                    `   Progress: ${imported}/${students.length} students`
                );
            }

            console.log(`✅ Imported ${students.length} students`);
        }

        // Update institute statistics
        console.log("📊 Updating institute statistics...");
        for (const institute of institutes) {
            const inst = await Institute.findOne({
                instituteCode: institute.instituteCode,
            });
            if (inst) {
                await inst.updateStatistics();
            }
        }

        console.log("✅ Data import completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error importing data:", error);
        process.exit(1);
    }
}

// Run import
importData();
