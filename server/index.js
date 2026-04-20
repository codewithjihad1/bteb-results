require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");

const connectDB = require("./config/database");
const studentRoutes = require("./routes/studentRoutes");
const instituteRoutes = require("./routes/instituteRoutes");
const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(helmet()); // Security headers
app.use(
    cors({
        origin: process.env.CORS_ORIGIN || "*",
        credentials: true,
    })
);
app.use(compression()); // Compress responses
app.use(morgan("dev")); // Logging
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString(),
    });
});

// API routes
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "BTEB Result Management System API",
        version: "1.0.0",
        endpoints: {
            students: "/api/students",
            institutes: "/api/institutes",
            health: "/health",
        },
    });
});

app.use("/api/students", studentRoutes);
app.use("/api/institutes", instituteRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log("═══════════════════════════════════════════════════");
    console.log(
        `🚀 Server running in ${process.env.NODE_ENV || "development"} mode`
    );
    console.log(`📡 Port: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log("═══════════════════════════════════════════════════");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
    console.error("❌ Unhandled Rejection:", err);
    process.exit(1);
});
