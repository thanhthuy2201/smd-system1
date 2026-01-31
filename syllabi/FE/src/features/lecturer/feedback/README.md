# Feedback Module

The Feedback Module provides a collaborative commenting system for syllabus review and feedback. It enables lecturers, reviewers, and academic staff to provide structured feedback through threaded comments.

## Components

### FeedbackThread

The main component for displaying and managing feedback comments.

#### Features

- **Comment Organization**: Display comments organized by section or in a flat list
- **Comment Metadata**: Show author, timestamp, comment type, and priority
- **Threaded Replies**: Support nested replies to comments
- **Filtering**: Filter by resolved/active status and comment type
- **Access Control**: Edit and delete actions only for comment owners
- **Resolution Tracking**: Mark comments as resolved to track progress

#### Props

```typescript
interface FeedbackThreadProps {
  comments: Comment[]           // Array of comments to display
  currentUserId: number          // Current user's ID for ownership checks
  onReply?: (commentId: number, text: string) => void
  onEdit?: (commentId: number, text: string) => void
  onDelete?: (commentId: number) => void
  onResolve?: (commentId: number) => void
  showResolved?: boolean         // Show resolved comments by default
  className?: string             // Optional CSS class
  groupBySection?: boolean       // Group comments by section reference
}
```

#### Usage Example

```tsx
import { FeedbackThread } from '@/features/lecturer/feedback'
import { useComments } from '@/features/lecturer/hooks/useFeedback'

function SyllabusFeedback({ syllabusId }: { syllabusId: number }) {
  const { comments, addReply, editComment, deleteComment, resolveComment } = 
    useComments(syllabusId)
  const currentUserId = useCurrentUser().id

  return (
    <FeedbackThread
      comments={comments}
      currentUserId={currentUserId}
      onReply={addReply}
      onEdit={editComment}
      onDelete={deleteComment}
      onResolve={resolveComment}
      groupBySection
    />
  )
}
```

## Comment Types

The system supports four types of comments:

- **Suggestion**: Recommendations for improvement (blue icon)
- **Question**: Questions requiring clarification (purple icon)
- **Error**: Issues that need to be fixed (red icon)
- **General**: General feedback or observations (gray icon)

## Priority Levels

Error comments can have priority levels:

- **Low**: Minor issues (green)
- **Medium**: Moderate issues (yellow)
- **High**: Critical issues requiring immediate attention (red)

## Filtering

Users can filter comments by:

1. **Status**: All, Active, or Resolved
2. **Type**: Suggestion, Question, Error, or General

Filters can be combined for more specific views.

## Accessibility

The component follows accessibility best practices:

- Semantic HTML with proper ARIA labels
- Keyboard navigation support
- Screen reader friendly
- Focus management for modals and dropdowns
- Color contrast compliance

## Requirements Validation

This component validates the following requirements:

- **7.1**: Display all existing comments organized by section
- **7.6**: Support threaded replies to existing comments
- **7.9**: Mark comments as resolved when issues are addressed
- **7.10**: Visually distinguish resolved comments from active comments

## Related Components

- `CommentForm`: For adding new comments (Task 12.2)
- `InlineCommentTool`: For adding comments to specific text (Task 12.3)

## Testing

See `FeedbackThread.demo.tsx` for an interactive demonstration with sample data.

To run the demo:

```bash
# Add a route to view the demo component
# Navigate to the demo route in your browser
```

## Future Enhancements

- Real-time updates via WebSocket
- Comment notifications
- Mention system (@username)
- Rich text formatting
- File attachments
- Comment search
