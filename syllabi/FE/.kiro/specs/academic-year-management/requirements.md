# Requirements Document: Academic Year Management

## Introduction

The Academic Year Management feature provides administrators with the ability to create, view, edit, and manage academic years within a React-based admin dashboard. This feature enables tracking of academic periods with proper validation, status management, and a user-friendly Vietnamese interface.

## Glossary

- **Academic_Year**: A time period representing one academic year, identified by a unique code (e.g., 2025-2026)
- **Academic_Year_Code**: A unique identifier in the format YYYY-YYYY where the second year equals the first year plus one
- **Status**: The operational state of an academic year (ACTIVE or DISABLED)
- **System**: The Academic Year Management feature within the admin dashboard
- **Administrator**: A user with permissions to manage academic years
- **Soft_Disable**: Marking an academic year as DISABLED without deleting it from the database

## Requirements

### Requirement 1: List Academic Years

**User Story:** As an administrator, I want to view all academic years in a table, so that I can see an overview of all academic periods in the system.

#### Acceptance Criteria

1. WHEN an administrator navigates to the academic years page, THE System SHALL display a page with the title "Năm học"
2. WHEN the academic years list is loading, THE System SHALL display a loading state indicator
3. WHEN no academic years exist, THE System SHALL display an empty state message
4. WHEN academic years exist, THE System SHALL display them in a table with columns: No., Mã năm học, Tên/Nhãn, Ngày bắt đầu, Ngày kết thúc, Trạng thái, Ngày tạo, Ngày cập nhật, and Hành động
5. WHEN displaying the table, THE System SHALL number rows sequentially starting from 1
6. WHEN the API request fails, THE System SHALL display an error state with an appropriate message
7. WHEN more than one page of results exists, THE System SHALL display pagination controls
8. WHEN displaying dates, THE System SHALL format them according to Vietnamese locale conventions

### Requirement 2: Add New Academic Year

**User Story:** As an administrator, I want to create a new academic year, so that I can define new academic periods in the system.

#### Acceptance Criteria

1. WHEN an administrator clicks the "Add Academic Year" button, THE System SHALL navigate to the add academic year form
2. WHEN the add form is displayed, THE System SHALL show fields for Mã năm học, Tên/Nhãn, Ngày bắt đầu, Ngày kết thúc, and Trạng thái
3. WHEN an administrator submits the form with valid data, THE System SHALL create the academic year and display a success toast message
4. WHEN an academic year is successfully created, THE System SHALL redirect to the academic years list page
5. WHEN an administrator clicks Cancel, THE System SHALL return to the list page without saving
6. WHEN the form is submitted, THE System SHALL validate all required fields are present
7. WHEN the Status field is not provided, THE System SHALL default it to ACTIVE

### Requirement 3: Validate Academic Year Code

**User Story:** As an administrator, I want the system to validate academic year codes, so that only properly formatted and unique codes are accepted.

#### Acceptance Criteria

1. WHEN an administrator enters an Academic Year Code, THE System SHALL validate it matches the pattern YYYY-YYYY
2. WHEN validating the code format, THE System SHALL ensure the second year equals the first year plus one
3. WHEN an administrator enters a duplicate Academic Year Code, THE System SHALL prevent submission and display an error message
4. WHEN the Academic Year Code is invalid, THE System SHALL display a field-level error message in Vietnamese
5. THE System SHALL enforce uniqueness of Academic Year Codes across all academic years

### Requirement 4: Validate Date Ranges

**User Story:** As an administrator, I want the system to validate date ranges, so that academic years have logical start and end dates.

#### Acceptance Criteria

1. WHEN an administrator selects dates, THE System SHALL validate that Ngày kết thúc is after Ngày bắt đầu
2. WHEN the end date is not after the start date, THE System SHALL display a field-level error message
3. WHEN both start and end dates are required fields, THE System SHALL prevent submission if either is missing
4. WHEN date validation fails, THE System SHALL display error messages in Vietnamese

### Requirement 5: Edit Academic Year

**User Story:** As an administrator, I want to edit existing academic years, so that I can update academic period information when needed.

#### Acceptance Criteria

1. WHEN an administrator clicks the Edit action for an academic year, THE System SHALL navigate to the edit form
2. WHEN the edit form loads, THE System SHALL populate all fields with the current academic year data
3. WHEN displaying the edit form, THE System SHALL make the Academic Year Code read-only
4. WHEN an administrator modifies Tên/Nhãn, Ngày bắt đầu, or Ngày kết thúc, THE System SHALL allow those changes
5. WHEN an administrator saves valid changes, THE System SHALL update the academic year and display a success toast
6. WHEN an academic year is successfully updated, THE System SHALL redirect to the list page
7. WHEN an administrator has unsaved changes and attempts to navigate away, THE System SHALL display a confirmation dialog
8. WHEN an administrator clicks Cancel with unsaved changes, THE System SHALL prompt for confirmation before discarding

### Requirement 6: Disable and Enable Academic Years

**User Story:** As an administrator, I want to disable or enable academic years, so that I can control which academic periods are active without deleting data.

#### Acceptance Criteria

1. WHEN an academic year has status ACTIVE, THE System SHALL display a "Disable" action in the row actions
2. WHEN an academic year has status DISABLED, THE System SHALL display an "Enable" action in the row actions
3. WHEN an administrator clicks Disable, THE System SHALL display a confirmation modal with Vietnamese text
4. WHEN an administrator confirms disable, THE System SHALL update the status to DISABLED
5. WHEN an administrator clicks Enable, THE System SHALL display a confirmation modal with Vietnamese text
6. WHEN an administrator confirms enable, THE System SHALL update the status to ACTIVE
7. IF an academic year is currently in use, THEN THE System SHALL prevent disabling and display an error message
8. WHEN a status change succeeds, THE System SHALL display a success toast and refresh the list

### Requirement 7: Search and Filter Academic Years

**User Story:** As an administrator, I want to search and filter academic years, so that I can quickly find specific academic periods.

#### Acceptance Criteria

1. WHERE a search box is implemented, THE System SHALL filter academic years by code or name as the user types
2. WHERE a status filter is implemented, THE System SHALL provide options for All, Active, and Disabled
3. WHEN a status filter is applied, THE System SHALL display only academic years matching that status
4. WHEN search or filter criteria change, THE System SHALL update the table results immediately
5. WHEN no results match the search or filter, THE System SHALL display an appropriate empty state message

### Requirement 8: Sort Academic Years

**User Story:** As an administrator, I want academic years sorted by start date, so that I can see the most recent academic periods first.

#### Acceptance Criteria

1. WHERE sorting is implemented, THE System SHALL sort academic years by Ngày bắt đầu in descending order by default
2. WHERE column sorting is enabled, THE System SHALL allow administrators to sort by clicking column headers
3. WHEN a sort order is applied, THE System SHALL display a visual indicator of the current sort column and direction

### Requirement 9: Handle API Errors Gracefully

**User Story:** As an administrator, I want clear error messages when operations fail, so that I understand what went wrong and can take corrective action.

#### Acceptance Criteria

1. WHEN any API request fails, THE System SHALL display an error message in Vietnamese
2. WHEN a create or update operation fails due to validation, THE System SHALL display field-level errors
3. WHEN a create or update operation fails due to server error, THE System SHALL display a toast notification with the error
4. WHEN a disable operation fails because the academic year is in use, THE System SHALL display a specific error message explaining why
5. WHEN the list fails to load, THE System SHALL display an error state with a retry option

### Requirement 10: Auto-generate Academic Year Label

**User Story:** As an administrator, I want the system to auto-generate a label from the code, so that I can save time when the label matches the code.

#### Acceptance Criteria

1. WHERE label auto-generation is implemented, WHEN an administrator enters a valid Academic Year Code, THE System SHALL suggest a label based on the code
2. WHERE label auto-generation is implemented, THE System SHALL allow administrators to override the suggested label
3. WHERE label auto-generation is implemented, THE System SHALL update the suggested label when the code changes

### Requirement 11: Manage Form State

**User Story:** As an administrator, I want the system to track form changes, so that I don't accidentally lose unsaved work.

#### Acceptance Criteria

1. WHEN an administrator modifies any form field, THE System SHALL mark the form as having unsaved changes
2. WHEN an administrator attempts to navigate away with unsaved changes, THE System SHALL display a confirmation dialog
3. WHEN an administrator confirms navigation, THE System SHALL discard changes and navigate
4. WHEN an administrator cancels navigation, THE System SHALL remain on the form with changes intact
5. WHEN form data is successfully saved, THE System SHALL clear the unsaved changes flag

### Requirement 12: Display Success Feedback

**User Story:** As an administrator, I want confirmation when operations succeed, so that I know my actions were completed successfully.

#### Acceptance Criteria

1. WHEN an academic year is created successfully, THE System SHALL display a success toast message in Vietnamese
2. WHEN an academic year is updated successfully, THE System SHALL display a success toast message in Vietnamese
3. WHEN an academic year status is changed successfully, THE System SHALL display a success toast message in Vietnamese
4. WHEN a success toast is displayed, THE System SHALL automatically dismiss it after a reasonable duration
