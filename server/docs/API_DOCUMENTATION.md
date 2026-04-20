# BTEB Result Management System - API Documentation

## Base URL

```
http://localhost:5000
```

## Response Format

All API responses follow this structure:

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
    "success": false,
    "message": "Error message",
    "errors": []
}
```

## Authentication

Currently, the API is open. For production, implement JWT authentication.

---

## Student Endpoints

### 1. Get Student Result from PDF and Save to MongoDB

Find a student's result from PDF file. If found, automatically saves to MongoDB and returns the result. If the student already exists in the database, returns the existing record.

**Endpoint:** `GET /api/students/pdf/:rollNumber`

**Parameters:**

-   `rollNumber` (path parameter) - Student's 6-digit roll number

**Example:**

```bash
GET /api/students/pdf/190002
```

**Response (when found in PDF and saved):**

```json
{
    "success": true,
    "message": "Student found in PDF and saved to database",
    "data": {
        "rollNumber": "190002",
        "instituteCode": "11044",
        "instituteName": "Himaloy Polytechnic Institute of Technology, Panchagar",
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
        "passedAllSubjects": true,
        "_id": "507f1f77bcf86cd799439011",
        "createdAt": "2024-10-26T10:30:00.000Z",
        "updatedAt": "2024-10-26T10:30:00.000Z"
    },
    "source": "pdf"
}
```

**Response (when already exists in database):**

```json
{
    "success": true,
    "message": "Student found in database",
    "data": { ... },
    "source": "database"
}
```

**Response (when not found):**

```json
{
    "success": false,
    "message": "Student not found in PDF",
    "rollNumber": "999999"
}
```

---

### 2. Batch Import All Students from PDF

Import all students from the PDF file into MongoDB. Uses upsert to avoid duplicates (updates existing records, inserts new ones).

**Endpoint:** `POST /api/students/import-from-pdf`

**Example:**

```bash
POST /api/students/import-from-pdf
```

**Response:**

```json
{
    "success": true,
    "message": "Batch import completed successfully",
    "statistics": {
        "totalStudentsInPDF": 5000,
        "inserted": 4500,
        "updated": 500,
        "matched": 5000
    }
}
```

---

### 3. Get Student by Roll Number

Find a specific student's result using their roll number.

**Endpoint:** `GET /api/students/roll/:rollNumber`

**Parameters:**

-   `rollNumber` (path parameter) - Student's roll number

**Example:**

```bash
GET /api/students/roll/190002
```

**Response:**

```json
{
    "success": true,
    "data": {
        "rollNumber": "190002",
        "instituteCode": "11044",
        "instituteName": "Himaloy Polytechnic Institute of Technology, Panchagar",
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
        "cgpa": null,
        "referredSubjects": [],
        "passedAllSubjects": true,
        "averageGpa": "3.51"
    }
}
```

---

### 3. Get Student by Roll Number

Find a specific student's result using their roll number.

**Endpoint:** `GET /api/students/roll/:rollNumber`

**Parameters:**

-   `rollNumber` (path parameter) - Student's roll number

**Example:**

```bash
GET /api/students/roll/190002
```

**Response:**

```json
{
    "success": true,
    "data": {
        "rollNumber": "190002",
        "instituteCode": "11044",
        "instituteName": "Himaloy Polytechnic Institute of Technology, Panchagar",
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
        "cgpa": null,
        "referredSubjects": [],
        "passedAllSubjects": true,
        "averageGpa": "3.51"
    }
}
```

---

### 4. Search Students

Search students with multiple filters.

**Endpoint:** `GET /api/students/search`

**Query Parameters:**

-   `rollNumber` (string) - Filter by roll number (partial match)
-   `instituteCode` (string) - Filter by institute code
-   `instituteName` (string) - Filter by institute name
-   `status` (enum) - PASSED | REFERRED | WITHHELD | ABSENT
-   `minGpa` (number) - Minimum GPA (0-4)
-   `maxGpa` (number) - Maximum GPA (0-4)
-   `page` (number) - Page number (default: 1)
-   `limit` (number) - Results per page (default: 20, max: 100)

**Examples:**

Get all passed students:

```bash
GET /api/students/search?status=PASSED&page=1&limit=20
```

Get students with GPA above 3.5:

```bash
GET /api/students/search?minGpa=3.5&limit=10
```

Search by institute:

```bash
GET /api/students/search?instituteCode=11044&status=PASSED
```

Combined search:

```bash
GET /api/students/search?rollNumber=190&minGpa=3.0&maxGpa=4.0&status=PASSED
```

**Response:**

```json
{
    "success": true,
    "data": [
        {
            "rollNumber": "190002",
            "instituteName": "Himaloy Polytechnic Institute",
            "status": "PASSED",
            "gpaData": { "gpa6": 3.46 }
        }
    ],
    "pagination": {
        "currentPage": 1,
        "totalPages": 5,
        "totalRecords": 100,
        "limit": 20
    }
}
```

---

### 5. Get All Students

Get all students with pagination and sorting.

**Endpoint:** `GET /api/students`

**Query Parameters:**

-   `page` (number) - Page number
-   `limit` (number) - Results per page
-   `sortBy` (string) - Sort field (rollNumber, gpaData.gpa6, etc.)
-   `order` (enum) - asc | desc

**Example:**

```bash
GET /api/students?page=1&limit=50&sortBy=gpaData.gpa6&order=desc
```

---

### 6. Get Top Performers

Get top performing students based on GPA.

**Endpoint:** `GET /api/students/top-performers`

**Query Parameters:**

-   `limit` (number) - Number of top students (default: 10, max: 100)
-   `instituteCode` (string) - Filter by specific institute

**Examples:**

Top 10 overall:

```bash
GET /api/students/top-performers?limit=10
```

Top 10 from specific institute:

```bash
GET /api/students/top-performers?limit=10&instituteCode=11044
```

**Response:**

```json
{
    "success": true,
    "data": [
        {
            "rollNumber": "600941",
            "instituteName": "Thakurgaon Polytechnic Institute",
            "gpaData": {
                "gpa1": 3.95,
                "gpa2": 3.77,
                "gpa3": 3.74,
                "gpa4": 3.93,
                "gpa5": 3.8,
                "gpa6": 3.98
            },
            "averageGpa": "3.86"
        }
    ],
    "count": 10
}
```

---

### 7. Get Students by Status

Get students filtered by their exam status.

**Endpoint:** `GET /api/students/status/:status`

**Parameters:**

-   `status` (path parameter) - PASSED | REFERRED | WITHHELD | ABSENT

**Query Parameters:**

-   `page` (number)
-   `limit` (number)

**Example:**

```bash
GET /api/students/status/REFERRED?page=1&limit=20
```

**Response:**

```json
{
    "success": true,
    "data": [
        {
            "rollNumber": "600105",
            "status": "REFERRED",
            "referredSubjects": [
                {
                    "subjectCode": "25921",
                    "subjectType": "T"
                }
            ]
        }
    ],
    "pagination": {
        "currentPage": 1,
        "totalPages": 3,
        "totalRecords": 50,
        "limit": 20
    }
}
```

---

### 8. Get Student Statistics

Get comprehensive statistics about all students.

**Endpoint:** `GET /api/students/stats/overview`

**Example:**

```bash
GET /api/students/stats/overview
```

**Response:**

```json
{
    "success": true,
    "data": {
        "total": 5000,
        "passed": 3500,
        "referred": 1200,
        "withheld": 200,
        "absent": 100,
        "passPercentage": "70.00",
        "averageGpa": "3.25",
        "gpaDistribution": [
            {
                "_id": 3.5,
                "count": 1500
            },
            {
                "_id": 3.0,
                "count": 1200
            }
        ]
    }
}
```

---

## Institute Endpoints

### 1. Get All Institutes

Get list of all institutes with pagination.

**Endpoint:** `GET /api/institutes`

**Query Parameters:**

-   `page` (number)
-   `limit` (number)
-   `sortBy` (string)
-   `order` (enum) - asc | desc

**Example:**

```bash
GET /api/institutes?page=1&limit=20&sortBy=passPercentage&order=desc
```

---

### 2. Get Institute by Code

Get details of a specific institute.

**Endpoint:** `GET /api/institutes/code/:instituteCode`

**Example:**

```bash
GET /api/institutes/code/11044
```

**Response:**

```json
{
    "success": true,
    "data": {
        "instituteCode": "11044",
        "instituteName": "Himaloy Polytechnic Institute of Technology, Panchagar",
        "location": "Panchagar",
        "totalStudents": 150,
        "passedStudents": 145,
        "referredStudents": 5,
        "passPercentage": 96.67
    }
}
```

---

### 3. Get Institute Results

Get all students from a specific institute.

**Endpoint:** `GET /api/institutes/:instituteCode/results`

**Query Parameters:**

-   `status` (enum) - Filter by status
-   `page` (number)
-   `limit` (number)

**Example:**

```bash
GET /api/institutes/11044/results?status=PASSED&page=1&limit=20
```

---

### 4. Get Institute Statistics

Get detailed statistics for a specific institute.

**Endpoint:** `GET /api/institutes/:instituteCode/statistics`

**Example:**

```bash
GET /api/institutes/11044/statistics
```

**Response:**

```json
{
    "success": true,
    "data": {
        "institute": {
            "code": "11044",
            "name": "Himaloy Polytechnic Institute of Technology, Panchagar",
            "location": "Panchagar"
        },
        "students": {
            "total": 150,
            "passed": 145,
            "referred": 5,
            "withheld": 0,
            "passPercentage": "96.67"
        },
        "averageGpa": "3.45",
        "topPerformers": [
            {
                "rollNumber": "190002",
                "gpaData": { "gpa6": 3.96 }
            }
        ]
    }
}
```

---

### 5. Search Institutes

Search institutes by name or location.

**Endpoint:** `GET /api/institutes/search`

**Query Parameters:**

-   `name` (string) - Search by name
-   `location` (string) - Search by location
-   `page` (number)
-   `limit` (number)

**Example:**

```bash
GET /api/institutes/search?name=Polytechnic&location=Panchagar
```

---

### 6. Get Top Institutes

Get top performing institutes by pass percentage.

**Endpoint:** `GET /api/institutes/top-performers`

**Query Parameters:**

-   `limit` (number) - Number of institutes (default: 10, max: 50)

**Example:**

```bash
GET /api/institutes/top-performers?limit=10
```

---

## Error Codes

| Status Code | Description                        |
| ----------- | ---------------------------------- |
| 200         | Success                            |
| 400         | Bad Request - Invalid parameters   |
| 404         | Not Found - Resource doesn't exist |
| 500         | Internal Server Error              |

---

## Rate Limiting

Currently no rate limiting is implemented. For production:

-   Implement rate limiting (e.g., 100 requests per minute)
-   Use Redis for distributed rate limiting

---

## Common Use Cases

### 1. Student Portal - Check Own Result

```javascript
// Frontend code example
async function getMyResult(rollNumber) {
    const response = await fetch(
        `http://localhost:5000/api/students/roll/${rollNumber}`
    );
    const data = await response.json();
    return data;
}
```

### 2. Institute Dashboard - Get All Results

```javascript
async function getInstituteResults(instituteCode, page = 1) {
    const response = await fetch(
        `http://localhost:5000/api/institutes/${instituteCode}/results?page=${page}&limit=50`
    );
    const data = await response.json();
    return data;
}
```

### 3. Analytics - Top Performers

```javascript
async function getTopStudents(limit = 10) {
    const response = await fetch(
        `http://localhost:5000/api/students/top-performers?limit=${limit}`
    );
    const data = await response.json();
    return data;
}
```

### 4. Search Functionality

```javascript
async function searchStudents(filters) {
    const params = new URLSearchParams(filters);
    const response = await fetch(
        `http://localhost:5000/api/students/search?${params}`
    );
    const data = await response.json();
    return data;
}

// Usage
searchStudents({
    status: "PASSED",
    minGpa: 3.5,
    instituteCode: "11044",
    page: 1,
    limit: 20,
});
```

---

## Data Import

To import results from PDF:

```bash
# Run the import script
npm run import

# Or manually
node scripts/importData.js
```

The script will:

1. Clear existing data
2. Parse the PDF file
3. Extract student and institute information
4. Import data into MongoDB
5. Update institute statistics

---

## Future Enhancements

-   [ ] JWT Authentication
-   [ ] Role-based access control (Admin, Institute, Student)
-   [ ] Real-time notifications
-   [ ] Result comparison across semesters
-   [ ] Export results to PDF/Excel
-   [ ] Email notifications for results
-   [ ] GraphQL API
-   [ ] WebSocket for live updates
-   [ ] Advanced analytics dashboard
-   [ ] Mobile app API support

---

## Support

For issues or questions:

-   Email: support@bteb.gov.bd
-   GitHub Issues: [Create Issue]
-   Documentation: [Wiki]
