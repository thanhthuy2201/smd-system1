# Lecturer Module - Reusable UI Components

This directory contains reusable UI components for the Lecturer Module. These components are designed to be used across different features within the lecturer workflow.

## Components

### AutoSaveIndicator

A component that displays the auto-save status and last saved timestamp.

**Props:**

- `status`: `'idle' | 'saving' | 'saved' | 'error'` - Current save status
- `lastSaved`: `Date | string` (optional) - Timestamp of last successful save
- `onRetry`: `() => void` (optional) - Callback for retry button when save fails
- `className`: `string` (optional) - Additional CSS classes

**Features:**

- Visual indicators for different save states (saving, saved, error)
- Human-readable relative timestamps ("just now", "2 minutes ago")
- Retry button for failed saves
- Accessible with ARIA live regions

**Usage:**

```tsx
import { AutoSaveIndicator } from '@/features/lecturer/components'

;<AutoSaveIndicator
  status={isAutoSaving ? 'saving' : 'saved'}
  lastSaved={lastSavedTimestamp}
  onRetry={handleRetry}
/>
```

**Requirements:** 1.8, 12.2

---

### ValidationResults

A component that displays validation criteria with pass/fail status.

**Props:**

- `criteria`: `ValidationCriterion[]` - Array of validation criteria
  - `name`: string - Criterion name
  - `passed`: boolean - Whether criterion passed
  - `message`: string - Detailed message
- `isValid`: boolean - Overall validation status
- `className`: `string` (optional) - Additional CSS classes

**Features:**

- Visual distinction between passed and failed criteria
- Summary alert for failed validations
- Color-coded status indicators
- Accessible list structure

**Usage:**

```tsx
import { ValidationResults } from '@/features/lecturer/components'

;<ValidationResults
  criteria={[
    { name: 'Minimum CLOs', passed: true, message: 'At least 3 CLOs defined' },
    {
      name: 'Assessment Weights',
      passed: false,
      message: 'Total must equal 100%',
    },
  ]}
  isValid={false}
/>
```

**Requirements:** 4.9

---

### StatusTracker

A component that displays approval progress through multiple stages.

**Props:**

- `stages`: `ApprovalStageInfo[]` - Array of approval stages
  - `stage`: `ApprovalStage` - Stage name
  - `status`: `'completed' | 'current' | 'pending'` - Stage status
  - `completedAt`: `Date | string` (optional) - Completion timestamp
  - `reviewerName`: `string` (optional) - Reviewer name
  - `reviewerRole`: `string` (optional) - Reviewer role
- `currentStatus`: `string` - Current overall status
- `className`: `string` (optional) - Additional CSS classes

**Features:**

- Visual progress bar showing completion percentage
- Timeline view with stage indicators
- Reviewer information display
- Status badges with appropriate colors
- Accessible progress indicators

**Usage:**

```tsx
import { StatusTracker } from '@/features/lecturer/components'

;<StatusTracker
  stages={[
    {
      stage: 'Submitted',
      status: 'completed',
      completedAt: '2024-01-15T10:00:00Z',
    },
    {
      stage: 'HoD Review',
      status: 'current',
      reviewerName: 'Dr. Smith',
      reviewerRole: 'Head of Department',
    },
    {
      stage: 'Academic Manager Review',
      status: 'pending',
    },
    {
      stage: 'Approved',
      status: 'pending',
    },
  ]}
  currentStatus='Pending Review'
/>
```

**Requirements:** 5.4, 5.5

---

### CommentThread

A component that displays threaded comments with replies and actions.

**Props:**

- `comments`: `Comment[]` - Array of comments
  - `id`: number - Comment ID
  - `userId`: number - Author user ID
  - `userName`: string - Author name
  - `type`: `CommentType` - Comment type (Suggestion, Question, Error, General)
  - `text`: string - Comment text
  - `priority`: `CommentPriority` (optional) - Priority for error comments
  - `isResolved`: boolean - Resolution status
  - `createdAt`: string - Creation timestamp
  - `replies`: `CommentReply[]` - Array of replies
  - `sectionReference`: `string` (optional) - Section reference
- `currentUserId`: number - Current user's ID (for ownership checks)
- `onReply`: `(commentId: number, text: string) => void` (optional) - Reply callback
- `onEdit`: `(commentId: number, text: string) => void` (optional) - Edit callback
- `onDelete`: `(commentId: number) => void` (optional) - Delete callback
- `onResolve`: `(commentId: number) => void` (optional) - Resolve callback
- `showResolved`: boolean (optional) - Whether to show resolved comments
- `className`: `string` (optional) - Additional CSS classes

**Features:**

- Type-specific icons and colors
- Priority badges for error comments
- Threaded replies
- Inline editing and replying
- Ownership-based action menu
- Resolution status tracking
- Empty state handling

**Usage:**

```tsx
import { CommentThread } from '@/features/lecturer/components'

;<CommentThread
  comments={comments}
  currentUserId={currentUser.id}
  onReply={handleReply}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onResolve={handleResolve}
  showResolved={false}
/>
```

**Requirements:** 7.1, 7.6, 7.9, 7.10

---

## Design Patterns

All components follow these patterns:

1. **Accessibility First**: Proper ARIA labels, semantic HTML, keyboard navigation
2. **Theme Support**: Work with both light and dark themes using CSS variables
3. **Responsive Design**: Mobile-first approach with appropriate breakpoints
4. **Type Safety**: Full TypeScript support with exported types
5. **Shadcn UI Integration**: Built on top of Shadcn UI components
6. **Consistent Styling**: Tailwind CSS with consistent spacing and colors

## Testing

Components should be tested for:

- Rendering with different prop combinations
- Accessibility (keyboard navigation, screen readers)
- Theme switching (light/dark mode)
- Responsive behavior
- User interactions (clicks, form submissions)

## Future Enhancements

Potential improvements for these components:

- Internationalization (i18n) support
- Animation transitions
- Customizable themes
- Export functionality
- Print-friendly views
