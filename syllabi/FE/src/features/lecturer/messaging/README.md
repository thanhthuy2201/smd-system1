# Messaging Module

Internal messaging system for lecturer communication with academic staff and reviewers.

## Components

### MessageInbox

Displays a list of messages with filtering, search, and unread indicators.

**Features:**
- ✅ Display message list with unread indicators
- ✅ Show unread count badge in header
- ✅ Implement read/unread filtering
- ✅ Add search functionality
- ✅ Link to conversation threads (via callback)
- ✅ Mark messages as read on click
- ✅ Delete messages with confirmation
- ✅ Pagination support
- ✅ Responsive design
- ✅ Accessibility support

**Requirements:** Validates Requirements 8.1

**Usage:**

```tsx
import { MessageInbox } from '@/features/lecturer/messaging'

function MessagesPage() {
  const navigate = useNavigate()

  return (
    <MessageInbox
      onMessageSelect={(message) => {
        // Navigate to conversation thread
        navigate(`/lecturer/messages/conversation/${message.senderId}`)
      }}
      pageSize={20}
    />
  )
}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | - | Optional CSS class name |
| `onMessageSelect` | `(message: Message) => void` | - | Callback when message is clicked |
| `pageSize` | `number` | `20` | Number of messages per page |

### ComposeMessage

Form component for composing and sending new messages with validation and file attachments.

**Features:**
- ✅ Recipient autocomplete with authorization filter
- ✅ Subject input with 200 character limit
- ✅ Message body with 5000 character limit
- ✅ File attachments (max 5 files, 10MB each)
- ✅ Optional syllabus reference selector
- ✅ Real-time character counts
- ✅ Form validation with Zod schema
- ✅ Success/error toast notifications
- ✅ Responsive design
- ✅ Accessibility support

**Requirements:** Validates Requirements 8.2, 8.3, 8.4, 8.5, 8.6, 8.11

**Usage:**

```tsx
import { ComposeMessage } from '@/features/lecturer/messaging'

function ComposeMessagePage() {
  const navigate = useNavigate()
  const { data: syllabi } = useSyllabi()

  return (
    <ComposeMessage
      defaultRecipientId={123}
      defaultSyllabusId={456}
      syllabi={syllabi}
      onSuccess={() => {
        navigate('/lecturer/messages')
      }}
      onCancel={() => {
        navigate('/lecturer/messages')
      }}
    />
  )
}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | - | Optional CSS class name |
| `defaultRecipientId` | `number` | - | Pre-select recipient |
| `defaultSyllabusId` | `number` | - | Pre-select syllabus reference |
| `syllabi` | `Syllabus[]` | `[]` | List of syllabi for reference selector |
| `onSuccess` | `() => void` | - | Callback on successful send |
| `onCancel` | `() => void` | - | Callback on cancel |

**Features in Detail:**

1. **Recipient Autocomplete:**
   - Search by name or email (min 2 characters)
   - Debounced search (300ms)
   - Shows recipient role and department
   - Authorization filter (department/reviewers only)
   - Popover with Command component

2. **Subject Field:**
   - Required field
   - Max 200 characters
   - Real-time character count
   - Validation on blur

3. **Message Body:**
   - Required field
   - Max 5000 characters
   - Textarea with resize
   - Real-time character count
   - Min height 200px

4. **Syllabus Reference:**
   - Optional dropdown
   - Shows course code, name, year, semester
   - Provides context for message

5. **File Attachments:**
   - Multiple file upload
   - Max 5 files
   - Max 10MB per file
   - File preview with name and size
   - Remove attachment button
   - Visual file list with icons

6. **Form Actions:**
   - Send button (disabled while sending)
   - Cancel button (optional)
   - Loading state during submission
   - Toast notifications for success/error

## Hooks

### useMessaging

Custom hook for managing the message inbox with pagination, filtering, and mutations.

**Features:**
- Fetch messages with pagination
- Search messages
- Filter by read/unread status
- Send messages (with file upload support)
- Mark messages as read (with optimistic updates)
- Delete messages
- Track unread count

**Usage:**

```tsx
const {
  messages,
  unreadCount,
  total,
  totalPages,
  send,
  markAsRead,
  remove,
  isSending,
  isDeleting
} = useMessaging({
  page: 1,
  pageSize: 20,
  search: 'syllabus',
  unreadOnly: false
})

// Send a message
send({
  recipientId: 123,
  subject: 'Question about syllabus',
  body: 'I have a question...',
  syllabusId: 456,
  attachments: [file1, file2]
})
```

### useConversation

Hook for fetching a conversation thread with a specific user.

**Usage:**

```tsx
const { conversation, messages, unreadCount } = useConversation({
  userId: 123
})
```

## API Functions

Located in `api/message.api.ts`:

- `getMessages(params)` - Get paginated list of messages
- `getMessage(id)` - Get a specific message
- `getConversation(userId)` - Get conversation thread with a user
- `sendMessage(data)` - Send a new message (handles file uploads via FormData)
- `replyToMessage(messageId, body)` - Reply to a message
- `markAsRead(id)` - Mark a message as read
- `deleteMessage(id)` - Delete a message
- `searchRecipients(query)` - Search for authorized recipients
- `getAuthorizedRecipients()` - Get list of authorized recipients

## Validation Schema

Located in `schemas/message.schema.ts`:

```typescript
messageSchema = {
  recipientId: number (required, positive)
  subject: string (1-200 characters)
  body: string (1-5000 characters)
  syllabusId: number (optional)
  attachments: File[] (max 5 files, 10MB each)
}
```

## Integration

The messaging components integrate with:

- **API:** `src/features/lecturer/api/message.api.ts`
- **Hooks:** `src/features/lecturer/hooks/useMessaging.ts`
- **Types:** `src/features/lecturer/types/index.ts`
- **Schemas:** `src/features/lecturer/schemas/message.schema.ts`

## Data Flow

```
ComposeMessage / MessageInbox
  ↓
useMessaging hook
  ↓
message.api (TanStack Query)
  ↓
Backend API (/api/v1/lecturer/messages)
```

## Accessibility

- Keyboard navigation support
- ARIA labels for screen readers
- Focus indicators
- Semantic HTML structure
- Color contrast compliance
- Form field descriptions
- Error message announcements

## Responsive Design

- Mobile: Single column, full width, touch-friendly
- Tablet: Optimized spacing and layout
- Desktop: Full feature set with hover states

## Requirements Coverage

| Requirement | Component | Status |
|-------------|-----------|--------|
| 8.1 - Message inbox with unread count | MessageInbox | ✅ |
| 8.2 - Recipient autocomplete | ComposeMessage | ✅ |
| 8.3 - Subject validation (max 200) | ComposeMessage | ✅ |
| 8.4 - Body validation (max 5000) | ComposeMessage | ✅ |
| 8.5 - File attachments (5 files, 10MB) | ComposeMessage | ✅ |
| 8.6 - Syllabus reference | ComposeMessage | ✅ |
| 8.7 - Conversation threads | useConversation | ✅ |
| 8.8 - Reply to messages | API | ✅ |
| 8.9 - Mark as read | MessageInbox | ✅ |
| 8.10 - Delete messages | MessageInbox | ✅ |
| 8.11 - Recipient authorization filter | ComposeMessage | ✅ |

## Next Steps

To complete the messaging system (Tasks 13.3-13.4):

1. **ConversationThread Component** - Display message history with a contact
2. **Messaging Mutations** - Implement remaining mutations (already in useMessaging)

## Demo Pages

- `demo.tsx` - MessageInbox demonstration
- `compose-demo.tsx` - ComposeMessage demonstration

Run the demos to see the components in action with mock data.
