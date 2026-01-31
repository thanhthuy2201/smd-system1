# Review Schedules API Specification

## Overview

This document specifies the API endpoints required for the Review Schedules Management feature. All endpoints require authentication via Firebase ID token in the Authorization header.

## Authentication

All requests must include:
```
Authorization: Bearer <firebase_id_token>
```

## Base URL

```
/api/v1/review-schedules
```

## Endpoints

### 1. List Review Schedules

**GET** `/api/v1/review-schedules`

List all review schedules with optional filtering, sorting, and pagination.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `pageSize` (number, optional): Items per page (default: 10)
- `search` (string, optional): Search by schedule name
- `status` (string, optional): Filter by status (UPCOMING, ACTIVE, COMPLETED, OVERDUE, ALL)
- `semesterId` (string, optional): Filter by semester ID
- `academicYear` (string, optional): Filter by academic year (e.g., "2024-2025")
- `sortBy` (string, optional): Field to sort by (default: "reviewStartDate")
- `sortOrder` (string, optional): Sort order (asc, desc) (default: "desc")

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Phê duyệt HK1 2024-2025",
      "semesterId": "semester-1-2024",
      "semesterName": "HK1 2024-2025",
      "academicYear": "2024-2025",
      "reviewStartDate": "2024-09-01T00:00:00Z",
      "l1Deadline": "2024-09-15T00:00:00Z",
      "l2Deadline": "2024-09-30T00:00:00Z",
      "finalApprovalDate": "2024-10-15T00:00:00Z",
      "status": "ACTIVE",
      "totalSyllabi": 50,
      "reviewedCount": 30,
      "pendingCount": 20,
      "overdueCount": 5,
      "progressPercentage": 60,
      "alertConfig": {
        "enabled": true,
        "thresholds": [7, 3, 1],
        "channels": ["EMAIL", "IN_APP"],
        "sendOverdueAlerts": true
      },
      "createdBy": "Admin User",
      "createdAt": "2024-08-01T00:00:00Z",
      "updatedAt": "2024-09-10T00:00:00Z",
      "isActive": true
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 10
}
```

### 2. Get Review Schedule by ID

**GET** `/api/v1/review-schedules/:id`

Get detailed information about a specific review schedule.

**Response:**
```json
{
  "id": "uuid",
  "name": "Phê duyệt HK1 2024-2025",
  "semesterId": "semester-1-2024",
  "semesterName": "HK1 2024-2025",
  "academicYear": "2024-2025",
  "reviewStartDate": "2024-09-01T00:00:00Z",
  "l1Deadline": "2024-09-15T00:00:00Z",
  "l2Deadline": "2024-09-30T00:00:00Z",
  "finalApprovalDate": "2024-10-15T00:00:00Z",
  "status": "ACTIVE",
  "totalSyllabi": 50,
  "reviewedCount": 30,
  "pendingCount": 20,
  "overdueCount": 5,
  "progressPercentage": 60,
  "alertConfig": {
    "enabled": true,
    "thresholds": [7, 3, 1],
    "channels": ["EMAIL", "IN_APP"],
    "sendOverdueAlerts": true
  },
  "createdBy": "Admin User",
  "createdAt": "2024-08-01T00:00:00Z",
  "updatedAt": "2024-09-10T00:00:00Z",
  "isActive": true
}
```

### 3. Create Review Schedule

**POST** `/api/v1/review-schedules`

Create a new review schedule.

**Request Body:**
```json
{
  "name": "Phê duyệt HK1 2024-2025",
  "semesterId": "semester-1-2024",
  "reviewStartDate": "2024-09-01T00:00:00Z",
  "l1Deadline": "2024-09-15T00:00:00Z",
  "l2Deadline": "2024-09-30T00:00:00Z",
  "finalApprovalDate": "2024-10-15T00:00:00Z",
  "alertConfig": {
    "enabled": true,
    "thresholds": [7, 3, 1],
    "channels": ["EMAIL", "IN_APP"],
    "sendOverdueAlerts": true
  }
}
```

**Validation Rules:**
- `name`: Required, 3-200 characters
- `semesterId`: Required, must exist
- `reviewStartDate`: Required, must be after semester submission end date
- `l1Deadline`: Required, must be at least 7 days after reviewStartDate
- `l2Deadline`: Required, must be at least 7 days after l1Deadline
- `finalApprovalDate`: Required, must be at least 7 days after l2Deadline

**Response:** Same as Get Review Schedule by ID

**Error Responses:**
- `400`: Validation error
- `409`: Duplicate schedule for the same semester
- `403`: User doesn't have permission

### 4. Update Review Schedule

**PATCH** `/api/v1/review-schedules/:id`

Update an existing review schedule.

**Request Body:** (all fields optional)
```json
{
  "name": "Updated name",
  "l1Deadline": "2024-09-20T00:00:00Z",
  "l2Deadline": "2024-10-05T00:00:00Z",
  "finalApprovalDate": "2024-10-20T00:00:00Z",
  "alertConfig": {
    "enabled": false
  }
}
```

**Business Rules:**
- Cannot modify `semesterId` or `reviewStartDate` after creation
- For ACTIVE schedules: Can only extend deadlines, not shorten them
- For COMPLETED schedules: Cannot modify dates
- For UPCOMING schedules: Can modify all dates

**Response:** Same as Get Review Schedule by ID

**Error Responses:**
- `400`: Validation error or business rule violation
- `404`: Schedule not found
- `403`: User doesn't have permission

### 5. Delete Review Schedule

**DELETE** `/api/v1/review-schedules/:id`

Soft delete a review schedule.

**Business Rules:**
- Can only delete UPCOMING schedules
- Cannot delete if any reviews have been submitted

**Response:** `204 No Content`

**Error Responses:**
- `400`: Cannot delete (has reviews or not UPCOMING)
- `404`: Schedule not found
- `403`: User doesn't have permission

### 6. Get Available Reviewers

**GET** `/api/v1/review-schedules/reviewers/available`

Get list of users who can be assigned as reviewers.

**Query Parameters:**
- `departmentId` (string, optional): Filter by department

**Response:**
```json
[
  {
    "id": "user-uuid",
    "name": "Dr. Nguyen Van A",
    "email": "nguyenvana@university.edu",
    "role": "HEAD_OF_DEPARTMENT",
    "department": "Computer Science",
    "departmentId": "dept-uuid",
    "currentAssignments": 3
  }
]
```

### 7. Assign Reviewer

**POST** `/api/v1/review-schedules/:scheduleId/assignments`

Assign a reviewer to a department for a specific schedule.

**Request Body:**
```json
{
  "departmentId": "dept-uuid",
  "primaryReviewerId": "user-uuid",
  "backupReviewerId": "user-uuid-2"
}
```

**Validation Rules:**
- `primaryReviewerId` and `backupReviewerId` must be different
- Both reviewers must have appropriate roles (HEAD_OF_DEPARTMENT or ACADEMIC_AFFAIRS)
- Cannot assign same reviewer to multiple departments in same schedule

**Response:** `201 Created`

**Error Responses:**
- `400`: Validation error
- `409`: Reviewer already assigned
- `403`: User doesn't have permission

### 8. Update Reviewer Assignment

**PATCH** `/api/v1/review-schedules/assignments/:assignmentId`

Update an existing reviewer assignment.

**Request Body:**
```json
{
  "primaryReviewerId": "new-user-uuid",
  "backupReviewerId": "new-user-uuid-2"
}
```

**Response:** `200 OK`

### 9. Remove Reviewer Assignment

**DELETE** `/api/v1/review-schedules/assignments/:assignmentId`

Remove a reviewer assignment.

**Business Rules:**
- Cannot remove if reviews are in progress
- Shows confirmation dialog on frontend

**Response:** `204 No Content`

### 10. Get Progress Statistics

**GET** `/api/v1/review-schedules/:scheduleId/progress`

Get detailed progress statistics for a review schedule.

**Response:**
```json
{
  "overall": {
    "total": 50,
    "reviewed": 30,
    "pending": 20,
    "overdue": 5,
    "progressPercentage": 60,
    "averageReviewTime": 3.5
  },
  "byDepartment": [
    {
      "departmentId": "dept-uuid",
      "departmentName": "Computer Science",
      "total": 10,
      "reviewed": 7,
      "pending": 3,
      "overdue": 1,
      "progressPercentage": 70
    }
  ],
  "byReviewer": [
    {
      "reviewerId": "user-uuid",
      "reviewerName": "Dr. Nguyen Van A",
      "assigned": 10,
      "completed": 7,
      "pending": 3,
      "overdue": 1,
      "averageReviewTime": 2.5
    }
  ]
}
```

### 11. Send Reminders

**POST** `/api/v1/review-schedules/:scheduleId/reminders`

Send reminder notifications to reviewers.

**Request Body:**
```json
{
  "reviewerIds": ["user-uuid-1", "user-uuid-2"]
}
```

**Notes:**
- If `reviewerIds` is empty or not provided, sends to all assigned reviewers with pending reviews
- Creates audit trail entry
- Sends via configured channels (email, in-app)

**Response:** `200 OK`

### 12. Export Report

**GET** `/api/v1/review-schedules/:scheduleId/export`

Export progress report in specified format.

**Query Parameters:**
- `format` (string, required): "PDF" or "EXCEL"

**Response:** Binary file (application/pdf or application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

**Report Contents:**
- Schedule details (name, semester, dates, status)
- Progress statistics (total, reviewed, pending, overdue)
- Department breakdown
- Reviewer performance
- Overdue items list

**PDF Format:** Single document with university branding
**Excel Format:** Multiple sheets for different data views

### 13. Get Audit Trail

**GET** `/api/v1/review-schedules/:scheduleId/audit-trail`

Get audit trail (change history) for a review schedule.

**Response:**
```json
[
  {
    "id": "audit-uuid",
    "action": "CREATED",
    "fieldChanged": null,
    "oldValue": null,
    "newValue": null,
    "userId": "user-uuid",
    "userName": "Admin User",
    "timestamp": "2024-08-01T00:00:00Z"
  },
  {
    "id": "audit-uuid-2",
    "action": "UPDATED",
    "fieldChanged": "l1Deadline",
    "oldValue": "2024-09-15T00:00:00Z",
    "newValue": "2024-09-20T00:00:00Z",
    "userId": "user-uuid",
    "userName": "Admin User",
    "timestamp": "2024-09-10T00:00:00Z"
  }
]
```

**Action Types:**
- `CREATED`: Schedule created
- `UPDATED`: Schedule updated
- `DELETED`: Schedule deleted
- `REVIEWER_ASSIGNED`: Reviewer assigned
- `REVIEWER_REMOVED`: Reviewer removed
- `REMINDER_SENT`: Reminder sent
- `REPORT_EXPORTED`: Report exported

### 14. Get Semesters

**GET** `/api/v1/semesters`

Get list of all available semesters with submission period information.

**Response:**
```json
[
  {
    "id": "semester-1-2024",
    "name": "HK1 2024-2025",
    "academicYear": "2024-2025",
    "startDate": "2024-09-01T00:00:00Z",
    "endDate": "2025-01-15T00:00:00Z",
    "submissionStartDate": "2024-07-01T00:00:00Z",
    "submissionEndDate": "2024-08-31T00:00:00Z"
  }
]
```

### 15. Get Semester by ID

**GET** `/api/v1/semesters/:id`

Get a specific semester with submission period information.

**Response:** Same as single semester object from Get Semesters

**Error Responses:**
- `404`: Semester not found

## Status Calculation

The `status` field is calculated based on dates and progress:

- **UPCOMING**: `reviewStartDate` is in the future
- **ACTIVE**: Current date is between `reviewStartDate` and `finalApprovalDate`, and has pending reviews
- **COMPLETED**: Current date is after `finalApprovalDate` and all reviews are done (`pendingCount === 0`)
- **OVERDUE**: Current date is after `finalApprovalDate` and still has pending reviews (`pendingCount > 0`)

## Date Format

All dates should be in ISO 8601 format with timezone: `YYYY-MM-DDTHH:mm:ssZ`

## Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "name",
        "message": "Name is required"
      }
    ]
  }
}
```

## Common Error Codes

- `VALIDATION_ERROR`: Request validation failed
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: User doesn't have permission
- `CONFLICT`: Resource already exists or business rule violation
- `INTERNAL_ERROR`: Server error

## Automated Deadline Alerts

The backend should implement a cron job to send automated alerts based on the `alertConfig`:

**Alert Triggers:**
- Send alerts at configured thresholds (e.g., 7, 3, 1 days before deadline)
- Send overdue alerts if `sendOverdueAlerts` is true
- Send via configured channels (EMAIL, IN_APP)

**Alert Recipients:**
- Assigned reviewers with pending reviews
- Department heads
- Academic managers (optional)

**Alert Content:**
- Schedule name
- Deadline date
- Number of pending reviews
- Link to review page
