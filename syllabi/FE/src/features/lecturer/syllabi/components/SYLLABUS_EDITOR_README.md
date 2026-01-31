# SyllabusEditor Component

## Overview

The `SyllabusEditor` component provides a comprehensive interface for editing existing syllabi with status-based access control, revision feedback display, and change tracking.

## Features

### 1. Status-Based Access Control (Requirements 3.1-3.5)

The editor implements strict access control based on syllabus status:

- **Editable Statuses**: `Draft`, `Revision Required`
- **Read-Only Statuses**: `Pending Review`, `Approved`, `Archived`

When a user attempts to edit a syllabus with a non-editable status, an access denied dialog is displayed and editing is prevented.

### 2. Reuses Wizard Step Components (Requirement 3.1-3.2)

The editor reuses all seven wizard step components for a consistent editing experience:

1. CourseInformationStep
2. LearningOutcomesStep
3. CLOPLOMappingStep
4. CourseContentStep
5. AssessmentMethodsStep
6. ReferencesStep
7. PreviewStep

This ensures consistency between creation and editing workflows.

### 3. Revision Feedback Panel (Requirement 3.2)

For syllabi with `Revision Required` status, the editor displays a tabbed interface with:

- **Editor Tab**: The main editing interface
- **Feedback Tab**: Displays all comments and feedback from reviewers using the `CommentThread` component
- **History Tab**: Placeholder for version history (to be implemented in task 7.3)

The feedback tab shows:

- All comments organized by section
- Unresolved comment count badge
- Ability to view and respond to reviewer feedback

### 4. Change Tracking Indicators (Requirement 3.8)

The editor displays visual indicators for changes:

- **Unsaved Changes Badge**: Shows when the form has unsaved modifications
- **Auto-Save Indicator**: Displays saving status and last saved timestamp
- **Version Information**: Shows current version and last update time

### 5. Auto-Save Functionality (Requirement 3.6)

Integrated with the `useSyllabusForm` hook to provide:

- Automatic saving every 30 seconds
- Visual feedback on save status
- Retry capability on save failures

## Usage

### Basic Usage

```tsx
import { SyllabusEditor } from '@/features/lecturer/syllabi/components/SyllabusEditor'

function EditPage() {
  const handleComplete = (syllabus: Syllabus) => {
    console.log('Syllabus updated:', syllabus)
    // Navigate or show success message
  }

  const handleCancel = () => {
    // Navigate back
  }

  return (
    <SyllabusEditor
      syllabusId={123}
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  )
}
```

### Route Integration

The component is integrated with TanStack Router at:

```
/syllabus/:id/edit
```

See `src/routes/_authenticated/syllabus/$id.edit.tsx` for the route implementation.

## Props

| Prop         | Type                           | Required | Description                        |
| ------------ | ------------------------------ | -------- | ---------------------------------- |
| `syllabusId` | `number`                       | Yes      | The ID of the syllabus to edit     |
| `onComplete` | `(syllabus: Syllabus) => void` | No       | Callback when editing is complete  |
| `onCancel`   | `() => void`                   | No       | Callback when user cancels editing |

## Component Behavior

### Loading State

While fetching syllabus data, displays a loading spinner with message.

### Error State

If syllabus cannot be loaded, displays an error alert with retry option.

### Access Control

1. Fetches syllabus data
2. Checks if status is in `EDITABLE_STATUSES`
3. If not editable:
   - Shows access denied dialog
   - Disables all form inputs
   - Displays lock icon and message

### Revision Required Flow

1. Detects `Revision Required` status
2. Displays alert banner at top
3. Shows tabbed interface with Feedback tab
4. Fetches and displays comments from reviewers
5. Allows editing while viewing feedback

### Navigation Guards

- Blocks navigation when form has unsaved changes
- Shows confirmation dialog before leaving
- Integrates with TanStack Router's `useBlocker` hook

## Data Flow

```
1. Component mounts
   ↓
2. Fetch syllabus data (TanStack Query)
   ↓
3. Check edit permissions
   ↓
4. Initialize form with data (useSyllabusForm)
   ↓
5. Enable auto-save
   ↓
6. User edits → Auto-save every 30s
   ↓
7. User submits → Update syllabus
   ↓
8. Call onComplete callback
```

## Integration Points

### API Integration

- `getSyllabus(id)`: Fetches syllabus data
- `getComments(syllabusId)`: Fetches reviewer feedback
- `updateSyllabus(id, data)`: Saves changes
- `saveDraft(id, data)`: Auto-saves draft

### Hooks

- `useSyllabusForm`: Form state management with auto-save
- `useTranslation`: Internationalization
- `useQuery`: Data fetching with caching

### Components

- `AutoSaveIndicator`: Shows save status
- `CommentThread`: Displays feedback
- `SyllabusWizard` steps: Reused for editing
- Shadcn UI components: Card, Alert, Badge, Tabs, etc.

## Accessibility

- Keyboard navigation supported
- ARIA labels on all interactive elements
- Focus management in dialogs
- Screen reader friendly status messages

## Responsive Design

- Mobile-first approach
- Adaptive layouts for different screen sizes
- Touch-friendly controls
- Collapsible sections on small screens

## Future Enhancements

1. **Version History Tab** (Task 7.3)
   - Display version timeline
   - Compare versions
   - Revert to previous versions

2. **Inline Change Tracking**
   - Highlight modified fields
   - Show diff view
   - Track who made changes

3. **Collaborative Editing**
   - Real-time updates
   - Conflict resolution
   - Lock mechanism

## Testing Considerations

### Unit Tests

- Status-based access control logic
- Form validation
- Navigation guards
- Error handling

### Integration Tests

- Complete edit workflow
- Auto-save functionality
- Feedback display
- Status transitions

### Property-Based Tests

- Access control across all statuses (Property 7)
- Version history tracking (Property 8)
- Form validation (Property 3)

## Related Components

- `SyllabusWizard`: Creation workflow
- `SyllabiList`: List view with edit actions
- `VersionHistory`: Version tracking (Task 7.3)
- `CommentThread`: Feedback display

## Related Files

- `src/features/lecturer/syllabi/components/SyllabusEditor.tsx`
- `src/routes/_authenticated/syllabus/$id.edit.tsx`
- `src/features/lecturer/hooks/useSyllabusForm.ts`
- `src/features/lecturer/api/syllabus.api.ts`
- `src/features/lecturer/i18n/vi.ts`
