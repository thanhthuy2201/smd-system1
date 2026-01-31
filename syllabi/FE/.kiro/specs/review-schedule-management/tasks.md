# Implementation Plan: Review Schedule Management

## Overviewcated/review-schedules/index.tsx

This implementation plan breaks down the Review Schedule Management feature into discrete, incremental coding tasks. The feature will be built using React 19 with TypeScript, following the existing project structure and patterns (TanStack Router, TanStack Query, React Hook Form with Zod, Shadcn UI components).

The implementation follows a bottom-up approach: data layer → API client → shared components → screens → routing → testing.

## Tasks

- [x] 1. Set up feature structure and data models
  - Create `src/features/review-schedules/` directory structure
  - Create `src/features/review-schedules/data/schema.ts` with Zod schemas and TypeScript types
  - Define `ReviewSchedule`, `ReviewScheduleStatus`, `ReviewScheduleFormInput`, `ReviewerAssignment`, `ProgressStatistics`, `DeadlineAlertConfig`, `AuditTrailEntry` types
  - Implement validation schemas: `scheduleNameSchema`, `dateSequenceSchema`, `alertConfigSchema`, `reviewScheduleFormSchema`, `reviewerAssignmentSchema`
  - Add date sequence validation with minimum 7-day gaps
  - _Requirements: 2.7, 2.8, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 2. Implement API client and TanStack Query hooks
  - Create `src/features/review-schedules/data/api.ts` with API client functions
  - Implement: `list()`, `getById()`, `create()`, `update()`, `delete()`, `getAvailableReviewers()`, `assignReviewer()`, `updateAssignment()`, `removeAssignment()`, `getProgress()`, `sendReminders()`, `exportReport()`, `getAuditTrail()`
  - Create `src/features/review-schedules/hooks/use-review-schedules.ts` with `useReviewSchedules` hook
  - Create `src/features/review-schedules/hooks/use-review-schedule.ts` with `useReviewSchedule` hook
  - Create `src/features/review-schedules/hooks/use-review-mutations.ts` with mutation hooks
  - Implement: `useCreateReviewSchedule`, `useUpdateReviewSchedule`, `useDeleteReviewSchedule`, `useAssignReviewer`, `useSendReminders`
  - Create `src/features/review-schedules/hooks/use-progress-statistics.ts` with auto-refresh (60s interval)
  - Configure cache invalidation strategies
  - _Requirements: 1.1, 2.3, 4.6, 5.1, 6.5, 7.4, 8.8, 11.6_

- [x] 3. Create shared UI components
  - Create `src/features/review-schedules/components/status-badge.tsx` for status display
  - Implement color coding: gray for UPCOMING, blue for ACTIVE, green for COMPLETED, red for OVERDUE
  - Use Vietnamese labels: "Sắp diễn ra", "Đang diễn ra", "Hoàn thành", "Quá hạn"
  - _Requirements: 1.4_

- [x] 4. Create progress indicator component
  - Create `src/features/review-schedules/components/progress-indicator.tsx`
  - Implement circular or linear progress bar
  - Display percentage and counts (reviewed/total)
  - Add color coding: green (>80%), yellow (50-80%), red (<50%)
  - Show tooltip with detailed breakdown on hover
  - _Requirements: 1.8, 5.2_

- [x] 5. Implement form dirty tracking hook
  - Create `src/features/review-schedules/hooks/use-form-dirty.ts` if not exists
  - Implement `useFormDirty` hook with browser beforeunload event handling
  - Implement navigation guard with confirmation dialog state management
  - _Requirements: 6.7_

- [x] 6. Create review schedule form component
  - Create `src/features/review-schedules/components/review-schedule-form.tsx`
  - Implement form with React Hook Form and Zod validation
  - Add fields: Review Cycle Name, Semester (select), Review Start Date, L1 Deadline, L2 Deadline, Final Approval Date
  - Add deadline alert configuration section
  - Implement Vietnamese labels and placeholders
  - Implement field-level error display in Vietnamese
  - Add date pickers with min/max constraints
  - Implement deadline extension logic for edit mode (only allow extending, not shortening)
  - Add Save and Cancel buttons
  - _Requirements: 2.2, 2.7, 2.8, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 6.3, 6.4_

- [x] 7. Create deadline alerts configuration component
  - Create `src/features/review-schedules/components/deadline-alerts-config.tsx`
  - Add enable/disable toggle
  - Add threshold configuration (multi-select: 7, 5, 3, 1 days)
  - Add channel selection (checkboxes: Email, In-App)
  - Add overdue alerts toggle
  - Display preview of when alerts will be sent
  - _Requirements: 7.1, 7.2, 7.3, 7.6, 7.7_

- [x] 8. Implement table column definitions
  - Create `src/features/review-schedules/components/columns.tsx`
  - Define TanStack Table column definitions for all columns
  - Implement Vietnamese column headers
  - Implement date formatting with Vietnamese locale (dd/MM/yyyy)
  - Add row numbering column with sequential numbers
  - Add status column using StatusBadge component
  - Add progress column using ProgressIndicator component
  - Add actions column placeholder
  - _Requirements: 1.4, 1.5, 1.7, 1.8_

- [x] 9. Create row actions component
  - Create `src/features/review-schedules/components/row-actions.tsx`
  - Implement dropdown menu with View, Edit, Delete, Send Reminder actions
  - Show Edit only for UPCOMING and ACTIVE schedules
  - Show Delete only for UPCOMING schedules with no reviews
  - Show Send Reminder only for ACTIVE schedules
  - Implement confirmation dialog for Delete action
  - Handle action errors with Vietnamese messages
  - _Requirements: 6.1, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 10. Implement toolbar component
  - Create `src/features/review-schedules/components/toolbar.tsx`
  - Add search input with Vietnamese placeholder "Tìm kiếm theo tên chu kỳ..."
  - Add status filter select with options: "Tất cả", "Sắp diễn ra", "Đang diễn ra", "Hoàn thành", "Quá hạn"
  - Add semester filter select
  - Add academic year filter select
  - Implement debounced search input (300ms delay)
  - Update URL query parameters when filters change
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.7, 10.8_

- [x] 11. Create review schedule table component
  - Create `src/features/review-schedules/components/review-schedule-table.tsx`
  - Implement TanStack Table with column definitions
  - Add loading state with skeleton loader
  - Add empty state with Vietnamese message "Chưa có lịch phê duyệt nào"
  - Add error state with Vietnamese message and retry button
  - Implement pagination with page size options (10, 20, 50)
  - Implement default sort by reviewStartDate descending
  - Add sort indicators to column headers
  - Wire up row actions (view, edit, delete, send reminder)
  - Highlight overdue schedules with red background
  - _Requirements: 1.2, 1.3, 1.6, 1.7, 5.6, 5.7_

- [x] 12. Create progress dashboard component
  - Create `src/features/review-schedules/components/progress-dashboard.tsx`
  - Display overall statistics cards: Total, Reviewed, Pending, Overdue
  - Add progress bar for overall completion
  - Display average review time
  - Create department progress table
  - Create reviewer progress table
  - Add click handlers to filter syllabi by metric
  - Implement auto-refresh every 60 seconds
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.8_

- [x] 13. Create reviewer assignment component
  - Create `src/features/review-schedules/components/reviewer-assignment.tsx`
  - Display list of departments with current assignments
  - Add "Assign Reviewer" button for each department
  - Implement assignment modal with department selector
  - Add primary reviewer dropdown (filtered by role: HoD/AA)
  - Add backup reviewer dropdown (optional)
  - Display reviewer workload (current assignments count)
  - Implement edit and remove assignment actions
  - Show confirmation dialog before removing assignment
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 4.8_

- [x] 14. Create audit trail component
  - Create `src/features/review-schedules/components/audit-trail.tsx`
  - Display timeline of all changes
  - Show action, field changed, old/new values, user, and timestamp
  - Format dates in Vietnamese locale
  - Add filtering by action type
  - Implement pagination for long histories
  - _Requirements: 6.8, 8.7_

- [x] 15. Implement list screen
  - Create `src/features/review-schedules/index.tsx`
  - Add page title "Lịch phê duyệt đề cương" with description
  - Add "Tạo lịch phê duyệt" button linking to create route
  - Integrate Toolbar component with search and filter state
  - Integrate ReviewScheduleTable component
  - Wire up useReviewSchedules hook with query params (page, pageSize, search, status, semester, academicYear, sort)
  - Handle loading, error, and empty states
  - Implement navigation to detail/edit screens on row actions
  - Implement delete with confirmation and toast notifications
  - Implement send reminder action with toast feedback
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.7, 1.8, 10.4, 10.5_

- [x] 16. Implement create screen
  - Create `src/features/review-schedules/create.tsx`
  - Add page title "Tạo lịch phê duyệt mới"
  - Integrate ReviewScheduleForm component in create mode
  - Wire up useCreateReviewSchedule mutation
  - Implement form submission with validation
  - Handle API errors with toast notifications in Vietnamese
  - Display success toast "Tạo lịch phê duyệt thành công" on success
  - Navigate to detail page after successful creation
  - Implement cancel navigation with unsaved changes check
  - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 12.2, 13.1_

- [x] 17. Implement edit screen
  - Create `src/features/review-schedules/edit.tsx`
  - Add page title "Chỉnh sửa lịch phê duyệt"
  - Extract ID from route params
  - Wire up useReviewSchedule hook to fetch schedule details
  - Handle loading state while fetching
  - Handle not found error (404) with Vietnamese message
  - Integrate ReviewScheduleForm component in edit mode with defaultValues
  - Implement deadline extension validation (only allow extending for active schedules)
  - Make form read-only for COMPLETED schedules
  - Wire up useUpdateReviewSchedule mutation
  - Implement form submission with validation
  - Handle API errors with toast notifications in Vietnamese
  - Display success toast "Cập nhật lịch phê duyệt thành công" on success
  - Send notifications to affected reviewers when deadlines are extended
  - Navigate to detail page after successful update
  - Implement unsaved changes detection with useFormDirty hook
  - Show confirmation dialog on navigation attempt with unsaved changes
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 12.2, 13.2_

- [x] 18. Implement detail screen
  - Create `src/features/review-schedules/detail.tsx`
  - Add page title with schedule name
  - Display schedule information section (dates, semester, status)
  - Integrate ProgressDashboard component
  - Integrate ReviewerAssignment component
  - Display deadline alert configuration
  - Integrate AuditTrail component
  - Add quick action buttons: Edit Schedule, Assign Reviewers, Send Reminder, Export Report
  - Wire up useReviewSchedule hook to fetch details
  - Wire up useProgressStatistics hook with auto-refresh
  - Handle loading state while fetching
  - Handle not found error (404) with Vietnamese message
  - Implement send reminder action with confirmation
  - Implement export report action with format selection
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

- [x] 19. Implement reviewer assignment functionality
  - Add assignment modal to detail screen
  - Fetch available reviewers using API
  - Display reviewer information (name, role, current workload)
  - Wire up useAssignReviewer mutation
  - Validate that primary and backup reviewers are different
  - Send notification to assigned reviewer on success
  - Display success toast "Phân công người phê duyệt thành công"
  - Refresh assignments list after successful assignment
  - Implement edit assignment functionality
  - Implement remove assignment with confirmation
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 13.3_

- [x] 20. Implement send reminder functionality
  - Add send reminder button to detail screen
  - Show confirmation modal with list of reviewers who will receive reminder
  - Allow selecting specific reviewers or send to all
  - Wire up sendReminders API call
  - Display success toast "Đã gửi nhắc nhở đến người phê duyệt"
  - Handle errors with appropriate Vietnamese messages
  - Log reminder sends in audit trail
  - _Requirements: 7.4, 7.8, 13.5_

- [x] 21. Implement export report functionality
  - Add export report button to detail screen
  - Show format selection modal (PDF or Excel)
  - Wire up exportReport API call
  - Generate report with: Schedule details, Progress statistics, Department breakdown, Reviewer performance, Overdue items
  - Apply university branding for PDF format
  - Create multiple sheets for Excel format
  - Handle download automatically
  - Display error toast if generation fails
  - Log export in audit trail
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

- [x] 22. Implement status calculation logic
  - Create utility function to calculate schedule status based on dates and progress
  - UPCOMING: Before review start date
  - ACTIVE: Between start and final approval date
  - COMPLETED: After final approval date with all reviews done
  - OVERDUE: After final approval date with pending reviews
  - Apply status calculation in list and detail views
  - Update status badge colors accordingly
  - _Requirements: 10.6_

- [x] 23. Set up routing
  - Create `src/routes/_authenticated/review-schedules/index.tsx` for list route
  - Create `src/routes/_authenticated/review-schedules/create.tsx` for create route
  - Create `src/routes/_authenticated/review-schedules/edit.$id.tsx` for edit route with ID param
  - Create `src/routes/_authenticated/review-schedules/detail.$id.tsx` for detail route with ID param
  - Import and render feature components in each route
  - Ensure routes are under `_authenticated` layout for auth protection
  - Add role check for Academic Manager role
  - Test navigation between routes
  - _Requirements: 1.1, 2.1, 6.1, 8.1_

- [x] 24. Implement toast notifications
  - Ensure toast notifications use Vietnamese messages throughout
  - Configure toast auto-dismiss duration (3-5 seconds)
  - Verify success toasts: create, update, delete, assign reviewer, send reminder
  - Verify error toasts: API failures, validation errors, permission errors
  - Implement toast queuing for multiple operations
  - Use appropriate colors: green for success, red for error, yellow for warning
  - Include relevant icons in toast messages
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8_

- [x] 25. Add sidebar navigation entry
  - Add "Lịch phê duyệt" entry to sidebar navigation
  - Use appropriate icon (e.g., Calendar or CalendarCheck from Lucide)
  - Link to `/review-schedules` route
  - Position appropriately in navigation menu (under Academic Management section)
  - Show only for users with Academic Manager role
  - _Requirements: 1.1_

- [x] 26. Implement error handling
  - Add error boundaries for component-level errors
  - Implement API error handling with Vietnamese messages
  - Handle validation errors with field-level display
  - Handle network errors with retry options
  - Handle permission errors (403) with appropriate messages
  - Handle 404 errors for not found schedules
  - Handle 409 errors for duplicate schedules
  - Handle business rule violations (cannot delete active schedule, cannot shorten deadlines)
  - Log all errors to console for debugging
  - _Requirements: 9.4, 9.5, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_

- [x] 27. Implement deadline validation against submission periods
  - Fetch submission period end date for selected semester
  - Validate that review start date is after submission end date
  - Display error if dates conflict
  - Show warning if dates are very close (less than 3 days gap)
  - _Requirements: 3.1_

- [x] 28. Implement automated deadline alerts (backend coordination)
  - Coordinate with backend team on alert scheduling
  - Ensure alert configuration is properly saved
  - Test that alerts are sent at configured thresholds
  - Verify email and in-app notification delivery
  - Test overdue alert functionality
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

- [x] 29. Implement progress auto-refresh
  - Configure useProgressStatistics hook to refresh every 60 seconds
  - Add visual indicator when data is refreshing
  - Implement manual refresh button
  - Handle refresh errors gracefully
  - Pause auto-refresh when user is inactive
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.8_

- [x] 30. Final checkpoint - End-to-end verification
  - Verify complete user flows: create, edit, view, assign reviewers, send reminders, export report
  - Verify all Vietnamese labels and messages are correct
  - Test responsive design on mobile and desktop
  - Verify loading, error, and empty states
  - Verify all toast notifications work correctly
  - Test unsaved changes protection
  - Verify date validation and deadline extension logic
  - Test reviewer assignment and removal
  - Verify progress tracking and auto-refresh
  - Test export functionality (PDF and Excel)
  - Verify audit trail completeness
  - Test deadline alert configuration
  - Ensure all functionality works as expected, ask the user if questions arise

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- All Vietnamese text should be verified by a native speaker if possible
- Consider extracting Vietnamese strings to a localization file for maintainability
- The implementation follows existing project patterns from academic-years feature
- Progress auto-refresh is critical for monitoring - implement early and test thoroughly
- Deadline validation is complex - allocate sufficient time for testing edge cases
- Export functionality may require backend support - coordinate with backend team
- Automated alerts require backend cron jobs - coordinate implementation timeline
