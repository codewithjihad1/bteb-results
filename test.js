#!/usr/bin/env node

/**
 * BTEB Result API Test Script
 * Quick command-line testing for the API
 */

const readline = require("readline");
const https = require("http");

const API_BASE = "http://localhost:5000/api";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function makeRequest(endpoint) {
    return new Promise((resolve, reject) => {
        const url = `${API_BASE}${endpoint}`;

        https
            .get(url, (res) => {
                let data = "";

                res.on("data", (chunk) => {
                    data += chunk;
                });

                res.on("end", () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error("Invalid JSON response"));
                    }
                });
            })
            .on("error", (err) => {
                reject(err);
            });
    });
}

function displayResult(data) {
    console.log("\n" + "=".repeat(60));
    console.log(JSON.stringify(data, null, 2));
    console.log("=".repeat(60) + "\n");
}

async function searchByRoll() {
    rl.question("Enter roll number: ", async (rollNumber) => {
        if (!rollNumber.trim()) {
            console.log("❌ Roll number cannot be empty");
            showMenu();
            return;
        }

        try {
            console.log("🔍 Searching...");
            const data = await makeRequest(`/students/roll/${rollNumber}`);
            displayResult(data);
        } catch (error) {
            console.log("❌ Error:", error.message);
        }

        showMenu();
    });
}

async function getTopPerformers() {
    try {
        console.log("🏆 Fetching top performers...");
        const data = await makeRequest("/students/top-performers?limit=10");
        displayResult(data);
    } catch (error) {
        console.log("❌ Error:", error.message);
    }

    showMenu();
}

async function getStatistics() {
    try {
        console.log("📊 Fetching statistics...");
        const data = await makeRequest("/students/stats/overview");
        displayResult(data);
    } catch (error) {
        console.log("❌ Error:", error.message);
    }

    showMenu();
}

async function searchByStatus() {
    rl.question("Enter status (PASSED/REFERRED/WITHHELD): ", async (status) => {
        if (!status.trim()) {
            console.log("❌ Status cannot be empty");
            showMenu();
            return;
        }

        try {
            console.log("🔍 Searching...");
            const data = await makeRequest(
                `/students/status/${status.toUpperCase()}?limit=5`
            );
            displayResult(data);
        } catch (error) {
            console.log("❌ Error:", error.message);
        }

        showMenu();
    });
}

async function getInstitutes() {
    try {
        console.log("🏫 Fetching institutes...");
        const data = await makeRequest("/institutes?limit=10");
        displayResult(data);
    } catch (error) {
        console.log("❌ Error:", error.message);
    }

    showMenu();
}

function showMenu() {
    console.log("\n" + "=".repeat(60));
    console.log("🎓 BTEB Result API Test Menu");
    console.log("=".repeat(60));
    console.log("1. Search by Roll Number");
    console.log("2. Get Top Performers");
    console.log("3. Get Statistics");
    console.log("4. Search by Status");
    console.log("5. Get All Institutes");
    console.log("6. Exit");
    console.log("=".repeat(60));

    rl.question("\nSelect option (1-6): ", (answer) => {
        switch (answer) {
            case "1":
                searchByRoll();
                break;
            case "2":
                getTopPerformers();
                break;
            case "3":
                getStatistics();
                break;
            case "4":
                searchByStatus();
                break;
            case "5":
                getInstitutes();
                break;
            case "6":
                console.log("\n👋 Goodbye!\n");
                rl.close();
                process.exit(0);
                break;
            default:
                console.log("❌ Invalid option");
                showMenu();
        }
    });
}

// Check if server is running
console.log("🔍 Checking if server is running...");

https
    .get(`${API_BASE.replace("/api", "")}/health`, (res) => {
        console.log("✅ Server is running!\n");
        showMenu();
    })
    .on("error", () => {
        console.log("\n❌ Error: Server is not running!");
        console.log("Please start the server first:");
        console.log("  npm run dev\n");
        process.exit(1);
    });
