# ConversationThread Component

## Overview

The `ConversationThread` component displays a conversation thread between the lecturer and another user. It provides a complete messaging interface with message history, quick reply functionality, file attachments, and syllabus context.

## Features

- **Message History**: Displays all messages in chronological order with date separators
- **Quick Reply**: Inline reply form with character count and validation
- **File Attachments**: Support for uploading and downloading attachments (max 5 files, 10MB each)
- **Syllabus Context**: Shows linked syllabus information when messages reference a syllabus
- **Auto-scroll**: Automatically scrolls to the latest message
- **Unread Count**: Displays unread message count in the header
- **Responsive Design**: Works on mobile, tablet, and desktop devices
- **Accessibility**: Full keyboard navigation and screen reader support

## Requirements

Implements requirements **8.7** and **8.8** from the lecturer module specification:
- Display message history with contact
- Show messages in chronological order
- Add quick reply functionality
- Display attachments with download links
- Show syllabus context if linked

## Usage

### Basic Usage

```tsx
import { ConversationThread } from '@/features/lecturer/messaging/components'

function ConversationPage() {
  const userId = 123 // ID of the user to chat with

  return (
    <ConversationThread
      userId={userId}
      onBack={() => navigate('/lecturer/messages')}
    />
  )
}
```

### With Custom Styling

```tsx
<ConversationThread
  userId={userId}
  className="h-[600px] rounded-lg border shadow-lg"
  onBack={() => navigate('/lecturer/messages')}
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `userId` | `number` | Yes | User ID to display conversation with |
| `className` | `string` | No | Optional CSS class for styling |
| `onBack` | `() => void` | No | Callback when back button is clicked |

## Component Structure

```
ConversationThread
├── Header
│   ├── Back Button (optional)
│   ├── Contact Avatar
│   ├── Contact Name & Email
│   └── Unread Badge
├── Message List (ScrollArea)
│   └── MessageBubble (for each message)
│       ├── Date Separator
│       ├── Avatar
│       ├── Sender Name & Time
│       ├── Message Content
│       ├── Syllabus Context (if linked)
│       └── Attachments (if any)
└── Quick Reply Form
    ├── Attachment Preview
    ├── Message Input (Textarea)
    └── Action Buttons
        ├── Attach Files Button
        └── Send Reply Button
```

## Message Display

### Message Bubbles

Messages are displayed in chat-style bubbles:
- **Current user messages**: Right-aligned with primary color background
- **Other user messages**: Left-aligned with muted background
- **Date separators**: Shown when messages are from different days

### Attachments

Attachments are displayed with:
- File icon
- File name (truncated if too long)
- File size
- Download button

### Syllabus Context

When a message references a syllabus, a badge is displayed showing:
- 📄 icon
- Syllabus title

## Quick Reply

The quick reply form includes:
- **Textarea**: Multi-line input with 5000 character limit
- **Character Counter**: Shows current/max characters
- **Attach Files**: Button to add up to 5 files (10MB each)
- **Attachment Preview**: Shows selected files with remove option
- **Send Button**: Submits the reply

### Reply Behavior

- Subject is automatically prefixed with "Re:" based on the last message
- Form resets after successful send
- Attachments are cleared after send
- Toast notifications for success/error
- Optimistic UI updates

## Data Fetching

The component uses the `useConversation` hook which:
- Fetches conversation thread from `/api/v1/lecturer/messages/conversation/:userId`
- Caches data for 1 minute
- Automatically refetches on window focus
- Provides loading and error states

## Styling

The component uses:
- **Tailwind CSS**: For all styling
- **CSS Variables**: For theme colors (light/dark mode)
- **Shadcn UI Components**: Avatar, Badge, Button, Form, ScrollArea, Separator, Textarea
- **Responsive Design**: Adapts to different screen sizes

### Theme Support

The component fully supports light and dark themes:
- Message bubbles adjust colors based on theme
- Text contrast is maintained for readability
- Icons and borders use theme-aware colors

## Accessibility

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Focus Management**: Clear focus indicators
- **Form Validation**: Accessible error messages

## Error Handling

The component handles:
- **Loading State**: Shows spinner while fetching conversation
- **Not Found**: Displays message if conversation doesn't exist
- **Send Errors**: Shows toast notification with error message
- **File Upload Errors**: Validates file size and count with user feedback

## Performance

- **Auto-scroll**: Only triggers when messages change
- **Optimistic Updates**: Immediate UI feedback for better UX
- **Debounced Input**: Character counter updates efficiently
- **Lazy Loading**: Messages are fetched on demand

## Integration

### With MessageInbox

```tsx
function MessagingPage() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)

  if (selectedUserId) {
    return (
      <ConversationThread
        userId={selectedUserId}
        onBack={() => setSelectedUserId(null)}
      />
    )
  }

  return (
    <MessageInbox
      onMessageSelect={(message) => setSelectedUserId(message.senderId)}
    />
  )
}
```

### With Routing

```tsx
// In route file: src/routes/lecturer/messages/conversation.$userId.tsx
import { useParams } from '@tanstack/react-router'
import { ConversationThread } from '@/features/lecturer/messaging/components'

export function ConversationRoute() {
  const { userId } = useParams()

  return (
    <ConversationThread
      userId={Number(userId)}
      onBack={() => navigate('/lecturer/messages')}
    />
  )
}
```

## Demo

A demo page is available at `src/features/lecturer/messaging/conversation-demo.tsx` that shows the component with mock data.

To view the demo:
1. Import the demo component in your route
2. Navigate to the demo route
3. The demo uses userId=2 (Dr. Sarah Johnson from mock data)

## Related Components

- **MessageInbox**: Displays list of messages
- **ComposeMessage**: Form to compose new messages
- **MessageBubble**: Individual message display (internal component)

## API Dependencies

The component depends on these API endpoints:
- `GET /api/v1/lecturer/messages/conversation/:userId` - Fetch conversation thread
- `POST /api/v1/messages` - Send new message
- `POST /api/v1/messages/:id/read` - Mark message as read

## Future Enhancements

Potential improvements:
- Real-time updates with WebSocket
- Message search within conversation
- Message reactions/emojis
- Typing indicators
- Read receipts
- Message editing/deletion
- Voice messages
- Image preview in chat
