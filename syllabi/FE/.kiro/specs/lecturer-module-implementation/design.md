# Design Document: Lecturer Module Implementation

## Overview

The Lecturer Module is a comprehensive React-based feature set that enables lecturers to manage the complete lifecycle of course syllabi within the Syllabus Management and Digitalization (SMD) system. The module consists of nine primary features (FE02-FE09) that support syllabus creation, editing, submission, peer review, feedback, messaging, and post-approval updates.

### Architecture Approach

The implementation follows a feature-based architecture pattern consistent with the existing codebase structure. All lecturer-related functionality will be organized under `src/features/lecturer/` with the following sub-modules:

- **syllabi**: Syllabus creation, editing, and viewing
- **submission**: Submission workflow and validation
- **reviews**: Review schedules and peer evaluation
- **feedback**: Collaborative commenting system
- **messaging**: Internal communication
- **update-requests**: Post-approval update workflow

### Technology Stack Integration

- **Routing**: TanStack Router with file-based routes under `src/routes/lecturer/`
- **Server State**: TanStack Query for API data fetching, caching, and mutations
- **Form Management**: React Hook Form for complex multi-step forms
- **Validation**: Zod schemas for runtime validation matching backend requirements
- **UI Components**: Shadcn UI components with custom feature-specific components
- **Styling**: Tailwind CSS following existing design system patterns

### Key Design Principles

1. **Progressive Enhancement**: Multi-step forms with auto-save and draft persistence
2. **Optimistic Updates**: Immediate UI feedback with background synchronization
3. **Error Resilience**: Comprehensive error handling with retry mechanisms
4. **Accessibility First**: WCAG 2.1 AA compliance with keyboard navigation and screen reader support
5. **Responsive Design**: Mobile-first approach with adaptive layouts
6. **Type Safety**: Full TypeScript coverage with strict mode enabled

## Architecture

### Component Hierarchy

```
src/features/lecturer/
├── syllabi/
│   ├── components/
│   │   ├── SyllabiList.tsx
│   │   ├── SyllabusWizard/
│   │   │   ├── index.tsx
│   │   │   ├── CourseInformationStep.tsx
│   │   │   ├── LearningOutcomesStep.tsx
│   │   │   ├── CLOPLOMappingStep.tsx
│   │   │   ├── CourseContentStep.tsx
│   │   │   ├── AssessmentMethodsStep.tsx
│   │   │   ├── ReferencesStep.tsx
│   │   │   └── PreviewStep.tsx
│   │   ├── SyllabusEditor.tsx
│   │   ├── SyllabusViewer.tsx
│   │   ├── VersionHistory.tsx
│   │   └── AutoSaveIndicator.tsx
│   ├── hooks/
│   │   ├── useSyllabiList.ts
│   │   ├── useSyllabusForm.ts
│   │   ├── useAutoSave.ts
│   │   └── useSyllabusValidation.ts
│   ├── schemas/
│   │   ├── syllabusSchema.ts
│   │   ├── cloSchema.ts
│   │   ├── contentSchema.ts
│   │   └── assessmentSchema.ts
│   └── types/
│       └── syllabus.types.ts
├── submission/
│   ├── components/
│   │   ├── SubmissionChecklist.tsx
│   │   ├── ValidationResults.tsx
│   │   ├── SubmissionConfirmation.tsx
│   │   └── StatusTracker.tsx
│   ├── hooks/
│   │   └── useSubmissionValidation.ts
│   └── types/
│       └── submission.types.ts
├── reviews/
│   ├── components/
│   │   ├── ReviewCalendar.tsx
│   │   ├── SubmissionsTimeline.tsx
│   │   ├── DeadlineAlerts.tsx
│   │   ├── PeerReviewQueue.tsx
│   │   ├── EvaluationForm.tsx
│   │   └── RubricGuide.tsx
│   ├── hooks/
│   │   ├── useReviewSchedules.ts
│   │   └── usePeerEvaluation.ts
│   └── types/
│       └── review.types.ts
├── feedback/
│   ├── components/
│   │   ├── FeedbackThread.tsx
│   │   ├── CommentForm.tsx
│   │   ├── CommentReply.tsx
│   │   └── InlineCommentTool.tsx
│   ├── hooks/
│   │   └── useFeedback.ts
│   └── types/
│       └── feedback.types.ts
├── messaging/
│   ├── components/
│   │   ├── MessageInbox.tsx
│   │   ├── ComposeMessage.tsx
│   │   ├── ConversationThread.tsx
│   │   └── MessageAttachments.tsx
│   ├── hooks/
│   │   └── useMessaging.ts
│   └── types/
│       └── message.types.ts
└── update-requests/
    ├── components/
    │   ├── UpdateRequestForm.tsx
    │   ├── DraftChangesEditor.tsx
    │   └── RequestStatusTracker.tsx
    ├── hooks/
    │   └── useUpdateRequests.ts
    └── types/
        └── updateRequest.types.ts
```

### Routing Structure

```
src/routes/lecturer/
├── _layout.tsx                          # Lecturer layout wrapper
├── index.tsx                            # Dashboard/overview
├── syllabi/
│   ├── index.tsx                        # Syllabi list
│   ├── create.tsx                       # Create wizard
│   ├── $id/
│   │   ├── edit.tsx                     # Edit form
│   │   ├── submit.tsx                   # Submit workflow
│   │   └── view.tsx                     # Read-only view
├── reviews/
│   ├── index.tsx                        # Review schedules
│   └── peer-reviews/
│       ├── index.tsx                    # Peer review queue
│       └── $id.tsx                      # Evaluate specific syllabus
├── messages/
│   ├── index.tsx                        # Message inbox
│   ├── compose.tsx                      # Compose new message
│   └── conversation.$userId.tsx         # Conversation thread
└── update-requests/
    ├── index.tsx                        # Update requests list
    └── create.$syllabusId.tsx           # Create update request
```

### State Management Strategy

#### Server State (TanStack Query)

All API interactions use TanStack Query with the following query key structure:

```typescript
// Query keys
['lecturer', 'syllabi'] // List of syllabi
['lecturer', 'syllabi', syllabusId] // Single syllabus
['lecturer', 'courses'] // Assigned courses
['lecturer', 'reviews'] // Review schedules
['lecturer', 'peer-reviews'] // Peer review queue
['lecturer', 'messages'] // Message inbox
['lecturer', 'update-requests'] // Update requests

// Mutation keys
['createSyllabus']
['updateSyllabus']
['submitSyllabus']
['createPeerEvaluation']
['sendMessage']
['createUpdateRequest']
```

#### Form State (React Hook Form)

Complex multi-step forms use React Hook Form with Zod validation:

```typescript
// Syllabus form structure
{
  courseId: number;
  academicYear: string;
  semester: string;
  credits: number;
  description: string;
  clos: CLO[];
  content: CourseContent[];
  assessments: Assessment[];
  references: Reference[];
}
```

#### Local UI State

Minimal local state for UI-specific concerns:
- Wizard step navigation
- Modal open/close states
- Expanded/collapsed sections
- Filter and search criteria

### Data Flow Patterns

#### 1. Syllabus Creation Flow

```
User Action → Form Validation → Auto-save Draft → Submit → API Mutation → Cache Update → UI Update
```

#### 2. Submission Validation Flow

```
Submit Request → Client Validation → Server Validation → Display Results → Confirmation → Status Change
```

#### 3. Peer Review Flow

```
Load Assigned Reviews → Display Queue → Select Syllabus → Load Evaluation Template → Fill Form → Submit Evaluation → Update Queue
```

#### 4. Feedback Flow

```
View Syllabus → Add Comment → Optimistic Update → API Call → Cache Invalidation → Refresh Comments
```

## Components and Interfaces

### Core Type Definitions

```typescript
// src/features/lecturer/syllabi/types/syllabus.types.ts

export interface Syllabus {
  id: number;
  courseId: number;
  courseCode: string;
  courseName: string;
  academicYear: string;
  semester: 'Fall' | 'Spring' | 'Summer';
  credits: number;
  totalHours: number;
  description: string;
  status: SyllabusStatus;
  version: string;
  createdAt: string;
  updatedAt: string;
  lecturerId: number;
  clos: CLO[];
  content: CourseContent[];
  assessments: Assessment[];
  references: Reference[];
}

export type SyllabusStatus = 
  | 'Draft' 
  | 'Pending Review' 
  | 'Revision Required' 
  | 'Approved' 
  | 'Archived';

export interface CLO {
  id?: number;
  code: string;
  description: string;
  bloomLevel: BloomLevel;
  mappedPlos: string[];
}

export type BloomLevel = 
  | 'Remember' 
  | 'Understand' 
  | 'Apply' 
  | 'Analyze' 
  | 'Evaluate' 
  | 'Create';

export interface CourseContent {
  id?: number;
  weekNumber: number;
  title: string;
  description: string;
  lectureHours: number;
  labHours: number;
  relatedClos: string[];
  teachingMethods: string[];
}

export interface Assessment {
  id?: number;
  type: AssessmentType;
  name: string;
  weight: number;
  relatedClos: string[];
  description?: string;
}

export type AssessmentType = 
  | 'Quiz' 
  | 'Assignment' 
  | 'Midterm' 
  | 'Final' 
  | 'Project' 
  | 'Presentation';

export interface Reference {
  id?: number;
  type: ReferenceType;
  title: string;
  authors: string;
  publisher?: string;
  year?: number;
  isbn?: string;
  url?: string;
}

export type ReferenceType = 
  | 'Required' 
  | 'Recommended' 
  | 'Online Resource';

// Submission types
export interface SubmissionValidation {
  isValid: boolean;
  criteria: ValidationCriterion[];
}

export interface ValidationCriterion {
  name: string;
  passed: boolean;
  message: string;
}

// Review types
export interface ReviewSchedule {
  id: number;
  departmentId: number;
  startDate: string;
  endDate: string;
  reviewType: string;
}

export interface PeerEvaluation {
  id?: number;
  syllabusId: number;
  reviewerId: number;
  criteriaScores: CriterionScore[];
  overallScore: number;
  recommendation: 'Approve' | 'Needs Revision' | 'Reject';
  summaryComments: string;
  status: 'Draft' | 'Submitted';
}

export interface CriterionScore {
  criterionId: number;
  criterionName: string;
  score: number;
  comment?: string;
}

// Feedback types
export interface Comment {
  id: number;
  syllabusId: number;
  userId: number;
  userName: string;
  type: CommentType;
  sectionReference?: string;
  text: string;
  priority?: 'Low' | 'Medium' | 'High';
  isResolved: boolean;
  createdAt: string;
  replies: CommentReply[];
}

export type CommentType = 
  | 'Suggestion' 
  | 'Question' 
  | 'Error' 
  | 'General';

export interface CommentReply {
  id: number;
  commentId: number;
  userId: number;
  userName: string;
  text: string;
  createdAt: string;
}

// Message types
export interface Message {
  id: number;
  senderId: number;
  senderName: string;
  recipientId: number;
  recipientName: string;
  subject: string;
  body: string;
  syllabusId?: number;
  isRead: boolean;
  sentDate: string;
  attachments: MessageAttachment[];
}

export interface MessageAttachment {
  id: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
}

// Update request types
export interface UpdateRequest {
  id?: number;
  syllabusId: number;
  changeType: ChangeType;
  affectedSections: string[];
  justification: string;
  effectiveSemester: string;
  urgency: 'Normal' | 'High';
  status: UpdateRequestStatus;
  supportingDocuments: Document[];
  draftChanges?: Partial<Syllabus>;
  createdAt?: string;
}

export type ChangeType = 
  | 'Minor Update' 
  | 'Content Revision' 
  | 'Major Restructure';

export type UpdateRequestStatus = 
  | 'Draft' 
  | 'Pending' 
  | 'Approved' 
  | 'Rejected';

export interface Document {
  id: number;
  fileName: string;
  fileSize: number;
  url: string;
}
```

### Zod Validation Schemas

```typescript
// src/features/lecturer/syllabi/schemas/syllabusSchema.ts

import { z } from 'zod';

export const cloSchema = z.object({
  code: z.string().regex(/^CLO\d+$/, 'CLO code must be in format CLO1, CLO2, etc.'),
  description: z.string()
    .min(20, 'CLO description must be at least 20 characters')
    .refine(
      (val) => /^[A-Z]/.test(val.trim()),
      'CLO description must start with an action verb'
    ),
  bloomLevel: z.enum([
    'Remember',
    'Understand',
    'Apply',
    'Analyze',
    'Evaluate',
    'Create'
  ]),
  mappedPlos: z.array(z.string()).min(1, 'CLO must be mapped to at least one PLO')
});

export const courseContentSchema = z.object({
  weekNumber: z.number().int().positive(),
  title: z.string().max(200, 'Topic title must not exceed 200 characters'),
  description: z.string().max(1000, 'Topic description must not exceed 1000 characters'),
  lectureHours: z.number().min(0).max(10),
  labHours: z.number().min(0).max(10),
  relatedClos: z.array(z.string()).min(1, 'Topic must relate to at least one CLO'),
  teachingMethods: z.array(z.string()).min(1, 'Select at least one teaching method')
});

export const assessmentSchema = z.object({
  type: z.enum(['Quiz', 'Assignment', 'Midterm', 'Final', 'Project', 'Presentation']),
  name: z.string().max(100, 'Assessment name must not exceed 100 characters'),
  weight: z.number().min(0).max(100),
  relatedClos: z.array(z.string()).min(1, 'Assessment must relate to at least one CLO'),
  description: z.string().max(500).optional()
});

export const referenceSchema = z.object({
  type: z.enum(['Required', 'Recommended', 'Online Resource']),
  title: z.string().max(300, 'Title must not exceed 300 characters'),
  authors: z.string().max(200, 'Authors must not exceed 200 characters'),
  publisher: z.string().max(100).optional(),
  year: z.number()
    .int()
    .min(1900)
    .max(new Date().getFullYear())
    .optional(),
  isbn: z.string()
    .regex(/^(?:\d{10}|\d{13})$/, 'Invalid ISBN format')
    .optional(),
  url: z.string().url('Invalid URL format').optional()
});

export const syllabusSchema = z.object({
  courseId: z.number().int().positive(),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/, 'Format must be YYYY-YYYY'),
  semester: z.enum(['Fall', 'Spring', 'Summer']),
  credits: z.number().int().min(1).max(10),
  totalHours: z.number().int().positive(),
  description: z.string()
    .min(100, 'Description must be at least 100 characters')
    .max(2000, 'Description must not exceed 2000 characters'),
  clos: z.array(cloSchema).min(3, 'Minimum 3 CLOs required'),
  content: z.array(courseContentSchema).min(1, 'At least one topic required'),
  assessments: z.array(assessmentSchema)
    .min(1, 'At least one assessment required')
    .refine(
      (assessments) => {
        const total = assessments.reduce((sum, a) => sum + a.weight, 0);
        return Math.abs(total - 100) < 0.01;
      },
      'Assessment weights must total 100%'
    ),
  references: z.array(referenceSchema)
    .refine(
      (refs) => refs.some(r => r.type === 'Required'),
      'At least one required textbook must be specified'
    )
});

export const submissionNotesSchema = z.object({
  notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional(),
  confirm: z.boolean().refine(val => val === true, 'Must confirm syllabus is ready')
});

export const commentSchema = z.object({
  type: z.enum(['Suggestion', 'Question', 'Error', 'General']),
  sectionReference: z.string().optional(),
  text: z.string()
    .min(10, 'Comment must be at least 10 characters')
    .max(1000, 'Comment must not exceed 1000 characters'),
  priority: z.enum(['Low', 'Medium', 'High']).optional()
});

export const messageSchema = z.object({
  recipientId: z.number().int().positive(),
  subject: z.string().max(200, 'Subject must not exceed 200 characters'),
  body: z.string().max(5000, 'Message body must not exceed 5000 characters'),
  syllabusId: z.number().int().positive().optional(),
  attachments: z.array(z.instanceof(File))
    .max(5, 'Maximum 5 attachments allowed')
    .refine(
      (files) => files.every(f => f.size <= 10 * 1024 * 1024),
      'Each file must be 10MB or less'
    )
    .optional()
});

export const updateRequestSchema = z.object({
  syllabusId: z.number().int().positive(),
  changeType: z.enum(['Minor Update', 'Content Revision', 'Major Restructure']),
  affectedSections: z.array(z.string()).min(1, 'Select at least one affected section'),
  justification: z.string().min(50, 'Justification must be at least 50 characters'),
  effectiveSemester: z.string(),
  urgency: z.enum(['Normal', 'High']),
  supportingDocuments: z.array(z.instanceof(File)).optional()
});
```

### API Integration Layer

```typescript
// src/features/lecturer/syllabi/api/syllabusApi.ts

import { apiClient } from '@/lib/api-client';
import type { Syllabus, SubmissionValidation } from '../types/syllabus.types';

export const syllabusApi = {
  // List operations
  getAssignedCourses: () => 
    apiClient.get('/api/v1/lecturer/courses'),
  
  getSyllabi: (filters?: { status?: string; academicYear?: string }) =>
    apiClient.get('/api/v1/lecturer/syllabi', { params: filters }),
  
  getSyllabus: (id: number) =>
    apiClient.get(`/api/v1/syllabi/${id}`),
  
  // Create/Update operations
  createSyllabus: (data: Partial<Syllabus>) =>
    apiClient.post('/api/v1/syllabi', data),
  
  updateSyllabus: (id: number, data: Partial<Syllabus>) =>
    apiClient.put(`/api/v1/syllabi/${id}`, data),
  
  saveDraft: (id: number, data: Partial<Syllabus>) =>
    apiClient.put(`/api/v1/syllabi/${id}/draft`, data),
  
  // Submission operations
  validateSyllabus: (id: number): Promise<SubmissionValidation> =>
    apiClient.post(`/api/v1/syllabi/${id}/validate`),
  
  submitSyllabus: (id: number, notes?: string) =>
    apiClient.post(`/api/v1/syllabi/${id}/submit`, { notes }),
  
  withdrawSubmission: (id: number) =>
    apiClient.post(`/api/v1/syllabi/${id}/withdraw`),
  
  // Version operations
  getVersionHistory: (id: number) =>
    apiClient.get(`/api/v1/syllabi/${id}/versions`),
  
  getPreview: (id: number) =>
    apiClient.get(`/api/v1/syllabi/${id}/preview`),
  
  // PLO operations
  getProgramPLOs: (programId: number) =>
    apiClient.get(`/api/v1/programs/${programId}/plos`)
};
```

### Custom Hooks

```typescript
// src/features/lecturer/syllabi/hooks/useSyllabusForm.ts

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { syllabusSchema } from '../schemas/syllabusSchema';
import { syllabusApi } from '../api/syllabusApi';
import { useAutoSave } from './useAutoSave';
import type { Syllabus } from '../types/syllabus.types';

export function useSyllabusForm(syllabusId?: number, initialData?: Partial<Syllabus>) {
  const queryClient = useQueryClient();
  
  const form = useForm({
    resolver: zodResolver(syllabusSchema),
    defaultValues: initialData || {
      clos: [],
      content: [],
      assessments: [],
      references: []
    },
    mode: 'onChange'
  });

  // Auto-save mutation
  const autoSaveMutation = useMutation({
    mutationFn: (data: Partial<Syllabus>) => 
      syllabusId 
        ? syllabusApi.saveDraft(syllabusId, data)
        : syllabusApi.createSyllabus(data),
    onSuccess: (response) => {
      queryClient.setQueryData(['lecturer', 'syllabi', response.data.id], response.data);
    }
  });

  // Enable auto-save
  useAutoSave({
    data: form.watch(),
    onSave: autoSaveMutation.mutate,
    interval: 30000, // 30 seconds
    enabled: form.formState.isDirty
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: (data: Syllabus) =>
      syllabusId
        ? syllabusApi.updateSyllabus(syllabusId, data)
        : syllabusApi.createSyllabus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecturer', 'syllabi'] });
    }
  });

  return {
    form,
    isAutoSaving: autoSaveMutation.isPending,
    lastSaved: autoSaveMutation.data?.timestamp,
    submit: submitMutation.mutate,
    isSubmitting: submitMutation.isPending,
    submitError: submitMutation.error
  };
}

// src/features/lecturer/syllabi/hooks/useAutoSave.ts

import { useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => void;
  interval: number;
  enabled: boolean;
}

export function useAutoSave<T>({ data, onSave, interval, enabled }: UseAutoSaveOptions<T>) {
  const debouncedData = useDebounce(data, interval);
  const previousDataRef = useRef<T>();

  useEffect(() => {
    if (!enabled) return;
    
    if (previousDataRef.current !== undefined && 
        JSON.stringify(previousDataRef.current) !== JSON.stringify(debouncedData)) {
      onSave(debouncedData);
    }
    
    previousDataRef.current = debouncedData;
  }, [debouncedData, enabled, onSave]);
}

// src/features/lecturer/syllabi/hooks/useSyllabusValidation.ts

import { useMutation } from '@tanstack/react-query';
import { syllabusApi } from '../api/syllabusApi';
import type { SubmissionValidation } from '../types/syllabus.types';

export function useSyllabusValidation(syllabusId: number) {
  return useMutation<SubmissionValidation>({
    mutationFn: () => syllabusApi.validateSyllabus(syllabusId)
  });
}
```

## Data Models

### Database Schema Considerations

The frontend will interact with the following backend entities:

#### SYLLABUS Table
- Primary entity for syllabus data
- Contains course reference, academic period, status, version
- Relationships: belongs to Course, belongs to User (lecturer)

#### SYLLABUS_CLO Table
- Stores learning outcomes for each syllabus
- Contains CLO code, description, Bloom's level
- Relationship: belongs to Syllabus

#### CLO_PLO_MAPPING Table
- Junction table for many-to-many CLO-PLO relationships
- Relationship: connects SYLLABUS_CLO to PROGRAM_PLO

#### SYLLABUS_CONTENT Table
- Stores weekly/topic breakdown
- Contains week number, title, description, hours allocation
- Relationship: belongs to Syllabus

#### SYLLABUS_ASSESSMENT Table
- Stores assessment methods and weightage
- Contains type, name, weight percentage
- Relationship: belongs to Syllabus

#### SYLLABUS_REFERENCE Table
- Stores textbooks and references
- Contains type, title, authors, publication details
- Relationship: belongs to Syllabus

#### MESSAGE Table
- Stores internal messages
- Contains sender, recipient, subject, body, optional syllabus reference
- Relationships: belongs to User (sender), belongs to User (recipient)

#### UPDATE_REQUEST Table
- Stores post-approval update requests
- Contains change type, justification, status
- Relationship: belongs to Syllabus

### API Response Formats

#### Success Response
```json
{
  "status": 200,
  "data": { /* entity data */ },
  "message": "Operation successful",
  "timestamp": "2026-01-30T10:00:00Z"
}
```

#### Error Response
```json
{
  "status": 422,
  "error": "Validation Failed",
  "message": "Syllabus cannot be submitted",
  "timestamp": "2026-01-30T10:00:00Z",
  "path": "/api/v1/syllabi/123/submit",
  "details": [
    { "field": "clos", "message": "Minimum 3 CLOs required" },
    { "field": "assessments", "message": "Weights must total 100%" }
  ]
}
```

### Caching Strategy

TanStack Query cache configuration:

```typescript
// Query cache times
{
  syllabi: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000 // 30 minutes
  },
  courses: {
    staleTime: 60 * 60 * 1000, // 1 hour (rarely changes)
    cacheTime: 24 * 60 * 60 * 1000 // 24 hours
  },
  messages: {
    staleTime: 1 * 60 * 1000, // 1 minute (frequent updates)
    cacheTime: 10 * 60 * 1000 // 10 minutes
  },
  reviews: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 60 * 60 * 1000 // 1 hour
  }
}
```

### Optimistic Updates

For better UX, implement optimistic updates for:
- Adding/editing comments
- Marking messages as read
- Resolving feedback
- Auto-saving drafts

```typescript
// Example optimistic update for comments
const addCommentMutation = useMutation({
  mutationFn: (comment: NewComment) => 
    feedbackApi.addComment(syllabusId, comment),
  onMutate: async (newComment) => {
    await queryClient.cancelQueries({ queryKey: ['syllabi', syllabusId, 'comments'] });
    
    const previousComments = queryClient.getQueryData(['syllabi', syllabusId, 'comments']);
    
    queryClient.setQueryData(['syllabi', syllabusId, 'comments'], (old: Comment[]) => [
      ...old,
      { ...newComment, id: Date.now(), createdAt: new Date().toISOString() }
    ]);
    
    return { previousComments };
  },
  onError: (err, newComment, context) => {
    queryClient.setQueryData(
      ['syllabi', syllabusId, 'comments'],
      context?.previousComments
    );
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['syllabi', syllabusId, 'comments'] });
  }
});
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas where properties can be consolidated to avoid redundancy:

**Validation Properties**: Many individual validation rules (2.1-2.5, 2.7) can be combined into comprehensive validation properties that test the entire validation schema rather than individual fields.

**Status-Based Access Control**: Properties 3.1-3.5 all test access control based on syllabus status. These can be combined into a single property that tests access control across all status values.

**Submission Validation**: Properties 4.1-4.8 all test different submission validation criteria. These can be combined into a single comprehensive submission validation property.

**Notification Properties**: Properties 14.1-14.6 all test that various events trigger notifications. These can be combined into a single property that tests notification creation for all event types.

**Filter and Search**: Properties 15.1-15.4 all test different filtering mechanisms. These can be combined into a single property that tests filtering across all criteria.

The following properties represent the unique, non-redundant validation requirements after consolidation.

### Core Properties

#### Property 1: Course Data Pre-population

*For any* course selected from the assigned courses list, the system should pre-populate course code, course name, and credit hours with data matching the course catalog entry.

**Validates: Requirements 1.1, 13.1, 13.2**

#### Property 2: CLO Code Sequential Generation

*For any* number of CLOs created in a syllabus, the generated CLO codes should follow the sequential pattern CLO1, CLO2, CLO3, ... CLOn without gaps or duplicates.

**Validates: Requirements 1.2**

#### Property 3: Syllabus Form Validation Schema

*For any* syllabus form submission, the validation should enforce all field constraints including:
- Course description between 100-2000 characters
- CLO descriptions minimum 20 characters starting with action verb
- Bloom's taxonomy level required for each CLO
- At least one PLO mapped per CLO
- Lecture and lab hours between 0-10 per topic
- Assessment weights between 0-100 per assessment
- Assessment weights totaling exactly 100%
- Publication years between 1900 and current year
- Valid ISBN format for textbooks
- Valid URL format for online resources
- At least 3 CLOs defined
- At least one required textbook specified

**Validates: Requirements 1.3, 1.4, 1.7, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 4.2, 4.6, 4.7**

#### Property 4: Draft Persistence Without Complete Data

*For any* syllabus with incomplete information, saving as draft should succeed and persist the partial data to the server.

**Validates: Requirements 1.10, 12.5**

#### Property 5: Auto-save Draft Synchronization

*For any* syllabus in Draft status with unsaved changes, after 30 seconds of inactivity, the system should automatically save the current state and update the last saved timestamp.

**Validates: Requirements 1.8, 12.1, 12.2**

#### Property 6: Preview Content Completeness

*For any* syllabus with all required sections populated, the preview should contain all sections including course information, CLOs, CLO-PLO mapping, course content, assessments, and references.

**Validates: Requirements 1.9**

#### Property 7: Status-Based Edit Access Control

*For any* syllabus, edit operations should be allowed if and only if the status is Draft or Revision Required, and should be denied for statuses Pending Review, Approved, or Archived.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

#### Property 8: Version History Tracking

*For any* edit operation on a syllabus, a version history entry should be created containing the timestamp, change summary, and modified sections.

**Validates: Requirements 3.6, 3.7, 3.8**

#### Property 9: Submission Validation Completeness

*For any* syllabus submitted for review, the validation should verify:
- Course information is complete
- At least 3 CLOs are defined
- All CLOs are mapped to at least one PLO
- Course content covers expected number of weeks
- Total hours align with credit hours (credits × 15)
- Assessment weights total exactly 100%
- At least one required textbook is specified
- All CLOs are assessed by at least one assessment method

And if any criterion fails, the system should return a validation results object with specific error messages for each failed criterion.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9**

#### Property 10: Submission Status Transition

*For any* syllabus that passes validation and receives submission confirmation, the system should change the status to Pending Review, create an approval history record, and send notifications to assigned reviewers.

**Validates: Requirements 4.11, 4.12**

#### Property 11: Deadline Alert Triggering

*For any* deadline that is within 7 days of the current date, the system should display a countdown alert in the review schedule view.

**Validates: Requirements 5.3**

#### Property 12: Approval Timeline Completeness

*For any* syllabus that has progressed through approval stages, the approval timeline should contain entries for each stage transition with timestamps and reviewer information.

**Validates: Requirements 5.6**

#### Property 13: Peer Review Queue Filtering

*For any* lecturer viewing the peer review queue, the displayed syllabi should include only those explicitly assigned to that lecturer for review.

**Validates: Requirements 6.1**

#### Property 14: Evaluation Score Calculation

*For any* peer evaluation with criterion scores, the overall score should equal the weighted average of all criterion scores.

**Validates: Requirements 6.6**

#### Property 15: Low Score Comment Requirement

*For any* evaluation criterion receiving a score of 2 or lower, the evaluation should be invalid unless a comment is provided for that criterion with maximum 500 characters.

**Validates: Requirements 6.5**

#### Property 16: Evaluation Completeness Validation

*For any* peer evaluation submission, the system should require:
- A rating from 1 to 5 for each criterion
- An overall recommendation (Approve, Needs Revision, or Reject)
- Summary comments with minimum 50 characters

**Validates: Requirements 6.4, 6.7, 6.8**

#### Property 17: Comment Validation Schema

*For any* comment submission, the system should enforce:
- Comment type selection (Suggestion, Question, Error, or General)
- Comment text between 10-1000 characters
- Optional section reference
- Optional priority level for error comments

**Validates: Requirements 7.2, 7.3, 7.4, 7.5**

#### Property 18: Comment Ownership Access Control

*For any* comment, edit and delete operations should succeed if and only if the requesting user is the comment author.

**Validates: Requirements 7.7, 7.8**

#### Property 19: Comment Threading Association

*For any* comment reply, the reply should be correctly associated with its parent comment and appear in the threaded conversation.

**Validates: Requirements 7.6**

#### Property 20: Unread Message Count Accuracy

*For any* lecturer's message inbox, the unread count should equal the number of messages where isRead is false and the lecturer is the recipient.

**Validates: Requirements 8.1**

#### Property 21: Message Validation Schema

*For any* message submission, the system should enforce:
- Subject maximum 200 characters
- Body maximum 5000 characters
- Maximum 5 file attachments
- Each attachment maximum 10MB
- Optional syllabus reference

**Validates: Requirements 8.3, 8.4, 8.5, 8.6**

#### Property 22: Recipient Search Authorization

*For any* recipient search query, the returned users should include only those within the lecturer's department or assigned as reviewers for the lecturer's syllabi.

**Validates: Requirements 8.11**

#### Property 23: Update Request Validation Schema

*For any* update request submission, the system should enforce:
- Change type selection (Minor Update, Content Revision, or Major Restructure)
- At least one affected section selected
- Justification minimum 50 characters
- Effective semester selection
- Urgency level selection (Normal or High)
- Optional supporting documents

**Validates: Requirements 9.2, 9.3, 9.4, 9.5, 9.6, 9.7**

#### Property 24: Update Request Cancellation Authorization

*For any* update request, cancellation should succeed if and only if the status is Pending (not yet reviewed).

**Validates: Requirements 9.12**

#### Property 25: HTTP Error Status Mapping

*For any* API error, the system should return the appropriate HTTP status code:
- 401 for invalid/expired authentication tokens
- 403 for unauthorized access attempts
- 404 for missing resources
- 409 for conflicting operations (e.g., editing submitted syllabus)
- 422 for validation failures with detailed error messages

**Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

#### Property 26: Error Logging Completeness

*For any* error that occurs, the system should log error details including timestamp, endpoint path, error message, and HTTP status code.

**Validates: Requirements 10.7**

#### Property 27: Validation Error Field Association

*For any* validation error, the error message should be associated with the specific form field that failed validation.

**Validates: Requirements 10.8**

#### Property 28: Keyboard Navigation Support

*For all* interactive elements in the lecturer module, keyboard navigation should be supported with proper focus management and tab order.

**Validates: Requirements 11.3**

#### Property 29: ARIA Label Completeness

*For all* interactive elements and form fields, appropriate ARIA labels should be present for screen reader accessibility.

**Validates: Requirements 11.4, 11.7**

#### Property 30: Modal Escape Key Handling

*For any* open modal dialog, pressing the Escape key should close the modal.

**Validates: Requirements 11.8**

#### Property 31: Theme Mode Support

*For any* theme mode change (light to dark or dark to light), all CSS variables should update to reflect the new theme.

**Validates: Requirements 11.6**

#### Property 32: Unsaved Changes Navigation Guard

*For any* form with unsaved changes (dirty state), attempting to navigate away should trigger a confirmation dialog warning about data loss.

**Validates: Requirements 12.4**

#### Property 33: Draft Version Retrieval

*For any* draft syllabus, loading the syllabus should retrieve the most recent auto-saved version from the server.

**Validates: Requirements 12.6**

#### Property 34: Course Catalog Integration

*For any* course selection, the system should retrieve course details including code, name, credits, and prerequisites from the course catalog API, and pre-populate the form fields.

**Validates: Requirements 13.1, 13.2, 13.3**

#### Property 35: PLO Retrieval for Program

*For any* course associated with a program, the system should retrieve and display the PLOs for that program to enable CLO-PLO mapping.

**Validates: Requirements 13.4**

#### Property 36: Event-Based Notification Creation

*For any* significant event (syllabus status change, peer review assignment, message receipt, comment addition, approaching deadline), the system should create a notification for the relevant user(s).

**Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5, 14.6**

#### Property 37: Notification State Management

*For any* notification, the system should support marking as read and should correctly calculate unread counts for display in the notification badge.

**Validates: Requirements 14.7, 14.9**

#### Property 38: Search and Filter Application

*For any* combination of search text and filter criteria (status, academic year, semester), the syllabi list should display only syllabi matching all applied criteria, with an accurate count of matching results.

**Validates: Requirements 15.1, 15.2, 15.3, 15.5, 15.6**

#### Property 39: Syllabi Sorting

*For any* sort criterion (creation date, last modified date, course code), the syllabi list should be ordered according to that criterion in ascending or descending order.

**Validates: Requirements 15.4**

#### Property 40: Filter Persistence

*For any* search and filter criteria applied during a session, the criteria should persist when navigating between pages within the lecturer module.

**Validates: Requirements 15.8**

## Error Handling

### Error Boundary Strategy

Implement React Error Boundaries at strategic levels:

```typescript
// src/features/lecturer/components/LecturerErrorBoundary.tsx

import { Component, type ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class LecturerErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lecturer module error:', error, errorInfo);
    // Log to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            {this.state.error?.message || 'An unexpected error occurred'}
          </AlertDescription>
          <Button onClick={() => this.setState({ hasError: false })}>
            Try again
          </Button>
        </Alert>
      );
    }

    return this.props.children;
  }
}
```

### API Error Handling

Centralized error handling for API requests:

```typescript
// src/lib/api-client.ts

import axios, { type AxiosError } from 'axios';
import { toast } from '@/components/ui/use-toast';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || 'An error occurred';

    switch (status) {
      case 401:
        toast({
          title: 'Authentication Required',
          description: 'Please log in to continue',
          variant: 'destructive'
        });
        // Redirect to login
        window.location.href = '/auth/sign-in';
        break;

      case 403:
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to perform this action',
          variant: 'destructive'
        });
        break;

      case 404:
        toast({
          title: 'Not Found',
          description: 'The requested resource was not found',
          variant: 'destructive'
        });
        break;

      case 409:
        toast({
          title: 'Conflict',
          description: message,
          variant: 'destructive'
        });
        break;

      case 422:
        // Validation errors handled by form components
        break;

      default:
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive'
        });
    }

    return Promise.reject(error);
  }
);

interface ApiError {
  status: number;
  error: string;
  message: string;
  timestamp: string;
  path: string;
  details?: Array<{ field: string; message: string }>;
}
```

### Form Validation Error Display

```typescript
// Example form error display component

import { useFormContext } from 'react-hook-form';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function FormErrors() {
  const { formState: { errors } } = useFormContext();
  
  const errorMessages = Object.entries(errors).map(([field, error]) => ({
    field,
    message: error?.message as string
  }));

  if (errorMessages.length === 0) return null;

  return (
    <Alert variant="destructive">
      <AlertDescription>
        <ul className="list-disc list-inside space-y-1">
          {errorMessages.map(({ field, message }) => (
            <li key={field}>
              <strong>{field}:</strong> {message}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
```

### Retry Mechanism

Implement retry logic for failed requests:

```typescript
// src/lib/retry.ts

export async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError!;
}

// Usage in auto-save
const autoSaveMutation = useMutation({
  mutationFn: (data: Partial<Syllabus>) => 
    retryRequest(() => syllabusApi.saveDraft(syllabusId, data)),
  onError: () => {
    toast({
      title: 'Auto-save Failed',
      description: 'Your changes could not be saved. Retrying...',
      variant: 'destructive'
    });
  }
});
```

## Testing Strategy

### Dual Testing Approach

The Lecturer Module requires both unit testing and property-based testing for comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Component rendering with specific props
- User interaction flows (click, type, submit)
- Error boundary behavior
- API integration with mocked responses
- Edge cases like empty lists, maximum limits

**Property-Based Tests**: Verify universal properties across all inputs
- Form validation with randomly generated data
- Access control across all status combinations
- Calculation correctness (scores, totals, counts)
- Data transformation consistency
- State management invariants

### Testing Tools

- **Unit Testing**: Vitest + React Testing Library
- **Property-Based Testing**: fast-check library for TypeScript
- **API Mocking**: MSW (Mock Service Worker)
- **Component Testing**: Testing Library user-event for interactions

### Property-Based Test Configuration

Each property test should:
- Run minimum 100 iterations to ensure comprehensive input coverage
- Use fast-check generators for realistic test data
- Include a comment tag referencing the design property
- Tag format: `// Feature: lecturer-module-implementation, Property N: [property text]`

### Example Property Test

```typescript
// src/features/lecturer/syllabi/__tests__/validation.property.test.ts

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { syllabusSchema } from '../schemas/syllabusSchema';

describe('Syllabus Validation Properties', () => {
  // Feature: lecturer-module-implementation, Property 3: Syllabus Form Validation Schema
  it('should enforce assessment weights totaling 100%', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            type: fc.constantFrom('Quiz', 'Assignment', 'Midterm', 'Final', 'Project'),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            weight: fc.float({ min: 0, max: 100 }),
            relatedClos: fc.array(fc.string(), { minLength: 1 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (assessments) => {
          const total = assessments.reduce((sum, a) => sum + a.weight, 0);
          const result = syllabusSchema.shape.assessments.safeParse(assessments);
          
          if (Math.abs(total - 100) < 0.01) {
            expect(result.success).toBe(true);
          } else {
            expect(result.success).toBe(false);
            expect(result.error?.issues[0].message).toContain('100%');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: lecturer-module-implementation, Property 2: CLO Code Sequential Generation
  it('should generate sequential CLO codes without gaps', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        (numClos) => {
          const codes = Array.from({ length: numClos }, (_, i) => `CLO${i + 1}`);
          
          // Verify sequential pattern
          codes.forEach((code, index) => {
            expect(code).toBe(`CLO${index + 1}`);
          });
          
          // Verify no duplicates
          const uniqueCodes = new Set(codes);
          expect(uniqueCodes.size).toBe(numClos);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Example Unit Test

```typescript
// src/features/lecturer/syllabi/__tests__/SyllabusWizard.test.tsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SyllabusWizard } from '../components/SyllabusWizard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('SyllabusWizard', () => {
  it('should pre-populate course information when course is selected', async () => {
    const queryClient = new QueryClient();
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <SyllabusWizard />
      </QueryClientProvider>
    );

    // Select a course
    const courseSelect = screen.getByLabelText(/select course/i);
    await user.click(courseSelect);
    await user.click(screen.getByText('CS101 - Introduction to Programming'));

    // Verify pre-populated fields
    await waitFor(() => {
      expect(screen.getByLabelText(/course code/i)).toHaveValue('CS101');
      expect(screen.getByLabelText(/course name/i)).toHaveValue('Introduction to Programming');
      expect(screen.getByLabelText(/credits/i)).toHaveValue('3');
    });
  });

  it('should display validation errors when submitting incomplete form', async () => {
    const queryClient = new QueryClient();
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <SyllabusWizard />
      </QueryClientProvider>
    );

    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Verify error messages
    await waitFor(() => {
      expect(screen.getByText(/minimum 3 CLOs required/i)).toBeInTheDocument();
      expect(screen.getByText(/description must be at least 100 characters/i)).toBeInTheDocument();
    });
  });
});
```

### Test Coverage Goals

- **Unit Test Coverage**: Minimum 80% code coverage
- **Property Test Coverage**: All 40 correctness properties implemented
- **Integration Test Coverage**: All critical user flows (create, edit, submit, review)
- **Accessibility Testing**: All components pass axe-core accessibility checks

### Continuous Integration

Tests should run automatically on:
- Every pull request
- Before merging to main branch
- Nightly builds for extended property test runs (1000+ iterations)

### Performance Testing

Monitor and test:
- Form rendering performance with large datasets (100+ CLOs, topics, assessments)
- Auto-save performance under poor network conditions
- List rendering performance with 1000+ syllabi
- Search and filter performance with large datasets
