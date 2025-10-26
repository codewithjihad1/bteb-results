# Migration Guide - Multi-Semester Support

## Overview

This guide explains how to migrate from the single-semester system to the multi-semester, multi-regulation system.

## Breaking Changes

### 1. Database Schema Changes

-   **New Fields Added:**
    -   `gpaData.gpa7` (Number, nullable)
    -   `gpaData.gpa8` (Number, nullable)
-   **Field Changes:**

    -   `semester`: Now required, indexed, must be between 3-8
    -   `regulation`: Now required, indexed, must be "2016" or "2022"

-   **Index Changes:**
    -   Old unique index on `rollNumber` removed
    -   New composite unique index: `{ rollNumber: 1, semester: 1, regulation: 1 }`
    -   New indexes added for filtering: `{ semester: 1, regulation: 1 }`

### 2. API Changes

All student-related endpoints now accept optional `semester` and `regulation` query parameters.

## Migration Steps

### Step 1: Backup Database

```bash
# Backup your MongoDB database
mongodump --db bteb_results --out ./backup/$(date +%Y%m%d)
```

### Step 2: Update Dependencies

```bash
cd server
npm install
```

### Step 3: Drop Old Unique Index

If you have existing data, you need to drop the old unique index on `rollNumber`:

```javascript
// Connect to MongoDB and run:
db.students.dropIndex("rollNumber_1");
```

### Step 4: Update Existing Documents

If you have existing data from the old schema, update them:

```javascript
// MongoDB update script
db.students.updateMany(
    { semester: { $exists: false } },
    {
        $set: {
            semester: 6,
            regulation: "2022",
        },
    }
);

// Add new indexes
db.students.createIndex(
    { rollNumber: 1, semester: 1, regulation: 1 },
    { unique: true }
);
db.students.createIndex({ semester: 1, regulation: 1 });
db.students.createIndex({ "gpaData.gpa7": -1 });
```

### Step 5: Re-import Data

Clear the database and re-import all PDFs:

```bash
# Delete all existing students (optional - only if you want fresh data)
# Then import each semester:

# 3rd Semester
POST http://localhost:5000/api/students/import-from-pdf?semester=3&regulation=2022

# 5th Semester
POST http://localhost:5000/api/students/import-from-pdf?semester=5&regulation=2022

# 6th Semester
POST http://localhost:5000/api/students/import-from-pdf?semester=6&regulation=2022

# 7th Semester
POST http://localhost:5000/api/students/import-from-pdf?semester=7&regulation=2022
```

### Step 6: Verify Migration

```bash
# Check available PDFs
GET http://localhost:5000/api/students/pdfs/available

# Check statistics for each semester
GET http://localhost:5000/api/students/stats/overview?semester=5&regulation=2022
GET http://localhost:5000/api/students/stats/overview?semester=6&regulation=2022
GET http://localhost:5000/api/students/stats/overview?semester=7&regulation=2022

# Verify a student's data
GET http://localhost:5000/api/students/roll/190002
```

## API Usage Changes

### Before (Old System)

```bash
# Get student
GET /api/students/roll/190002

# Search students
GET /api/students/search?instituteCode=11044

# Import from PDF (hardcoded to 6th semester)
POST /api/students/import-from-pdf
```

### After (New System)

```bash
# Get all semester results for a student
GET /api/students/roll/190002

# Get specific semester result
GET /api/students/roll/190002?semester=6&regulation=2022

# Search students in specific semester
GET /api/students/search?institudeCode=11044&semester=5&regulation=2022

# Import specific semester
POST /api/students/import-from-pdf?semester=5&regulation=2022
```

## Code Migration

### Frontend Changes Required

#### 1. Update API Calls

```javascript
// OLD
const response = await fetch(`/api/students/roll/${rollNumber}`);

// NEW - Get all semesters
const response = await fetch(`/api/students/roll/${rollNumber}`);

// NEW - Get specific semester
const response = await fetch(
    `/api/students/roll/${rollNumber}?semester=6&regulation=2022`
);
```

#### 2. Handle Multiple Results

```javascript
// The API now returns an array if no semester specified
const data = await response.json();

if (Array.isArray(data.data)) {
    // Multiple semester results
    console.log(`Found ${data.count} results`);
    data.data.forEach((result) => {
        console.log(
            `Semester ${result.semester}: GPA ${result.currentSemesterGpa}`
        );
    });
} else {
    // Single result
    console.log(
        `Semester ${data.data.semester}: GPA ${data.data.currentSemesterGpa}`
    );
}
```

#### 3. Update Search Filters

```javascript
// Add semester and regulation to search form
const searchParams = new URLSearchParams({
    instituteCode: "11044",
    semester: "6",
    regulation: "2022",
    minGpa: "3.0",
});

const response = await fetch(`/api/students/search?${searchParams}`);
```

## Rollback Plan

If you need to rollback to the old system:

### 1. Restore Database Backup

```bash
mongorestore --db bteb_results ./backup/YYYYMMDD
```

### 2. Revert Code Changes

```bash
git revert <commit-hash>
```

### 3. Reinstall Dependencies

```bash
npm install
```

## Testing Checklist

-   [ ] All PDFs detected correctly with `/students/pdfs/available`
-   [ ] Import works for each semester
-   [ ] Student lookup by roll number returns correct results
-   [ ] Search with semester/regulation filters works
-   [ ] Statistics endpoint works with filters
-   [ ] Multiple semester results returned when no filter specified
-   [ ] GPA calculations correct for each semester
-   [ ] Unique constraint works (same roll can exist in different semesters)
-   [ ] Top performers query works across semesters
-   [ ] Institute statistics work per semester

## Common Issues

### Issue 1: Duplicate Key Error

**Error:** `E11000 duplicate key error collection`

**Solution:**

1. Check if old unique index exists: `db.students.getIndexes()`
2. Drop old index: `db.students.dropIndex("rollNumber_1")`
3. Recreate with new composite index

### Issue 2: PDF Not Found

**Error:** `PDF file not found for semester X, regulation Y`

**Solution:**

1. Check PDF filename matches pattern: `RESULT_{X}th_{Y}_Regulation.pdf`
2. Verify PDF is in `/server/data/` directory
3. Check file permissions

### Issue 3: GPA Field Undefined

**Error:** `Cannot read property 'gpa6' of undefined`

**Solution:**

1. Use dynamic GPA field based on semester
2. Use virtual field `currentSemesterGpa` instead of hardcoded `gpa6`

```javascript
// BAD
const gpa = student.gpaData.gpa6;

// GOOD
const gpa = student.gpaData[`gpa${student.semester}`];
// or
const gpa = student.currentSemesterGpa;
```

## Support

For questions or issues during migration, check:

1. Server logs: Look for parsing errors or database errors
2. API documentation: `docs/API_UPDATED.md`
3. PDF format guide: `PDF_IMPORT_GUIDE.md`

## Performance Considerations

With multiple semesters, the database will grow. Consider:

1. **Indexing Strategy:** Already optimized with compound indexes
2. **Query Performance:** Use filters (semester, regulation) in queries
3. **Pagination:** Always use pagination for large result sets
4. **Aggregations:** Statistics queries use MongoDB aggregation pipeline (efficient)

## Future Enhancements

Potential improvements for multi-semester system:

1. Bulk import all PDFs at once
2. Student progress tracking dashboard
3. Semester-to-semester GPA trends
4. Comparative analytics across regulations
5. Automated PDF detection and import on file upload
