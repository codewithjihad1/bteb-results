# BTEB Result Management System Backend

## Quick Start Guide

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

Create a `.env` file:

```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bteb_results
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### 3. Start MongoDB

Make sure MongoDB is running on your system.

### 4. Import Data

```bash
npm run import
```

### 5. Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### 6. Test API

Open browser: http://localhost:5000

## API Examples

### Search by Roll Number

```bash
curl http://localhost:5000/api/students/roll/190002
```

### Search Students

```bash
curl "http://localhost:5000/api/students/search?status=PASSED&minGpa=3.5&limit=10"
```

### Get Institute Results

```bash
curl http://localhost:5000/api/institutes/11044/results
```

### Get Statistics

```bash
curl http://localhost:5000/api/students/stats/overview
```

## Project Structure

```
backend/
├── config/          # Database configuration
├── models/          # Mongoose models
├── routes/          # API routes
├── controllers/     # Request handlers
├── middleware/      # Custom middleware
├── utils/           # Helper utilities
├── scripts/         # Data import scripts
├── data/            # PDF files
└── index.js         # Entry point
```

## Technologies

-   Node.js & Express.js
-   MongoDB & Mongoose
-   PDF Parsing
-   Input Validation
-   Security Headers
