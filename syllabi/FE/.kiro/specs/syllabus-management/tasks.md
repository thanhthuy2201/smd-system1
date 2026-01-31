# Implementation Plan: Syllabus Management

## Overview

This implementation plan breaks down the Syllabus Management feature into discrete, incremental coding tasks. The feature will be built using React 19 with TypeScript, following the existing project structure and patterns (TanStack Router, TanStack Query, React Hook Form with Zod, Shadcn UI components).

The implementation follows a bottom-up approach: data layer → API client → shared components → screens → routing → testing.

## Tasks

- [ ] 1. Set up feature structure and data models
  - Update `src/features/syllabus/data/schema.ts` with complete Zod schemas and TypeScript types
  - Define `Syllabus`, `SyllabusStatus`, `SyllabusFormInput`, `CourseLearningOutcome`, `CLOPLOMapping`, `WeeklyContent`, `AssessmentMethod`, `Resource` types
  - Implement validation schemas: `courseCodeSchema`, `creditHoursSchema`, `cloSchema`, `assessmentSchema`, `syllabusFormSchema`
  - Add validation for assessment weight totals and CLO-PLO mappings
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 12.3_

- [ ] 2. Implement API client and TanStack Query hooks
  - Create `src/features/syllabus/data/api.ts` with API client functions
  - Implement: `list()`, `getById()`, `create()`, `update()`, `delete()`, `submit()`, `createVersion()`, `getVersionHistory()`, `compareVersions()`, `exportPDF()`, `checkCourseCodeUniqueness()`
  - Create `src/features/syllabus/hooks/use-syllabi.ts` with `useSyllabi` hook
  - Create `src/features/syllabus/hooks/use-syllabus.ts` with `useSyllabus` hook
  - Create `src/features/syllabus/hooks/use-syllabus-mutations.ts` with mutation hooks
  - Implement: `useCreateSyllabus`, `useUpdateSyllabus`, `useDeleteSyllabus`, `useSubmitSyllabus`, `useCreateVersion`
  - Configure cache invalidation strategies
  - _Requirements: 1.1, 2.3, 4.5, 5.4, 7.2, 11.2_

- [ ] 3. Create shared UI components
  - Update `src/features/syllabus/components/status-badge.tsx` for all status types
  - Implement color coding: blue for DRAFT, yellow for PENDING, green for APPROVED, red for REJECTED, orange for REVISION_REQUIRED
  - Use Vietnamese labels: "Bản nháp", "Chờ phê duyệt", "Đã phê duyệt", "Từ chối", "Yêu cầu chỉnh sửa"
  - _Requirements: 1.4_

- [ ] 4. Implement auto-save hook
  - Create `src/features/syllabus/hooks/use-auto-save.ts`
  - Implement auto-save logic that triggers every 30 seconds
  - Add debouncing to prevent excessive API calls
  - Display auto-save status indicator
  - Handle auto-save errors gracefully
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8_

- [ ] 5. Implement form dirty tracking hook
  - Update `src/features/syllabus/hooks/use-form-dirty.ts` if not exists, create it
  - Implement `useFormDirty` hook with browser beforeunload event handling
  - Implement navigation guard with confirmation dialog state management
  - _Requirements: 4.7_

- [ ] 6. Create course information section component
  - Create `src/features/syllabus/components/course-info-section.tsx`
  - Implement form fields: Course Code, Course Name, Semester, Academic Year, Credit Hours, Contact Hours, Description
  - Add Prerequisites and Corequisites multi-select fields
  - Implement Vietnamese labels and placeholders
  - Implement field-level error display in Vietnamese
  - Add course code uniqueness validation
  - _Requirements: 2.2, 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 7. Create learning outcomes section component
  - Create `src/features/syllabus/components/learning-outcomes-section.tsx`
  - Implement CLO list with add/edit/delete functionality
  - Add Bloom's Taxonomy level selector for each CLO
  - Implement CLO code auto-generation (CLO1, CLO2, etc.)
  - Add validation for minimum 3 CLOs
  - _Requirements: 2.2, 9.2_

- [ ] 8. Create CLO-PLO mapping matrix component
  - Create `src/features/syllabus/components/clo-plo-matrix.tsx`
  - Implement matrix UI with CLOs as rows and PLOs as columns
  - Add checkboxes or strength indicators for mappings
  - Display PLO descriptions on hover
  - Calculate and display PLO coverage percentage
  - Validate that each CLO maps to at least one PLO
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

- [ ] 9. Create course content section component
  - Create `src/features/syllabus/components/content-section.tsx`
  - Implement weekly schedule table (16 weeks)
  - Add fields for each week: Topics, CLOs Covered, Teaching Methods, Readings
  - Implement add/remove week functionality
  - Validate minimum 12 weeks required
  - _Requirements: 2.2_

- [ ] 10. Create assessment methods section component
  - Create `src/features/syllabus/components/assessment-section.tsx`
  - Implement assessment list with add/edit/delete functionality
  - Add fields: Type, Description, Weight (%), CLO mapping, Due Week
  - Display total weight calculation
  - Validate total weight equals 100%
  - Validate each CLO is assessed at least once
  - Show warning if any assessment exceeds 50%
  - _Requirements: 2.2, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_

- [ ] 11. Create resources section component
  - Create `src/features/syllabus/components/resources-section.tsx`
  - Implement textbooks list with add/edit/delete functionality
  - Implement references list with add/edit/delete functionality
  - Add fields: Title, Authors, Publisher, Year, ISBN, URL, Is Required
  - Support different resource types: Textbook, Reference, Online
  - _Requirements: 2.2_

- [ ] 12. Create main syllabus form component
  - Create or update `src/features/syllabus/components/syllabus-form.tsx`
  - Integrate all section components
  - Implement multi-step form navigation (optional) or single-page form
  - Add form-level validation
  - Implement Save Draft and Submit for Review buttons
  - Add Cancel button with unsaved changes confirmation
  - Wire up auto-save functionality
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 4.1, 4.2, 4.3, 4.6, 4.7, 4.8_

- [ ] 13. Update table column definitions
  - Update `src/features/syllabus/components/syllabus-columns.tsx`
  - Define TanStack Table column definitions for all columns
  - Implement Vietnamese column headers
  - Implement date formatting with Vietnamese locale (dd/MM/yyyy)
  - Add row numbering column with sequential numbers
  - Add status column using StatusBadge component
  - Add actions column with Edit, View, Delete, Submit options
  - _Requirements: 1.4, 1.5, 1.8_

- [ ] 14. Create row actions component
  - Update `src/features/syllabus/components/row-actions.tsx`
  - Implement dropdown menu with Edit, View, Delete, Submit, Create Version actions
  - Show Edit only for DRAFT status and own syllabi
  - Show Submit only for DRAFT status with complete data
  - Show Create Version only for APPROVED status
  - Implement confirmation dialog for Delete and Submit actions
  - Handle action errors with Vietnamese messages
  - _Requirements: 2.1, 4.1, 5.1, 5.2, 5.3, 7.1_

- [ ] 15. Implement toolbar component
  - Update `src/features/syllabus/components/toolbar.tsx`
  - Add search input with Vietnamese placeholder "Tìm kiếm theo mã hoặc tên môn học..."
  - Add status filter select with options: "Tất cả", "Bản nháp", "Chờ phê duyệt", "Đã phê duyệt", "Từ chối"
  - Add semester filter select
  - Add academic year filter select
  - Implement debounced search input (300ms delay)
  - Update URL query parameters when filters change
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.7, 8.8_

- [ ] 16. Update syllabus table component
  - Update `src/features/syllabus/components/syllabus-table.tsx`
  - Implement TanStack Table with column definitions
  - Add loading state with skeleton loader
  - Add empty state with Vietnamese message "Chưa có đề cương nào"
  - Add error state with Vietnamese message and retry button
  - Implement pagination with page size options (10, 20, 50, 100)
  - Implement default sort by updatedAt descending
  - Add sort indicators to column headers
  - Wire up row actions (edit, view, delete, submit)
  - _Requirements: 1.2, 1.3, 1.6, 1.7, 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 17. Implement list screen
  - Update `src/features/syllabus/index.tsx`
  - Add page title "Danh sách Đề cương" with description
  - Add "Tạo đề cương mới" button linking to create route
  - Integrate Toolbar component with search and filter state
  - Integrate SyllabusTable component
  - Wire up useSyllabi hook with query params (page, pageSize, search, status, semester, academicYear, sort)
  - Handle loading, error, and empty states
  - Implement navigation to edit/view screens on row actions
  - Implement delete with confirmation and toast notifications
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.7, 8.4, 8.5_

- [ ] 18. Implement create screen
  - Update `src/features/syllabus/create.tsx` or create if not exists
  - Add page title "Tạo đề cương mới"
  - Integrate SyllabusForm component in create mode
  - Wire up useCreateSyllabus mutation
  - Implement form submission with validation
  - Handle API errors with toast notifications in Vietnamese
  - Display success toast "Tạo đề cương thành công" on success
  - Navigate to edit page after successful creation
  - Implement cancel navigation with unsaved changes check
  - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 13.2, 13.3, 15.1_

- [ ] 19. Implement edit screen
  - Update `src/features/syllabus/edit.tsx` or create if not exists
  - Add page title "Chỉnh sửa đề cương"
  - Extract ID from route params
  - Wire up useSyllabus hook to fetch syllabus details
  - Handle loading state while fetching
  - Handle not found error (404) with Vietnamese message
  - Integrate SyllabusForm component in edit mode with defaultValues
  - Wire up useUpdateSyllabus mutation
  - Implement form submission with validation
  - Handle API errors with toast notifications in Vietnamese
  - Display success toast "Cập nhật đề cương thành công" on success
  - Implement auto-save with status indicator
  - Implement unsaved changes detection with useFormDirty hook
  - Show confirmation dialog on navigation attempt with unsaved changes
  - Add Submit for Review button for DRAFT status
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 5.1, 5.2, 5.3, 5.5, 5.6, 5.7, 13.2, 13.3, 14.1-14.8, 15.2_

- [ ] 20. Implement view/detail screen
  - Update `src/features/syllabus/view.tsx` or create if not exists
  - Add page title with course code and name
  - Display all syllabus sections in read-only format
  - Show version history if multiple versions exist
  - Display approval status and reviewer comments
  - Show CLO-PLO mapping matrix
  - Add "Download PDF" button
  - Show last modified date and author information
  - Show approval date and approver names for approved syllabi
  - Add "Create New Version" button for approved syllabi
  - Add "Edit" button for draft syllabi (own syllabi only)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 7.1_

- [ ] 21. Create version history component
  - Create `src/features/syllabus/components/version-history.tsx`
  - Display all versions in chronological order
  - Show version number, status, date, and author for each version
  - Add "View" and "Compare" buttons for each version
  - Highlight current version
  - _Requirements: 6.3, 7.5_

- [ ] 22. Create review feedback component
  - Create `src/features/syllabus/components/review-feedback.tsx`
  - Display reviewer comments organized by section
  - Show reviewer name and review date
  - Display evaluation scores if available
  - Show revision requirements clearly
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 23. Implement version comparison screen
  - Create `src/features/syllabus/compare.tsx`
  - Extract version IDs from route params
  - Fetch both versions using useSyllabus hook
  - Display side-by-side comparison
  - Highlight differences between versions
  - Add navigation back to version history
  - _Requirements: 7.6_

- [ ] 24. Implement submit for review functionality
  - Add submit validation to check all required sections are complete
  - Create confirmation modal with submission details
  - Wire up useSubmitSyllabus mutation
  - Validate submission period is open
  - Handle submission errors (period closed, incomplete data)
  - Display success toast "Đã gửi đề cương để phê duyệt"
  - Lock editing after successful submission
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 15.3_

- [ ] 25. Implement create new version functionality
  - Add "Create New Version" button to view screen for approved syllabi
  - Wire up useCreateVersion mutation
  - Duplicate current syllabus with incremented version number
  - Set new version status to DRAFT
  - Mark previous version as is_current = false
  - Navigate to edit screen for new version
  - Display success toast "Đã tạo phiên bản mới"
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 26. Implement PDF export functionality
  - Add "Export to PDF" button to view screen
  - Wire up exportPDF API call
  - Generate formatted PDF with university branding
  - Include all syllabus sections and metadata
  - Add approval stamps for approved syllabi
  - Handle download automatically
  - Display error toast if generation fails
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [ ] 27. Set up routing
  - Update `src/routes/_authenticated/syllabus/index.tsx` for list route
  - Update `src/routes/_authenticated/syllabus/create.tsx` for create route
  - Update `src/routes/_authenticated/syllabus/edit.$id.tsx` for edit route with ID param
  - Update `src/routes/_authenticated/syllabus/view.$id.tsx` for view route with ID param
  - Create `src/routes/_authenticated/syllabus/compare.$id.tsx` for compare route
  - Import and render feature components in each route
  - Ensure routes are under `_authenticated` layout for auth protection
  - Test navigation between routes
  - _Requirements: 1.1, 2.1, 4.1, 6.1_

- [ ] 28. Implement toast notifications
  - Ensure toast notifications use Vietnamese messages throughout
  - Configure toast auto-dismiss duration (3-5 seconds)
  - Verify success toasts: create, update, submit, delete, create version
  - Verify error toasts: API failures, validation errors, permission errors
  - Implement toast queuing for multiple operations
  - Use appropriate colors: green for success, red for error, yellow for warning
  - Include relevant icons in toast messages
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 29. Update sidebar navigation entry
  - Ensure "Đề cương" entry exists in sidebar navigation
  - Use appropriate icon (e.g., FileText or BookOpen from Lucide)
  - Link to `/syllabus` route
  - Position appropriately in navigation menu
  - _Requirements: 1.1_

- [ ] 30. Implement error handling
  - Add error boundaries for component-level errors
  - Implement API error handling with Vietnamese messages
  - Handle validation errors with field-level display
  - Handle network errors with retry options
  - Handle permission errors with appropriate messages
  - Handle 404 errors for not found syllabi
  - Handle 409 errors for duplicate course codes
  - Log all errors to console for debugging
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8_

- [ ] 31. Final checkpoint - End-to-end verification
  - Verify complete user flows: create, edit, submit, view, version, export
  - Verify all Vietnamese labels and messages are correct
  - Test responsive design on mobile and desktop
  - Verify loading, error, and empty states
  - Verify all toast notifications work correctly
  - Test unsaved changes protection
  - Test auto-save functionality
  - Verify CLO-PLO mapping validation
  - Verify assessment weight validation
  - Test version history and comparison
  - Test PDF export
  - Ensure all functionality works as expected, ask the user if questions arise

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- All Vietnamese text should be verified by a native speaker if possible
- Consider extracting Vietnamese strings to a localization file for maintainability
- The implementation follows existing project patterns from academic-years and tasks features
- Auto-save is critical for user experience - implement early and test thoroughly
- CLO-PLO mapping and assessment validation are complex - allocate sufficient time
- PDF generation may require backend support - coordinate with backend team
