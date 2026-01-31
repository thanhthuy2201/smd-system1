# Implementation Plan: Lecturer Module

## Overview

This implementation plan breaks down the Lecturer Module into discrete, incremental coding tasks. The module will be built using React 19 + TypeScript, following the existing codebase patterns with feature-based organization, TanStack Router for routing, TanStack Query for server state, and React Hook Form with Zod for form validation.

The implementation follows a bottom-up approach: establishing core infrastructure first (types, schemas, API layer), then building reusable components, followed by feature-specific implementations, and finally integration and testing.

## Tasks

- [x] 1. Set up core infrastructure and type definitions
  - Create directory structure under `src/features/lecturer/`
  - Define TypeScript types for all entities (Syllabus, CLO, Assessment, etc.)
  - Create Zod validation schemas for all forms
  - Set up API client configuration with interceptors
  - _Requirements: 1.1, 2.1-2.8, 10.1-10.5_

- [x] 2. Implement API integration layer
  - [x] 2.1 Create syllabus API functions (CRUD operations)
    - Implement `getSyllabi`, `getSyllabus`, `createSyllabus`, `updateSyllabus`
    - Implement `saveDraft`, `validateSyllabus`, `submitSyllabus`
    - Implement `getVersionHistory`, `getPreview`
    - _Requirements: 1.1, 1.10, 3.1-3.8, 4.1-4.12_
  
  - [x] 2.2 Create review and evaluation API functions
    - Implement `getReviewSchedules`, `getSubmissions`, `getApprovalTimeline`
    - Implement `getPeerReviews`, `createPeerEvaluation`, `updatePeerEvaluation`
    - _Requirements: 5.1-5.7, 6.1-6.10_
  
  - [x] 2.3 Create feedback and messaging API functions
    - Implement `getComments`, `addComment`, `replyToComment`, `resolveComment`
    - Implement `getMessages`, `sendMessage`, `markMessageAsRead`
    - _Requirements: 7.1-7.10, 8.1-8.11_
  
  - [x] 2.4 Create update request API functions
    - Implement `getApprovedSyllabi`, `createUpdateRequest`, `submitUpdateRequest`
    - Implement `cancelUpdateRequest`, `getUpdateRequests`
    - _Requirements: 9.1-9.12_

- [x] 3. Implement custom hooks for data fetching and state management
  - [x] 3.1 Create `useSyllabusForm` hook with auto-save functionality
    - Implement form initialization with React Hook Form
    - Integrate Zod validation resolver
    - Implement auto-save mutation with 30-second debounce
    - Add last saved timestamp tracking
    - _Requirements: 1.8, 12.1-12.7_
  
  - [x] 3.2 Create `useAutoSave` hook for generic auto-save behavior
    - Implement debounced data watching
    - Add dirty state detection
    - Handle save success and failure states
    - _Requirements: 1.8, 12.1-12.3_
  
  - [x] 3.3 Create `useSyllabusValidation` hook for submission validation
    - Implement validation mutation
    - Parse validation results
    - Format error messages
    - _Requirements: 4.1-4.9_
  
  - [x] 3.4 Create data fetching hooks
    - Implement `useSyllabiList` with filters and search
    - Implement `useReviewSchedules` for calendar data
    - Implement `usePeerReviews` for review queue
    - Implement `useMessaging` for inbox and conversations
    - _Requirements: 5.1-5.7, 6.1, 8.1-8.11, 15.1-15.8_

- [x] 4. Build reusable UI components
  - [x] 4.1 Create AutoSaveIndicator component
    - Display last saved timestamp
    - Show saving/saved/error states
    - Add retry button for failed saves
    - _Requirements: 1.8, 12.2_
  
  - [x] 4.2 Create ValidationResults component
    - Display checklist of validation criteria
    - Show pass/fail status for each criterion
    - Display specific error messages
    - _Requirements: 4.9_
  
  - [x] 4.3 Create StatusTracker component
    - Display progress bar for approval stages
    - Show current status with visual indicators
    - Display reviewer information
    - _Requirements: 5.4, 5.5_
  
  - [x] 4.4 Create CommentThread component
    - Display threaded comments with replies
    - Support comment types with icons
    - Show resolved/active states
    - Add inline reply functionality
    - _Requirements: 7.1, 7.6, 7.9, 7.10_

- [x] 5. Implement syllabus creation wizard
  - [x] 5.1 Create SyllabusWizard container component
    - Implement multi-step navigation
    - Add step validation before progression
    - Integrate auto-save functionality
    - Add unsaved changes warning
    - _Requirements: 1.1-1.10, 12.4_
  
  - [x] 5.2 Create CourseInformationStep component
    - Implement course selection dropdown with pre-population
    - Add academic year and semester selectors
    - Add course description textarea with character count
    - Integrate with course catalog API
    - _Requirements: 1.1, 13.1-13.7_
  
  - [x] 5.3 Create LearningOutcomesStep component
    - Implement CLO list with add/remove functionality
    - Auto-generate sequential CLO codes
    - Add Bloom's taxonomy level selector
    - Validate minimum 3 CLOs
    - _Requirements: 1.2, 1.3, 2.2_
  
  - [x] 5.4 Create CLOPLOMappingStep component
    - Display matrix interface for CLO-PLO mapping
    - Fetch PLOs from program API
    - Validate at least one PLO per CLO
    - Show mapping summary
    - _Requirements: 1.4, 13.4_
  
  - [x] 5.5 Create CourseContentStep component
    - Implement weekly topics list with add/remove
    - Add hours allocation inputs with validation
    - Calculate and display total hours
    - Validate hours alignment with credits
    - _Requirements: 1.5, 2.3, 2.8_
  
  - [x] 5.6 Create AssessmentMethodsStep component
    - Implement assessment list with add/remove
    - Add weight percentage inputs
    - Calculate and display total weight
    - Validate total equals 100%
    - Show CLO coverage for each assessment
    - _Requirements: 1.6, 2.4, 2.6_
  
  - [x] 5.7 Create ReferencesStep component
    - Implement references list with add/remove
    - Add type selector (Required/Recommended/Online)
    - Validate ISBN and URL formats
    - Ensure at least one required textbook
    - _Requirements: 1.7, 2.5_
  
  - [x] 5.8 Create PreviewStep component
    - Display formatted syllabus preview
    - Match university template layout
    - Add edit buttons for each section
    - Show save as draft and submit buttons
    - _Requirements: 1.9_

- [x] 6. Checkpoint - Ensure syllabus creation wizard works end-to-end
  - Test creating a complete syllabus from start to finish
  - Verify auto-save functionality
  - Verify all validation rules
  - Ask the user if questions arise

- [x] 7. Implement syllabus editing and management
  - [x] 7.1 Create SyllabiList component
    - Display syllabi in data table with status badges
    - Implement search and filter functionality
    - Add sorting by date and course code
    - Show action buttons based on status
    - _Requirements: 3.1-3.5, 15.1-15.8_
  
  - [x] 7.2 Create SyllabusEditor component
    - Reuse wizard steps for editing
    - Implement status-based access control
    - Display revision feedback panel
    - Show change tracking indicators
    - _Requirements: 3.1-3.8_
  
  - [x] 7.3 Create VersionHistory component
    - Display version timeline with timestamps
    - Show change summaries for each version
    - Add compare versions functionality
    - Allow reverting to previous versions
    - _Requirements: 3.6, 3.7_

- [x] 8. Implement submission workflow
  - [x] 8.1 Create SubmissionChecklist component
    - Display all validation criteria
    - Show real-time validation status
    - Highlight failed criteria with error messages
    - Add fix buttons linking to relevant sections
    - _Requirements: 4.1-4.9_
  
  - [x] 8.2 Create SubmissionConfirmation modal
    - Display final review summary
    - Add optional notes textarea
    - Require explicit confirmation checkbox
    - Show submission progress
    - _Requirements: 4.10, 4.11_
  
  - [x] 8.3 Implement submission mutation and status updates
    - Create submission mutation with TanStack Query
    - Update syllabus status to Pending Review
    - Create approval history record
    - Trigger reviewer notifications
    - Invalidate relevant queries
    - _Requirements: 4.11, 4.12_

- [x] 9. Implement review schedules and tracking
  - [x] 9.1 Create ReviewCalendar component
    - Display calendar with highlighted review periods
    - Show department-specific schedules
    - Add deadline markers
    - Implement month/week view toggle
    - _Requirements: 5.1_
  
  - [x] 9.2 Create SubmissionsTimeline component
    - Display submitted syllabi with status
    - Show progress through approval stages
    - Add status change timestamps
    - Link to detailed approval timeline
    - _Requirements: 5.2, 5.5, 5.6_
  
  - [x] 9.3 Create DeadlineAlerts component
    - Calculate days until deadline
    - Display countdown for deadlines within 7 days
    - Show urgency indicators
    - Sort by urgency
    - _Requirements: 5.3, 5.7_

- [x] 10. Implement peer review functionality
  - [x] 10.1 Create PeerReviewQueue component
    - Display assigned syllabi for review
    - Show syllabus metadata and status
    - Add filter by review status
    - Link to evaluation form
    - _Requirements: 6.1_
  
  - [x] 10.2 Create SyllabusViewer component
    - Display complete syllabus in read-only format
    - Disable all edit controls
    - Add print/export functionality
    - Show all sections with proper formatting
    - _Requirements: 6.2_
  
  - [x] 10.3 Create EvaluationForm component
    - Display evaluation criteria from template
    - Implement 1-5 rating scale for each criterion
    - Add conditional comment fields for low scores
    - Calculate overall weighted score
    - Add recommendation selector
    - Add summary comments textarea
    - _Requirements: 6.3-6.8_
  
  - [x] 10.4 Create RubricGuide component
    - Display scoring guidelines for each criterion
    - Show examples of each rating level
    - Add collapsible sections
    - Make accessible as side panel
    - _Requirements: 6.10_
  
  - [x] 10.5 Implement evaluation submission
    - Create evaluation mutation
    - Support draft and final submission
    - Validate all required fields
    - Update peer review queue
    - _Requirements: 6.9_

- [x] 11. Checkpoint - Ensure review and evaluation features work
  - Test review schedule display
  - Test peer evaluation workflow
  - Verify scoring calculations
  - Ask the user if questions arise

- [x] 12. Implement feedback and commenting system
  - [x] 12.1 Create FeedbackThread component
    - Display comments organized by section
    - Show comment metadata (author, timestamp, type)
    - Implement threaded reply display
    - Add resolved/active filtering
    - _Requirements: 7.1, 7.6, 7.9, 7.10_
  
  - [x] 12.2 Create CommentForm component
    - Add comment type selector
    - Add section reference selector
    - Add priority selector for error comments
    - Validate comment text length
    - _Requirements: 7.2-7.5_
  
  - [x] 12.3 Create InlineCommentTool component
    - Allow selecting text to comment on
    - Show comment indicators on text
    - Open comment form at selection
    - Link comments to specific text ranges
    - _Requirements: 7.4_
  
  - [x] 12.4 Implement comment mutations
    - Create add comment mutation with optimistic update
    - Create reply mutation
    - Create edit comment mutation with ownership check
    - Create delete comment mutation with ownership check
    - Create resolve comment mutation
    - _Requirements: 7.6-7.9_

- [x] 13. Implement internal messaging system
  - [x] 13.1 Create MessageInbox component
    - Display message list with unread indicators
    - Show unread count badge
    - Implement read/unread filtering
    - Add search functionality
    - Link to conversation threads
    - _Requirements: 8.1_
  
  - [x] 13.2 Create ComposeMessage component
    - Add recipient autocomplete with authorization filter
    - Add subject and body inputs with validation
    - Implement file attachment with size/count limits
    - Add optional syllabus reference selector
    - Show character counts
    - _Requirements: 8.2-8.6, 8.11_
  
  - [x] 13.3 Create ConversationThread component
    - Display message history with contact
    - Show messages in chronological order
    - Add quick reply functionality
    - Display attachments with download links
    - Show syllabus context if linked
    - _Requirements: 8.7, 8.8_
  
  - [x] 13.4 Implement messaging mutations
    - Create send message mutation
    - Create mark as read mutation with optimistic update
    - Create delete message mutation
    - Update unread count in cache
    - _Requirements: 8.8-8.10_

- [x] 14. Implement update request workflow
  - [x] 14.1 Create UpdateRequestForm component
    - Display approved syllabi list
    - Add change type selector
    - Add affected sections multi-select
    - Add justification textarea with validation
    - Add effective semester selector
    - Add urgency selector
    - Add supporting documents upload
    - _Requirements: 9.1-9.7_
  
  - [x] 14.2 Create DraftChangesEditor component
    - Reuse syllabus editor components
    - Show original vs. proposed changes side-by-side
    - Highlight modified sections
    - Allow editing proposed changes
    - Save draft changes with update request
    - _Requirements: 9.8_
  
  - [x] 14.3 Create RequestStatusTracker component
    - Display update request status
    - Show review progress
    - Display reviewer feedback
    - Show approval/rejection decision
    - _Requirements: 9.11_
  
  - [x] 14.4 Implement update request mutations
    - Create update request mutation
    - Create save draft mutation
    - Create submit request mutation with notification
    - Create cancel request mutation with status check
    - _Requirements: 9.9, 9.10, 9.12_

- [x] 15. Implement routing and navigation
  - [x] 15.1 Create lecturer layout component
    - Add lecturer-specific navigation menu
    - Add breadcrumb navigation
    - Add notification badge in header
    - Integrate with existing layout system
    - _Requirements: All_
  
  - [x] 15.2 Create route files for all lecturer pages
    - Create `src/routes/lecturer/_layout.tsx`
    - Create `src/routes/lecturer/index.tsx` (dashboard)
    - Create `src/routes/lecturer/syllabi/index.tsx`
    - Create `src/routes/lecturer/syllabi/create.tsx`
    - Create `src/routes/lecturer/syllabi/$id/edit.tsx`
    - Create `src/routes/lecturer/syllabi/$id/submit.tsx`
    - Create `src/routes/lecturer/reviews/index.tsx`
    - Create `src/routes/lecturer/reviews/peer-reviews/index.tsx`
    - Create `src/routes/lecturer/reviews/peer-reviews/$id.tsx`
    - Create `src/routes/lecturer/messages/index.tsx`
    - Create `src/routes/lecturer/messages/compose.tsx`
    - Create `src/routes/lecturer/messages/conversation.$userId.tsx`
    - Create `src/routes/lecturer/update-requests/index.tsx`
    - Create `src/routes/lecturer/update-requests/create.$syllabusId.tsx`
    - _Requirements: All_

- [x] 16. Implement error handling and user feedback
  - [x] 16.1 Create LecturerErrorBoundary component
    - Implement error boundary with fallback UI
    - Add error logging
    - Add retry functionality
    - Display user-friendly error messages
    - _Requirements: 10.6, 10.7_
  
  - [x] 16.2 Configure API error interceptors
    - Implement request interceptor for auth token
    - Implement response interceptor for error handling
    - Map HTTP status codes to user messages
    - Handle 401 with redirect to login
    - Handle 403 with access denied message
    - Handle 404 with not found message
    - Handle 409 with conflict message
    - Handle 422 with validation errors
    - _Requirements: 10.1-10.5_
  
  - [x] 16.3 Implement toast notifications
    - Add success toasts for operations
    - Add error toasts with retry options
    - Add loading toasts for long operations
    - Add info toasts for warnings
    - _Requirements: 10.9_
  
  - [x] 16.4 Implement loading states
    - Add loading indicators for async operations
    - Add skeleton loaders for data fetching
    - Add progress bars for file uploads
    - Add spinners for mutations
    - _Requirements: 10.10_

- [x] 17. Implement accessibility features
  - [x] 17.1 Add keyboard navigation support
    - Implement tab order for all interactive elements
    - Add keyboard shortcuts for common actions
    - Ensure modal dialogs trap focus
    - Add Escape key handlers for modals
    - _Requirements: 11.3, 11.8_
  
  - [x] 17.2 Add ARIA labels and attributes
    - Add aria-label to all interactive elements
    - Add aria-describedby for form fields
    - Add aria-live regions for dynamic content
    - Add aria-invalid for validation errors
    - Add role attributes where needed
    - _Requirements: 11.4, 11.7_
  
  - [x] 17.3 Add focus indicators
    - Ensure visible focus styles for all elements
    - Add focus-visible styles
    - Test focus order and visibility
    - _Requirements: 11.9_
  
  - [x] 17.4 Implement theme support
    - Ensure all components support light/dark themes
    - Test theme switching
    - Verify CSS variable usage
    - _Requirements: 11.6_

- [x] 18. Implement notification system integration
  - [x] 18.1 Create notification components
    - Create NotificationBadge component for header
    - Create NotificationList component
    - Create NotificationItem component
    - Add mark as read functionality
    - _Requirements: 14.7-14.9_
  
  - [x] 18.2 Implement notification triggers
    - Trigger notification on syllabus status change
    - Trigger notification on peer review assignment
    - Trigger notification on message receipt
    - Trigger notification on comment addition
    - Trigger notification on approaching deadline
    - _Requirements: 14.1-14.6_
  
  - [x] 18.3 Implement notification delivery
    - Create in-app notification display
    - Integrate with email notification service (if available)
    - Add notification preferences
    - _Requirements: 14.10_

- [x] 19. Checkpoint - Ensure all features are integrated
  - Test complete user flows from start to finish
  - Test navigation between all pages
  - Test error handling and recovery
  - Verify accessibility with keyboard navigation
  - Ask the user if questions arise

- [x] 20. Final checkpoint - Complete implementation and verification
  - Test all user flows manually
  - Test on different screen sizes (mobile, tablet, desktop)
  - Test with different themes (light/dark)
  - Test keyboard navigation and accessibility
  - Fix any remaining issues
  - Verify all features work end-to-end

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The implementation follows the existing codebase patterns and conventions
- All components should use Shadcn UI components where applicable
- All forms should use React Hook Form with Zod validation
- All API calls should use TanStack Query for caching and state management
- All routes should use TanStack Router file-based routing
- Use `bun` for all package management and script execution commands
- Testing tasks have been removed to save time and focus on implementation
