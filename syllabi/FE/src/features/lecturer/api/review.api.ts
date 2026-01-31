/**
 * Review and Evaluation API Functions
 *
 * This module contains all API functions for review schedules,
 * peer evaluations, and approval workflows.
 */
import { apiClient } from '@/lib/api-client'
import type {
  ReviewSchedule,
  ApprovalTimeline,
  PeerEvaluation,
  PeerReviewAssignment,
  EvaluationTemplate,
  ApiResponse,
  PaginatedResponse,
} from '../types'

// ============================================================================
// Review Schedule Operations
// ============================================================================

/**
 * Get review schedules for the lecturer's department
 */
export const getReviewSchedules = async (): Promise<ReviewSchedule[]> => {
  const response = await apiClient.get<ApiResponse<ReviewSchedule[]>>(
    '/api/v1/lecturer/review-schedules'
  )
  return response.data.items
}

/**
 * Get active review schedule
 */
export const getActiveReviewSchedule =
  async (): Promise<ReviewSchedule | null> => {
    const response = await apiClient.get<ApiResponse<ReviewSchedule | null>>(
      '/api/v1/lecturer/review-schedules/active'
    )
    return response.data.items
  }

// ============================================================================
// Submission Tracking Operations
// ============================================================================

/**
 * Get approval timeline for a specific syllabus
 */
export const getApprovalTimeline = async (
  syllabusId: number
): Promise<ApprovalTimeline[]> => {
  const response = await apiClient.get<ApiResponse<ApprovalTimeline[]>>(
    `/api/v1/syllabi/${syllabusId}/approval-timeline`
  )
  return response.data.items
}

/**
 * Get all submissions by the current lecturer
 */
export const getMySubmissions = async (): Promise<
  PaginatedResponse<ApprovalTimeline>
> => {
  const response = await apiClient.get<
    ApiResponse<PaginatedResponse<ApprovalTimeline>>
  >('/api/v1/lecturer/submissions')
  return response.data.items
}

/**
 * Alias for getMySubmissions for consistency with design document
 */
export const getSubmissions = getMySubmissions

// ============================================================================
// Peer Review Operations
// ============================================================================

/**
 * Get peer review assignments for the current lecturer
 */
export const getPeerReviews = async (): Promise<PeerReviewAssignment[]> => {
  const response = await apiClient.get<ApiResponse<PeerReviewAssignment[]>>(
    '/api/v1/lecturer/peer-reviews'
  )
  return response.data.items
}

/**
 * Get a specific peer review assignment
 */
export const getPeerReview = async (
  id: number
): Promise<PeerReviewAssignment> => {
  const response = await apiClient.get<ApiResponse<PeerReviewAssignment>>(
    `/api/v1/lecturer/peer-reviews/${id}`
  )
  return response.data.items
}

/**
 * Get evaluation template for peer review
 */
export const getEvaluationTemplate = async (): Promise<EvaluationTemplate> => {
  const response = await apiClient.get<ApiResponse<EvaluationTemplate>>(
    '/api/v1/evaluation-templates/default'
  )
  return response.data.items
}

// ============================================================================
// Peer Evaluation Operations
// ============================================================================

/**
 * Create a new peer evaluation (draft)
 */
export const createPeerEvaluation = async (
  data: Partial<PeerEvaluation>
): Promise<PeerEvaluation> => {
  const response = await apiClient.post<ApiResponse<PeerEvaluation>>(
    '/api/v1/peer-evaluations',
    data
  )
  return response.data.items
}

/**
 * Update an existing peer evaluation
 */
export const updatePeerEvaluation = async (
  id: number,
  data: Partial<PeerEvaluation>
): Promise<PeerEvaluation> => {
  const response = await apiClient.put<ApiResponse<PeerEvaluation>>(
    `/api/v1/peer-evaluations/${id}`,
    data
  )
  return response.data.items
}

/**
 * Submit peer evaluation (finalize)
 */
export const submitPeerEvaluation = async (
  id: number
): Promise<PeerEvaluation> => {
  const response = await apiClient.post<ApiResponse<PeerEvaluation>>(
    `/api/v1/peer-evaluations/${id}/submit`
  )
  return response.data.items
}

/**
 * Get peer evaluation by ID
 */
export const getPeerEvaluation = async (
  id: number
): Promise<PeerEvaluation> => {
  const response = await apiClient.get<ApiResponse<PeerEvaluation>>(
    `/api/v1/peer-evaluations/${id}`
  )
  return response.data.items
}

/**
 * Get peer evaluation for a specific syllabus (if exists)
 */
export const getPeerEvaluationBySyllabus = async (
  syllabusId: number
): Promise<PeerEvaluation | null> => {
  const response = await apiClient.get<ApiResponse<PeerEvaluation | null>>(
    `/api/v1/peer-evaluations/syllabus/${syllabusId}`
  )
  return response.data.items
}
