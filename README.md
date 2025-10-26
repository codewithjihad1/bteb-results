# BTEB Result Management System - Backend API

A comprehensive REST API for managing and querying BTEB (Bangladesh Technical Education Board) examination results.

## 🚀 Features

-   **Individual Result Search**: Find student results by roll number
-   **Institute-wise Results**: View all results for a specific institute
-   **Advanced Filtering**: Search by status, GPA range, institute, etc.
-   **Statistics**: Get comprehensive statistics for students and institutes
-   **Top Performers**: View rankings and top-performing students/institutes
-   **PDF Import**: Automatically parse and import results from PDF files

## 📋 Prerequisites

-   Node.js (v14 or higher)
-   MongoDB (v4.4 or higher)
-   npm or yarn

## 🛠️ Installation

1. Clone the repository:

```bash
cd result_management_system_backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file:

```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bteb_results
NODE_ENV=development
```

5. Start MongoDB service

6. Import data from PDF:

```bash
node scripts/importData.js
```

7. Start the server:

```bash
# Development
npm run dev

# Production
npm start
```

## 📚 API Endpoints

### Students

#### Get Student by Roll Number

```http
GET /api/students/roll/:rollNumber
```

**Example:**

```bash
curl http://localhost:5000/api/students/roll/190002
```

#### Search Students

```http
GET /api/students/search?rollNumber=190&status=PASSED&minGpa=3.0
```

**Query Parameters:**

-   `rollNumber`: Filter by roll number (partial match)
-   `instituteCode`: Filter by institute code
-   `instituteName`: Filter by institute name
-   `status`: PASSED | REFERRED | WITHHELD | ABSENT
-   `minGpa`: Minimum GPA (0-4)
-   `maxGpa`: Maximum GPA (0-4)
-   `page`: Page number (default: 1)
-   `limit`: Results per page (default: 20)

#### Get All Students

```http
GET /api/students?page=1&limit=20&sortBy=rollNumber&order=asc
```

#### Get Top Performers

```http
GET /api/students/top-performers?limit=10&instituteCode=11044
```

#### Get Students by Status

```http
GET /api/students/status/PASSED?page=1&limit=20
```

#### Get Student Statistics

```http
GET /api/students/stats/overview
```

### Institutes

#### Get All Institutes

```http
GET /api/institutes?page=1&limit=20
```

#### Get Institute by Code

```http
GET /api/institutes/code/11044
```

#### Get Institute Results

```http
GET /api/institutes/11044/results?status=PASSED&page=1&limit=20
```

#### Get Institute Statistics

```http
GET /api/institutes/11044/statistics
```

#### Search Institutes

```http
GET /api/institutes/search?name=Polytechnic&location=Panchagar
```

#### Get Top Institutes

```http
GET /api/institutes/top-performers?limit=10
```

## 📊 Response Format

### Success Response

```json
{
    "success": true,
    "data": {
        "rollNumber": "190002",
        "instituteCode": "11044",
        "instituteName": "Himaloy Polytechnic Institute of Technology, Panchagar",
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
    }
}
```

### Error Response

```json
{
    "success": false,
    "message": "Student not found with this roll number"
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalRecords": 200,
    "limit": 20
  }
}
```

## 🗃️ Data Models

### Student Model

```javascript
{
  rollNumber: String,
  instituteCode: String,
  instituteName: String,
  semester: Number,
  regulation: String,
  examYear: Number,
  status: String, // PASSED | REFERRED | WITHHELD | ABSENT
  gpaData: {
    gpa1: Number,
    gpa2: Number,
    gpa3: Number,
    gpa4: Number,
    gpa5: Number,
    gpa6: Number
  },
  referredSubjects: [{
    subjectCode: String,
    subjectType: String // T | P
  }],
  passedAllSubjects: Boolean
}
```

### Institute Model

```javascript
{
  instituteCode: String,
  instituteName: String,
  location: String,
  totalStudents: Number,
  passedStudents: Number,
  referredStudents: Number,
  passPercentage: Number
}
```

## 🔧 Technologies Used

-   **Node.js** - Runtime environment
-   **Express.js** - Web framework
-   **MongoDB** - Database
-   **Mongoose** - ODM
-   **pdf-parse** - PDF parsing
-   **express-validator** - Input validation
-   **helmet** - Security headers
-   **cors** - CORS handling
-   **morgan** - Logging
-   **compression** - Response compression

## 📝 Environment Variables

| Variable    | Description               | Default                                |
| ----------- | ------------------------- | -------------------------------------- |
| PORT        | Server port               | 5000                                   |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/bteb_results |
| NODE_ENV    | Environment mode          | development                            |
| CORS_ORIGIN | CORS allowed origin       | \*                                     |

## 🚀 Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### PM2

```bash
pm2 start index.js --name bteb-api
```

## 📄 License

ISC

## 👥 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For issues and questions, please open an issue on GitHub.
