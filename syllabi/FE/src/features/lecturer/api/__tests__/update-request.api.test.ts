/**
 * Update Request API Tests
 *
 * Tests for all update request API functions to ensure they work correctly
 * and match the design specifications.
 *
 * Requirements validated: 9.1-9.12
 */
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { apiClient } from '@/lib/api-client'
import type {
  UpdateRequest,
  NewUpdateRequest,
  Syllabus,
  UpdateRequestsQueryParams,
  PaginatedResponse,
} from '../../types'
import {
  getUpdateRequests,
  getUpdateRequest,
  getApprovedSyllabi,
  createUpdateRequest,
  updateUpdateRequest,
  saveDraftChanges,
  submitUpdateRequest,
  cancelUpdateRequest,
  deleteUpdateRequest,
} from '../update-request.api'

// Mock the api-client
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    upload: vi.fn(),
  },
}))

describe('Update Request API Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // Test: getUpdateRequests
  // ============================================================================

  describe('getUpdateRequests', () => {
    it('should fetch paginated list of update requests without filters', async () => {
      const mockResponse: PaginatedResponse<UpdateRequest> = {
        items: [
          {
            id: 1,
            syllabusId: 101,
            syllabusTitle: 'Introduction to Programming',
            changeType: 'Minor Update',
            affectedSections: ['Course Content'],
            justification: 'Update week 5 content',
            effectiveSemester: 'Fall 2024',
            urgency: 'Normal',
            status: 'Pending',
            supportingDocuments: [],
            createdAt: '2024-01-15T10:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      }

      ;(apiClient.get as Mock).mockResolvedValue({
        data: { data: mockResponse },
      })

      const result = await getUpdateRequests()

      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/v1/lecturer/update-requests',
        { params: undefined }
      )
      expect(result).toEqual(mockResponse)
      expect(result.items).toHaveLength(1)
      expect(result.items[0].id).toBe(1)
    })

    it('should fetch update requests with query parameters', async () => {
      const params: UpdateRequestsQueryParams = {
        page: 2,
        pageSize: 20,
        status: 'Pending',
        sortBy: 'urgency',
        sortOrder: 'desc',
      }

      const mockResponse: PaginatedResponse<UpdateRequest> = {
        items: [],
        total: 0,
        page: 2,
        pageSize: 20,
        totalPages: 0,
      }

      ;(apiClient.get as Mock).mockResolvedValue({
        data: { data: mockResponse },
      })

      const result = await getUpdateRequests(params)

      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/v1/lecturer/update-requests',
        { params }
      )
      expect(result).toEqual(mockResponse)
    })

    it('should handle API errors gracefully', async () => {
      ;(apiClient.get as Mock).mockRejectedValue(new Error('Network error'))

      await expect(getUpdateRequests()).rejects.toThrow('Network error')
    })
  })

  // ============================================================================
  // Test: getUpdateRequest
  // ============================================================================

  describe('getUpdateRequest', () => {
    it('should fetch a specific update request by ID', async () => {
      const mockUpdateRequest: UpdateRequest = {
        id: 1,
        syllabusId: 101,
        syllabusTitle: 'Introduction to Programming',
        syllabusVersion: '1.0',
        changeType: 'Content Revision',
        affectedSections: ['Course Content', 'Assessment Methods'],
        justification: 'Need to update assessment weights based on feedback',
        effectiveSemester: 'Spring 2024',
        urgency: 'High',
        status: 'Pending',
        supportingDocuments: [
          {
            id: 1,
            fileName: 'feedback.pdf',
            fileSize: 102400,
            fileType: 'application/pdf',
            url: 'https://example.com/feedback.pdf',
          },
        ],
        draftChanges: {
          assessments: [
            {
              id: 1,
              type: 'Quiz',
              name: 'Weekly Quiz',
              weight: 20,
              relatedClos: ['CLO1'],
            },
          ],
        },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-16T14:30:00Z',
      }

      ;(apiClient.get as Mock).mockResolvedValue({
        data: { data: mockUpdateRequest },
      })

      const result = await getUpdateRequest(1)

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/update-requests/1')
      expect(result).toEqual(mockUpdateRequest)
      expect(result.id).toBe(1)
      expect(result.changeType).toBe('Content Revision')
      expect(result.supportingDocuments).toHaveLength(1)
    })

    it('should handle 404 error for non-existent update request', async () => {
      ;(apiClient.get as Mock).mockRejectedValue({
        response: { status: 404 },
      })

      await expect(getUpdateRequest(999)).rejects.toMatchObject({
        response: { status: 404 },
      })
    })
  })

  // ============================================================================
  // Test: getApprovedSyllabi
  // ============================================================================

  describe('getApprovedSyllabi', () => {
    it('should fetch list of approved syllabi eligible for update requests', async () => {
      const mockSyllabi: Syllabus[] = [
        {
          id: 101,
          courseId: 1,
          courseCode: 'CS101',
          courseName: 'Introduction to Programming',
          academicYear: '2023-2024',
          semester: 'Fall',
          credits: 3,
          totalHours: 45,
          description: 'An introductory course to programming',
          status: 'Approved',
          version: '1.0',
          createdAt: '2023-08-01T10:00:00Z',
          updatedAt: '2023-09-15T14:00:00Z',
          lecturerId: 1,
          clos: [],
          content: [],
          assessments: [],
          references: [],
        },
        {
          id: 102,
          courseId: 2,
          courseCode: 'CS201',
          courseName: 'Data Structures',
          academicYear: '2023-2024',
          semester: 'Spring',
          credits: 4,
          totalHours: 60,
          description: 'Advanced data structures course',
          status: 'Approved',
          version: '2.1',
          createdAt: '2023-12-01T10:00:00Z',
          updatedAt: '2024-01-10T14:00:00Z',
          lecturerId: 1,
          clos: [],
          content: [],
          assessments: [],
          references: [],
        },
      ]

      ;(apiClient.get as Mock).mockResolvedValue({
        data: { data: mockSyllabi },
      })

      const result = await getApprovedSyllabi()

      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/v1/lecturer/syllabi/approved'
      )
      expect(result).toEqual(mockSyllabi)
      expect(result).toHaveLength(2)
      expect(result[0].status).toBe('Approved')
      expect(result[1].status).toBe('Approved')
    })

    it('should return empty array when no approved syllabi exist', async () => {
      ;(apiClient.get as Mock).mockResolvedValue({
        data: { data: [] },
      })

      const result = await getApprovedSyllabi()

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })
  })

  // ============================================================================
  // Test: createUpdateRequest
  // ============================================================================

  describe('createUpdateRequest', () => {
    it('should create update request without supporting documents', async () => {
      const newRequest: NewUpdateRequest = {
        syllabusId: 101,
        changeType: 'Minor Update',
        affectedSections: ['Course Content'],
        justification: 'Update week 5 content to include new examples',
        effectiveSemester: 'Fall 2024',
        urgency: 'Normal',
      }

      const mockResponse: UpdateRequest = {
        id: 1,
        ...newRequest,
        status: 'Draft',
        supportingDocuments: [],
        createdAt: '2024-01-15T10:00:00Z',
      }

      ;(apiClient.post as Mock).mockResolvedValue({
        data: { data: mockResponse },
      })

      const result = await createUpdateRequest(newRequest)

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/update-requests',
        newRequest
      )
      expect(result).toEqual(mockResponse)
      expect(result.id).toBe(1)
      expect(result.status).toBe('Draft')
    })

    it('should create update request with supporting documents using FormData', async () => {
      const file1 = new File(['content1'], 'document1.pdf', {
        type: 'application/pdf',
      })
      const file2 = new File(['content2'], 'document2.pdf', {
        type: 'application/pdf',
      })

      const newRequest: NewUpdateRequest = {
        syllabusId: 101,
        changeType: 'Major Restructure',
        affectedSections: ['Course Content', 'Learning Outcomes'],
        justification: 'Complete restructure based on curriculum review',
        effectiveSemester: 'Fall 2024',
        urgency: 'High',
        supportingDocuments: [file1, file2],
      }

      const mockResponse: UpdateRequest = {
        id: 2,
        syllabusId: 101,
        changeType: 'Major Restructure',
        affectedSections: ['Course Content', 'Learning Outcomes'],
        justification: 'Complete restructure based on curriculum review',
        effectiveSemester: 'Fall 2024',
        urgency: 'High',
        status: 'Draft',
        supportingDocuments: [
          {
            id: 1,
            fileName: 'document1.pdf',
            fileSize: 102400,
            fileType: 'application/pdf',
            url: 'https://example.com/document1.pdf',
          },
          {
            id: 2,
            fileName: 'document2.pdf',
            fileSize: 204800,
            fileType: 'application/pdf',
            url: 'https://example.com/document2.pdf',
          },
        ],
        createdAt: '2024-01-15T10:00:00Z',
      }

      ;(apiClient.upload as Mock).mockResolvedValue({
        data: { data: mockResponse },
      })

      const result = await createUpdateRequest(newRequest)

      expect(apiClient.upload).toHaveBeenCalledWith(
        '/api/v1/update-requests',
        expect.any(FormData)
      )
      expect(result).toEqual(mockResponse)
      expect(result.supportingDocuments).toHaveLength(2)
    })

    it('should create update request with draft changes', async () => {
      const newRequest: NewUpdateRequest = {
        syllabusId: 101,
        changeType: 'Content Revision',
        affectedSections: ['Assessment Methods'],
        justification: 'Adjust assessment weights',
        effectiveSemester: 'Spring 2024',
        urgency: 'Normal',
        draftChanges: {
          assessments: [
            {
              id: 1,
              type: 'Quiz',
              name: 'Weekly Quiz',
              weight: 25,
              relatedClos: ['CLO1', 'CLO2'],
            },
          ],
        },
      }

      const mockResponse: UpdateRequest = {
        id: 3,
        ...newRequest,
        status: 'Draft',
        supportingDocuments: [],
        createdAt: '2024-01-15T10:00:00Z',
      }

      ;(apiClient.post as Mock).mockResolvedValue({
        data: { data: mockResponse },
      })

      const result = await createUpdateRequest(newRequest)

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/update-requests',
        newRequest
      )
      expect(result.draftChanges).toBeDefined()
      expect(result.draftChanges?.assessments).toHaveLength(1)
    })
  })

  // ============================================================================
  // Test: updateUpdateRequest
  // ============================================================================

  describe('updateUpdateRequest', () => {
    it('should update update request without documents', async () => {
      const updates: Partial<NewUpdateRequest> = {
        justification: 'Updated justification with more details',
        urgency: 'High',
      }

      const mockResponse: UpdateRequest = {
        id: 1,
        syllabusId: 101,
        changeType: 'Minor Update',
        affectedSections: ['Course Content'],
        justification: 'Updated justification with more details',
        effectiveSemester: 'Fall 2024',
        urgency: 'High',
        status: 'Draft',
        supportingDocuments: [],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-16T11:00:00Z',
      }

      ;(apiClient.put as Mock).mockResolvedValue({
        data: { data: mockResponse },
      })

      const result = await updateUpdateRequest(1, updates)

      expect(apiClient.put).toHaveBeenCalledWith(
        '/api/v1/update-requests/1',
        updates
      )
      expect(result).toEqual(mockResponse)
      expect(result.urgency).toBe('High')
    })

    it('should update update request with new documents using FormData', async () => {
      const newFile = new File(['new content'], 'new-document.pdf', {
        type: 'application/pdf',
      })

      const updates: Partial<NewUpdateRequest> = {
        supportingDocuments: [newFile],
      }

      const mockResponse: UpdateRequest = {
        id: 1,
        syllabusId: 101,
        changeType: 'Minor Update',
        affectedSections: ['Course Content'],
        justification: 'Update week 5 content',
        effectiveSemester: 'Fall 2024',
        urgency: 'Normal',
        status: 'Draft',
        supportingDocuments: [
          {
            id: 3,
            fileName: 'new-document.pdf',
            fileSize: 51200,
            fileType: 'application/pdf',
            url: 'https://example.com/new-document.pdf',
          },
        ],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-16T12:00:00Z',
      }

      ;(apiClient.upload as Mock).mockResolvedValue({
        data: { data: mockResponse },
      })

      const result = await updateUpdateRequest(1, updates)

      expect(apiClient.upload).toHaveBeenCalledWith(
        '/api/v1/update-requests/1',
        expect.any(FormData)
      )
      expect(result.supportingDocuments).toHaveLength(1)
    })
  })

  // ============================================================================
  // Test: saveDraftChanges
  // ============================================================================

  describe('saveDraftChanges', () => {
    it('should save draft changes for an update request', async () => {
      const draftChanges: Partial<Syllabus> = {
        description: 'Updated course description',
        assessments: [
          {
            id: 1,
            type: 'Quiz',
            name: 'Weekly Quiz',
            weight: 20,
            relatedClos: ['CLO1'],
          },
          {
            id: 2,
            type: 'Final',
            name: 'Final Exam',
            weight: 40,
            relatedClos: ['CLO1', 'CLO2', 'CLO3'],
          },
        ],
      }

      const mockResponse: UpdateRequest = {
        id: 1,
        syllabusId: 101,
        changeType: 'Content Revision',
        affectedSections: ['Course Description', 'Assessment Methods'],
        justification: 'Update based on feedback',
        effectiveSemester: 'Fall 2024',
        urgency: 'Normal',
        status: 'Draft',
        supportingDocuments: [],
        draftChanges,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-16T13:00:00Z',
      }

      ;(apiClient.put as Mock).mockResolvedValue({
        data: { data: mockResponse },
      })

      const result = await saveDraftChanges(1, draftChanges)

      expect(apiClient.put).toHaveBeenCalledWith(
        '/api/v1/update-requests/1/draft-changes',
        { draftChanges }
      )
      expect(result.draftChanges).toEqual(draftChanges)
      expect(result.draftChanges?.assessments).toHaveLength(2)
    })
  })

  // ============================================================================
  // Test: submitUpdateRequest
  // ============================================================================

  describe('submitUpdateRequest', () => {
    it('should submit an update request for review', async () => {
      const mockResponse: UpdateRequest = {
        id: 1,
        syllabusId: 101,
        changeType: 'Minor Update',
        affectedSections: ['Course Content'],
        justification: 'Update week 5 content',
        effectiveSemester: 'Fall 2024',
        urgency: 'Normal',
        status: 'Pending',
        supportingDocuments: [],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-16T14:00:00Z',
      }

      ;(apiClient.post as Mock).mockResolvedValue({
        data: { data: mockResponse },
      })

      const result = await submitUpdateRequest(1)

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/update-requests/1/submit'
      )
      expect(result).toEqual(mockResponse)
      expect(result.status).toBe('Pending')
    })

    it('should handle validation errors when submitting incomplete request', async () => {
      ;(apiClient.post as Mock).mockRejectedValue({
        response: {
          status: 422,
          data: {
            message: 'Validation failed',
            details: [
              { field: 'justification', message: 'Justification is required' },
            ],
          },
        },
      })

      await expect(submitUpdateRequest(1)).rejects.toMatchObject({
        response: { status: 422 },
      })
    })
  })

  // ============================================================================
  // Test: cancelUpdateRequest
  // ============================================================================

  describe('cancelUpdateRequest', () => {
    it('should cancel a pending update request', async () => {
      const mockResponse: UpdateRequest = {
        id: 1,
        syllabusId: 101,
        changeType: 'Minor Update',
        affectedSections: ['Course Content'],
        justification: 'Update week 5 content',
        effectiveSemester: 'Fall 2024',
        urgency: 'Normal',
        status: 'Draft',
        supportingDocuments: [],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-16T15:00:00Z',
      }

      ;(apiClient.post as Mock).mockResolvedValue({
        data: { data: mockResponse },
      })

      const result = await cancelUpdateRequest(1)

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/update-requests/1/cancel'
      )
      expect(result).toEqual(mockResponse)
    })

    it('should handle error when trying to cancel already reviewed request', async () => {
      ;(apiClient.post as Mock).mockRejectedValue({
        response: {
          status: 409,
          data: {
            message: 'Cannot cancel request that has already been reviewed',
          },
        },
      })

      await expect(cancelUpdateRequest(1)).rejects.toMatchObject({
        response: { status: 409 },
      })
    })
  })

  // ============================================================================
  // Test: deleteUpdateRequest
  // ============================================================================

  describe('deleteUpdateRequest', () => {
    it('should delete a draft update request', async () => {
      ;(apiClient.delete as Mock).mockResolvedValue({})

      await deleteUpdateRequest(1)

      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/update-requests/1')
    })

    it('should handle error when trying to delete non-draft request', async () => {
      ;(apiClient.delete as Mock).mockRejectedValue({
        response: {
          status: 409,
          data: {
            message: 'Only draft requests can be deleted',
          },
        },
      })

      await expect(deleteUpdateRequest(1)).rejects.toMatchObject({
        response: { status: 409 },
      })
    })

    it('should handle 404 error for non-existent request', async () => {
      ;(apiClient.delete as Mock).mockRejectedValue({
        response: { status: 404 },
      })

      await expect(deleteUpdateRequest(999)).rejects.toMatchObject({
        response: { status: 404 },
      })
    })
  })
})
