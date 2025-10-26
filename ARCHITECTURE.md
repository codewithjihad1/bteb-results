# PDF Import System Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Application                        │
│  (Browser, Mobile App, Postman, cURL, React App, etc.)         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP Request
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Express.js Server                          │
│                    (localhost:5000)                              │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Student Routes                             │    │
│  │  GET /api/students/pdf/:rollNumber                      │    │
│  │  POST /api/students/import-from-pdf                     │    │
│  └─────────────────────┬──────────────────────────────────┘    │
│                        │                                         │
│                        ▼                                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │           Student Controller                            │    │
│  │  - getStudentFromPDF()                                  │    │
│  │  - importAllStudentsFromPDF()                           │    │
│  └──────────┬─────────────────────┬──────────────────────┘    │
│             │                     │                             │
└─────────────┼─────────────────────┼─────────────────────────────┘
              │                     │
              ▼                     ▼
    ┌──────────────────┐  ┌──────────────────┐
    │   MongoDB        │  │   PDF Parser     │
    │   Database       │  │   Utility        │
    │                  │  │                  │
    │  - Students      │  │  - parsePDF()    │
    │    Collection    │  │  - Extract Data  │
    │  - Indexes       │  │  - Regex Match   │
    └──────────────────┘  └─────────┬────────┘
              ▲                     │
              │                     ▼
              │           ┌──────────────────┐
              └───────────│   PDF File       │
                         │   (data/)        │
                         └──────────────────┘
```

## Single Student Search Flow

```
START
  │
  ├─► User enters roll number (e.g., "190002")
  │
  ├─► API Request: GET /api/students/pdf/190002
  │
  ├─► Route validates input (6 digits, numeric)
  │
  ├─► Controller: getStudentFromPDF()
  │
  ├─► Check MongoDB first
  │   │
  │   ├─► FOUND in DB? ──► Return immediately ✓
  │   │                    (source: "database")
  │   │
  │   └─► NOT FOUND? ──► Continue...
  │
  ├─► Parse PDF file
  │   │
  │   ├─► Read PDF
  │   ├─► Extract text
  │   └─► Parse student data
  │
  ├─► Search for roll number in parsed data
  │   │
  │   ├─► FOUND? ──► Save to MongoDB ──► Return ✓
  │   │              (source: "pdf")
  │   │
  │   └─► NOT FOUND? ──► Return 404 ✗
  │
END
```

## Batch Import Flow

```
START
  │
  ├─► API Request: POST /api/students/import-from-pdf
  │
  ├─► Controller: importAllStudentsFromPDF()
  │
  ├─► Parse entire PDF file
  │   │
  │   ├─► Read all pages
  │   ├─► Extract all text
  │   ├─► Parse institutes
  │   └─► Parse students (PASSED, REFERRED, etc.)
  │
  ├─► Found: 5000 students
  │
  ├─► Prepare bulk operations
  │   │
  │   └─► Create upsert operations for each student
  │       (Update if exists, Insert if new)
  │
  ├─► Execute bulkWrite to MongoDB
  │   │
  │   ├─► Process in batches
  │   ├─► Handle duplicates automatically
  │   └─► Update indexes
  │
  ├─► Collect statistics
  │   │
  │   ├─► Inserted: 4500
  │   ├─► Updated: 500
  │   └─► Matched: 5000
  │
  └─► Return statistics ✓
  │
END
```

## Data Flow

```
┌─────────────┐
│  PDF File   │  Contains raw student results
└──────┬──────┘
       │
       │ 1. Parse
       ▼
┌─────────────┐
│ PDF Parser  │  Extracts structured data
└──────┬──────┘
       │
       │ 2. Extract
       ▼
┌─────────────────────────────────────┐
│      Student Data Object            │
│  {                                  │
│    rollNumber: "190002",            │
│    instituteCode: "11044",          │
│    instituteName: "...",            │
│    status: "PASSED",                │
│    gpaData: { ... },                │
│    referredSubjects: [ ... ]        │
│  }                                  │
└──────┬──────────────────────────────┘
       │
       │ 3. Save/Upsert
       ▼
┌─────────────┐
│  MongoDB    │  Persistent storage
│  Student    │  with indexes for fast retrieval
│  Collection │
└─────────────┘
```

## Component Interaction

```
┌────────────────────────────────────────────────────────┐
│                  studentController.js                   │
│                                                         │
│  getStudentFromPDF(rollNumber)                         │
│    ├─► Student.findByRollNumber()  ────────┐          │
│    ├─► BTEBResultParser.parsePDF()         │          │
│    └─► student.save()               ───────┼───┐      │
│                                             │   │      │
│  importAllStudentsFromPDF()                │   │      │
│    ├─► BTEBResultParser.parsePDF()         │   │      │
│    └─► Student.bulkWrite()          ───────┼───┼──┐   │
└────────────────────────────────────────────┼───┼──┼───┘
                                             │   │  │
                 ┌───────────────────────────┘   │  │
                 │   ┌───────────────────────────┘  │
                 │   │   ┌──────────────────────────┘
                 ▼   ▼   ▼
         ┌──────────────────────┐
         │   MongoDB Database   │
         │                      │
         │  Students Collection │
         │  - rollNumber (idx)  │
         │  - instituteCode     │
         │  - status            │
         │  - gpaData           │
         │  - timestamps        │
         └──────────────────────┘
```

## Request/Response Examples

### Example 1: Student Found in PDF

```
REQUEST:
  GET /api/students/pdf/190002

PROCESSING:
  1. Validate: "190002" ✓
  2. Check DB: Not found
  3. Parse PDF: Found!
  4. Save to DB: Success
  5. Return result

RESPONSE:
  {
    "success": true,
    "message": "Student found in PDF and saved to database",
    "data": {
      "rollNumber": "190002",
      "status": "PASSED",
      "gpaData": { "gpa6": 3.46 },
      ...
    },
    "source": "pdf"
  }
```

### Example 2: Student Already in Database

```
REQUEST:
  GET /api/students/pdf/190002

PROCESSING:
  1. Validate: "190002" ✓
  2. Check DB: Found! ✓
  3. Return immediately (skip PDF parsing)

RESPONSE:
  {
    "success": true,
    "message": "Student found in database",
    "data": { ... },
    "source": "database"
  }
```

### Example 3: Student Not Found

```
REQUEST:
  GET /api/students/pdf/999999

PROCESSING:
  1. Validate: "999999" ✓
  2. Check DB: Not found
  3. Parse PDF: Not found
  4. Return 404

RESPONSE:
  {
    "success": false,
    "message": "Student not found in PDF",
    "rollNumber": "999999"
  }
```

### Example 4: Batch Import

```
REQUEST:
  POST /api/students/import-from-pdf

PROCESSING:
  1. Parse entire PDF
  2. Extract 5000 students
  3. Prepare bulk operations
  4. Execute bulkWrite
  5. Return statistics

RESPONSE:
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

## Performance Optimization

```
┌─────────────────────────────────────────────────────┐
│              Performance Strategy                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  1. Database-First Approach                         │
│     ↳ Check MongoDB before parsing PDF             │
│     ↳ Result: Instant response if cached           │
│                                                      │
│  2. Bulk Operations                                 │
│     ↳ Use bulkWrite instead of individual saves    │
│     ↳ Result: 10x faster for batch imports         │
│                                                      │
│  3. Upsert Strategy                                 │
│     ↳ Update existing, insert new                  │
│     ↳ Result: No duplicate checking needed         │
│                                                      │
│  4. Indexes                                         │
│     ↳ rollNumber indexed                           │
│     ↳ Result: Fast lookups                         │
│                                                      │
│  5. Lean Queries                                    │
│     ↳ Return plain objects when possible           │
│     ↳ Result: Lower memory usage                   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Error Handling Strategy

```
┌────────────────────────────────────────────┐
│         Error Handling Layers              │
├────────────────────────────────────────────┤
│                                            │
│  Layer 1: Input Validation                │
│    ├─► express-validator                  │
│    └─► Return 400 Bad Request             │
│                                            │
│  Layer 2: Business Logic                  │
│    ├─► try-catch blocks                   │
│    ├─► Null checks                        │
│    └─► Return 404 Not Found               │
│                                            │
│  Layer 3: Database Errors                 │
│    ├─► MongoDB connection errors          │
│    ├─► Validation errors                  │
│    └─► Return 500 Server Error            │
│                                            │
│  Layer 4: File System Errors              │
│    ├─► PDF not found                      │
│    ├─► Parse errors                       │
│    └─► Return 500 Server Error            │
│                                            │
└────────────────────────────────────────────┘
```

## Testing Strategy

```
┌─────────────────────────────────────────────────┐
│              Testing Approach                    │
├─────────────────────────────────────────────────┤
│                                                  │
│  1. Unit Tests (Recommended)                    │
│     ├─► Test PDF parser                         │
│     ├─► Test controller functions               │
│     └─► Test database operations                │
│                                                  │
│  2. Integration Tests (Provided)                │
│     ├─► test_pdf_import.js (Node.js)           │
│     ├─► test_pdf_import.html (Browser)         │
│     └─► Postman collection                      │
│                                                  │
│  3. Manual Testing                              │
│     ├─► cURL commands                           │
│     ├─► Postman requests                        │
│     └─► Browser interface                       │
│                                                  │
│  4. Load Testing (Future)                       │
│     ├─► Test with large PDFs                    │
│     ├─► Test concurrent requests                │
│     └─► Monitor performance                     │
│                                                  │
└─────────────────────────────────────────────────┘
```
