/**
 * Core Type Definitions for Lecturer Module
 *
 * This module contains all TypeScript type definitions for the lecturer feature,
 * including syllabi, reviews, feedback, messaging, and update requests.
 */

// ============================================================================
// Enums and Constants
// ============================================================================

export type SyllabusStatus =
  | 'Draft'
  | 'Pending Review'
  | 'Revision Required'
  | 'Approved'
  | 'Archived'

export type BloomLevel =
  | 'Remember'
  | 'Understand'
  | 'Apply'
  | 'Analyze'
  | 'Evaluate'
  | 'Create'

export type AssessmentType =
  | 'Quiz'
  | 'Assignment'
  | 'Midterm'
  | 'Final'
  | 'Project'
  | 'Presentation'

export type ReferenceType = 'Required' | 'Recommended' | 'Online Resource'

export type CommentType = 'Suggestion' | 'Question' | 'Error' | 'General'

export type ChangeType =
  | 'Minor Update'
  | 'Content Revision'
  | 'Major Restructure'

export type UpdateRequestStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected'

export type Semester = 'Fall' | 'Spring' | 'Summer'

export type Priority = 'Low' | 'Medium' | 'High'

export type Recommendation = 'Approve' | 'Needs Revision' | 'Reject'

export type EvaluationStatus = 'Draft' | 'Submitted'

// ============================================================================
// Syllabus Types
// ============================================================================

export interface Syllabus {
  id: number
  courseId: number
  courseCode: string
  courseName: string
  academicYear: string
  semester: Semester
  credits: number
  totalHours: number
  description: string
  status: SyllabusStatus
  version: string
  createdAt: string
  updatedAt: string
  lecturerId: number
  lecturerName?: string
  clos: CLO[]
  content: CourseContent[]
  assessments: Assessment[]
  references: Reference[]
}

export interface CLO {
  id?: number
  code: string
  description: string
  bloomLevel: BloomLevel
  mappedPlos: string[]
}

export interface CourseContent {
  id?: number
  weekNumber: number
  title: string
  description: string
  lectureHours: number
  labHours: number
  relatedClos: string[]
  teachingMethods: string[]
}

export interface Assessment {
  id?: number
  type: AssessmentType
  name: string
  weight: number
  relatedClos: string[]
  description?: string
}

export interface Reference {
  id?: number
  type: ReferenceType
  title: string
  authors: string
  publisher?: string
  year?: number
  isbn?: string
  url?: string
}

// ============================================================================
// Course Catalog Types
// ============================================================================

export interface Course {
  course_id: number
  code: string
  name: string
  credits: number
  programId: number
  programName: string
  departmentId: number
  departmentName: string
  prerequisites: string[]
}

export interface PLO {
  id: number
  code: string
  description: string
  programId: number
}

// ============================================================================
// Submission Types
// ============================================================================

export interface SubmissionValidation {
  isValid: boolean
  criteria: ValidationCriterion[]
}

export interface ValidationCriterion {
  name: string
  passed: boolean
  message: string
}

export interface SubmissionNotes {
  notes?: string
  confirm: boolean
}

// ============================================================================
// Review Types
// ============================================================================

export interface ReviewSchedule {
  id: number
  departmentId: number
  departmentName: string
  startDate: string
  endDate: string
  reviewType: string
  status: 'Upcoming' | 'Active' | 'Completed'
}

export interface ApprovalTimeline {
  id: number
  syllabusId: number
  stage:
    | 'Submitted'
    | 'HoD Review'
    | 'Academic Manager Review'
    | 'Approved'
    | 'Rejected'
  reviewerId?: number
  reviewerName?: string
  reviewerRole?: string
  timestamp: string
  comments?: string
}

export interface PeerEvaluation {
  id?: number
  syllabusId: number
  reviewerId: number
  criteriaScores: CriterionScore[]
  overallScore: number
  recommendation: Recommendation
  summaryComments: string
  status: EvaluationStatus
  createdAt?: string
  updatedAt?: string
}

export interface CriterionScore {
  criterionId: number
  criterionName: string
  score: number
  comment?: string
}

export interface EvaluationTemplate {
  id: number
  name: string
  criteria: EvaluationCriterion[]
}

export interface EvaluationCriterion {
  id: number
  name: string
  description: string
  weight: number
  maxScore: number
}

export interface PeerReviewAssignment {
  id: number
  syllabusId: number
  syllabus: Syllabus
  assignedAt: string
  dueDate: string
  status: 'Pending' | 'In Progress' | 'Completed'
  evaluation?: PeerEvaluation
}

// ============================================================================
// Feedback Types
// ============================================================================

export interface Comment {
  id: number
  syllabusId: number
  userId: number
  userName: string
  userRole?: string
  type: CommentType
  sectionReference?: string
  text: string
  priority?: Priority
  isResolved: boolean
  createdAt: string
  updatedAt?: string
  replies: CommentReply[]
}

export interface CommentReply {
  id: number
  commentId: number
  userId: number
  userName: string
  userRole?: string
  text: string
  createdAt: string
  updatedAt?: string
}

export interface NewComment {
  type: CommentType
  sectionReference?: string
  text: string
  priority?: Priority
}

export interface NewCommentReply {
  text: string
}

// ============================================================================
// Message Types
// ============================================================================

export interface Message {
  id: number
  senderId: number
  senderName: string
  senderEmail?: string
  recipientId: number
  recipientName: string
  recipientEmail?: string
  subject: string
  body: string
  syllabusId?: number
  syllabusTitle?: string
  isRead: boolean
  sentDate: string
  attachments: MessageAttachment[]
}

export interface MessageAttachment {
  id: number
  fileName: string
  fileSize: number
  fileType: string
  url: string
}

export interface NewMessage {
  recipientId: number
  subject: string
  body: string
  syllabusId?: number
  attachments?: File[]
}

export interface MessageThread {
  contactId: number
  contactName: string
  contactEmail?: string
  messages: Message[]
  unreadCount: number
  lastMessageDate: string
}

export interface Recipient {
  id: number
  name: string
  email: string
  role: string
  departmentId?: number
  departmentName?: string
}

// ============================================================================
// Update Request Types
// ============================================================================

export interface UpdateRequest {
  id?: number
  syllabusId: number
  syllabusTitle?: string
  syllabusVersion?: string
  changeType: ChangeType
  affectedSections: string[]
  justification: string
  effectiveSemester: string
  urgency: 'Normal' | 'High'
  status: UpdateRequestStatus
  supportingDocuments: Document[]
  draftChanges?: Partial<Syllabus>
  createdAt?: string
  updatedAt?: string
  reviewedAt?: string
  reviewedBy?: string
  reviewComments?: string
}

export interface Document {
  id: number
  fileName: string
  fileSize: number
  fileType: string
  url: string
}

export interface NewUpdateRequest {
  syllabusId: number
  changeType: ChangeType
  affectedSections: string[]
  justification: string
  effectiveSemester: string
  urgency: 'Normal' | 'High'
  supportingDocuments?: File[]
  draftChanges?: Partial<Syllabus>
}

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
  id: number
  userId: number
  type: NotificationType
  title: string
  message: string
  relatedEntityType?: 'Syllabus' | 'Message' | 'Comment' | 'Review'
  relatedEntityId?: number
  isRead: boolean
  createdAt: string
}

export type NotificationType =
  | 'SyllabusStatusChange'
  | 'PeerReviewAssignment'
  | 'MessageReceived'
  | 'CommentAdded'
  | 'DeadlineApproaching'
  | 'UpdateRequestResponse'

// ============================================================================
// Query Parameters
// ============================================================================

export interface SyllabiQueryParams {
  page?: number
  pageSize?: number
  search?: string
  status?: SyllabusStatus | 'All'
  academicYear?: string
  semester?: Semester
  sortBy?: 'createdAt' | 'updatedAt' | 'courseCode'
  sortOrder?: 'asc' | 'desc'
}

export interface MessagesQueryParams {
  page?: number
  pageSize?: number
  search?: string
  unreadOnly?: boolean
  sortBy?: 'sentDate'
  sortOrder?: 'asc' | 'desc'
}

export interface UpdateRequestsQueryParams {
  page?: number
  pageSize?: number
  status?: UpdateRequestStatus | 'All'
  sortBy?: 'createdAt' | 'urgency'
  sortOrder?: 'asc' | 'desc'
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  status: number
  items: T
  message: string
  timestamp: string
}

export interface ApiError {
  status: number
  error: string
  message: string
  timestamp: string
  path: string
  details?: Array<{ field: string; message: string }>
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ============================================================================
// Version History Types
// ============================================================================

export interface VersionHistory {
  id: number
  syllabusId: number
  version: string
  changeSummary: string
  changedBy: number
  changedByName: string
  changedAt: string
  changes: VersionChange[]
}

export interface VersionChange {
  section: string
  field: string
  oldValue: string
  newValue: string
}
