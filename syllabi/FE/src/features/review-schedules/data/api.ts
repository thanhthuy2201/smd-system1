import { apiClient } from '@/lib/api-client'
import type {
  ReviewSchedulesListResponse,
  ReviewScheduleDetailResponse,
  ReviewSchedulesQueryParams,
  ReviewScheduleFormInput,
  ReviewerAssignment,
  AvailableReviewer,
  ProgressStatistics,
  AuditTrailEntry,
  Semester,
  ReviewSchedule,
} from './schema'

/**
 * API Client for Review Schedule Management
 *
 * This module provides functions for interacting with the review schedules API.
 */

// API base path for review schedules
const BASE_PATH = '/api/v1/review-schedules'

/**
 * Transform backend response to frontend format
 * Backend uses snake_case, frontend uses camelCase
 */
function transformBackendSchedule(backendItem: any): ReviewSchedule {
  return {
    id: String(backendItem.schedule_id),
    name: backendItem.name,
    semesterId: String(backendItem.semester_id || ''),
    semesterName: backendItem.semester_name,
    academicYear: backendItem.academic_year,
    reviewStartDate: new Date(backendItem.review_start),
    l1Deadline: new Date(backendItem.l1_deadline),
    l2Deadline: new Date(backendItem.l2_deadline),
    finalApprovalDate: new Date(backendItem.final_approval),
    status: backendItem.status || 'UPCOMING',

    // Progress tracking - use defaults if not provided
    totalSyllabi: backendItem.total_syllabi || 0,
    reviewedCount: backendItem.reviewed_count || 0,
    pendingCount: backendItem.pending_count || 0,
    overdueCount: backendItem.overdue_count || 0,
    progressPercentage: backendItem.progress_percentage || 0,

    // Alert configuration - use defaults if not provided
    alertConfig: backendItem.alert_config || {
      enabled: false,
      thresholds: [7, 3, 1],
      channels: ['EMAIL', 'IN_APP'],
      sendOverdueAlerts: true,
    },

    // Metadata
    createdBy: backendItem.created_by ? String(backendItem.created_by) : '',
    createdAt: backendItem.created_at
      ? new Date(backendItem.created_at)
      : new Date(),
    updatedAt: backendItem.updated_at
      ? new Date(backendItem.updated_at)
      : new Date(),
    isActive: backendItem.is_active ?? true,
  }
}

/**
 * Transform backend assignment to frontend format
 */
function transformBackendAssignment(backendItem: any): ReviewerAssignment {
  return {
    id: String(backendItem.assignment_id),
    scheduleId: String(backendItem.schedule_id),
    departmentId: String(backendItem.department_id),
    departmentName: backendItem.department_name,
    primaryReviewerId: String(backendItem.reviewer_id),
    primaryReviewerName: backendItem.reviewer_name,
    primaryReviewerRole: backendItem.review_level === 1 ? 'HOD' : 'AA',
    backupReviewerId: backendItem.backup_reviewer_id
      ? String(backendItem.backup_reviewer_id)
      : undefined,
    backupReviewerName: backendItem.backup_reviewer_name,
    assignedAt: backendItem.assigned_at
      ? new Date(backendItem.assigned_at)
      : new Date(),
    assignedBy: backendItem.assigned_by ? String(backendItem.assigned_by) : '',
  }
}

/**
 * List review schedules with optional filtering, sorting, and pagination
 */
export async function list(
  params: ReviewSchedulesQueryParams = {}
): Promise<ReviewSchedulesListResponse> {
  const response = await apiClient.get<{
    total: number
    page: number
    pageSize: number
    totalPages: number
    items: any[]
  }>(BASE_PATH, { params })

  // Transform backend response to frontend format
  return {
    data: response.data.items.map(transformBackendSchedule),
    total: response.data.total,
    page: response.data.page,
    pageSize: response.data.pageSize,
  }
}

/**
 * Get a single review schedule by ID with full details
 */
export async function getById(
  id: string
): Promise<ReviewScheduleDetailResponse> {
  const response = await apiClient.get<any>(`${BASE_PATH}/${id}`)

  const backendData = response.data

  // Transform the main schedule data
  const schedule = transformBackendSchedule(backendData)

  // Transform assignments if they exist
  const assignments = backendData.assignments
    ? backendData.assignments.map(transformBackendAssignment)
    : []

  // For now, return mock data for progress and audit trail
  // These will be fetched from separate endpoints
  return {
    data: schedule,
    assignments,
    progress: {
      scheduleId: schedule.id,
      overall: {
        total: schedule.totalSyllabi,
        reviewed: schedule.reviewedCount,
        pending: schedule.pendingCount,
        overdue: schedule.overdueCount,
        percentage: schedule.progressPercentage,
      },
      byDepartment: [],
      byReviewer: [],
      averageReviewTime: 0,
    },
    auditTrail: [],
  }
}

/**
 * Transform frontend form data to backend format
 */
function transformToBackendFormat(
  data: ReviewScheduleFormInput | Partial<ReviewScheduleFormInput>
): any {
  const backendData: any = {}

  if (data.name) backendData.name = data.name
  if (data.semesterId) backendData.semester_id = Number(data.semesterId)
  if (data.reviewStartDate)
    backendData.review_start = data.reviewStartDate.toISOString().split('T')[0]
  if (data.l1Deadline)
    backendData.l1_deadline = data.l1Deadline.toISOString().split('T')[0]
  if (data.l2Deadline)
    backendData.l2_deadline = data.l2Deadline.toISOString().split('T')[0]
  if (data.finalApprovalDate)
    backendData.final_approval = data.finalApprovalDate
      .toISOString()
      .split('T')[0]
  if (data.alertConfig) backendData.alert_config = data.alertConfig

  return backendData
}

/**
 * Create a new review schedule
 */
export async function create(
  data: ReviewScheduleFormInput
): Promise<ReviewScheduleDetailResponse> {
  const backendData = transformToBackendFormat(data)
  const response = await apiClient.post<any>(BASE_PATH, backendData)

  // Transform response back to frontend format
  return getById(String(response.data.schedule_id))
}

/**
 * Update an existing review schedule
 */
export async function update(
  id: string,
  data: Partial<ReviewScheduleFormInput>
): Promise<ReviewScheduleDetailResponse> {
  const backendData = transformToBackendFormat(data)
  await apiClient.put(`${BASE_PATH}/${id}`, backendData)

  // Fetch the updated schedule
  return getById(id)
}

/**
 * Delete a review schedule (soft delete)
 */
export async function deleteSchedule(id: string): Promise<void> {
  await apiClient.delete(`${BASE_PATH}/${id}`)
}

/**
 * Get available reviewers, optionally filtered by department
 */
export async function getAvailableReviewers(
  departmentId?: string
): Promise<AvailableReviewer[]> {
  const response = await apiClient.get<AvailableReviewer[]>(
    `${BASE_PATH}/reviewers/available`,
    {
      params: departmentId ? { departmentId } : undefined,
    }
  )
  return response.data
}

/**
 * Assign a reviewer to a department for a specific schedule
 */
export async function assignReviewer(
  scheduleId: string,
  assignment: Omit<ReviewerAssignment, 'id' | 'assignedAt' | 'assignedBy'>
): Promise<void> {
  await apiClient.post(`${BASE_PATH}/${scheduleId}/assignments`, assignment)
}

/**
 * Update an existing reviewer assignment
 */
export async function updateAssignment(
  assignmentId: string,
  data: Partial<
    Omit<ReviewerAssignment, 'id' | 'scheduleId' | 'assignedAt' | 'assignedBy'>
  >
): Promise<void> {
  await apiClient.put(`${BASE_PATH}/assignments/${assignmentId}`, data)
}

/**
 * Remove a reviewer assignment
 */
export async function removeAssignment(assignmentId: string): Promise<void> {
  await apiClient.delete(`${BASE_PATH}/assignments/${assignmentId}`)
}

/**
 * Get progress statistics for a review schedule
 */
export async function getProgress(
  scheduleId: string
): Promise<ProgressStatistics> {
  const response = await apiClient.get<any>(
    `${BASE_PATH}/${scheduleId}/progress`
  )

  const backendData = response.data

  // Transform backend response to frontend format
  // Backend uses snake_case, frontend uses camelCase
  return {
    scheduleId: String(backendData.schedule_id || scheduleId),
    overall: {
      total: backendData.overall?.total || 0,
      reviewed: backendData.overall?.reviewed || 0,
      pending: backendData.overall?.pending || 0,
      overdue: backendData.overall?.overdue || 0,
      percentage: backendData.overall?.percentage || 0,
    },
    byDepartment: (backendData.by_department || []).map((dept: any) => ({
      departmentId: String(dept.department_id),
      departmentName: dept.department_name,
      total: dept.total || 0,
      reviewed: dept.reviewed || 0,
      pending: dept.pending || 0,
      overdue: dept.overdue || 0,
      percentage: dept.percentage || 0,
    })),
    byReviewer: (backendData.by_reviewer || []).map((reviewer: any) => ({
      reviewerId: String(reviewer.reviewer_id),
      reviewerName: reviewer.reviewer_name,
      role: reviewer.role === 'HOD' ? 'HOD' : 'AA',
      assigned: reviewer.assigned || 0,
      completed: reviewer.completed || 0,
      pending: reviewer.pending || 0,
      overdue: reviewer.overdue || 0,
      averageTime: reviewer.average_time || 0,
    })),
    averageReviewTime: backendData.average_review_time || 0,
  }
}

/**
 * Send reminder notifications to reviewers
 * @param scheduleId - The review schedule ID
 * @param reviewerIds - Optional array of specific reviewer IDs. If not provided, sends to all assigned reviewers
 */
export async function sendReminders(
  scheduleId: string,
  reviewerIds?: string[]
): Promise<void> {
  await apiClient.post(`${BASE_PATH}/${scheduleId}/reminders`, {
    reviewerIds,
  })
}

/**
 * Export progress report in specified format
 * @param scheduleId - The review schedule ID
 * @param format - Export format (PDF or EXCEL)
 * @returns Blob containing the report file
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8
 *
 * Report includes:
 * - Schedule details (name, semester, dates, status)
 * - Progress statistics (total, reviewed, pending, overdue)
 * - Department breakdown (progress by department)
 * - Reviewer performance (assigned, completed, pending, overdue, average time)
 * - Overdue items list
 *
 * PDF format: Single document with university branding
 * Excel format: Multiple sheets for different data views
 */
export async function exportReport(
  scheduleId: string,
  format: 'PDF' | 'EXCEL'
): Promise<Blob> {
  const response = await apiClient.get(`${BASE_PATH}/${scheduleId}/export`, {
    params: { format },
    responseType: 'blob',
  })
  return response.data
}

/**
 * Get audit trail for a review schedule
 */
export async function getAuditTrail(
  scheduleId: string
): Promise<AuditTrailEntry[]> {
  const response = await apiClient.get<AuditTrailEntry[]>(
    `${BASE_PATH}/${scheduleId}/audit-trail`
  )
  return response.data
}

/**
 * Get all available semesters
 * Returns list of semesters with submission period information
 *
 * Requirements: 3.1 - Validate review start date against submission end date
 */
export async function getSemesters(): Promise<Semester[]> {
  const response = await apiClient.get<Semester[]>('/api/v1/semesters')
  return response.data
}

/**
 * Get a specific semester by ID
 * Returns semester with submission period information
 *
 * Requirements: 3.1 - Validate review start date against submission end date
 */
export async function getSemesterById(
  semesterId: string
): Promise<Semester | null> {
  try {
    const response = await apiClient.get<Semester>(
      `/api/v1/semesters/${semesterId}`
    )
    return response.data
  } catch (error) {
    // Return null if semester not found
    return null
  }
}
