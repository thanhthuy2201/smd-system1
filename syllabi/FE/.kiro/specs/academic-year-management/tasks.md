# Implementation Plan: Academic Year Management

## Overview

This implementation plan breaks down the Academic Year Management feature into discrete, incremental coding tasks. The feature will be built using React 19 with TypeScript, following the existing project structure and patterns (TanStack Router, TanStack Query, React Hook Form with Zod, Shadcn UI components).

The implementation follows a bottom-up approach: data layer → API client → shared components → screens → routing → testing.

## Tasks

- [x] 1. Set up feature structure and data models
  - Create `src/features/academic-years/` directory structure
  - Create `src/features/academic-years/data/schema.ts` with Zod schemas and TypeScript types
  - Define `AcademicYear`, `AcademicYearStatus`, `AcademicYearFormInput` types
  - Implement validation schemas: `academicYearCodeSchema`, `dateRangeSchema`, `academicYearFormSchema`
  - _Requirements: 3.1, 3.2, 4.1_

- [x] 2. Implement API client and TanStack Query hooks
  - Create `src/features/academic-years/data/api.ts` with API client functions
  - Implement: `list()`, `getById()`, `create()`, `update()`, `updateStatus()`, `checkCodeUniqueness()`
  - Create `src/features/academic-years/hooks/use-academic-years.ts` with `useAcademicYears` hook
  - Create `src/features/academic-years/hooks/use-academic-year.ts` with `useAcademicYear` hook
  - Implement mutation hooks: `useCreateAcademicYear`, `useUpdateAcademicYear`, `useUpdateAcademicYearStatus`
  - Configure optimistic updates for status changes
  - _Requirements: 1.1, 2.3, 5.5, 6.4, 6.6_

- [x] 3. Create shared UI components
  - Create `src/features/academic-years/components/status-badge.tsx` for status display
  - Implement color coding: green for ACTIVE, gray for DISABLED
  - Use Vietnamese labels: "Hoạt động" (Active), "Vô hiệu hóa" (Disabled)
  - _Requirements: 1.4_

- [x] 4. Implement form dirty tracking hook
  - Create `src/features/academic-years/hooks/use-form-dirty.ts`
  - Implement `useFormDirty` hook with browser beforeunload event handling
  - Implement navigation guard with confirmation dialog state management
  - _Requirements: 11.1, 11.2, 11.5_

- [x] 5. Create academic year form component
  - Create `src/features/academic-years/components/academic-year-form.tsx`
  - Implement form with React Hook Form and Zod validation
  - Add fields: code (text input), name (text input), startDate (date picker), endDate (date picker), status (select)
  - Implement Vietnamese labels and placeholders
  - Implement field-level error display in Vietnamese
  - Add code read-only logic for edit mode
  - Implement label auto-generation from code (optional feature)
  - Add Save and Cancel buttons
  - _Requirements: 2.2, 3.1, 3.2, 3.4, 4.1, 4.2, 4.4, 5.3, 10.1, 10.3_

- [x] 6. Implement table column definitions
  - Create `src/features/academic-years/components/columns.tsx`
  - Define TanStack Table column definitions for all columns
  - Implement Vietnamese column headers
  - Implement date formatting with Vietnamese locale (dd/MM/yyyy)
  - Add row numbering column with sequential numbers
  - Add status column using StatusBadge component
  - Add actions column placeholder
  - _Requirements: 1.4, 1.5, 1.8_

- [x] 7. Create row actions component
  - Create `src/features/academic-years/components/row-actions.tsx`
  - Implement dropdown menu with Edit, Disable/Enable actions
  - Show "Vô hiệu hóa" (Disable) for ACTIVE status
  - Show "Kích hoạt" (Enable) for DISABLED status
  - Implement confirmation dialog for status changes with Vietnamese text
  - Handle status change with error handling for in-use academic years
  - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.7_

- [x] 8. Implement toolbar component
  - Create `src/features/academic-years/components/toolbar.tsx`
  - Add search input with Vietnamese placeholder "Tìm kiếm..."
  - Add status filter select with options: "Tất cả" (All), "Hoạt động" (Active), "Vô hiệu hóa" (Disabled)
  - Implement debounced search input (300ms delay)
  - _Requirements: 7.1, 7.2_

- [x] 9. Create academic year table component
  - Create `src/features/academic-years/components/academic-year-table.tsx`
  - Implement TanStack Table with column definitions
  - Add loading state with skeleton loader
  - Add empty state with Vietnamese message "Không có năm học nào"
  - Add error state with Vietnamese message and retry button
  - Implement pagination with page size options (10, 20, 50, 100)
  - Implement default sort by startDate descending
  - Add sort indicators to column headers
  - Wire up row actions (edit, status change)
  - _Requirements: 1.2, 1.3, 1.6, 1.7, 8.1, 8.3, 9.5_

- [x] 10. Checkpoint - Verify all components
  - Verify all components render without errors
  - Check that all Vietnamese labels are correct
  - Ensure all tests pass, ask the user if questions arise

- [x] 11. Implement list screen
  - Create `src/features/academic-years/index.tsx`
  - Add page title "Năm học" with Typography component
  - Add "Thêm năm học" (Add Academic Year) button linking to add route
  - Integrate Toolbar component with search and filter state
  - Integrate AcademicYearTable component
  - Wire up useAcademicYears hook with query params (page, pageSize, search, status, sort)
  - Handle loading, error, and empty states
  - Implement navigation to edit screen on row edit action
  - Implement status change with confirmation and toast notifications
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.7, 6.8, 7.4_

- [x] 12. Implement add screen
  - Create `src/features/academic-years/add.tsx`
  - Add page title "Thêm năm học mới" (Add New Academic Year)
  - Integrate AcademicYearForm component in create mode
  - Wire up useCreateAcademicYear mutation
  - Implement form submission with validation
  - Handle API errors with toast notifications in Vietnamese
  - Display success toast "Tạo năm học thành công" on success
  - Navigate to list page after successful creation
  - Implement cancel navigation with unsaved changes check
  - _Requirements: 2.1, 2.3, 2.4, 2.5, 9.2, 9.3, 12.1_

- [x] 13. Implement edit screen
  - Create `src/features/academic-years/edit.tsx`
  - Add page title "Chỉnh sửa năm học" (Edit Academic Year)
  - Extract ID from route params
  - Wire up useAcademicYear hook to fetch academic year details
  - Handle loading state while fetching
  - Handle not found error (404) with Vietnamese message
  - Integrate AcademicYearForm component in edit mode with defaultValues
  - Wire up useUpdateAcademicYear mutation
  - Implement form submission with validation
  - Handle API errors with toast notifications in Vietnamese
  - Display success toast "Cập nhật năm học thành công" on success
  - Navigate to list page after successful update
  - Implement unsaved changes detection with useFormDirty hook
  - Show confirmation dialog on navigation attempt with unsaved changes
  - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.6, 5.7, 5.8, 9.2, 9.3, 11.2, 11.3, 11.4, 12.2_

- [x] 14. Set up routing
  - Create `src/routes/_authenticated/academic-years.index.tsx` for list route
  - Create `src/routes/_authenticated/academic-years.add.tsx` for add route
  - Create `src/routes/_authenticated/academic-years.edit.$id.tsx` for edit route with ID param
  - Import and render feature components in each route
  - Ensure routes are under `_authenticated` layout for auth protection
  - Test navigation between routes
  - _Requirements: 1.1, 2.1, 5.1_

- [x] 15. Implement toast notifications
  - Ensure toast notifications use Vietnamese messages throughout
  - Configure toast auto-dismiss duration (3-5 seconds)
  - Verify success toasts: create, update, status change
  - Verify error toasts: API failures, validation errors
  - _Requirements: 9.1, 9.3, 12.1, 12.2, 12.3, 12.4_

- [x] 16. Add sidebar navigation entry
  - Add "Năm học" (Academic Years) entry to sidebar navigation
  - Use appropriate icon (e.g., Calendar or GraduationCap from Lucide)
  - Link to `/academic-years` route
  - Position appropriately in navigation menu
  - _Requirements: 1.1_

- [ ] 17. Final checkpoint - End-to-end verification
  - Verify complete user flows: create, edit, disable, enable, search, filter, sort
  - Verify all Vietnamese labels and messages are correct
  - Test responsive design on mobile and desktop
  - Verify loading, error, and empty states
  - Verify all toast notifications work correctly
  - Test unsaved changes protection
  - Ensure all functionality works as expected, ask the user if questions arise

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- All Vietnamese text should be verified by a native speaker if possible
- Consider extracting Vietnamese strings to a localization file for maintainability
- The implementation follows existing project patterns from tasks and users features
