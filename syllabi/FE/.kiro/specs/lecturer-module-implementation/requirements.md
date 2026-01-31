# Requirements Document

## Introduction

The Lecturer Module is a comprehensive feature set for the Syllabus Management and Digitalization (SMD) system that enables lecturers to create, manage, and collaborate on course syllabi. This module provides the primary content creation interface for academic staff, supporting the complete lifecycle of syllabus development from initial draft through peer review, approval workflows, and post-approval updates.

The module integrates with existing React 19 + TypeScript infrastructure using TanStack Router for navigation, TanStack Query for server state management, React Hook Form with Zod for form validation, and Shadcn UI components for consistent user interface elements.

## Glossary

- **Syllabus**: A comprehensive course document containing learning outcomes, content outline, assessment methods, and references
- **CLO**: Course Learning Outcome - specific skills or knowledge students should achieve
- **PLO**: Program Learning Outcome - broader program-level objectives that CLOs map to
- **Bloom's_Taxonomy**: Educational framework for categorizing learning objectives (Remember, Understand, Apply, Analyze, Evaluate, Create)
- **Lecturer**: Primary user role responsible for creating and managing syllabi
- **Peer_Review**: Evaluation process where senior lecturers assess syllabus quality
- **HoD**: Head of Department - first-level reviewer in approval workflow
- **Academic_Manager**: University-level administrator managing syllabus standards
- **Draft_Status**: Syllabus state allowing full editing before submission
- **Revision_Required_Status**: Syllabus returned by reviewers requiring modifications
- **Approved_Status**: Syllabus that has completed the approval workflow
- **Update_Request**: Formal request to modify an approved syllabus

## Requirements

### Requirement 1: Syllabus Creation Wizard

**User Story:** As a lecturer, I want to create comprehensive syllabi using a guided multi-step wizard, so that I can ensure all required information is captured systematically.

#### Acceptance Criteria

1. WHEN a lecturer selects a course from their assigned courses list, THE System SHALL pre-populate course code, course name, and credit information from the course catalog
2. WHEN creating learning outcomes, THE System SHALL auto-generate sequential CLO codes (CLO1, CLO2, CLO3)
3. WHEN defining a CLO, THE System SHALL require selection of a Bloom's taxonomy level from the six standard levels
4. WHEN mapping CLOs to PLOs, THE System SHALL display a matrix interface allowing selection of at least one PLO per CLO
5. WHEN adding course content topics, THE System SHALL require sequential week numbers and validate that total hours align with credit hours
6. WHEN defining assessment methods, THE System SHALL calculate the total weight percentage and prevent submission if not equal to 100%
7. WHEN adding references, THE System SHALL validate ISBN format for textbooks and URL format for online resources
8. WHILE editing any section of the syllabus, THE System SHALL auto-save draft changes every 30 seconds
9. WHEN the lecturer requests a preview, THE System SHALL display a formatted view of the complete syllabus matching the university template
10. THE System SHALL allow saving as draft at any stage without requiring complete information

### Requirement 2: Form Validation and Data Integrity

**User Story:** As a lecturer, I want comprehensive validation of my syllabus data, so that I can identify and correct errors before submission.

#### Acceptance Criteria

1. WHEN entering course description, THE System SHALL require minimum 100 characters and maximum 2000 characters
2. WHEN defining CLO descriptions, THE System SHALL require minimum 20 characters and verify the description starts with an action verb
3. WHEN allocating hours to topics, THE System SHALL validate that lecture hours and lab hours are between 0 and 10 per topic
4. WHEN setting assessment weights, THE System SHALL validate each weight is between 0 and 100 percent
5. WHEN entering publication year for references, THE System SHALL validate the year is between 1900 and the current year
6. IF total assessment weights do not equal 100%, THEN THE System SHALL display an error message indicating the current total and required adjustment
7. IF a CLO is not mapped to any PLO, THEN THE System SHALL prevent progression and highlight the unmapped CLO
8. IF course content hours do not align with credit hours (credits × 15), THEN THE System SHALL display a warning but allow override with justification

### Requirement 3: Syllabus Editing and Version Control

**User Story:** As a lecturer, I want to edit existing syllabi with appropriate access controls, so that I can make revisions while maintaining data integrity.

#### Acceptance Criteria

1. WHEN a syllabus has Draft status, THE System SHALL allow full editing of all sections
2. WHEN a syllabus has Revision_Required_Status, THE System SHALL allow full editing and display reviewer feedback in a dedicated panel
3. WHEN a syllabus has Pending Review status, THE System SHALL prevent editing unless the submission is withdrawn
4. WHEN a syllabus has Approved_Status, THE System SHALL prevent direct editing and require an update request workflow
5. WHEN a syllabus has Archived status, THE System SHALL display it in read-only mode
6. WHEN editing a syllabus, THE System SHALL track all changes and maintain version history
7. WHEN viewing version history, THE System SHALL display previous versions with timestamps and change summaries
8. THE System SHALL highlight modified sections using visual indicators when changes are made

### Requirement 4: Submission Validation and Workflow

**User Story:** As a lecturer, I want to submit completed syllabi for review with pre-submission validation, so that I can ensure my syllabus meets all requirements before entering the approval workflow.

#### Acceptance Criteria

1. WHEN initiating submission, THE System SHALL validate that course information is complete
2. WHEN initiating submission, THE System SHALL validate that at least 3 CLOs are defined
3. WHEN initiating submission, THE System SHALL validate that all CLOs are mapped to at least one PLO
4. WHEN initiating submission, THE System SHALL validate that course content covers the expected number of weeks
5. WHEN initiating submission, THE System SHALL validate that total hours match credit hours within acceptable tolerance
6. WHEN initiating submission, THE System SHALL validate that assessment weights total exactly 100%
7. WHEN initiating submission, THE System SHALL validate that at least one required textbook is specified
8. WHEN initiating submission, THE System SHALL validate that all CLOs are assessed by at least one assessment method
9. IF any validation criterion fails, THEN THE System SHALL display a validation results panel showing all pass/fail statuses with specific error messages
10. WHEN all validation criteria pass, THE System SHALL display a confirmation modal requiring explicit confirmation before submission
11. WHEN submission is confirmed, THE System SHALL change syllabus status to Pending Review and create an approval history record
12. WHEN submission is confirmed, THE System SHALL send notifications to assigned reviewers

### Requirement 5: Review Schedule and Status Tracking

**User Story:** As a lecturer, I want to view review schedules and track the status of my submitted syllabi, so that I can monitor progress through the approval workflow and meet deadlines.

#### Acceptance Criteria

1. THE System SHALL display a calendar view highlighting active review periods for the lecturer's department
2. THE System SHALL display a timeline of all submitted syllabi with current status indicators
3. WHEN a deadline is approaching within 7 days, THE System SHALL display a countdown alert
4. THE System SHALL display assigned reviewer information including HoD and Academic_Manager names
5. THE System SHALL display a progress bar showing advancement through approval stages (Submitted → HoD Review → Academic Manager Review → Approved)
6. WHEN viewing a specific syllabus, THE System SHALL display a detailed approval timeline with timestamps for each stage transition
7. THE System SHALL display upcoming deadlines sorted by urgency with visual priority indicators

### Requirement 6: Peer Review Evaluation

**User Story:** As a senior lecturer participating in peer review, I want to evaluate assigned syllabi using standardized criteria, so that I can provide consistent and constructive feedback.

#### Acceptance Criteria

1. THE System SHALL display a queue of syllabi assigned to the lecturer for peer review
2. WHEN reviewing a syllabus, THE System SHALL display the complete syllabus content in read-only format
3. WHEN evaluating, THE System SHALL display an evaluation form with criteria from the evaluation template
4. WHEN scoring each criterion, THE System SHALL require a rating from 1 to 5
5. IF a criterion receives a score of 2 or lower, THEN THE System SHALL require a comment explaining the low score with maximum 500 characters
6. THE System SHALL calculate an overall score as the weighted average of all criterion scores
7. WHEN completing evaluation, THE System SHALL require selection of an overall recommendation (Approve, Needs Revision, or Reject)
8. WHEN completing evaluation, THE System SHALL require summary comments with minimum 50 characters
9. THE System SHALL allow saving evaluation as draft before final submission
10. THE System SHALL display a rubric guide panel providing reference information for scoring criteria

### Requirement 7: Collaborative Feedback System

**User Story:** As a lecturer, I want to provide and receive feedback on syllabi through threaded comments, so that I can engage in constructive dialogue during the review process.

#### Acceptance Criteria

1. WHEN viewing a syllabus, THE System SHALL display all existing comments organized by section
2. WHEN adding a comment, THE System SHALL require selection of comment type (Suggestion, Question, Error, or General)
3. WHEN adding a comment, THE System SHALL require comment text with minimum 10 characters and maximum 1000 characters
4. WHEN adding a comment, THE System SHALL allow optional section reference to indicate which part of the syllabus the comment addresses
5. WHEN adding an error comment, THE System SHALL allow selection of priority level (Low, Medium, or High)
6. THE System SHALL support threaded replies to existing comments
7. THE System SHALL allow lecturers to edit their own comments
8. THE System SHALL allow lecturers to delete their own comments
9. THE System SHALL allow marking comments as resolved when issues are addressed
10. WHEN a comment is marked as resolved, THE System SHALL visually distinguish it from active comments

### Requirement 8: Internal Messaging System

**User Story:** As a lecturer, I want to communicate with academic staff and reviewers through internal messaging, so that I can quickly clarify questions and discuss syllabus-related matters.

#### Acceptance Criteria

1. THE System SHALL display a message inbox with unread message count
2. WHEN composing a message, THE System SHALL provide autocomplete search for recipients by name or email
3. WHEN composing a message, THE System SHALL require a subject with maximum 200 characters
4. WHEN composing a message, THE System SHALL require message body with maximum 5000 characters
5. WHEN composing a message, THE System SHALL allow attaching up to 5 files with maximum 10MB each
6. WHEN composing a message, THE System SHALL allow linking to a specific syllabus for context
7. THE System SHALL display conversation threads showing message history with a specific contact
8. THE System SHALL allow replying directly to messages
9. THE System SHALL allow marking messages as read
10. THE System SHALL allow deleting messages
11. THE System SHALL restrict recipient selection to users within the lecturer's department or assigned reviewers

### Requirement 9: Post-Approval Update Requests

**User Story:** As a lecturer, I want to request updates to approved syllabi, so that I can make necessary changes while maintaining proper approval workflows.

#### Acceptance Criteria

1. THE System SHALL display a list of approved syllabi eligible for update requests
2. WHEN creating an update request, THE System SHALL require selection of change type (Minor Update, Content Revision, or Major Restructure)
3. WHEN creating an update request, THE System SHALL require selection of affected sections from a multi-select list
4. WHEN creating an update request, THE System SHALL require justification with minimum 50 characters explaining why the update is needed
5. WHEN creating an update request, THE System SHALL require selection of effective semester for when changes should take effect
6. WHEN creating an update request, THE System SHALL require selection of urgency level (Normal or High)
7. THE System SHALL allow attaching supporting documents to the update request
8. THE System SHALL provide a draft changes editor allowing the lecturer to make proposed modifications
9. THE System SHALL allow saving update request as draft before submission
10. WHEN an update request is submitted, THE System SHALL send notification to the Academic_Manager
11. THE System SHALL display a status tracker showing update request progress through the review cycle
12. THE System SHALL allow canceling pending update requests that have not yet been reviewed

### Requirement 10: Error Handling and User Feedback

**User Story:** As a lecturer, I want clear error messages and feedback when operations fail, so that I can understand what went wrong and how to resolve issues.

#### Acceptance Criteria

1. IF authentication token is invalid or expired, THEN THE System SHALL return HTTP 401 status and display a login prompt
2. IF a lecturer attempts to edit a syllabus they are not authorized to modify, THEN THE System SHALL return HTTP 403 status and display an access denied message
3. IF a requested syllabus or resource is not found, THEN THE System SHALL return HTTP 404 status and display a not found message
4. IF a syllabus is already submitted and cannot be edited, THEN THE System SHALL return HTTP 409 status and display a conflict message explaining the current status
5. IF validation fails during submission, THEN THE System SHALL return HTTP 422 status and display detailed validation errors for each failed criterion
6. IF a network request fails, THEN THE System SHALL display a user-friendly error message and provide a retry option
7. WHEN an error occurs, THE System SHALL log error details including timestamp, endpoint path, and error message
8. WHEN displaying validation errors, THE System SHALL highlight the specific form fields requiring correction
9. THE System SHALL display success messages after successful operations (save, submit, send message)
10. THE System SHALL display loading indicators during asynchronous operations

### Requirement 11: Responsive Design and Accessibility

**User Story:** As a lecturer, I want the interface to work well on different devices and be accessible, so that I can work efficiently regardless of my device or accessibility needs.

#### Acceptance Criteria

1. THE System SHALL display all lecturer module interfaces in responsive layouts that adapt to mobile, tablet, and desktop screen sizes
2. THE System SHALL maintain usability of forms and data tables on mobile devices with appropriate touch targets
3. THE System SHALL support keyboard navigation for all interactive elements
4. THE System SHALL provide appropriate ARIA labels for screen readers
5. THE System SHALL maintain sufficient color contrast ratios for text and interactive elements
6. THE System SHALL support both light and dark theme modes
7. THE System SHALL display form validation errors in a way that is accessible to screen readers
8. THE System SHALL ensure that all modal dialogs can be closed using the Escape key
9. THE System SHALL provide focus indicators for keyboard navigation
10. THE System SHALL ensure that data tables are navigable and readable on smaller screens using horizontal scrolling or responsive design patterns

### Requirement 12: Data Persistence and Auto-Save

**User Story:** As a lecturer, I want my work to be automatically saved, so that I don't lose progress if my session is interrupted.

#### Acceptance Criteria

1. WHILE editing a syllabus in Draft_Status, THE System SHALL auto-save changes every 30 seconds
2. WHEN auto-save occurs, THE System SHALL display a visual indicator showing the last saved timestamp
3. IF auto-save fails due to network issues, THEN THE System SHALL display a warning and retry after 10 seconds
4. WHEN navigating away from an unsaved form, THE System SHALL display a confirmation dialog warning about unsaved changes
5. THE System SHALL store draft data on the server to allow resuming work from different devices
6. WHEN a lecturer returns to a draft syllabus, THE System SHALL load the most recent auto-saved version
7. THE System SHALL maintain draft state for update requests allowing lecturers to save proposed changes before submission

### Requirement 13: Integration with Existing Course Data

**User Story:** As a lecturer, I want syllabus creation to leverage existing course catalog data, so that I can avoid redundant data entry and ensure consistency.

#### Acceptance Criteria

1. WHEN selecting a course for syllabus creation, THE System SHALL retrieve course details from the course catalog API
2. THE System SHALL pre-populate course code, course name, and credit hours from the retrieved course data
3. THE System SHALL retrieve and display prerequisite courses from the course catalog
4. THE System SHALL retrieve PLOs associated with the course's program for CLO mapping
5. IF course data retrieval fails, THEN THE System SHALL display an error message and allow manual entry of course information
6. THE System SHALL validate that manually entered course codes exist in the course catalog
7. THE System SHALL display a warning if credit hours are modified from the catalog default

### Requirement 14: Notification System Integration

**User Story:** As a lecturer, I want to receive notifications about important events related to my syllabi, so that I can respond promptly to review feedback and deadlines.

#### Acceptance Criteria

1. WHEN a syllabus is returned with Revision_Required_Status, THE System SHALL send a notification to the lecturer
2. WHEN a syllabus is approved, THE System SHALL send a notification to the lecturer
3. WHEN a peer review is assigned, THE System SHALL send a notification to the reviewing lecturer
4. WHEN a new message is received, THE System SHALL send a notification to the recipient
5. WHEN a deadline is approaching within 3 days, THE System SHALL send a reminder notification
6. WHEN a comment is added to a syllabus, THE System SHALL send a notification to the syllabus owner
7. THE System SHALL display a notification badge with unread count in the application header
8. THE System SHALL allow lecturers to view notification history
9. THE System SHALL allow lecturers to mark notifications as read
10. THE System SHALL support both in-app and email notification delivery

### Requirement 15: Search and Filter Capabilities

**User Story:** As a lecturer, I want to search and filter my syllabi, so that I can quickly find specific syllabi among many courses.

#### Acceptance Criteria

1. THE System SHALL provide a search input allowing text search across syllabus titles and course codes
2. THE System SHALL provide filter options for syllabus status (Draft, Pending Review, Revision Required, Approved, Archived)
3. THE System SHALL provide filter options for academic year and semester
4. THE System SHALL provide sorting options for syllabi by creation date, last modified date, and course code
5. WHEN search or filter criteria are applied, THE System SHALL update the syllabus list in real-time
6. THE System SHALL display the count of syllabi matching current search and filter criteria
7. THE System SHALL allow clearing all filters to return to the full list view
8. THE System SHALL persist search and filter preferences during the session
