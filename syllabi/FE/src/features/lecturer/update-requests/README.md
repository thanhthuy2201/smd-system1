# Update Requests Feature

This feature provides functionality for lecturers to request updates to approved syllabi through a formal workflow.

## Components

### UpdateRequestForm

A comprehensive form component for creating post-approval update requests.

**Features:**
- Approved syllabi list selector with detailed information
- Change type selector (Minor Update, Content Revision, Major Restructure)
- Multi-select for affected sections
- Justification textarea with character count (50-2000 characters)
- Effective semester input with format validation
- Urgency level selector (Normal, High)
- Supporting documents upload (max 10 files, 10MB each)
- Real-time validation with Zod schema
- Accessible form controls with ARIA labels
- Responsive design

**Usage:**

```tsx
import { UpdateRequestForm } from '@/features/lecturer/update-requests'
import { useApprovedSyllabi, useUpdateRequests } from '@/features/lecturer/hooks'

function CreateUpdateRequestPage() {
  const { data: syllabi = [], isLoading: isLoadingSyllabi } = useApprovedSyllabi()
  const { create, isCreating } = useUpdateRequests()

  const handleSubmit = async (data: UpdateRequestFormData) => {
    await create({
      syllabusId: data.syllabusId,
      changeType: data.changeType,
      affectedSections: data.affectedSections,
      justification: data.justification,
      effectiveSemester: data.effectiveSemester,
      urgency: data.urgency,
      supportingDocuments: data.supportingDocuments,
    })
    // Navigate or show success message
  }

  if (isLoadingSyllabi) {
    return <div>Loading syllabi...</div>
  }

  return (
    <UpdateRequestForm
      approvedSyllabi={syllabi}
      onSubmit={handleSubmit}
      isLoading={isCreating}
      onCancel={() => navigate('/lecturer/update-requests')}
    />
  )
}
```

### DraftChangesEditor

A side-by-side editor for comparing original syllabus with proposed changes. Reuses syllabus wizard components for consistency.

**Features:**
- Side-by-side comparison view (original vs. proposed)
- Multiple view modes (split, edit-only, original-only)
- Highlights modified sections
- Step-by-step navigation through syllabus sections
- Auto-save support with unsaved changes tracking
- Reset to original functionality
- Full validation using existing Zod schemas
- Responsive design with mobile support

**Usage:**

```tsx
import { DraftChangesEditor } from '@/features/lecturer/update-requests'
import { useSyllabus, useUpdateRequest, useUpdateRequests } from '@/features/lecturer/hooks'

function EditUpdateRequestPage() {
  const { data: syllabus } = useSyllabus(syllabusId)
  const { data: updateRequest } = useUpdateRequest(requestId)
  const { update, isUpdating } = useUpdateRequests()

  const handleSave = async (changes: Partial<Syllabus>) => {
    await update({
      id: requestId,
      data: { draftChanges: changes }
    })
  }

  return (
    <DraftChangesEditor
      originalSyllabus={syllabus}
      draftChanges={updateRequest.draftChanges}
      affectedSections={updateRequest.affectedSections}
      onSave={handleSave}
      isLoading={isUpdating}
    />
  )
}
```

See [DraftChangesEditor.md](./components/DraftChangesEditor.md) for detailed documentation.

### RequestStatusTracker

A status tracking component that displays the progress of an update request through the review cycle.

**Features:**
- Visual status badge (Draft, Pending, Approved, Rejected)
- Progress bar showing completion percentage
- Timeline view of all review stages
- Reviewer information display
- Approval/rejection feedback display
- Responsive design with mobile support
- Full accessibility support

**Usage:**

```tsx
import { RequestStatusTracker } from '@/features/lecturer/update-requests'
import { useUpdateRequest } from '@/features/lecturer/hooks'

function UpdateRequestDetailPage({ requestId }: { requestId: number }) {
  const { data: updateRequest } = useUpdateRequest(requestId)

  if (!updateRequest) return <div>Loading...</div>

  // Build stages based on update request data
  const stages = [
    {
      stage: 'Submitted' as const,
      status: 'completed' as const,
      completedAt: updateRequest.createdAt,
    },
    {
      stage: 'Under Review' as const,
      status: updateRequest.status === 'Pending' ? 'current' as const : 'completed' as const,
      reviewerName: updateRequest.status !== 'Draft' ? 'Academic Manager' : undefined,
      completedAt: updateRequest.reviewedAt,
    },
    {
      stage: 'Decision Made' as const,
      status: (updateRequest.status === 'Approved' || updateRequest.status === 'Rejected')
        ? 'completed' as const
        : 'pending' as const,
      completedAt: updateRequest.reviewedAt,
    },
  ]

  return (
    <RequestStatusTracker
      status={updateRequest.status}
      stages={stages}
      reviewComments={updateRequest.reviewComments}
      reviewedBy={updateRequest.reviewedBy}
      reviewedAt={updateRequest.reviewedAt}
    />
  )
}
```

See [RequestStatusTracker.md](./components/RequestStatusTracker.md) for detailed documentation.

## Hooks

### useUpdateRequests

Main hook for managing update request operations.

**Returns:**
- `create` - Create a new update request
- `update` - Update a draft update request
- `submit` - Submit an update request for review
- `cancel` - Cancel a pending update request
- `deleteRequest` - Delete a draft update request
- `isLoading` - Combined loading state

### useUpdateRequestsList

Fetch paginated list of update requests with filters.

**Parameters:**
- `params` - Query parameters (page, pageSize, status, sortBy, sortOrder)

### useUpdateRequest

Fetch a single update request by ID.

**Parameters:**
- `id` - Update request ID

### useApprovedSyllabi

Fetch list of approved syllabi eligible for update requests.

## API Integration

The feature integrates with the following API endpoints:

- `GET /api/v1/lecturer/update-requests` - List update requests
- `GET /api/v1/update-requests/:id` - Get single update request
- `GET /api/v1/lecturer/syllabi/approved` - Get approved syllabi
- `POST /api/v1/update-requests` - Create update request
- `PUT /api/v1/update-requests/:id` - Update draft request
- `POST /api/v1/update-requests/:id/submit` - Submit for review
- `POST /api/v1/update-requests/:id/cancel` - Cancel request
- `DELETE /api/v1/update-requests/:id` - Delete draft request

## Validation

The form uses Zod schema validation with the following rules:

- **Syllabus ID**: Required, must be a positive integer
- **Change Type**: Required, one of: Minor Update, Content Revision, Major Restructure
- **Affected Sections**: Required, at least one section must be selected
- **Justification**: Required, 50-2000 characters
- **Effective Semester**: Required, format YYYY-Semester (e.g., 2025-Fall)
- **Urgency**: Required, either Normal or High
- **Supporting Documents**: Optional, max 10 files, 10MB each

## Requirements Coverage

This implementation satisfies the following requirements:

- **9.1**: Display list of approved syllabi eligible for update requests
- **9.2**: Require selection of change type
- **9.3**: Require selection of affected sections (multi-select)
- **9.4**: Require justification with minimum 50 characters
- **9.5**: Require selection of effective semester
- **9.6**: Require selection of urgency level
- **9.7**: Allow attaching supporting documents
- **9.8**: Provide draft changes editor with side-by-side comparison
- **9.11**: Display update request status tracker showing review progress

## Accessibility

The components follow WCAG 2.1 AA guidelines:

- All form fields have proper labels and descriptions
- ARIA attributes for screen readers
- Keyboard navigation support
- Focus indicators
- Error messages associated with fields
- Character count live regions
- Semantic HTML structure
- Progress bars with proper ARIA attributes
- Timeline with list semantics

## Future Enhancements

- Draft auto-save functionality for update requests
- Notification system integration
- Bulk update request operations
- Template-based update requests
- Real-time status updates via WebSocket
- Export timeline as PDF
