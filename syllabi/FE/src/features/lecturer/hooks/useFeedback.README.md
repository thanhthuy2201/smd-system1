# useFeedback Hook Implementation

## Overview

The `useFeedback` hook provides a comprehensive interface for managing collaborative feedback and comments on syllabi. It implements all required comment mutations with optimistic updates, ownership checks, and proper error handling.

## Features

### Core Functionality

1. **Fetch Comments** - Retrieve all comments for a syllabus
2. **Add Comments** - Create new comments with optimistic updates
3. **Reply to Comments** - Add threaded replies to existing comments
4. **Edit Comments** - Update comment text with ownership validation
5. **Delete Comments** - Remove comments with ownership validation
6. **Resolve/Unresolve Comments** - Mark comments as resolved or reopen them
7. **Edit Replies** - Update reply text with ownership validation
8. **Delete Replies** - Remove replies with ownership validation

### Key Design Decisions

#### Optimistic Updates

All mutations implement optimistic updates for immediate UI feedback:

- **Add Comment**: Immediately shows the new comment with a temporary ID
- **Add Reply**: Instantly displays the reply in the thread
- **Edit Comment/Reply**: Updates the text immediately
- **Delete Comment/Reply**: Removes from UI instantly
- **Resolve/Unresolve**: Updates resolved state immediately

If the server request fails, the optimistic update is rolled back and an error toast is displayed.

#### Ownership Checks

Edit and delete operations include client-side ownership validation:

```typescript
// Client-side ownership check
const comment = comments.find((c) => c.id === commentId)
if (comment && currentUserId && comment.userId !== currentUserId) {
  return Promise.reject(
    new Error('You can only edit your own comments')
  )
}
```

This provides immediate feedback before making the API call. The server should also validate ownership for security.

#### Error Handling

All mutations include comprehensive error handling:

- **onError**: Rolls back optimistic updates
- **Toast Notifications**: User-friendly error messages
- **Error Context**: Preserves previous state for rollback

#### Cache Management

The hook uses TanStack Query's cache invalidation strategy:

- **Query Key**: `['lecturer', 'syllabi', syllabusId, 'comments']`
- **Stale Time**: 2 minutes (comments update moderately frequently)
- **Cache Time**: 10 minutes
- **Invalidation**: After all successful mutations

## Usage Examples

### Basic Usage

```tsx
import { useFeedback } from '@/features/lecturer/hooks'

function SyllabusFeedback({ syllabusId, currentUserId }) {
  const {
    comments,
    addComment,
    replyToComment,
    editComment,
    removeComment,
    resolve,
    isLoading,
    isAddingComment
  } = useFeedback({
    syllabusId,
    currentUserId
  })

  if (isLoading) return <div>Loading comments...</div>

  return (
    <div>
      {comments.map(comment => (
        <CommentCard
          key={comment.id}
          comment={comment}
          onReply={(text) => replyToComment(comment.id, { text })}
          onEdit={(text) => editComment(comment.id, { text })}
          onDelete={() => removeComment(comment.id)}
          onResolve={() => resolve(comment.id)}
        />
      ))}
    </div>
  )
}
```

### Adding a Comment

```tsx
const handleAddComment = (formData) => {
  addComment({
    type: 'Suggestion',
    text: 'Consider adding more examples in this section',
    sectionReference: 'Learning Outcomes',
    priority: 'Medium'
  })
}
```

### Replying to a Comment

```tsx
const handleReply = (commentId, replyText) => {
  replyToComment(commentId, {
    text: replyText
  })
}
```

### Editing a Comment (with ownership check)

```tsx
const handleEdit = (commentId, newText) => {
  // Ownership is checked automatically
  editComment(commentId, {
    text: newText
  })
}
```

### Deleting a Comment (with ownership check)

```tsx
const handleDelete = (commentId) => {
  // Ownership is checked automatically
  removeComment(commentId)
}
```

### Resolving a Comment

```tsx
const handleResolve = (commentId) => {
  resolve(commentId)
}
```

## API Reference

### Hook Options

```typescript
interface UseFeedbackOptions {
  /** Syllabus ID to fetch comments for */
  syllabusId: number
  /** Enable/disable the query */
  enabled?: boolean
  /** Current user ID for ownership checks */
  currentUserId?: number
}
```

### Return Value

```typescript
interface UseFeedbackReturn {
  // Query state
  data: Comment[] | undefined
  error: Error | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  refetch: () => void
  
  // Data
  comments: Comment[]
  
  // Mutations
  addComment: (data: NewComment) => void
  isAddingComment: boolean
  
  replyToComment: (commentId: number, data: NewCommentReply) => void
  isAddingReply: boolean
  
  editComment: (commentId: number, data: Partial<NewComment>) => void
  isEditingComment: boolean
  
  removeComment: (commentId: number) => void
  isDeletingComment: boolean
  
  resolve: (commentId: number) => void
  isResolving: boolean
  
  unresolve: (commentId: number) => void
  isUnresolving: boolean
  
  editReply: (replyId: number, data: Partial<NewCommentReply>) => void
  isEditingReply: boolean
  
  removeReply: (replyId: number) => void
  isDeletingReply: boolean
}
```

## Requirements Validation

This implementation satisfies the following requirements:

### Requirement 7.6 - Threaded Replies
✅ Supports threaded replies to existing comments via `replyToComment` mutation

### Requirement 7.7 - Edit Comments
✅ Allows lecturers to edit their own comments with ownership validation

### Requirement 7.8 - Delete Comments
✅ Allows lecturers to delete their own comments with ownership validation

### Requirement 7.9 - Resolve Comments
✅ Allows marking comments as resolved when issues are addressed

### Additional Features
✅ Optimistic updates for all mutations
✅ Comprehensive error handling with rollback
✅ User-friendly toast notifications
✅ Client-side ownership validation
✅ Cache invalidation strategy

## Integration with Existing Components

The hook integrates seamlessly with existing feedback components:

### FeedbackThread Component
```tsx
import { useFeedback } from '@/features/lecturer/hooks'

export function FeedbackThread({ syllabusId }) {
  const { comments, resolve, removeComment } = useFeedback({
    syllabusId,
    currentUserId: getCurrentUserId()
  })
  
  // Render comments with actions
}
```

### CommentForm Component
```tsx
import { useFeedback } from '@/features/lecturer/hooks'

export function CommentForm({ syllabusId }) {
  const { addComment, isAddingComment } = useFeedback({
    syllabusId
  })
  
  const handleSubmit = (data) => {
    addComment(data)
  }
  
  // Render form
}
```

### InlineCommentTool Component
```tsx
import { useFeedback } from '@/features/lecturer/hooks'

export function InlineCommentTool({ syllabusId, onAddComment }) {
  const { addComment } = useFeedback({ syllabusId })
  
  const handleAddInlineComment = (textRange, commentData) => {
    addComment({
      ...commentData,
      sectionReference: textRange.sectionReference
    })
  }
  
  // Render inline comment tool
}
```

## Performance Considerations

### Query Optimization
- **Stale Time**: 2 minutes prevents unnecessary refetches
- **Cache Time**: 10 minutes keeps data available for quick navigation
- **Selective Invalidation**: Only invalidates comment queries, not entire syllabus data

### Optimistic Updates
- Provides instant feedback without waiting for server response
- Reduces perceived latency
- Automatically rolls back on error

### Ownership Checks
- Client-side validation prevents unnecessary API calls
- Server-side validation ensures security
- Clear error messages guide users

## Testing Recommendations

### Unit Tests
```typescript
describe('useFeedback', () => {
  it('should add comment with optimistic update', async () => {
    // Test optimistic update behavior
  })
  
  it('should prevent editing other users comments', async () => {
    // Test ownership validation
  })
  
  it('should rollback on error', async () => {
    // Test error handling
  })
})
```

### Integration Tests
- Test with real API endpoints
- Verify cache invalidation
- Test concurrent mutations
- Verify toast notifications

## Future Enhancements

Potential improvements for future iterations:

1. **Batch Operations**: Support bulk resolve/delete operations
2. **Real-time Updates**: WebSocket integration for live comment updates
3. **Comment Drafts**: Auto-save comment drafts before submission
4. **Rich Text**: Support for formatted text in comments
5. **Mentions**: @mention functionality for notifying specific users
6. **Attachments**: Support for attaching files to comments
7. **Comment History**: Track edit history for comments
8. **Reactions**: Add emoji reactions to comments

## Related Files

- **API Layer**: `src/features/lecturer/api/feedback.api.ts`
- **Types**: `src/features/lecturer/types/index.ts`
- **Schemas**: `src/features/lecturer/schemas/feedback.schema.ts`
- **Components**:
  - `src/features/lecturer/feedback/components/FeedbackThread.tsx`
  - `src/features/lecturer/feedback/components/CommentForm.tsx`
  - `src/features/lecturer/feedback/components/InlineCommentTool.tsx`

## Conclusion

The `useFeedback` hook provides a robust, user-friendly interface for managing collaborative feedback on syllabi. With optimistic updates, ownership validation, and comprehensive error handling, it delivers a smooth user experience while maintaining data integrity and security.
