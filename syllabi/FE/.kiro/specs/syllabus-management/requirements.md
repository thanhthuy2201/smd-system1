# Requirements Document: Syllabus Management

## Introduction

The Syllabus Management feature provides lecturers and administrators with the ability to create, view, edit, submit, and manage course syllabi within the SMD (Syllabus Management and Digitalization) system. This feature is the core of the academic workflow, enabling systematic syllabus creation, review, and approval processes.

## Glossary

- **Syllabus**: A comprehensive document outlining course objectives, content, schedule, assessment methods, and learning outcomes
- **Course_Code**: A unique identifier for a course (e.g., CS101, MATH201)
- **Version**: A specific iteration of a syllabus (e.g., v1.0, v2.0)
- **Status**: The current state of a syllabus (DRAFT, PENDING, APPROVED, REJECTED, REVISION_REQUIRED)
- **Lecturer**: The primary author and owner of a syllabus
- **HoD**: Head of Department - First-level reviewer
- **Academic_Manager**: Second-level reviewer (Academic Affairs)
- **PLO**: Program Learning Outcome - Learning objectives at program level
- **CLO**: Course Learning Outcome - Learning objectives at course level
- **Submission_Period**: Time window when syllabi can be submitted for review

## Requirements

### Requirement 1: List Syllabi

**User Story:** As a lecturer, I want to view all my syllabi in a table, so that I can see an overview of all courses I'm teaching.

#### Acceptance Criteria

1. WHEN a lecturer navigates to the syllabi page, THE System SHALL display a page with the title "Danh sách Đề cương"
2. WHEN the syllabi list is loading, THE System SHALL display a loading state indicator
3. WHEN no syllabi exist, THE System SHALL display an empty state message "Chưa có đề cương nào"
4. WHEN syllabi exist, THE System SHALL display them in a table with columns: No., Mã môn học, Tên môn học, Phiên bản, Trạng thái, Cập nhật lần cuối, and Hành động
5. WHEN displaying the table, THE System SHALL number rows sequentially starting from 1
6. WHEN the API request fails, THE System SHALL display an error state with an appropriate message
7. WHEN more than one page of results exists, THE System SHALL display pagination controls
8. WHEN displaying dates, THE System SHALL format them according to Vietnamese locale conventions (dd/MM/yyyy)

### Requirement 2: Create New Syllabus

**User Story:** As a lecturer, I want to create a new syllabus, so that I can define course content and structure.

#### Acceptance Criteria

1. WHEN a lecturer clicks the "Tạo đề cương mới" button, THE System SHALL navigate to the create syllabus form
2. WHEN the create form is displayed, THE System SHALL show sections for: Course Information, Learning Outcomes, Course Content, Assessment Methods, and Resources
3. WHEN a lecturer submits the form with valid data, THE System SHALL create the syllabus with status DRAFT
4. WHEN a syllabus is successfully created, THE System SHALL display a success toast message "Tạo đề cương thành công"
5. WHEN a syllabus is successfully created, THE System SHALL redirect to the syllabus detail/edit page
6. WHEN a lecturer clicks Cancel, THE System SHALL return to the list page without saving
7. WHEN the form is submitted, THE System SHALL validate all required fields are present
8. WHEN creating a syllabus, THE System SHALL auto-assign the current user as the author

### Requirement 3: Validate Course Information

**User Story:** As a lecturer, I want the system to validate course information, so that only properly formatted data is accepted.

#### Acceptance Criteria

1. WHEN a lecturer enters a Course Code, THE System SHALL validate it matches the pattern [A-Z]{2,4}[0-9]{3,4}
2. WHEN a lecturer enters a duplicate Course Code for the same semester, THE System SHALL prevent submission and display an error message
3. WHEN required fields are missing, THE System SHALL display field-level error messages in Vietnamese
4. WHEN Credit Hours is entered, THE System SHALL validate it is between 1 and 10
5. WHEN Contact Hours is entered, THE System SHALL validate it is greater than or equal to Credit Hours
6. THE System SHALL enforce uniqueness of Course Code + Version + Semester combination

### Requirement 4: Edit Syllabus

**User Story:** As a lecturer, I want to edit my draft syllabi, so that I can update course information before submission.

#### Acceptance Criteria

1. WHEN a lecturer clicks the Edit action for a DRAFT syllabus, THE System SHALL navigate to the edit form
2. WHEN the edit form loads, THE System SHALL populate all fields with the current syllabus data
3. WHEN displaying the edit form for DRAFT status, THE System SHALL allow editing all fields
4. WHEN displaying the edit form for APPROVED status, THE System SHALL make all fields read-only
5. WHEN a lecturer saves valid changes, THE System SHALL update the syllabus and display a success toast
6. WHEN a syllabus is successfully updated, THE System SHALL remain on the edit page
7. WHEN a lecturer has unsaved changes and attempts to navigate away, THE System SHALL display a confirmation dialog
8. WHEN auto-save is enabled, THE System SHALL save draft changes every 30 seconds

### Requirement 5: Submit Syllabus for Review

**User Story:** As a lecturer, I want to submit my syllabus for review, so that it can be approved by department heads and academic affairs.

#### Acceptance Criteria

1. WHEN a syllabus has status DRAFT, THE System SHALL display a "Submit for Review" button
2. WHEN a lecturer clicks Submit for Review, THE System SHALL validate all required sections are complete
3. WHEN validation passes, THE System SHALL display a confirmation modal with submission details
4. WHEN a lecturer confirms submission, THE System SHALL change status to PENDING and create a review request
5. WHEN submission is successful, THE System SHALL display a success toast "Đã gửi đề cương để phê duyệt"
6. WHEN submission is outside the submission period, THE System SHALL prevent submission and display an error message
7. WHEN a syllabus is submitted, THE System SHALL send notifications to assigned reviewers
8. WHEN a syllabus is submitted, THE System SHALL lock editing until review is complete

### Requirement 6: View Syllabus Details

**User Story:** As a user, I want to view complete syllabus details, so that I can review all course information.

#### Acceptance Criteria

1. WHEN a user clicks on a syllabus row, THE System SHALL navigate to the syllabus detail page
2. WHEN the detail page loads, THE System SHALL display all syllabus sections in a readable format
3. WHEN viewing details, THE System SHALL show version history if multiple versions exist
4. WHEN viewing details, THE System SHALL display approval status and reviewer comments
5. WHEN viewing details, THE System SHALL show CLO-PLO mapping in a matrix format
6. WHEN viewing details, THE System SHALL provide a "Download PDF" button
7. WHEN viewing details, THE System SHALL show last modified date and author information
8. WHEN viewing an approved syllabus, THE System SHALL display approval date and approver names

### Requirement 7: Manage Syllabus Versions

**User Story:** As a lecturer, I want to create new versions of approved syllabi, so that I can update course content while maintaining history.

#### Acceptance Criteria

1. WHEN viewing an APPROVED syllabus, THE System SHALL display a "Create New Version" button
2. WHEN a lecturer clicks Create New Version, THE System SHALL duplicate the current syllabus with incremented version number
3. WHEN a new version is created, THE System SHALL set status to DRAFT
4. WHEN a new version is created, THE System SHALL mark previous version as is_current = false
5. WHEN viewing version history, THE System SHALL display all versions in chronological order
6. WHEN comparing versions, THE System SHALL highlight differences between versions
7. WHEN a new version is approved, THE System SHALL automatically archive the previous version
8. THE System SHALL maintain a complete audit trail of all version changes

### Requirement 8: Filter and Search Syllabi

**User Story:** As a user, I want to filter and search syllabi, so that I can quickly find specific courses.

#### Acceptance Criteria

1. WHERE a search box is implemented, THE System SHALL filter syllabi by course code or course name
2. WHERE a status filter is implemented, THE System SHALL provide options for All, Draft, Pending, Approved, Rejected
3. WHERE a semester filter is implemented, THE System SHALL filter by academic year and semester
4. WHEN search or filter criteria change, THE System SHALL update the table results immediately
5. WHEN no results match the search or filter, THE System SHALL display an appropriate empty state message
6. WHERE an author filter is implemented (for admin), THE System SHALL filter by lecturer name
7. WHEN filters are applied, THE System SHALL update the URL query parameters
8. WHEN the page loads with query parameters, THE System SHALL apply those filters automatically

### Requirement 9: Manage CLO-PLO Mapping

**User Story:** As a lecturer, I want to map Course Learning Outcomes to Program Learning Outcomes, so that course alignment with program goals is documented.

#### Acceptance Criteria

1. WHEN editing a syllabus, THE System SHALL provide a CLO-PLO mapping interface
2. WHEN adding a CLO, THE System SHALL allow selection of one or more related PLOs
3. WHEN displaying the mapping, THE System SHALL show a matrix with CLOs as rows and PLOs as columns
4. WHEN a mapping is created, THE System SHALL mark the intersection with a checkmark or indicator
5. WHEN saving the syllabus, THE System SHALL validate that each CLO maps to at least one PLO
6. WHEN viewing the mapping, THE System SHALL display PLO descriptions on hover
7. THE System SHALL support mapping strength indicators (Strong, Moderate, Weak)
8. THE System SHALL calculate and display PLO coverage percentage

### Requirement 10: Handle Review Feedback

**User Story:** As a lecturer, I want to view and respond to review feedback, so that I can address reviewer concerns and resubmit.

#### Acceptance Criteria

1. WHEN a syllabus is REJECTED or REVISION_REQUIRED, THE System SHALL display reviewer comments
2. WHEN viewing feedback, THE System SHALL show comments organized by section
3. WHEN viewing feedback, THE System SHALL display reviewer name and review date
4. WHEN a syllabus requires revision, THE System SHALL unlock editing
5. WHEN a lecturer addresses feedback, THE System SHALL allow resubmission
6. WHEN resubmitting, THE System SHALL require a response comment explaining changes made
7. WHEN resubmitted, THE System SHALL notify the same reviewers
8. THE System SHALL maintain a complete history of all review cycles

### Requirement 11: Export Syllabus

**User Story:** As a user, I want to export syllabi to PDF, so that I can share or print course information.

#### Acceptance Criteria

1. WHEN viewing a syllabus, THE System SHALL provide an "Export to PDF" button
2. WHEN a user clicks Export to PDF, THE System SHALL generate a formatted PDF document
3. WHEN generating PDF, THE System SHALL include all syllabus sections and metadata
4. WHEN generating PDF, THE System SHALL apply university branding and formatting
5. WHEN PDF generation is complete, THE System SHALL automatically download the file
6. WHEN PDF generation fails, THE System SHALL display an error message
7. THE System SHALL include approval stamps and signatures on approved syllabi
8. THE System SHALL support exporting multiple syllabi as a ZIP file

### Requirement 12: Manage Assessment Methods

**User Story:** As a lecturer, I want to define assessment methods and weights, so that students understand how they will be evaluated.

#### Acceptance Criteria

1. WHEN editing a syllabus, THE System SHALL provide an assessment methods section
2. WHEN adding an assessment, THE System SHALL require: Type, Description, Weight (%), and CLO mapping
3. WHEN entering weights, THE System SHALL validate that total weight equals 100%
4. WHEN saving assessments, THE System SHALL validate that each CLO is assessed at least once
5. THE System SHALL support common assessment types: Exam, Quiz, Assignment, Project, Presentation, Participation
6. WHEN displaying assessments, THE System SHALL show which CLOs each assessment evaluates
7. THE System SHALL calculate and display assessment distribution by type
8. THE System SHALL warn if any assessment weight exceeds 50%

### Requirement 13: Handle API Errors Gracefully

**User Story:** As a user, I want clear error messages when operations fail, so that I understand what went wrong and can take corrective action.

#### Acceptance Criteria

1. WHEN any API request fails, THE System SHALL display an error message in Vietnamese
2. WHEN a create or update operation fails due to validation, THE System SHALL display field-level errors
3. WHEN a create or update operation fails due to server error, THE System SHALL display a toast notification with the error
4. WHEN a submission fails because the period is closed, THE System SHALL display a specific error message
5. WHEN the list fails to load, THE System SHALL display an error state with a retry option
6. WHEN a network error occurs, THE System SHALL display "Lỗi kết nối mạng. Vui lòng thử lại."
7. WHEN a 403 error occurs, THE System SHALL display "Bạn không có quyền thực hiện thao tác này"
8. THE System SHALL log all errors to the console for debugging purposes

### Requirement 14: Auto-save Draft Changes

**User Story:** As a lecturer, I want my draft changes to be automatically saved, so that I don't lose work if my session is interrupted.

#### Acceptance Criteria

1. WHEN editing a DRAFT syllabus, THE System SHALL auto-save changes every 30 seconds
2. WHEN auto-save is triggered, THE System SHALL save without user interaction
3. WHEN auto-save succeeds, THE System SHALL display a subtle indicator "Đã lưu tự động"
4. WHEN auto-save fails, THE System SHALL display a warning and retry
5. WHEN navigating away, THE System SHALL perform a final auto-save
6. WHEN returning to a draft, THE System SHALL load the most recent auto-saved version
7. THE System SHALL not auto-save if no changes have been made
8. THE System SHALL disable auto-save for non-DRAFT syllabi

### Requirement 15: Display Success Feedback

**User Story:** As a user, I want confirmation when operations succeed, so that I know my actions were completed successfully.

#### Acceptance Criteria

1. WHEN a syllabus is created successfully, THE System SHALL display a success toast "Tạo đề cương thành công"
2. WHEN a syllabus is updated successfully, THE System SHALL display a success toast "Cập nhật đề cương thành công"
3. WHEN a syllabus is submitted successfully, THE System SHALL display a success toast "Đã gửi đề cương để phê duyệt"
4. WHEN a syllabus is deleted successfully, THE System SHALL display a success toast "Đã xóa đề cương"
5. WHEN a success toast is displayed, THE System SHALL automatically dismiss it after 3-5 seconds
6. WHEN multiple operations succeed in sequence, THE System SHALL queue toast messages
7. THE System SHALL use green color scheme for success messages
8. THE System SHALL include relevant icons in toast messages
