import { z } from 'zod'

// ============================================================================
// Enums
// ============================================================================

export enum ReviewScheduleStatus {
  UPCOMING = 'UPCOMING', // Before review start date
  ACTIVE = 'ACTIVE', // Between start and final approval
  COMPLETED = 'COMPLETED', // After final approval, all reviews done
  OVERDUE = 'OVERDUE', // Past final approval, reviews pending
}

// ============================================================================
// Core Types
// ============================================================================

export interface Semester {
  id: string
  name: string
  academicYear: string
  startDate: Date
  endDate: Date
  submissionStartDate: Date
  submissionEndDate: Date
}

export interface DeadlineAlertConfig {
  enabled: boolean
  thresholds: number[] // Days before deadline [7, 3, 1]
  channels: ('EMAIL' | 'IN_APP')[]
  sendOverdueAlerts: boolean
}

export interface ReviewSchedule {
  id: string
  name: string
  semesterId: string
  semesterName: string
  academicYear: string
  reviewStartDate: Date
  l1Deadline: Date
  l2Deadline: Date
  finalApprovalDate: Date
  status: ReviewScheduleStatus

  // Progress tracking
  totalSyllabi: number
  reviewedCount: number
  pendingCount: number
  overdueCount: number
  progressPercentage: number

  // Alert configuration
  alertConfig: DeadlineAlertConfig

  // Metadata
  createdBy: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface ReviewerAssignment {
  id: string
  scheduleId: string
  departmentId: string
  departmentName: string
  primaryReviewerId: string
  primaryReviewerName: string
  primaryReviewerRole: 'HOD' | 'AA'
  backupReviewerId?: string
  backupReviewerName?: string
  assignedAt: Date
  assignedBy: string
}

export interface DepartmentProgress {
  departmentId: string
  departmentName: string
  total: number
  reviewed: number
  pending: number
  overdue: number
  percentage: number
}

export interface ReviewerProgress {
  reviewerId: string
  reviewerName: string
  role: 'HOD' | 'AA'
  assigned: number
  completed: number
  pending: number
  overdue: number
  averageTime: number // in hours
}

export interface ProgressStatistics {
  scheduleId: string
  overall: {
    total: number
    reviewed: number
    pending: number
    overdue: number
    percentage: number
  }
  byDepartment: DepartmentProgress[]
  byReviewer: ReviewerProgress[]
  averageReviewTime: number // in hours
}

export interface AuditTrailEntry {
  id: string
  scheduleId: string
  action: string
  field?: string
  oldValue?: string
  newValue?: string
  performedBy: string
  performedByName: string
  performedAt: Date
  reason?: string
}

export interface AvailableReviewer {
  id: string
  name: string
  email: string
  role: 'HOD' | 'AA'
  departmentId?: string
  departmentName?: string
  currentAssignments: number
}

// ============================================================================
// Form Input Types
// ============================================================================

export interface ReviewScheduleFormInput {
  name: string
  semesterId: string
  reviewStartDate: Date
  l1Deadline: Date
  l2Deadline: Date
  finalApprovalDate: Date
  alertConfig: DeadlineAlertConfig
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ReviewSchedulesListResponse {
  data: ReviewSchedule[]
  total: number
  page: number
  pageSize: number
}

export interface ReviewScheduleDetailResponse {
  data: ReviewSchedule
  assignments: ReviewerAssignment[]
  progress: ProgressStatistics
  auditTrail: AuditTrailEntry[]
}

// ============================================================================
// Query Parameters
// ============================================================================

export interface ReviewSchedulesQueryParams {
  page?: number
  pageSize?: number
  search?: string
  status?: ReviewScheduleStatus | 'ALL'
  semesterId?: string
  academicYear?: string
  sortBy?: 'name' | 'reviewStartDate' | 'progressPercentage'
  sortOrder?: 'asc' | 'desc'
}

// ============================================================================
// Zod Validation Schemas
// ============================================================================

/**
 * Review schedule name validation
 * - Minimum 5 characters
 * - Maximum 100 characters
 * - Allows letters, numbers, spaces, hyphens, underscores, and Vietnamese characters
 */
export const scheduleNameSchema = z
  .string()
  .min(5, 'Tên chu kỳ phải có ít nhất 5 ký tự')
  .max(100, 'Tên chu kỳ không được quá 100 ký tự')
  .regex(
    /^[a-zA-Z0-9\s\-_àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]+$/,
    'Tên chu kỳ chỉ được chứa chữ cái, số, khoảng trắng và dấu gạch ngang'
  )

/**
 * Date sequence validation
 * Ensures dates are in correct order with minimum 7-day gaps between stages
 */
export const dateSequenceSchema = z
  .object({
    reviewStartDate: z.date({ message: 'Ngày bắt đầu là bắt buộc' }),
    l1Deadline: z.date({ message: 'Hạn L1 là bắt buộc' }),
    l2Deadline: z.date({ message: 'Hạn L2 là bắt buộc' }),
    finalApprovalDate: z.date({
      message: 'Ngày phê duyệt cuối là bắt buộc',
    }),
  })
  .refine((data) => data.l1Deadline > data.reviewStartDate, {
    message: 'Hạn L1 phải sau ngày bắt đầu phê duyệt',
    path: ['l1Deadline'],
  })
  .refine((data) => data.l2Deadline > data.l1Deadline, {
    message: 'Hạn L2 phải sau hạn L1',
    path: ['l2Deadline'],
  })
  .refine((data) => data.finalApprovalDate > data.l2Deadline, {
    message: 'Ngày phê duyệt cuối phải sau hạn L2',
    path: ['finalApprovalDate'],
  })
  .refine(
    (data) => {
      const daysBetweenStartAndL1 = Math.floor(
        (data.l1Deadline.getTime() - data.reviewStartDate.getTime()) /
          (1000 * 60 * 60 * 24)
      )
      return daysBetweenStartAndL1 >= 7
    },
    {
      message: 'Phải có ít nhất 7 ngày giữa ngày bắt đầu và hạn L1',
      path: ['l1Deadline'],
    }
  )
  .refine(
    (data) => {
      const daysBetweenL1AndL2 = Math.floor(
        (data.l2Deadline.getTime() - data.l1Deadline.getTime()) /
          (1000 * 60 * 60 * 24)
      )
      return daysBetweenL1AndL2 >= 7
    },
    {
      message: 'Phải có ít nhất 7 ngày giữa hạn L1 và hạn L2',
      path: ['l2Deadline'],
    }
  )

/**
 * Alert configuration validation
 */
export const alertConfigSchema = z.object({
  enabled: z.boolean(),
  thresholds: z
    .array(z.number().int().min(1).max(30))
    .min(1, 'Phải có ít nhất một ngưỡng nhắc nhở'),
  channels: z
    .array(z.enum(['EMAIL', 'IN_APP']))
    .min(1, 'Phải chọn ít nhất một kênh thông báo'),
  sendOverdueAlerts: z.boolean(),
})

/**
 * Complete review schedule form validation schema
 * Combines all validation rules including date sequence
 */
export const reviewScheduleFormSchema = z
  .object({
    name: scheduleNameSchema,
    semesterId: z.string().min(1, 'Học kỳ là bắt buộc'),
    reviewStartDate: z.date({ message: 'Ngày bắt đầu là bắt buộc' }),
    l1Deadline: z.date({ message: 'Hạn L1 là bắt buộc' }),
    l2Deadline: z.date({ message: 'Hạn L2 là bắt buộc' }),
    finalApprovalDate: z.date({
      message: 'Ngày phê duyệt cuối là bắt buộc',
    }),
    alertConfig: alertConfigSchema,
  })
  .and(dateSequenceSchema)

/**
 * Reviewer assignment validation
 * Ensures primary and backup reviewers are different
 */
export const reviewerAssignmentSchema = z
  .object({
    departmentId: z.string().min(1, 'Khoa/Bộ môn là bắt buộc'),
    primaryReviewerId: z.string().min(1, 'Người phê duyệt chính là bắt buộc'),
    backupReviewerId: z.string().optional(),
  })
  .refine((data) => data.primaryReviewerId !== data.backupReviewerId, {
    message: 'Người phê duyệt dự phòng phải khác người phê duyệt chính',
    path: ['backupReviewerId'],
  })

// ============================================================================
// Type Exports for Zod Schemas
// ============================================================================

export type ReviewScheduleFormData = z.infer<typeof reviewScheduleFormSchema>
export type ReviewerAssignmentFormData = z.infer<
  typeof reviewerAssignmentSchema
>
export type AlertConfigFormData = z.infer<typeof alertConfigSchema>
