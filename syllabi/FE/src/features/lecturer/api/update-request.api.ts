/**
 * Update Request API Functions
 *
 * This module contains all API functions for post-approval update requests.
 */
import { apiClient } from '@/lib/api-client'
import type {
  UpdateRequest,
  NewUpdateRequest,
  Syllabus,
  UpdateRequestsQueryParams,
  PaginatedResponse,
  ApiResponse,
} from '../types'

// ============================================================================
// Update Request List Operations
// ============================================================================

/**
 * Get paginated list of update requests
 */
export const getUpdateRequests = async (
  params?: UpdateRequestsQueryParams
): Promise<PaginatedResponse<UpdateRequest>> => {
  const response = await apiClient.get<
    ApiResponse<PaginatedResponse<UpdateRequest>>
  >('/api/v1/lecturer/update-requests', { params })
  return response.data.items
}

/**
 * Get a specific update request by ID
 */
export const getUpdateRequest = async (id: number): Promise<UpdateRequest> => {
  const response = await apiClient.get<ApiResponse<UpdateRequest>>(
    `/api/v1/update-requests/${id}`
  )
  return response.data.items
}

// ============================================================================
// Approved Syllabi Operations
// ============================================================================

/**
 * Get list of approved syllabi eligible for update requests
 */
export const getApprovedSyllabi = async (): Promise<Syllabus[]> => {
  const response = await apiClient.get<ApiResponse<Syllabus[]>>(
    '/api/v1/lecturer/syllabi/approved'
  )
  return response.data.items
}

// ============================================================================
// Create/Update Operations
// ============================================================================

/**
 * Create a new update request
 */
export const createUpdateRequest = async (
  data: NewUpdateRequest
): Promise<UpdateRequest> => {
  // If there are supporting documents, use FormData
  if (data.supportingDocuments && data.supportingDocuments.length > 0) {
    const formData = new FormData()
    formData.append('syllabusId', data.syllabusId.toString())
    formData.append('changeType', data.changeType)
    formData.append('affectedSections', JSON.stringify(data.affectedSections))
    formData.append('justification', data.justification)
    formData.append('effectiveSemester', data.effectiveSemester)
    formData.append('urgency', data.urgency)

    if (data.draftChanges) {
      formData.append('draftChanges', JSON.stringify(data.draftChanges))
    }

    data.supportingDocuments.forEach((file) => {
      formData.append('supportingDocuments', file)
    })

    const response = await apiClient.upload<ApiResponse<UpdateRequest>>(
      '/api/v1/update-requests',
      formData
    )
    return response.data.items
  }

  // No documents, use regular JSON
  const response = await apiClient.post<ApiResponse<UpdateRequest>>(
    '/api/v1/update-requests',
    data
  )
  return response.data.items
}

/**
 * Update an existing update request (draft only)
 */
export const updateUpdateRequest = async (
  id: number,
  data: Partial<NewUpdateRequest>
): Promise<UpdateRequest> => {
  // If there are supporting documents, use FormData
  if (data.supportingDocuments && data.supportingDocuments.length > 0) {
    const formData = new FormData()

    if (data.changeType) formData.append('changeType', data.changeType)
    if (data.affectedSections)
      formData.append('affectedSections', JSON.stringify(data.affectedSections))
    if (data.justification) formData.append('justification', data.justification)
    if (data.effectiveSemester)
      formData.append('effectiveSemester', data.effectiveSemester)
    if (data.urgency) formData.append('urgency', data.urgency)
    if (data.draftChanges)
      formData.append('draftChanges', JSON.stringify(data.draftChanges))

    data.supportingDocuments.forEach((file) => {
      formData.append('supportingDocuments', file)
    })

    const response = await apiClient.upload<ApiResponse<UpdateRequest>>(
      `/api/v1/update-requests/${id}`,
      formData
    )
    return response.data.items
  }

  // No documents, use regular JSON
  const response = await apiClient.put<ApiResponse<UpdateRequest>>(
    `/api/v1/update-requests/${id}`,
    data
  )
  return response.data.items
}

/**
 * Save draft changes for an update request
 */
export const saveDraftChanges = async (
  id: number,
  draftChanges: Partial<Syllabus>
): Promise<UpdateRequest> => {
  const response = await apiClient.put<ApiResponse<UpdateRequest>>(
    `/api/v1/update-requests/${id}/draft-changes`,
    { draftChanges }
  )
  return response.data.items
}

// ============================================================================
// Submit/Cancel Operations
// ============================================================================

/**
 * Submit an update request for review
 */
export const submitUpdateRequest = async (
  id: number
): Promise<UpdateRequest> => {
  const response = await apiClient.post<ApiResponse<UpdateRequest>>(
    `/api/v1/update-requests/${id}/submit`
  )
  return response.data.items
}

/**
 * Cancel a pending update request
 */
export const cancelUpdateRequest = async (
  id: number
): Promise<UpdateRequest> => {
  const response = await apiClient.post<ApiResponse<UpdateRequest>>(
    `/api/v1/update-requests/${id}/cancel`
  )
  return response.data.items
}

/**
 * Delete an update request (draft only)
 */
export const deleteUpdateRequest = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/v1/update-requests/${id}`)
}
