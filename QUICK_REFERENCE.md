# Quick Reference - Multi-Semester API

## Common API Calls

### 1. Check Available PDFs

```bash
GET /api/students/pdfs/available
```

### 2. Import Students by Semester

```bash
# 3rd Semester
POST /api/students/import-from-pdf?semester=3&regulation=2022

# 5th Semester
POST /api/students/import-from-pdf?semester=5&regulation=2022

# 6th Semester
POST /api/students/import-from-pdf?semester=6&regulation=2022

# 7th Semester
POST /api/students/import-from-pdf?semester=7&regulation=2022
```

### 3. Get Student Results

```bash
# All semesters for a student
GET /api/students/roll/190002

# Specific semester
GET /api/students/roll/190002?semester=6&regulation=2022
```

### 4. Search Students

```bash
# By semester
GET /api/students/search?semester=5&regulation=2022

# High performers in 5th semester
GET /api/students/search?semester=5&minGpa=3.5

# Institute-specific
GET /api/students/search?instituteCode=11044&semester=6

# Referred students
GET /api/students/search?semester=5&status=REFERRED
```

### 5. Get Statistics

```bash
# Overall
GET /api/students/stats/overview

# By semester
GET /api/students/stats/overview?semester=5&regulation=2022

# By regulation
GET /api/students/stats/overview?regulation=2022
```

## Parameter Reference

| Parameter     | Type   | Values                             | Description                |
| ------------- | ------ | ---------------------------------- | -------------------------- |
| semester      | Number | 3-8                                | Filter by semester         |
| regulation    | String | "2016", "2022"                     | Filter by regulation       |
| status        | String | PASSED, REFERRED, WITHHELD, ABSENT | Filter by result status    |
| minGpa        | Number | 0-4                                | Minimum GPA filter         |
| maxGpa        | Number | 0-4                                | Maximum GPA filter         |
| instituteCode | String | e.g. "11044"                       | Filter by institute        |
| page          | Number | >= 1                               | Page number for pagination |
| limit         | Number | 1-100                              | Results per page           |

## PDF File Naming

PDFs must follow this pattern:

```
RESULT_{semester}{ordinal}_{regulation}_Regulation.pdf
```

Examples:

-   `RESULT_3rd_2022_Regulation.pdf`
-   `RESULT_5th_2022_Regulation.pdf`
-   `RESULT_6th_2022_Regulation.pdf`
-   `RESULT_7th_2022_Regulation.pdf`
-   `RESULT_5th_2016_Regulation.pdf`

## Response Patterns

### Single Student

```json
{
  "success": true,
  "data": {
    "rollNumber": "190002",
    "semester": 6,
    "regulation": "2022",
    "status": "PASSED",
    "gpaData": { ... }
  }
}
```

### Multiple Semesters

```json
{
  "success": true,
  "message": "Multiple results found",
  "count": 3,
  "data": [
    { "semester": 5, ... },
    { "semester": 6, ... },
    { "semester": 7, ... }
  ]
}
```

### Search Results

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalRecords": 200,
    "limit": 20
  },
  "filters": {
    "semester": "5",
    "regulation": "2022"
  }
}
```

## Common Use Cases

### Track Student Progress

```bash
# Get all semester results
GET /api/students/roll/190002

# Compare 5th vs 6th semester
GET /api/students/roll/190002?semester=5
GET /api/students/roll/190002?semester=6
```

### Institute Analysis

```bash
# All students in institute
GET /api/students/search?instituteCode=11044

# Semester-specific
GET /api/students/search?instituteCode=11044&semester=5

# Pass rate
GET /api/students/stats/overview?instituteCode=11044&semester=5
```

### Performance Analysis

```bash
# Top performers in semester
GET /api/students/search?semester=5&minGpa=3.8&limit=10

# Referred students
GET /api/students/search?semester=5&status=REFERRED

# GPA distribution
GET /api/students/stats/overview?semester=5
```

## Error Handling

```json
// PDF not found
{
  "success": false,
  "message": "PDF file not found for semester 5, regulation 2016",
  "pdfFileName": "RESULT_5th_2016_Regulation.pdf"
}

// Student not found
{
  "success": false,
  "message": "Student not found with this roll number",
  "filters": { "rollNumber": "999999", "semester": "6" }
}

// Validation error
{
  "success": false,
  "errors": [
    {
      "msg": "Semester must be between 3 and 8",
      "param": "semester"
    }
  ]
}
```

## Testing Commands

```bash
# Check server health
curl http://localhost:5000/health

# List available PDFs
curl http://localhost:5000/api/students/pdfs/available

# Get student (with PowerShell)
curl "http://localhost:5000/api/students/roll/190002?semester=6&regulation=2022"

# Search (with PowerShell)
curl "http://localhost:5000/api/students/search?semester=5&minGpa=3.5&limit=5"

# Get statistics
curl "http://localhost:5000/api/students/stats/overview?semester=5&regulation=2022"
```
