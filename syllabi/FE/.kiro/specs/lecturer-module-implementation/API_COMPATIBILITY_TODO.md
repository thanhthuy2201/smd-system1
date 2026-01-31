# API Compatibility Analysis & TODO

## Overview
This document analyzes the compatibility between the Lecturer Module requirements (from `Lecturer_Detailed_Design.txt`) and the actual backend API (from `openapi.json`).

## Status Legend
- ✅ **EXISTS**: Endpoint exists in OpenAPI spec
- ⚠️ **PARTIAL**: Endpoint exists but may need field adjustments
- ❌ **MISSING**: Endpoint does not exist in OpenAPI spec - **BACKEND TODO**

---

## FE02 - Create and Propose New Syllabi

### Required Endpoints

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /api/v1/lecturer/courses` | ❌ **MISSING** | **TODO**: Backend needs to implement endpoint to get courses assigned to lecturer |
| `GET /api/v1/courses/{id}/details` | ⚠️ **PARTIAL** | Exists as `GET /api/v1/courses/{course_id}` - verify response includes all needed fields |
| `GET /api/v1/programs/{id}/plos` | ❌ **MISSING** | **TODO**: Backend needs to implement endpoint to get PLOs for a program |
| `POST /api/v1/syllabi` | ✅ **EXISTS** | Endpoint exists |
| `POST /api/v1/syllabi/{id}/clos` | ❌ **MISSING** | **TODO**: Backend needs endpoint to add individual CLOs (or use nested structure in main POST) |
| `POST /api/v1/syllabi/{id}/content` | ❌ **MISSING** | **TODO**: Backend needs endpoint to add course content/topics (or use nested structure) |
| `POST /api/v1/syllabi/{id}/assessments` | ❌ **MISSING** | **TODO**: Backend needs endpoint to add assessments (or use nested structure) |
| `POST /api/v1/syllabi/{id}/references` | ❌ **MISSING** | **TODO**: Backend needs endpoint to add references (or use nested structure) |
| `PUT /api/v1/syllabi/{id}/draft` | ❌ **MISSING** | **TODO**: Backend needs auto-save draft endpoint |
| `GET /api/v1/syllabi/{id}/preview` | ❌ **MISSING** | **TODO**: Backend needs preview endpoint for formatted syllabus |

### Alternative Approach
**RECOMMENDATION**: Instead of separate POST endpoints for CLOs, content, assessments, and references, the backend could accept a nested JSON structure in the main `POST /api/v1/syllabi` endpoint. This would simplify the API and reduce round trips.

Example nested structure:
```json
{
  "courseId": 101,
  "academicYear": "2024-2025",
  "semester": "Fall",
  "clos": [...],
  "content": [...],
  "assessments": [...],
  "references": [...]
}
```

---

## FE03 - Update Syllabi

### Required Endpoints

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /api/v1/lecturer/syllabi` | ❌ **MISSING** | **TODO**: Backend needs lecturer-specific syllabi list with filters |
| `GET /api/v1/syllabi/{id}` | ✅ **EXISTS** | Endpoint exists |
| `PUT /api/v1/syllabi/{id}` | ✅ **EXISTS** | Endpoint exists |
| `PUT /api/v1/syllabi/{id}/clos/{cloId}` | ❌ **MISSING** | **TODO**: Backend needs endpoint to update specific CLO |
| `DELETE /api/v1/syllabi/{id}/clos/{cloId}` | ❌ **MISSING** | **TODO**: Backend needs endpoint to delete specific CLO |
| `GET /api/v1/syllabi/{id}/versions` | ❌ **MISSING** | **TODO**: Backend needs version history endpoint |
| `GET /api/v1/syllabi/{id}/feedback` | ❌ **MISSING** | **TODO**: Backend needs endpoint to get reviewer feedback |
| `POST /api/v1/syllabi/{id}/withdraw` | ❌ **MISSING** | **TODO**: Backend needs endpoint to withdraw submission |

---

## FE04 - Submit Syllabi for Review

### Required Endpoints

| Endpoint | Status | Notes |
|----------|--------|-------|
| `POST /api/v1/syllabi/{id}/validate` | ❌ **MISSING** | **TODO**: Backend needs pre-submission validation endpoint |
| `POST /api/v1/syllabi/{id}/submit` | ❌ **MISSING** | **TODO**: Backend needs submission endpoint |
| `GET /api/v1/syllabi/{id}/submission-status` | ❌ **MISSING** | **TODO**: Backend needs endpoint to get submission/approval status |

---

## FE05 - View Review Schedules

### Required Endpoints

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /api/v1/lecturer/review-schedules` | ❌ **MISSING** | **TODO**: Backend needs endpoint for lecturer's department review schedules |
| `GET /api/v1/lecturer/submissions` | ❌ **MISSING** | **TODO**: Backend needs endpoint for lecturer's submitted syllabi with status |
| `GET /api/v1/syllabi/{id}/approval-timeline` | ❌ **MISSING** | **TODO**: Backend needs detailed approval timeline endpoint |
| `GET /api/v1/lecturer/deadlines` | ❌ **MISSING** | **TODO**: Backend needs endpoint for upcoming deadlines |

**NOTE**: Review schedules API exists at `/api/v1/review-schedules` but may need lecturer-specific filtering.

---

## FE06 - Evaluate Syllabi (Peer Review)

### Required Endpoints

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /api/v1/lecturer/peer-reviews` | ⚠️ **PARTIAL** | Exists as `GET /api/v1/peer-reviews` - verify it filters by current user |
| `GET /api/v1/syllabi/{id}/review-view` | ❌ **MISSING** | **TODO**: Backend needs read-only review view endpoint (or use regular GET) |
| `GET /api/v1/evaluation-templates/{id}` | ❌ **MISSING** | **TODO**: Backend needs endpoint to get evaluation template with criteria |
| `POST /api/v1/syllabi/{id}/peer-evaluation` | ⚠️ **PARTIAL** | Exists as `POST /api/v1/peer-reviews` - verify request body structure |
| `PUT /api/v1/peer-evaluations/{id}` | ⚠️ **PARTIAL** | Exists as `PUT /api/v1/peer-reviews/{review_id}` - verify it supports draft updates |

---

## FE07 - Provide Feedback (Comments)

### Required Endpoints

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /api/v1/syllabi/{id}/comments` | ❌ **MISSING** | **TODO**: Backend needs endpoint to get comments on a syllabus |
| `POST /api/v1/syllabi/{id}/comments` | ❌ **MISSING** | **TODO**: Backend needs endpoint to add comment to syllabus |
| `POST /api/v1/comments/{id}/reply` | ❌ **MISSING** | **TODO**: Backend needs endpoint to reply to comment |
| `PUT /api/v1/comments/{id}` | ❌ **MISSING** | **TODO**: Backend needs endpoint to edit own comment |
| `DELETE /api/v1/comments/{id}` | ❌ **MISSING** | **TODO**: Backend needs endpoint to delete own comment |
| `PUT /api/v1/comments/{id}/resolve` | ❌ **MISSING** | **TODO**: Backend needs endpoint to mark comment as resolved |

**NOTE**: No comment/feedback system found in OpenAPI spec. This is a major missing feature.

---

## FE08 - Internal Messaging

### Required Endpoints

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /api/v1/messages/inbox` | ✅ **EXISTS** | Endpoint exists |
| `GET /api/v1/messages/sent` | ✅ **EXISTS** | Endpoint exists |
| `GET /api/v1/messages/conversation/{userId}` | ✅ **EXISTS** | Endpoint exists |
| `POST /api/v1/messages` | ✅ **EXISTS** | Endpoint exists |
| `POST /api/v1/messages/{id}/reply` | ✅ **EXISTS** | Endpoint exists |
| `PUT /api/v1/messages/{id}/read` | ✅ **EXISTS** | Endpoint exists |
| `DELETE /api/v1/messages/{id}` | ✅ **EXISTS** | Endpoint exists |
| `GET /api/v1/users/contacts` | ❌ **MISSING** | **TODO**: Backend needs endpoint to get available contacts for messaging |

**NOTE**: Messaging system is well-implemented! Only missing contacts endpoint.

---

## FE09 - Request Updates After Approval

### Required Endpoints

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /api/v1/lecturer/syllabi/approved` | ❌ **MISSING** | **TODO**: Backend needs endpoint to get approved syllabi eligible for updates |
| `POST /api/v1/syllabi/{id}/update-request` | ⚠️ **PARTIAL** | Exists as `POST /api/v1/update-requests` - verify request body structure |
| `GET /api/v1/update-requests/my-requests` | ⚠️ **PARTIAL** | Exists as `GET /api/v1/update-requests` with filtering - verify user filtering |
| `PUT /api/v1/update-requests/{id}` | ✅ **EXISTS** | Endpoint exists |
| `PUT /api/v1/update-requests/{id}/draft-changes` | ❌ **MISSING** | **TODO**: Backend needs endpoint to save proposed changes |
| `POST /api/v1/update-requests/{id}/submit` | ❌ **MISSING** | **TODO**: Backend needs endpoint to submit update request for review |
| `DELETE /api/v1/update-requests/{id}` | ✅ **EXISTS** | Endpoint exists |

---

## Critical Missing Features Summary

### 🔴 HIGH PRIORITY - Core Functionality Blockers

1. **Lecturer-Specific Endpoints**
   - `GET /api/v1/lecturer/courses` - Get assigned courses
   - `GET /api/v1/lecturer/syllabi` - Get lecturer's syllabi with filters
   - `GET /api/v1/lecturer/review-schedules` - Get review schedules
   - `GET /api/v1/lecturer/submissions` - Get submitted syllabi
   - `GET /api/v1/lecturer/deadlines` - Get upcoming deadlines
   - `GET /api/v1/lecturer/syllabi/approved` - Get approved syllabi

2. **Syllabus Workflow**
   - `PUT /api/v1/syllabi/{id}/draft` - Auto-save drafts
   - `POST /api/v1/syllabi/{id}/validate` - Pre-submission validation
   - `POST /api/v1/syllabi/{id}/submit` - Submit for review
   - `POST /api/v1/syllabi/{id}/withdraw` - Withdraw submission
   - `GET /api/v1/syllabi/{id}/versions` - Version history
   - `GET /api/v1/syllabi/{id}/preview` - Formatted preview
   - `GET /api/v1/syllabi/{id}/approval-timeline` - Approval timeline

3. **Comment/Feedback System** (Entire feature missing)
   - `GET /api/v1/syllabi/{id}/comments`
   - `POST /api/v1/syllabi/{id}/comments`
   - `POST /api/v1/comments/{id}/reply`
   - `PUT /api/v1/comments/{id}`
   - `DELETE /api/v1/comments/{id}`
   - `PUT /api/v1/comments/{id}/resolve`

4. **Program Learning Outcomes**
   - `GET /api/v1/programs/{id}/plos` - Get PLOs for CLO mapping

5. **Evaluation Templates**
   - `GET /api/v1/evaluation-templates/{id}` - Get evaluation criteria

### 🟡 MEDIUM PRIORITY - Enhanced Functionality

1. **Nested Resource Management**
   - Individual CLO/Content/Assessment/Reference endpoints (or use nested structure)
   - `PUT /api/v1/syllabi/{id}/clos/{cloId}`
   - `DELETE /api/v1/syllabi/{id}/clos/{cloId}`

2. **Update Request Workflow**
   - `PUT /api/v1/update-requests/{id}/draft-changes` - Save proposed changes
   - `POST /api/v1/update-requests/{id}/submit` - Submit for review

3. **Contacts**
   - `GET /api/v1/users/contacts` - Get available contacts for messaging

---

## Frontend Implementation Strategy

### Phase 1: Use Existing APIs
Start implementation with endpoints that exist:
- User authentication (`/api/v1/auth/*`)
- Basic syllabus CRUD (`/api/v1/syllabi`)
- Messaging system (`/api/v1/messages/*`)
- Update requests (`/api/v1/update-requests`)
- Peer reviews (`/api/v1/peer-reviews`)

### Phase 2: Mock Missing APIs
Create mock API responses for missing endpoints to continue frontend development:
- Use MSW (Mock Service Worker) or similar
- Create realistic mock data matching expected schemas
- Document mock endpoints clearly

### Phase 3: Integrate Real APIs
As backend implements missing endpoints:
- Replace mocks with real API calls
- Update type definitions if response structures differ
- Test integration thoroughly

---

## Recommended Backend API Changes

### 1. Consolidate Nested Resources
Instead of separate endpoints for CLOs, content, assessments, and references, accept nested structures in main syllabus endpoints:

```typescript
// POST /api/v1/syllabi
{
  "courseId": 101,
  "academicYear": "2024-2025",
  "semester": "Fall",
  "clos": [
    { "code": "CLO1", "description": "...", "bloomLevel": "Analyze", "mappedPlos": ["PLO1"] }
  ],
  "content": [
    { "weekNumber": 1, "title": "...", "lectureHours": 3, "labHours": 0 }
  ],
  "assessments": [
    { "type": "Midterm", "name": "...", "weight": 30, "relatedClos": ["CLO1"] }
  ],
  "references": [
    { "type": "Required", "title": "...", "authors": "..." }
  ]
}
```

### 2. Add Lecturer-Specific Endpoints
Create a `/api/v1/lecturer/*` namespace for lecturer-specific operations:
- `/api/v1/lecturer/courses` - Assigned courses
- `/api/v1/lecturer/syllabi` - Lecturer's syllabi
- `/api/v1/lecturer/dashboard` - Dashboard data (already exists!)
- `/api/v1/lecturer/review-schedules` - Review schedules
- `/api/v1/lecturer/submissions` - Submitted syllabi
- `/api/v1/lecturer/deadlines` - Upcoming deadlines

### 3. Implement Comment System
Add complete comment/feedback system:
- Comments on syllabi
- Threaded replies
- Comment types (Suggestion, Question, Error, General)
- Resolve/unresolve functionality
- Edit/delete own comments

### 4. Add Workflow Endpoints
Implement syllabus workflow endpoints:
- Validate before submission
- Submit for review
- Withdraw submission
- Auto-save drafts
- Version history
- Approval timeline

---

## Action Items

### For Backend Team
1. Review this document and prioritize missing endpoints
2. Implement HIGH PRIORITY endpoints first
3. Consider API consolidation recommendations
4. Update OpenAPI spec as endpoints are added
5. Coordinate with frontend team on response structures

### For Frontend Team
1. Start with existing APIs (Phase 1)
2. Create mocks for missing APIs (Phase 2)
3. Document assumptions about response structures
4. Be prepared to adjust when real APIs are available
5. Keep this document updated as APIs are implemented

---

## Notes

- The messaging system is well-implemented and can be used as-is
- Update requests have partial support but need workflow endpoints
- Peer reviews exist but need evaluation template support
- No comment/feedback system exists - this is a major gap
- Many lecturer-specific endpoints are missing
- Consider using nested JSON structures instead of separate POST endpoints for related resources

---

**Last Updated**: January 31, 2026
**Status**: Initial Analysis Complete - Awaiting Backend Implementation
