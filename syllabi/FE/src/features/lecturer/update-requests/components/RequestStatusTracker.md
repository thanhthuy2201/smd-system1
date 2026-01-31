# RequestStatusTracker Component

## Overview

Displays the status and progress of an update request through the review cycle with a visual timeline.

**Requirements**: 9.11

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `status` | `UpdateRequestStatus` | Yes | Current status (Draft, Pending, Approved, Rejected) |
| `stages` | `ReviewStageInfo[]` | Yes | Array of review stages |
| `reviewComments` | `string` | No | Reviewer feedback |
| `reviewedBy` | `string` | No | Reviewer name |
| `reviewedAt` | `Date \| string` | No | Review date |
| `className` | `string` | No | Custom CSS class |

## Types

```typescript
type UpdateRequestStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected'

type ReviewStage = 'Submitted' | 'Under Review' | 'Decision Made'

interface ReviewStageInfo {
  stage: ReviewStage
  status: 'completed' | 'current' | 'pending'
  completedAt?: Date | string
  reviewerName?: string
  reviewerRole?: string
}
```

## Usage

```tsx
import { RequestStatusTracker } from '@/features/lecturer/update-requests/components'

function UpdateRequestDetail({ requestId }) {
  const { data: request } = useUpdateRequest(requestId)

  const stages = [
    { stage: 'Submitted', status: 'completed', completedAt: request.createdAt },
    { stage: 'Under Review', status: 'current', reviewerName: 'Dr. Smith' },
    { stage: 'Decision Made', status: 'pending' },
  ]

  return (
    <RequestStatusTracker
      status={request.status}
      stages={stages}
      reviewComments={request.reviewComments}
      reviewedBy={request.reviewedBy}
      reviewedAt={request.reviewedAt}
    />
  )
}
```

## Features

- Status badge with color coding
- Progress bar showing completion percentage
- Timeline view of review stages
- Reviewer information display
- Approval/rejection feedback alerts
- Responsive design
- Full accessibility support

## Accessibility

- Progress bar with ARIA attributes
- Timeline with list semantics
- Keyboard navigation support
- Screen reader friendly
- WCAG 2.1 AA compliant
