# Syllabi Components

This directory contains components for displaying and managing syllabi in the lecturer module.

## Components

### SyllabiList

Main component that displays syllabi in a data table with:

- **Search**: Search by course code or title
- **Filters**: Filter by status, semester
- **Sorting**: Sort by course code, created date, updated date
- **Status Badges**: Color-coded badges for each status
- **Action Buttons**: Context-aware actions based on syllabus status

**Usage:**

```tsx
import { SyllabiList } from '@/features/lecturer/syllabi/components'

function MyPage() {
  return <SyllabiList />
}
```

### syllabi-columns

Column definitions for the syllabi data table. Includes:

- Course code and name
- Academic year and semester
- Status badge with color coding
- Version number
- Created and updated dates
- Action buttons

### SyllabiRowActions

Dropdown menu with status-based actions:

- **Draft**: Edit, Delete, Submit for Review
- **Pending Review**: View, Withdraw Submission
- **Revision Required**: Edit, View Feedback
- **Approved**: View, Request Update
- **Archived**: View only

## Status-Based Access Control

The components implement access control based on syllabus status:

| Status            | Can Edit | Can Delete | Can Submit | Can Withdraw | Can View Feedback | Can Request Update |
| ----------------- | -------- | ---------- | ---------- | ------------ | ----------------- | ------------------ |
| Draft             | ✓        | ✓          | ✓          | ✗            | ✗                 | ✗                  |
| Pending Review    | ✗        | ✗          | ✗          | ✓            | ✗                 | ✗                  |
| Revision Required | ✓        | ✗          | ✗          | ✗            | ✓                 | ✗                  |
| Approved          | ✗        | ✗          | ✗          | ✗            | ✗                 | ✓                  |
| Archived          | ✗        | ✗          | ✗          | ✗            | ✗                 | ✗                  |

## Requirements Satisfied

- **Requirement 3.1-3.5**: Status-based edit access control
- **Requirement 15.1-15.8**: Search, filter, and sort capabilities
