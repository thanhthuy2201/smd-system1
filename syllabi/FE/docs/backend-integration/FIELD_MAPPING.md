# Backend ↔ Frontend Field Mapping

## Overview

The backend uses **snake_case** naming convention while the frontend uses **camelCase**. This document shows the field mappings between backend and frontend.

## Review Schedule Fields

### List Response (`GET /api/v1/review-schedules`)

| Backend Field (snake_case) | Frontend Field (camelCase) | Type | Notes |
|----------------------------|----------------------------|------|-------|
| `schedule_id` | `id` | number → string | Converted to string |
| `name` | `name` | string | No change |
| `semester_id` | `semesterId` | number → string | Converted to string |
| `semester_name` | `semesterName` | string | No change |
| `academic_year` | `academicYear` | string | No change |
| `review_start` | `reviewStartDate` | string → Date | Converted to Date object |
| `l1_deadline` | `l1Deadline` | string → Date | Converted to Date object |
| `l2_deadline` | `l2Deadline` | string → Date | Converted to Date object |
| `final_approval` | `finalApprovalDate` | string → Date | Converted to Date object |
| `is_active` | `isActive` | boolean | No change |
| `assignment_count` | - | number | Not used in frontend list |
| `status` | `status` | string | Added by frontend (calculated) |
| `total_syllabi` | `totalSyllabi` | number | Default: 0 if missing |
| `reviewed_count` | `reviewedCount` | number | Default: 0 if missing |
| `pending_count` | `pendingCount` | number | Default: 0 if missing |
| `overdue_count` | `overdueCount` | number | Default: 0 if missing |
| `progress_percentage` | `progressPercentage` | number | Default: 0 if missing |
| `alert_config` | `alertConfig` | object | Default config if missing |
| `created_by` | `createdBy` | number → string | Converted to string |
| `created_at` | `createdAt` | string → Date | Converted to Date object |
| `updated_at` | `updatedAt` | string → Date | Converted to Date object |

### Detail Response (`GET /api/v1/review-schedules/:id`)

Same as list response, plus:

| Backend Field (snake_case) | Frontend Field (camelCase) | Type | Notes |
|----------------------------|----------------------------|------|-------|
| `assignments` | `assignments` | array | See Assignment Fields below |

### Assignment Fields

| Backend Field (snake_case) | Frontend Field (camelCase) | Type | Notes |
|----------------------------|----------------------------|------|-------|
| `assignment_id` | `id` | number → string | Converted to string |
| `schedule_id` | `scheduleId` | number → string | Converted to string |
| `department_id` | `departmentId` | number → string | Converted to string |
| `department_name` | `departmentName` | string | No change |
| `reviewer_id` | `primaryReviewerId` | number → string | Converted to string |
| `reviewer_name` | `primaryReviewerName` | string | No change |
| `review_level` | `primaryReviewerRole` | number → string | 1='HOD', 2='AA' |
| `is_primary` | - | boolean | Not used in frontend |
| `backup_reviewer_id` | `backupReviewerId` | number → string | Optional, converted to string |
| `backup_reviewer_name` | `backupReviewerName` | string | Optional |
| `assigned_at` | `assignedAt` | string → Date | Converted to Date object |
| `assigned_by` | `assignedBy` | number → string | Converted to string |

## Create/Update Request

### Frontend → Backend (POST/PATCH)

| Frontend Field (camelCase) | Backend Field (snake_case) | Type | Notes |
|----------------------------|----------------------------|------|-------|
| `name` | `name` | string | No change |
| `semesterId` | `semester_id` | string → number | Converted to number |
| `reviewStartDate` | `review_start` | Date → string | Format: YYYY-MM-DD |
| `l1Deadline` | `l1_deadline` | Date → string | Format: YYYY-MM-DD |
| `l2Deadline` | `l2_deadline` | Date → string | Format: YYYY-MM-DD |
| `finalApprovalDate` | `final_approval` | Date → string | Format: YYYY-MM-DD |
| `alertConfig` | `alert_config` | object | No change |

## Date Format

### Backend Format
- **Date only**: `YYYY-MM-DD` (e.g., `"2024-10-16"`)
- **DateTime**: `YYYY-MM-DDTHH:mm:ss.ffffff` (e.g., `"2026-01-30T15:26:41.611368"`)

### Frontend Format
- **Date objects**: JavaScript `Date` objects
- **Display**: `dd/MM/yyyy` (Vietnamese format)

## Example Transformation

### Backend Response
```json
{
  "schedule_id": 1,
  "name": "Lịch thẩm định đề cương Học kỳ 1 2024-2025",
  "semester_id": 1,
  "semester_name": "Học kỳ 1",
  "academic_year": "2024-2025",
  "review_start": "2024-10-16",
  "l1_deadline": "2024-10-30",
  "l2_deadline": "2024-11-13",
  "final_approval": "2024-11-27",
  "is_active": true,
  "created_by": 1,
  "created_at": "2026-01-30T15:26:41.611368",
  "updated_at": "2026-01-30T15:26:41.611368"
}
```

### Frontend Object
```typescript
{
  id: "1",
  name: "Lịch thẩm định đề cương Học kỳ 1 2024-2025",
  semesterId: "1",
  semesterName: "Học kỳ 1",
  academicYear: "2024-2025",
  reviewStartDate: new Date("2024-10-16"),
  l1Deadline: new Date("2024-10-30"),
  l2Deadline: new Date("2024-11-13"),
  finalApprovalDate: new Date("2024-11-27"),
  status: "ACTIVE",
  totalSyllabi: 0,
  reviewedCount: 0,
  pendingCount: 0,
  overdueCount: 0,
  progressPercentage: 0,
  alertConfig: {
    enabled: false,
    thresholds: [7, 3, 1],
    channels: ["EMAIL", "IN_APP"],
    sendOverdueAlerts: true
  },
  createdBy: "1",
  createdAt: new Date("2026-01-30T15:26:41.611368"),
  updatedAt: new Date("2026-01-30T15:26:41.611368"),
  isActive: true
}
```

## Transformation Functions

The frontend has three transformation functions in `src/features/review-schedules/data/api.ts`:

1. **`transformBackendSchedule()`** - Transforms backend schedule to frontend format
2. **`transformBackendAssignment()`** - Transforms backend assignment to frontend format
3. **`transformToBackendFormat()`** - Transforms frontend form data to backend format

## Status Calculation

The `status` field is **calculated by the frontend** based on dates and progress:

- **UPCOMING**: `reviewStartDate` is in the future
- **ACTIVE**: Current date is between `reviewStartDate` and `finalApprovalDate`, and has pending reviews
- **COMPLETED**: Current date is after `finalApprovalDate` and all reviews are done (`pendingCount === 0`)
- **OVERDUE**: Current date is after `finalApprovalDate` and still has pending reviews (`pendingCount > 0`)

The backend can also calculate and return this field, but the frontend will recalculate it for consistency.

## Default Values

When backend doesn't provide certain fields, the frontend uses these defaults:

| Field | Default Value |
|-------|---------------|
| `status` | `"UPCOMING"` |
| `totalSyllabi` | `0` |
| `reviewedCount` | `0` |
| `pendingCount` | `0` |
| `overdueCount` | `0` |
| `progressPercentage` | `0` |
| `alertConfig` | `{ enabled: false, thresholds: [7, 3, 1], channels: ["EMAIL", "IN_APP"], sendOverdueAlerts: true }` |
| `createdBy` | `""` |
| `createdAt` | `new Date()` |
| `updatedAt` | `new Date()` |
| `isActive` | `true` |

## Notes

1. **ID Conversion**: All IDs are converted from numbers to strings for consistency in the frontend
2. **Date Conversion**: All date strings are converted to JavaScript Date objects
3. **Optional Fields**: The transformation handles missing fields gracefully with defaults
4. **Review Level Mapping**: `review_level` 1 = HOD (Head of Department), 2 = AA (Academic Affairs)
