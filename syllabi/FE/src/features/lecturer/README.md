# Lecturer Module

This module provides comprehensive functionality for lecturers to manage course syllabi throughout their lifecycle, from creation through approval workflows and post-approval updates.

## Directory Structure

```
src/features/lecturer/
├── api/                          # API integration layer
│   ├── syllabus.api.ts          # Syllabus CRUD, submission, validation
│   ├── review.api.ts            # Review schedules, peer evaluations
│   ├── feedback.api.ts          # Comments and collaborative feedback
│   ├── message.api.ts           # Internal messaging system
│   ├── update-request.api.ts    # Post-approval update requests
│   ├── notification.api.ts      # Notification management
│   └── index.ts                 # API exports
├── schemas/                      # Zod validation schemas
│   ├── syllabus.schema.ts       # Syllabus, CLO, content, assessment, reference schemas
│   ├── feedback.schema.ts       # Comment and reply schemas
│   ├── message.schema.ts        # Message validation
│   ├── review.schema.ts         # Peer evaluation schemas
│   ├── update-request.schema.ts # Update request validation
│   └── index.ts                 # Schema exports
├── types/                        # TypeScript type definitions
│   └── index.ts                 # All type definitions
├── hooks/                        # Custom React hooks (to be implemented)
├── components/                   # Feature components (to be implemented)
├── syllabi/                      # Syllabus management (to be implemented)
├── submission/                   # Submission workflow (to be implemented)
├── reviews/                      # Review and evaluation (to be implemented)
├── feedback/                     # Feedback system (to be implemented)
├── messaging/                    # Messaging system (to be implemented)
└── update-requests/              # Update requests (to be implemented)
```

## Core Infrastructure

### Type Definitions (`types/index.ts`)

Comprehensive TypeScript types for all entities:

- **Syllabus Types**: Syllabus, CLO, CourseContent, Assessment, Reference
- **Review Types**: ReviewSchedule, PeerEvaluation, ApprovalTimeline
- **Feedback Types**: Comment, CommentReply
- **Message Types**: Message, MessageThread, Recipient
- **Update Request Types**: UpdateRequest, Document
- **Notification Types**: Notification
- **Query Parameters**: SyllabiQueryParams, MessagesQueryParams, etc.
- **API Response Types**: ApiResponse, ApiError, PaginatedResponse

### Validation Schemas (`schemas/`)

Zod schemas for runtime validation:

- **Syllabus Schemas**: Complete validation for all syllabus fields including CLOs, content, assessments, and references
- **Feedback Schemas**: Comment and reply validation
- **Message Schemas**: Message composition with attachment validation
- **Review Schemas**: Peer evaluation with criterion scoring
- **Update Request Schemas**: Post-approval update validation

### API Integration (`api/`)

Complete API client functions for all operations:

- **Syllabus API**: CRUD operations, submission, validation, version history
- **Review API**: Review schedules, peer evaluations, approval timelines
- **Feedback API**: Comments, replies, resolution
- **Message API**: Messaging, conversations, recipient search
- **Update Request API**: Create, submit, cancel update requests
- **Notification API**: Notification management

## Key Features

### 1. Syllabus Management

- Multi-step wizard for syllabus creation
- Auto-save functionality (30-second intervals)
- Version history tracking
- Status-based access control
- Course catalog integration

### 2. Submission Workflow

- Pre-submission validation
- Validation checklist display
- Confirmation modal
- Status tracking

### 3. Review System

- Review schedule calendar
- Submission timeline
- Deadline alerts
- Peer evaluation forms
- Rubric guides

### 4. Feedback System

- Threaded comments
- Comment types (Suggestion, Question, Error, General)
- Priority levels
- Resolution tracking
- Inline commenting

### 5. Messaging System

- Internal messaging
- Conversation threads
- File attachments (up to 5 files, 10MB each)
- Recipient authorization
- Unread count tracking

### 6. Update Requests

- Post-approval update workflow
- Change type classification
- Draft changes editor
- Supporting documents
- Status tracking

## Technology Stack

- **React 19** with TypeScript
- **TanStack Router** for routing
- **TanStack Query** for server state management
- **React Hook Form** for form management
- **Zod** for validation
- **Shadcn UI** for components
- **Tailwind CSS** for styling

## API Configuration

The module uses the centralized API client from `@/lib/api-client` which includes:

- Base URL configuration from environment variables
- Request interceptor for authentication tokens
- Response interceptor for error handling
- Support for file uploads and downloads

## Error Handling

All API functions return typed responses and handle errors through:

- HTTP status code mapping (401, 403, 404, 409, 422, 500)
- Detailed validation error messages
- User-friendly error notifications
- Retry mechanisms for failed requests

## Next Steps

The following components and features will be implemented in subsequent tasks:

1. Custom hooks for data fetching and state management
2. Reusable UI components
3. Syllabus creation wizard
4. Syllabus editing and management
5. Submission workflow components
6. Review and evaluation components
7. Feedback and commenting system
8. Internal messaging interface
9. Update request workflow
10. Routing and navigation
11. Error handling and user feedback
12. Accessibility features
13. Notification system integration

## Usage Example

```typescript
import { getSyllabi, createSyllabus } from '@/features/lecturer/api'
import { syllabusSchema } from '@/features/lecturer/schemas'
import type { Syllabus } from '@/features/lecturer/types'

// Fetch syllabi with filters
const syllabi = await getSyllabi({
  status: 'Draft',
  academicYear: '2024-2025',
  page: 1,
  pageSize: 20,
})

// Validate and create syllabus
const formData = {
  /* ... */
}
const validationResult = syllabusSchema.safeParse(formData)

if (validationResult.success) {
  const newSyllabus = await createSyllabus(validationResult.data)
}
```

## Contributing

When adding new features to this module:

1. Follow the existing directory structure
2. Add type definitions to `types/index.ts`
3. Create Zod schemas in the appropriate schema file
4. Implement API functions in the appropriate API file
5. Use the `@/` path alias for imports
6. Follow TypeScript strict mode conventions
7. Use inline type imports: `import { type Foo } from 'bar'`
