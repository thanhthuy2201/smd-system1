# Requirements Document: Review Schedule Management

## Introduction

The Review Schedule Management feature enables Academic Managers to set up review cycles, assign reviewers to departments/programs, and configure approval deadlines. This ensures systematic review of all submitted syllabi according to university timelines.

## Glossary

- **Review_Schedule**: A defined period for reviewing syllabi with specific deadlines
- **Review_Cycle**: A complete review process from submission to final approval
- **L1_Review**: First-level review conducted by Head of Department (HoD)
- **L2_Review**: Second-level review conducted by Academic Affairs (AA)
- **Reviewer_Assignment**: Linking a reviewer to specific departments or programs
- **Deadline**: A specific date by which a review stage must be completed
- **Progress_Tracker**: Visual representation of review completion status

## Requirements

### Requirement 1: List Review Schedules

**User Story:** As an Academic Manager, I want to view all review schedules, so that I can monitor and manage the review process.

#### Acceptance Criteria

1. WHEN an Academic Manager navigates to the review schedules page, THE System SHALL display a page with the title "Lịch phê duyệt đề cương"
2. WHEN the review schedules list is loading, THE System SHALL display a loading state indicator
3. WHEN no review schedules exist, THE System SHALL display an empty state message
4. WHEN review schedules exist, THE System SHALL display them in a table with columns: No., Tên chu kỳ, Học kỳ, Ngày bắt đầu, Hạn L1, Hạn L2, Ngày phê duyệt cuối, Tiến độ, Hành động
5. WHEN displaying the table, THE System SHALL number rows sequentially starting from 1
6. WHEN the API request fails, THE System SHALL display an error state with an appropriate message
7. WHEN displaying dates, THE System SHALL format them according to Vietnamese locale conventions
8. WHEN displaying progress, THE System SHALL show percentage of completed reviews

### Requirement 2: Create Review Schedule

**User Story:** As an Academic Manager, I want to create a new review schedule, so that I can define review periods and deadlines for a semester.

#### Acceptance Criteria

1. WHEN an Academic Manager clicks the "Tạo lịch phê duyệt" button, THE System SHALL navigate to the create review schedule form
2. WHEN the create form is displayed, THE System SHALL show fields for: Review Cycle Name, Semester, Review Start Date, L1 Deadline, L2 Deadline, Final Approval Date
3. WHEN an Academic Manager submits the form with valid data, THE System SHALL create the review schedule
4. WHEN a review schedule is successfully created, THE System SHALL display a success toast message
5. WHEN a review schedule is successfully created, THE System SHALL redirect to the review schedule detail page
6. WHEN an Academic Manager clicks Cancel, THE System SHALL return to the list page without saving
7. WHEN the form is submitted, THE System SHALL validate all required fields are present
8. WHEN the form is submitted, THE System SHALL validate date sequence (Review Start < L1 Deadline < L2 Deadline < Final Approval)

### Requirement 3: Validate Review Schedule Dates

**User Story:** As an Academic Manager, I want the system to validate review schedule dates, so that deadlines are logical and sequential.

#### Acceptance Criteria

1. WHEN entering Review Start Date, THE System SHALL validate it is after the submission end date for the selected semester
2. WHEN entering L1 Deadline, THE System SHALL validate it is after Review Start Date
3. WHEN entering L2 Deadline, THE System SHALL validate it is after L1 Deadline
4. WHEN entering Final Approval Date, THE System SHALL validate it is after L2 Deadline
5. WHEN date validation fails, THE System SHALL display field-level error messages in Vietnamese
6. WHEN dates overlap with existing review schedules for the same semester, THE System SHALL display a warning
7. THE System SHALL validate that all dates are within the selected academic year
8. THE System SHALL validate that deadlines allow reasonable time for review (minimum 7 days between stages)

### Requirement 4: Assign Reviewers to Departments

**User Story:** As an Academic Manager, I want to assign reviewers to departments, so that syllabi are reviewed by appropriate personnel.

#### Acceptance Criteria

1. WHEN viewing a review schedule, THE System SHALL display a reviewer assignment section
2. WHEN clicking "Assign Reviewers", THE System SHALL show a list of departments
3. WHEN selecting a department, THE System SHALL show available reviewers with HoD or AA role
4. WHEN assigning a reviewer, THE System SHALL allow selection of Primary Reviewer and Backup Reviewer
5. WHEN saving assignments, THE System SHALL validate that each department has at least one assigned reviewer
6. WHEN a reviewer is assigned, THE System SHALL send a notification to the reviewer
7. WHEN viewing assignments, THE System SHALL display reviewer name, role, and assigned departments
8. THE System SHALL allow reassignment of reviewers if no reviews have been completed

### Requirement 5: Track Review Progress

**User Story:** As an Academic Manager, I want to track review progress, so that I can identify bottlenecks and follow up on pending reviews.

#### Acceptance Criteria

1. WHEN viewing a review schedule, THE System SHALL display a progress dashboard
2. WHEN displaying progress, THE System SHALL show total syllabi, reviewed, pending, and overdue counts
3. WHEN displaying progress, THE System SHALL show progress by department
4. WHEN displaying progress, THE System SHALL show progress by reviewer
5. WHEN clicking on a progress metric, THE System SHALL filter the syllabus list accordingly
6. WHEN a deadline is approaching (within 3 days), THE System SHALL highlight it in yellow
7. WHEN a deadline has passed, THE System SHALL highlight it in red
8. THE System SHALL calculate and display average review time per syllabus

### Requirement 6: Edit Review Schedule

**User Story:** As an Academic Manager, I want to edit review schedules, so that I can adjust deadlines when necessary.

#### Acceptance Criteria

1. WHEN an Academic Manager clicks the Edit action for a review schedule, THE System SHALL navigate to the edit form
2. WHEN the edit form loads, THE System SHALL populate all fields with current data
3. WHEN editing an active review schedule, THE System SHALL only allow extending deadlines, not shortening them
4. WHEN editing a completed review schedule, THE System SHALL make all fields read-only
5. WHEN an Academic Manager saves valid changes, THE System SHALL update the review schedule
6. WHEN deadlines are extended, THE System SHALL send notifications to affected reviewers
7. WHEN an Academic Manager has unsaved changes and attempts to navigate away, THE System SHALL display a confirmation dialog
8. THE System SHALL maintain an audit trail of all deadline changes

### Requirement 7: Configure Deadline Alerts

**User Story:** As an Academic Manager, I want to configure deadline alerts, so that reviewers are reminded of upcoming deadlines.

#### Acceptance Criteria

1. WHEN creating a review schedule, THE System SHALL provide deadline alert configuration options
2. WHEN configuring alerts, THE System SHALL allow setting reminder thresholds (e.g., 7 days, 3 days, 1 day before deadline)
3. WHEN configuring alerts, THE System SHALL allow selection of notification channels (email, in-app, both)
4. WHEN an alert threshold is reached, THE System SHALL automatically send notifications to reviewers with pending reviews
5. WHEN a deadline passes, THE System SHALL send overdue notifications to reviewers and Academic Manager
6. THE System SHALL allow disabling alerts for specific review schedules
7. THE System SHALL display alert configuration in the review schedule details
8. THE System SHALL log all sent alerts for audit purposes

### Requirement 8: View Review Schedule Details

**User Story:** As an Academic Manager, I want to view complete review schedule details, so that I can monitor all aspects of the review process.

#### Acceptance Criteria

1. WHEN clicking on a review schedule, THE System SHALL navigate to the detail page
2. WHEN the detail page loads, THE System SHALL display all schedule information
3. WHEN viewing details, THE System SHALL show assigned reviewers by department
4. WHEN viewing details, THE System SHALL show progress statistics
5. WHEN viewing details, THE System SHALL show list of syllabi in this review cycle
6. WHEN viewing details, THE System SHALL show deadline alert configuration
7. WHEN viewing details, THE System SHALL show audit trail of changes
8. THE System SHALL provide quick actions: Edit Schedule, Assign Reviewers, Send Reminder

### Requirement 9: Delete Review Schedule

**User Story:** As an Academic Manager, I want to delete review schedules, so that I can remove schedules that were created in error.

#### Acceptance Criteria

1. WHEN an Academic Manager clicks Delete for a review schedule, THE System SHALL display a confirmation dialog
2. WHEN confirming deletion, THE System SHALL validate that no reviews have been completed
3. WHEN validation passes, THE System SHALL soft-delete the review schedule
4. WHEN deletion is successful, THE System SHALL display a success toast
5. WHEN deletion fails because reviews exist, THE System SHALL display an error message explaining why
6. WHEN a schedule is deleted, THE System SHALL send notifications to assigned reviewers
7. THE System SHALL maintain deleted schedules in the database for audit purposes
8. THE System SHALL not allow deletion of active or completed review schedules

### Requirement 10: Filter and Search Review Schedules

**User Story:** As an Academic Manager, I want to filter and search review schedules, so that I can quickly find specific schedules.

#### Acceptance Criteria

1. WHERE a search box is implemented, THE System SHALL filter schedules by review cycle name
2. WHERE a semester filter is implemented, THE System SHALL filter by semester and academic year
3. WHERE a status filter is implemented, THE System SHALL provide options: All, Upcoming, Active, Completed, Overdue
4. WHEN search or filter criteria change, THE System SHALL update the table results immediately
5. WHEN no results match the search or filter, THE System SHALL display an appropriate empty state message
6. THE System SHALL calculate status based on current date and schedule dates
7. WHEN filters are applied, THE System SHALL update the URL query parameters
8. WHEN the page loads with query parameters, THE System SHALL apply those filters automatically

### Requirement 11: Export Review Progress Report

**User Story:** As an Academic Manager, I want to export review progress reports, so that I can share status with university leadership.

#### Acceptance Criteria

1. WHEN viewing a review schedule, THE System SHALL provide an "Export Report" button
2. WHEN clicking Export Report, THE System SHALL offer format options: PDF, Excel
3. WHEN generating a report, THE System SHALL include: Schedule details, Progress statistics, Department breakdown, Reviewer performance, Overdue items
4. WHEN generating PDF, THE System SHALL apply university branding
5. WHEN generating Excel, THE System SHALL include multiple sheets for different data views
6. WHEN export is complete, THE System SHALL automatically download the file
7. WHEN export fails, THE System SHALL display an error message
8. THE System SHALL log all report exports for audit purposes

### Requirement 12: Handle API Errors Gracefully

**User Story:** As an Academic Manager, I want clear error messages when operations fail, so that I understand what went wrong and can take corrective action.

#### Acceptance Criteria

1. WHEN any API request fails, THE System SHALL display an error message in Vietnamese
2. WHEN a create or update operation fails due to validation, THE System SHALL display field-level errors
3. WHEN a create or update operation fails due to server error, THE System SHALL display a toast notification
4. WHEN a delete operation fails because reviews exist, THE System SHALL display a specific error message
5. WHEN the list fails to load, THE System SHALL display an error state with a retry option
6. WHEN a network error occurs, THE System SHALL display "Lỗi kết nối mạng. Vui lòng thử lại."
7. WHEN a 403 error occurs, THE System SHALL display "Bạn không có quyền thực hiện thao tác này"
8. THE System SHALL log all errors to the console for debugging purposes

### Requirement 13: Display Success Feedback

**User Story:** As an Academic Manager, I want confirmation when operations succeed, so that I know my actions were completed successfully.

#### Acceptance Criteria

1. WHEN a review schedule is created successfully, THE System SHALL display "Tạo lịch phê duyệt thành công"
2. WHEN a review schedule is updated successfully, THE System SHALL display "Cập nhật lịch phê duyệt thành công"
3. WHEN reviewers are assigned successfully, THE System SHALL display "Phân công người phê duyệt thành công"
4. WHEN a review schedule is deleted successfully, THE System SHALL display "Đã xóa lịch phê duyệt"
5. WHEN reminders are sent successfully, THE System SHALL display "Đã gửi nhắc nhở đến người phê duyệt"
6. WHEN a success toast is displayed, THE System SHALL automatically dismiss it after 3-5 seconds
7. THE System SHALL use green color scheme for success messages
8. THE System SHALL include relevant icons in toast messages
