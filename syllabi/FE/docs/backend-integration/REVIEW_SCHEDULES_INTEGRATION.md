# Review Schedules Backend Integration Guide

## Overview

The Review Schedules feature has been updated to use real API endpoints instead of mock data. This document provides guidance for integrating with the backend.

## Changes Made

### 1. API Client Updates

**File:** `src/features/review-schedules/data/api.ts`

All functions now call real backend endpoints:

- ✅ `list()` - GET `/api/v1/review-schedules`
- ✅ `getById()` - GET `/api/v1/review-schedules/:id`
- ✅ `create()` - POST `/api/v1/review-schedules`
- ✅ `update()` - PATCH `/api/v1/review-schedules/:id`
- ✅ `deleteSchedule()` - DELETE `/api/v1/review-schedules/:id`
- ✅ `getAvailableReviewers()` - GET `/api/v1/review-schedules/reviewers/available`
- ✅ `assignReviewer()` - POST `/api/v1/review-schedules/:scheduleId/assignments`
- ✅ `updateAssignment()` - PATCH `/api/v1/review-schedules/assignments/:assignmentId`
- ✅ `removeAssignment()` - DELETE `/api/v1/review-schedules/assignments/:assignmentId`
- ✅ `getProgress()` - GET `/api/v1/review-schedules/:scheduleId/progress`
- ✅ `sendReminders()` - POST `/api/v1/review-schedules/:scheduleId/reminders`
- ✅ `exportReport()` - GET `/api/v1/review-schedules/:scheduleId/export`
- ✅ `getAuditTrail()` - GET `/api/v1/review-schedules/:scheduleId/audit-trail`
- ✅ `getSemesters()` - GET `/api/v1/semesters`
- ✅ `getSemesterById()` - GET `/api/v1/semesters/:id`

### 2. Removed Mock Data

- Removed faker.js mock data generation
- Removed in-memory data stores
- Removed mock report generation

### 3. Authentication Integration

All API requests automatically include the Firebase ID token in the Authorization header via the API client interceptor.

## Backend Requirements

### Required Endpoints

See `docs/backend-integration/review-schedules-api-spec.md` for complete API specification including:

- Request/response formats
- Validation rules
- Business rules
- Error handling
- Status codes

### Database Schema

The backend should implement tables for:

1. **review_schedules** - Main schedule data
2. **reviewer_assignments** - Reviewer assignments per department
3. **audit_trail** - Change history
4. **semesters** - Semester information with submission periods

### Automated Tasks

The backend should implement:

1. **Deadline Alerts Cron Job**
   - Check schedules with alerts enabled
   - Send notifications at configured thresholds
   - Send overdue alerts if enabled
   - Log alerts in audit trail

2. **Status Updates**
   - Automatically update schedule status based on dates
   - Calculate progress statistics
   - Update overdue counts

## Testing the Integration

### 1. Environment Setup

Set the API base URL in `.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

For production:
```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

### 2. Test Authentication

1. Sign in with Firebase
2. Check browser console for auth logs
3. Verify `/api/auth/verify` is called successfully
4. Verify user role is stored correctly

### 3. Test Review Schedules

1. **List View**
   - Navigate to `/review-schedules`
   - Should call `GET /api/v1/review-schedules`
   - Verify data displays correctly
   - Test filters and search
   - Test pagination

2. **Create Schedule**
   - Click "Tạo lịch phê duyệt"
   - Fill in form
   - Submit
   - Should call `POST /api/v1/review-schedules`
   - Verify success toast
   - Verify redirect to detail page

3. **Edit Schedule**
   - Click edit on a schedule
   - Modify fields
   - Submit
   - Should call `PATCH /api/v1/review-schedules/:id`
   - Verify success toast

4. **Delete Schedule**
   - Click delete on an UPCOMING schedule
   - Confirm deletion
   - Should call `DELETE /api/v1/review-schedules/:id`
   - Verify success toast
   - Verify schedule removed from list

5. **Detail View**
   - Click on a schedule
   - Should call `GET /api/v1/review-schedules/:id`
   - Should call `GET /api/v1/review-schedules/:id/progress`
   - Verify all data displays correctly

6. **Reviewer Assignment**
   - On detail page, click "Assign Reviewer"
   - Should call `GET /api/v1/review-schedules/reviewers/available`
   - Select reviewers and submit
   - Should call `POST /api/v1/review-schedules/:scheduleId/assignments`
   - Verify success toast

7. **Send Reminders**
   - On detail page, click "Send Reminder"
   - Confirm
   - Should call `POST /api/v1/review-schedules/:scheduleId/reminders`
   - Verify success toast

8. **Export Report**
   - On detail page, click "Export Report"
   - Select format (PDF or Excel)
   - Should call `GET /api/v1/review-schedules/:scheduleId/export`
   - Verify file downloads

## Error Handling

The frontend handles these error scenarios:

- **401 Unauthorized** - Redirects to login
- **403 Forbidden** - Shows permission error
- **404 Not Found** - Shows not found message
- **409 Conflict** - Shows conflict error (e.g., duplicate schedule)
- **422 Validation Error** - Shows field-level validation errors
- **500 Server Error** - Shows generic error message

All errors display Vietnamese messages to the user.

## API Client Configuration

**File:** `src/lib/api-client.ts`

The API client:
- Automatically adds Firebase token to all requests
- Handles common error scenarios
- Logs requests/responses in development
- Supports file uploads and downloads

## Data Transformation

### Date Handling

- Frontend sends dates in ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`
- Backend should return dates in the same format
- Frontend displays dates in Vietnamese format: `dd/MM/yyyy`

### Status Calculation

The frontend calculates status client-side using `calculateScheduleStatus()` utility, but the backend should also calculate and return the status to ensure consistency.

## Role-Based Access Control

Review schedules are restricted to users with these roles:
- `ACADEMIC_MANAGER`
- `Admin`

The backend should verify user role on all endpoints.

## Monitoring and Logging

### Frontend Logging

In development mode, the API client logs:
- All requests (method, URL, params, data)
- All responses (status, data)
- All errors (status, message, details)

### Backend Logging

The backend should log:
- All API requests with user ID
- All mutations (create, update, delete)
- All errors with stack traces
- Automated alert sends
- Report exports

## Performance Considerations

### Caching

The frontend uses TanStack Query for caching:
- List data: 5 minutes
- Detail data: 5 minutes
- Progress data: 1 minute (auto-refreshes every 60 seconds)
- Semesters: 1 hour

### Pagination

- Default page size: 10
- Available page sizes: 10, 20, 50
- Backend should support efficient pagination

### Filtering

The backend should support efficient filtering on:
- Schedule name (text search)
- Status (exact match)
- Semester ID (exact match)
- Academic year (exact match)

## Security Considerations

1. **Authentication**: All endpoints require valid Firebase token
2. **Authorization**: Verify user role on all endpoints
3. **Input Validation**: Validate all input data
4. **SQL Injection**: Use parameterized queries
5. **XSS Prevention**: Sanitize user input
6. **CORS**: Configure CORS for frontend domain
7. **Rate Limiting**: Implement rate limiting on API endpoints

## Deployment Checklist

### Frontend
- [ ] Set production API URL in environment variables
- [ ] Build production bundle: `pnpm build`
- [ ] Test production build: `pnpm preview`
- [ ] Deploy to hosting (Netlify, Vercel, etc.)

### Backend
- [ ] Implement all required endpoints
- [ ] Set up database schema
- [ ] Implement authentication middleware
- [ ] Implement authorization checks
- [ ] Set up automated deadline alerts cron job
- [ ] Configure email service for notifications
- [ ] Set up logging and monitoring
- [ ] Configure CORS for frontend domain
- [ ] Deploy to production server
- [ ] Set up SSL certificate

### Testing
- [ ] Test all CRUD operations
- [ ] Test role-based access control
- [ ] Test error handling
- [ ] Test file uploads/downloads
- [ ] Test automated alerts
- [ ] Test with production data
- [ ] Load testing
- [ ] Security testing

## Support

For questions or issues:
1. Check the API specification: `docs/backend-integration/review-schedules-api-spec.md`
2. Check browser console for error logs
3. Check network tab for API requests/responses
4. Check backend logs for server errors

## Next Steps

1. Backend team implements API endpoints per specification
2. Frontend team tests integration with backend
3. Fix any issues or mismatches
4. Conduct end-to-end testing
5. Deploy to production
