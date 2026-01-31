/**
 * Unit Tests for Syllabus API Functions
 *
 * These tests verify that the API functions are correctly defined
 * and make the expected HTTP requests with proper parameters.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '@/lib/api-client'
import type { Syllabus, SubmissionValidation } from '../../types'
import * as syllabusApi from '../syllabus.api'

// Mock the API client
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    download: vi.fn(),
  },
}))

describe('Syllabus API Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Course Catalog Operations', () => {
    it('should fetch assigned courses', async () => {
      const mockCourses = [
        { id: 1, code: 'CS101', name: 'Intro to CS', credits: 3 },
      ]
      ;(apiClient.get as any).mockResolvedValue({
        data: { data: mockCourses },
      })

      const result = await syllabusApi.getAssignedCourses()

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/lecturer/courses')
      expect(result).toEqual(mockCourses)
    })

    it('should fetch program PLOs', async () => {
      const mockPLOs = [
        { id: 1, code: 'PLO1', description: 'Test PLO', programId: 1 },
      ]
      ;(apiClient.get as any).mockResolvedValue({
        data: { data: mockPLOs },
      })

      const result = await syllabusApi.getProgramPLOs(1)

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/programs/1/plos')
      expect(result).toEqual(mockPLOs)
    })
  })

  describe('Syllabus List Operations', () => {
    it('should fetch syllabi with query parameters', async () => {
      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      }
      ;(apiClient.get as any).mockResolvedValue({
        data: { data: mockResponse },
      })

      const params = { status: 'Draft' as const, page: 1 }
      const result = await syllabusApi.getSyllabi(params)

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/lecturer/syllabi', {
        params,
      })
      expect(result).toEqual(mockResponse)
    })

    it('should fetch a single syllabus by ID', async () => {
      const mockSyllabus: Partial<Syllabus> = {
        id: 1,
        courseCode: 'CS101',
        courseName: 'Intro to CS',
      }
      ;(apiClient.get as any).mockResolvedValue({
        data: { data: mockSyllabus },
      })

      const result = await syllabusApi.getSyllabus(1)

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/syllabi/1')
      expect(result).toEqual(mockSyllabus)
    })
  })

  describe('Syllabus Create/Update Operations', () => {
    it('should create a new syllabus', async () => {
      const newSyllabus: Partial<Syllabus> = {
        courseId: 1,
        academicYear: '2024-2025',
        semester: 'Fall',
      }
      const mockResponse: Partial<Syllabus> = { id: 1, ...newSyllabus }
      ;(apiClient.post as any).mockResolvedValue({
        data: { data: mockResponse },
      })

      const result = await syllabusApi.createSyllabus(newSyllabus)

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/syllabi',
        newSyllabus
      )
      expect(result).toEqual(mockResponse)
    })

    it('should update an existing syllabus', async () => {
      const updates: Partial<Syllabus> = { description: 'Updated description' }
      const mockResponse: Partial<Syllabus> = { id: 1, ...updates }
      ;(apiClient.put as any).mockResolvedValue({
        data: { data: mockResponse },
      })

      const result = await syllabusApi.updateSyllabus(1, updates)

      expect(apiClient.put).toHaveBeenCalledWith('/api/v1/syllabi/1', updates)
      expect(result).toEqual(mockResponse)
    })

    it('should save syllabus as draft', async () => {
      const draftData: Partial<Syllabus> = { description: 'Draft description' }
      const mockResponse: Partial<Syllabus> = { id: 1, ...draftData }
      ;(apiClient.put as any).mockResolvedValue({
        data: { data: mockResponse },
      })

      const result = await syllabusApi.saveDraft(1, draftData)

      expect(apiClient.put).toHaveBeenCalledWith(
        '/api/v1/syllabi/1/draft',
        draftData
      )
      expect(result).toEqual(mockResponse)
    })

    it('should delete a syllabus', async () => {
      ;(apiClient.delete as any).mockResolvedValue({})

      await syllabusApi.deleteSyllabus(1)

      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/syllabi/1')
    })
  })

  describe('Submission Operations', () => {
    it('should validate syllabus before submission', async () => {
      const mockValidation: SubmissionValidation = {
        isValid: true,
        criteria: [{ name: 'Course Info', passed: true, message: 'Complete' }],
      }
      ;(apiClient.post as any).mockResolvedValue({
        data: { data: mockValidation },
      })

      const result = await syllabusApi.validateSyllabus(1)

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/syllabi/1/validate')
      expect(result).toEqual(mockValidation)
    })

    it('should submit syllabus for review', async () => {
      const mockResponse: Partial<Syllabus> = {
        id: 1,
        status: 'Pending Review',
      }
      ;(apiClient.post as any).mockResolvedValue({
        data: { data: mockResponse },
      })

      const result = await syllabusApi.submitSyllabus(1, 'Ready for review')

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/syllabi/1/submit', {
        notes: 'Ready for review',
      })
      expect(result).toEqual(mockResponse)
    })

    it('should withdraw a submitted syllabus', async () => {
      const mockResponse: Partial<Syllabus> = { id: 1, status: 'Draft' }
      ;(apiClient.post as any).mockResolvedValue({
        data: { data: mockResponse },
      })

      const result = await syllabusApi.withdrawSubmission(1)

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/syllabi/1/withdraw')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('Version Operations', () => {
    it('should fetch version history', async () => {
      const mockHistory = [
        {
          id: 1,
          syllabusId: 1,
          version: '1.0',
          changeSummary: 'Initial version',
          changedBy: 1,
          changedByName: 'John Doe',
          changedAt: '2024-01-01T00:00:00Z',
          changes: [],
        },
      ]
      ;(apiClient.get as any).mockResolvedValue({
        data: { data: mockHistory },
      })

      const result = await syllabusApi.getVersionHistory(1)

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/syllabi/1/versions')
      expect(result).toEqual(mockHistory)
    })

    it('should fetch a specific version', async () => {
      const mockVersion: Partial<Syllabus> = { id: 1, version: '1.0' }
      ;(apiClient.get as any).mockResolvedValue({
        data: { data: mockVersion },
      })

      const result = await syllabusApi.getSyllabusVersion(1, '1.0')

      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/v1/syllabi/1/versions/1.0'
      )
      expect(result).toEqual(mockVersion)
    })
  })

  describe('Preview Operations', () => {
    it('should fetch formatted preview', async () => {
      const mockHtml = '<html><body>Preview</body></html>'
      ;(apiClient.get as any).mockResolvedValue({
        data: { data: { html: mockHtml } },
      })

      const result = await syllabusApi.getPreview(1)

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/syllabi/1/preview')
      expect(result).toEqual(mockHtml)
    })

    it('should export syllabus as PDF', async () => {
      ;(apiClient.download as any).mockResolvedValue(undefined)

      await syllabusApi.exportPDF(1, 'syllabus.pdf')

      expect(apiClient.download).toHaveBeenCalledWith(
        '/api/v1/syllabi/1/export/pdf',
        'syllabus.pdf'
      )
    })
  })
})
