# BTEB Result Management System - Updated API Documentation

## Overview

The API now supports multiple semesters (3rd to 8th) and regulations (2016, 2022) for the Bangladesh Technical Education Board (BTEB) diploma results.

## Base URL

```
http://localhost:5000/api
```

## New Query Parameters

Most endpoints now support these optional query parameters:

-   `semester` - Integer (3-8): Filter by specific semester
-   `regulation` - String ("2016" or "2022"): Filter by regulation year

---

## Endpoints

### 1. Get Available PDF Files

Get list of all available PDF files with their metadata.

**Endpoint:** `GET /students/pdfs/available`

**Response:**

```json
{
    "success": true,
    "count": 5,
    "data": [
        {
            "fileName": "RESULT_3rd_2022_Regulation.pdf",
            "semester": 3,
            "regulation": "2022",
            "path": "/data/RESULT_3rd_2022_Regulation.pdf"
        },
        {
            "fileName": "RESULT_5th_2022_Regulation.pdf",
            "semester": 5,
            "regulation": "2022",
            "path": "/data/RESULT_5th_2022_Regulation.pdf"
        }
    ]
}
```

---

### 2. Get Student from PDF (Parse & Save)

Parse a specific student from PDF and save to database. The API will automatically detect the correct PDF based on semester and regulation parameters.

**Endpoint:** `GET /students/pdf/:rollNumber`

**Path Parameters:**

-   `rollNumber` (required): 6-digit student roll number

**Query Parameters:**

-   `semester` (optional): Semester number (3-8)
-   `regulation` (optional): Regulation year ("2016" or "2022")

**Examples:**

```bash
# Get student from 6th semester, 2022 regulation (default)
GET /students/pdf/190002

# Get student from 5th semester, 2022 regulation
GET /students/pdf/700014?semester=5&regulation=2022

# Get student from 5th semester, 2016 regulation
GET /students/pdf/101165?semester=5&regulation=2016
```

**Response (Success):**

```json
{
    "success": true,
    "message": "Student found in PDF and saved to database",
    "data": {
        "rollNumber": "190002",
        "instituteCode": "11044",
        "instituteName": "Himaloy Polytechnic Institute of Technology, Panchagarh",
        "semester": 6,
        "regulation": "2022",
        "examYear": 2024,
        "status": "PASSED",
        "gpaData": {
            "gpa1": 3.5,
            "gpa2": 3.75,
            "gpa3": 3.5,
            "gpa4": 3.36,
            "gpa5": 3.4,
            "gpa6": 3.46
        },
        "referredSubjects": [],
        "passedAllSubjects": true
    },
    "source": "pdf"
}
```

**Response (PDF Not Found):**

```json
{
    "success": false,
    "message": "PDF file not found for semester 5, regulation 2016",
    "pdfFileName": "RESULT_5th_2016_Regulation.pdf"
}
```

---

### 3. Batch Import from PDF

Import all students from a specific PDF file into the database.

**Endpoint:** `POST /students/import-from-pdf`

**Query Parameters:**

-   `semester` (optional): Semester number (3-8), defaults to 6
-   `regulation` (optional): Regulation year ("2016" or "2022"), defaults to "2022"

**Examples:**

```bash
# Import 6th semester, 2022 regulation (default)
POST /students/import-from-pdf

# Import 5th semester, 2022 regulation
POST /students/import-from-pdf?semester=5&regulation=2022

# Import 7th semester, 2022 regulation
POST /students/import-from-pdf?semester=7&regulation=2022
```

**Response:**

```json
{
    "success": true,
    "message": "Batch import completed successfully",
    "pdfFile": "RESULT_5th_2022_Regulation.pdf",
    "statistics": {
        "totalStudentsInPDF": 5,
        "inserted": 3,
        "updated": 2,
        "matched": 2
    }
}
```

---

### 4. Get Student by Roll Number

Retrieve student(s) from database by roll number.

**Endpoint:** `GET /students/roll/:rollNumber`

**Path Parameters:**

-   `rollNumber` (required): Student roll number

**Query Parameters:**

-   `semester` (optional): Filter by specific semester
-   `regulation` (optional): Filter by regulation year

**Examples:**

```bash
# Get all results for a roll number (all semesters/regulations)
GET /students/roll/190002

# Get specific semester result
GET /students/roll/190002?semester=6&regulation=2022

# Get specific semester without regulation (gets all regulations for that semester)
GET /students/roll/190002?semester=5
```

**Response (Multiple Results):**

```json
{
  "success": true,
  "message": "Multiple results found for this roll number",
  "count": 3,
  "data": [
    {
      "rollNumber": "190002",
      "semester": 6,
      "regulation": "2022",
      "status": "PASSED",
      "gpaData": { "gpa6": 3.46, ... }
    },
    {
      "rollNumber": "190002",
      "semester": 7,
      "regulation": "2022",
      "status": "PASSED",
      "gpaData": { "gpa7": 3.64, ... }
    }
  ]
}
```

---

### 5. Search Students

Search students with multiple filters.

**Endpoint:** `GET /students/search`

**Query Parameters:**

-   `rollNumber` (optional): Search by roll number (partial match)
-   `instituteCode` (optional): Filter by institute code
-   `instituteName` (optional): Search by institute name (partial match)
-   `status` (optional): Filter by status (PASSED, REFERRED, WITHHELD, ABSENT)
-   `semester` (optional): Filter by semester (3-8)
-   `regulation` (optional): Filter by regulation ("2016" or "2022")
-   `minGpa` (optional): Minimum GPA (0-4)
-   `maxGpa` (optional): Maximum GPA (0-4)
-   `page` (optional): Page number (default: 1)
-   `limit` (optional): Results per page (default: 20, max: 100)

**Examples:**

```bash
# Search 5th semester students with GPA > 3.5
GET /students/search?semester=5&regulation=2022&minGpa=3.5

# Search referred students in 6th semester
GET /students/search?semester=6&status=REFERRED

# Search by institute in 7th semester
GET /students/search?instituteCode=11044&semester=7&regulation=2022

# Search across all semesters for an institute
GET /students/search?instituteCode=11044
```

**Response:**

```json
{
    "success": true,
    "data": [
        {
            "rollNumber": "700014",
            "semester": 5,
            "regulation": "2022",
            "status": "PASSED",
            "gpaData": {
                "gpa5": 3.76,
                "gpa4": 3.76,
                "gpa3": 3.54,
                "gpa2": 3.34,
                "gpa1": 3.36
            }
        }
    ],
    "pagination": {
        "currentPage": 1,
        "totalPages": 1,
        "totalRecords": 5,
        "limit": 20
    },
    "filters": {
        "semester": "5",
        "regulation": "2022",
        "status": null,
        "instituteCode": null
    }
}
```

---

### 6. Get Student Statistics

Get statistics for students with optional filters.

**Endpoint:** `GET /students/stats/overview`

**Query Parameters:**

-   `semester` (optional): Filter by semester
-   `regulation` (optional): Filter by regulation

**Examples:**

```bash
# Overall statistics
GET /students/stats/overview

# Statistics for 6th semester, 2022 regulation
GET /students/stats/overview?semester=6&regulation=2022

# Statistics for all 5th semester results
GET /students/stats/overview?semester=5
```

**Response:**

```json
{
    "success": true,
    "data": {
        "filters": {
            "semester": "6",
            "regulation": "2022"
        },
        "total": 100,
        "passed": 85,
        "referred": 12,
        "withheld": 2,
        "absent": 1,
        "passPercentage": "85.00",
        "averageGpa": "3.45",
        "gpaDistribution": [
            { "_id": 3.5, "count": 40 },
            { "_id": 3.0, "count": 30 }
        ]
    }
}
```

---

### 7. Get Top Performers

Get top performing students.

**Endpoint:** `GET /students/top-performers`

**Query Parameters:**

-   `limit` (optional): Number of results (default: 10, max: 100)
-   `instituteCode` (optional): Filter by institute

**Example:**

```bash
GET /students/top-performers?limit=20&instituteCode=11044
```

---

### 8. Get Students by Status

Get students filtered by result status.

**Endpoint:** `GET /students/status/:status`

**Path Parameters:**

-   `status` (required): One of PASSED, REFERRED, WITHHELD, ABSENT

**Query Parameters:**

-   `page` (optional): Page number
-   `limit` (optional): Results per page

**Example:**

```bash
GET /students/status/REFERRED?page=1&limit=20
```

---

## Data Models

### Student Schema

```javascript
{
  rollNumber: String (6 digits, unique with semester+regulation),
  instituteCode: String (5 digits),
  instituteName: String,
  semester: Number (3-8),
  regulation: String ("2016" or "2022"),
  examYear: Number,
  status: String (PASSED, REFERRED, WITHHELD, ABSENT),
  gpaData: {
    gpa1: Number (nullable),
    gpa2: Number (nullable),
    gpa3: Number (nullable),
    gpa4: Number (nullable),
    gpa5: Number (nullable),
    gpa6: Number (nullable),
    gpa7: Number (nullable),
    gpa8: Number (nullable)
  },
  cgpa: Number (nullable),
  referredSubjects: [
    {
      subjectCode: String,
      subjectType: String (T or P)
    }
  ],
  passedAllSubjects: Boolean,
  technology: String,
  shift: String (DAY or EVENING)
}
```

---

## PDF File Naming Convention

PDFs must follow this naming pattern to be automatically detected:

```
RESULT_{semester}{ordinal}_{regulation}_Regulation.pdf
```

**Examples:**

-   `RESULT_3rd_2022_Regulation.pdf` - 3rd semester, 2022 regulation
-   `RESULT_5th_2022_Regulation.pdf` - 5th semester, 2022 regulation
-   `RESULT_6th_2022_Regulation.pdf` - 6th semester, 2022 regulation
-   `RESULT_7th_2022_Regulation.pdf` - 7th semester, 2022 regulation
-   `RESULT_5th_2016_Regulation.pdf` - 5th semester, 2016 regulation

---

## Example Use Cases

### Use Case 1: Import All PDFs

```bash
# Import 3rd semester
POST /students/import-from-pdf?semester=3&regulation=2022

# Import 5th semester
POST /students/import-from-pdf?semester=5&regulation=2022

# Import 6th semester
POST /students/import-from-pdf?semester=6&regulation=2022

# Import 7th semester
POST /students/import-from-pdf?semester=7&regulation=2022
```

### Use Case 2: Track Student Progress Across Semesters

```bash
# Get all results for a student
GET /students/roll/190002

# This returns all semester results for roll 190002
```

### Use Case 3: Compare Performance Across Semesters

```bash
# Get 5th semester stats
GET /students/stats/overview?semester=5&regulation=2022

# Get 6th semester stats
GET /students/stats/overview?semester=6&regulation=2022

# Get 7th semester stats
GET /students/stats/overview?semester=7&regulation=2022
```

---

## Error Handling

All endpoints return standardized error responses:

```json
{
    "success": false,
    "message": "Error description",
    "error": "Detailed error message"
}
```

**Common HTTP Status Codes:**

-   `200` - Success
-   `201` - Created
-   `400` - Bad Request (validation errors)
-   `404` - Not Found
-   `500` - Server Error

---

## Notes

1. **Unique Constraint**: Students are uniquely identified by the combination of `rollNumber`, `semester`, and `regulation`.

2. **GPA Fields**: Only the GPA fields up to the current semester will be populated. For example, a 5th semester student will have gpa1-gpa5 populated.

3. **Current Semester GPA**: Use the virtual field `currentSemesterGpa` to get the GPA for the student's current semester.

4. **Average GPA**: The virtual field `averageGpa` calculates the average of all non-null semester GPAs.

5. **PDF Detection**: The system automatically detects semester and regulation from the PDF filename. Ensure PDFs follow the naming convention.
