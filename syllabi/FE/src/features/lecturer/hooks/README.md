# Lecturer Module Hooks

This directory contains custom React hooks for the Lecturer Module, providing data fetching, state management, and form handling capabilities.

## Overview

The hooks are built using:

- **React Hook Form** for form state management
- **TanStack Query** for server state and caching
- **Zod** for validation schemas
- **TypeScript** for type safety

## Hooks

### Form Management Hooks

#### `useSyllabusForm`

Manages syllabus form state with auto-save functionality.

**Features:**

- React Hook Form integration with Zod validation
- Auto-save every 30 seconds
- Last saved timestamp tracking
- Submit mutation handling
- Optimistic updates

**Usage:**

```tsx
import { useSyllabusForm } from '@/features/lecturer/hooks'

function SyllabusEditor({ syllabusId, initialData }) {
  const { form, isAutoSaving, lastSaved, submit, isSubmitting } =
    useSyllabusForm({
      syllabusId,
      initialData,
      onSuccess: (syllabus) => {
        console.log('Saved:', syllabus)
      },
    })

  return (
    <form onSubmit={form.handleSubmit(submit)}>
      {/* Form fields */}
      {isAutoSaving && <span>Saving...</span>}
      {lastSaved && <span>Last saved: {lastSaved.toLocaleTimeString()}</span>}
    </form>
  )
}
```

#### `useAutoSave`

Generic hook for implementing auto-save with debouncing.

**Features:**

- Configurable debounce interval
- Dirty state detection
- Enable/disable control
- Prevents unnecessary saves

**Usage:**

```tsx
import { useAutoSave } from '@/features/lecturer/hooks'

function MyForm() {
  const [data, setData] = useState({})

  useAutoSave({
    data,
    onSave: (data) => saveMutation.mutate(data),
    interval: 30000, // 30 seconds
    enabled: isDirty,
  })

  return <form>{/* ... */}</form>
}
```

### Validation Hooks

#### `useSyllabusValidation`

Validates syllabus before submission with detailed criteria results.

**Features:**

- Server-side validation
- Detailed validation criteria
- Failed/passed criteria separation
- Error handling

**Usage:**

```tsx
import { useSyllabusValidation } from '@/features/lecturer/hooks'

function SubmissionChecklist({ syllabusId }) {
  const { validate, isValidating, isValid, failedCriteria, passedCriteria } =
    useSyllabusValidation({ syllabusId })

  return (
    <div>
      <button onClick={validate} disabled={isValidating}>
        Validate Syllabus
      </button>

      {failedCriteria.map((criterion) => (
        <div key={criterion.name} className='text-red-500'>
          ✗ {criterion.name}: {criterion.message}
        </div>
      ))}

      {passedCriteria.map((criterion) => (
        <div key={criterion.name} className='text-green-500'>
          ✓ {criterion.name}
        </div>
      ))}
    </div>
  )
}
```

### Data Fetching Hooks

#### `useSyllabiList`

Fetches paginated list of syllabi with filtering and sorting.

**Features:**

- Pagination support
- Search by course code/title
- Filter by status, academic year, semester
- Sort by various fields
- Automatic cache management

**Usage:**

```tsx
import { useSyllabiList } from '@/features/lecturer/hooks'

function SyllabiList() {
  const { syllabi, isLoading, total, hasNextPage, hasPreviousPage } =
    useSyllabiList({
      page: 1,
      pageSize: 10,
      status: 'Draft',
      search: 'CS101',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    })

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <p>Total: {total} syllabi</p>
      {syllabi.map((syllabus) => (
        <div key={syllabus.id}>{syllabus.courseName}</div>
      ))}
    </div>
  )
}
```

#### `useReviewSchedules`

Fetches review schedules and tracks deadlines.

**Features:**

- Filter by status (active, upcoming, completed)
- Calculate days until deadline
- Identify approaching deadlines (within 7 days)

**Usage:**

```tsx
import { useReviewSchedules } from '@/features/lecturer/hooks'

function ReviewCalendar() {
  const { activeSchedules, approachingDeadlines, isLoading } =
    useReviewSchedules()

  return (
    <div>
      <h2>Active Reviews</h2>
      {activeSchedules.map((schedule) => (
        <div key={schedule.id}>{schedule.reviewType}</div>
      ))}

      <h2>Approaching Deadlines</h2>
      {approachingDeadlines.map((schedule) => (
        <div key={schedule.id}>
          {schedule.reviewType} - {schedule.daysUntilDeadline} days left
        </div>
      ))}
    </div>
  )
}
```

#### `usePeerReviews`

Manages peer review assignments and evaluations.

**Features:**

- Fetch assigned reviews
- Filter by status (pending, in progress, completed)
- Track completion progress
- Submit/update evaluations

**Usage:**

```tsx
import { usePeerReviews } from '@/features/lecturer/hooks'

function PeerReviewQueue() {
  const {
    pendingReviews,
    completionPercentage,
    submitEvaluation,
    isSubmitting,
  } = usePeerReviews()

  const handleSubmit = (evaluation) => {
    submitEvaluation(evaluation)
  }

  return (
    <div>
      <p>Completion: {completionPercentage}%</p>
      {pendingReviews.map((review) => (
        <div key={review.id}>
          <h3>{review.syllabus.courseName}</h3>
          <button onClick={() => handleSubmit(/* evaluation */)}>
            Submit Evaluation
          </button>
        </div>
      ))}
    </div>
  )
}
```

#### `useMessaging`

Manages message inbox with pagination and actions.

**Features:**

- Paginated message list
- Search messages
- Filter by read/unread
- Send messages
- Mark as read (with optimistic updates)
- Delete messages
- Track unread count

**Usage:**

```tsx
import { useMessaging } from '@/features/lecturer/hooks'

function MessageInbox() {
  const { messages, unreadCount, send, markAsRead, isLoading } = useMessaging({
    page: 1,
    pageSize: 20,
    unreadOnly: false,
  })

  const handleSend = () => {
    send({
      recipientId: 123,
      subject: 'Question',
      body: 'I have a question...',
      syllabusId: 456,
    })
  }

  return (
    <div>
      <p>Unread: {unreadCount}</p>
      {messages.map((message) => (
        <div key={message.id} onClick={() => markAsRead(message.id)}>
          {message.subject}
        </div>
      ))}
    </div>
  )
}
```

#### `useConversation`

Fetches conversation thread with a specific user.

**Usage:**

```tsx
import { useConversation } from '@/features/lecturer/hooks'

function ConversationThread({ userId }) {
  const { messages, unreadCount, isLoading } = useConversation({ userId })

  return (
    <div>
      {messages.map((message) => (
        <div key={message.id}>{message.body}</div>
      ))}
    </div>
  )
}
```

## Cache Configuration

All hooks use TanStack Query with the following cache times:

- **Syllabi**: 5 min stale time, 30 min cache time
- **Courses**: 1 hour stale time, 24 hour cache time (rarely changes)
- **Messages**: 1 min stale time, 10 min cache time (frequent updates)
- **Reviews**: 10 min stale time, 1 hour cache time

## Query Keys

Consistent query key structure for cache management:

```typescript
;['lecturer', 'syllabi'][('lecturer', 'syllabi', syllabusId)][ // List of syllabi // Single syllabus
  ('lecturer', 'courses')
][('lecturer', 'reviews', 'schedules')][('lecturer', 'peer-reviews')][ // Assigned courses // Review schedules // Peer review queue
  ('lecturer', 'messages')
][('lecturer', 'messages', 'conversation', userId)] // Message inbox // Conversation thread
```

## Error Handling

All hooks handle errors gracefully:

- Network errors are logged to console
- Mutations provide error states
- Optimistic updates are rolled back on failure
- Error callbacks can be provided via options

## Type Safety

All hooks are fully typed with TypeScript:

- Input options are validated
- Return types are explicit
- Generic types for flexible usage
- Exported types for consumer use

## Testing

Hooks can be tested using:

- `@testing-library/react-hooks` for hook testing
- Mock TanStack Query with `QueryClient`
- Mock API responses with MSW

Example:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { useSyllabiList } from './useSyllabiList'

test('fetches syllabi list', async () => {
  const queryClient = new QueryClient()
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  const { result } = renderHook(() => useSyllabiList(), { wrapper })

  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(result.current.syllabi).toHaveLength(10)
})
```

## Best Practices

1. **Always provide query keys**: Consistent keys enable proper cache invalidation
2. **Use optimistic updates**: Improve UX for mutations that are likely to succeed
3. **Handle loading states**: Show loading indicators during data fetching
4. **Handle error states**: Display user-friendly error messages
5. **Invalidate queries**: Refresh related data after mutations
6. **Use enabled option**: Conditionally enable queries based on dependencies
7. **Provide callbacks**: Use onSuccess/onError for side effects

## Related Files

- `src/features/lecturer/api/` - API functions used by hooks
- `src/features/lecturer/types/` - TypeScript type definitions
- `src/features/lecturer/schemas/` - Zod validation schemas
- `src/lib/api-client.ts` - Axios client configuration
