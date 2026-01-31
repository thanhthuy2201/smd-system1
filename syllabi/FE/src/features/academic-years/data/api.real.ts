import { apiClient } from '@/lib/api-client'
import {
  type AcademicYearDetailResponse,
  type AcademicYearFormInput,
  type AcademicYearsListResponse,
  type AcademicYearsQueryParams,
  type AcademicYearStatus,
  type CodeUniquenessResponse,
} from './schema'

/**
 * API Client for Academic Years - Real Backend Implementation
 *
 * This implementation makes actual HTTP requests to the backend API.
 * Replace the mock implementation in api.ts with this when backend is ready.
 *
 * To use this implementation:
 * 1. Ensure VITE_API_BASE_URL is set in .env
 * 2. Rename this file to api.ts (backup the mock version first)
 * 3. Update imports in hooks if needed
 */

export const academicYearsApi = {
  /**
   * List academic years with pagination, search, filter, and sort
   * GET /api/v1/academic-years
   * Validates Requirement 1.1
   */
  async list(
    params: AcademicYearsQueryParams = {}
  ): Promise<AcademicYearsListResponse> {
    const response = await apiClient.get<AcademicYearsListResponse>(
      '/api/v1/academic-years',
      { params }
    )
    return response.data
  },

  /**
   * Get a single academic year by ID
   * GET /api/v1/academic-years/:id
   * Validates Requirement 5.2
   */
  async getById(id: string): Promise<AcademicYearDetailResponse> {
    const response = await apiClient.get<AcademicYearDetailResponse>(
      `/api/v1/academic-years/${id}`
    )
    return response.data
  },

  /**
   * Create a new academic year
   * POST /api/v1/academic-years
   * Validates Requirements 2.3, 2.7
   */
  async create(
    input: AcademicYearFormInput
  ): Promise<AcademicYearDetailResponse> {
    const response = await apiClient.post<AcademicYearDetailResponse>(
      '/api/v1/academic-years',
      input
    )
    return response.data
  },

  /**
   * Update an existing academic year
   * PUT /api/v1/academic-years/:id
   * Validates Requirement 5.5
   */
  async update(
    id: string,
    input: Partial<AcademicYearFormInput>
  ): Promise<AcademicYearDetailResponse> {
    const response = await apiClient.put<AcademicYearDetailResponse>(
      `/api/v1/academic-years/${id}`,
      input
    )
    return response.data
  },

  /**
   * Update academic year status (Enable/Disable)
   * PATCH /api/v1/academic-years/:id/status
   * Validates Requirements 6.4, 6.6
   */
  async updateStatus(
    id: string,
    status: AcademicYearStatus
  ): Promise<AcademicYearDetailResponse> {
    const response = await apiClient.patch<AcademicYearDetailResponse>(
      `/api/v1/academic-years/${id}/status`,
      { status }
    )
    return response.data
  },

  /**
   * Delete academic year (soft delete)
   * DELETE /api/v1/academic-years/:id
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/academic-years/${id}`)
  },

  /**
   * Check if an academic year code is unique
   * GET /api/v1/academic-years/check-code
   * Validates Requirement 3.5
   */
  async checkCodeUniqueness(
    code: string,
    excludeId?: string
  ): Promise<CodeUniquenessResponse> {
    const response = await apiClient.get<CodeUniquenessResponse>(
      '/api/v1/academic-years/check-code',
      {
        params: { code, excludeId },
      }
    )
    return response.data
  },
}
