/**
 * Unit Tests for Review and Evaluation API Functions
 *
 * Tests verify that all API functions are properly defined and
 * make correct API calls with appropriate parameters.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type {
  ReviewSchedule,
  ApprovalTimeline,
  PeerReviewAssignment,
  EvaluationTemplate,
  PeerEvaluation,
} from '../../types'
import {
  getReviewSchedules,
  getActiveReviewSchedule,
  getApprovalTimeline,
  getMySubmissions,
  getSubmissions,
  getPeerReviews,
  getPeerReview,
  getEvaluationTemplate,
  createPeerEvaluation,
  updatePeerEvaluation,
  submitPeerEvaluation,
  getPeerEvaluation,
  getPeerEvaluationBySyllabus,
} from '../review.api'

// Mock the API client
const mockGet = vi.fn()
const mockPost = vi.fn()
const mockPut = vi.fn()

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
  },
}))

describe('Review and Evaluation API Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // Review Schedule Operations
  // ============================================================================

  describe('getReviewSchedules', () => {
    it("should fetch review schedules for the lecturer's department", async () => {
      const mockSchedules: ReviewSchedule[] = [
        {
          id: 1,
          departmentId: 1,
          departmentName: 'Computer Science',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          reviewType: 'Peer Review',
          status: 'Active',
        },
      ]

      mockGet.mockResolvedValue({
        data: { data: mockSchedules },
      })

      const result = await getReviewSchedules()

      expect(mockGet).toHaveBeenCalledWith('/api/v1/lecturer/review-schedules')
      expect(result).toEqual(mockSchedules)
    })
  })

  describe('getActiveReviewSchedule', () => {
    it('should fetch the active review schedule', async () => {
      const mockSchedule: ReviewSchedule = {
        id: 1,
        departmentId: 1,
        departmentName: 'Computer Science',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        reviewType: 'Peer Review',
        status: 'Active',
      }

      mockGet.mockResolvedValue({
        data: { data: mockSchedule },
      })

      const result = await getActiveReviewSchedule()

      expect(mockGet).toHaveBeenCalledWith(
        '/api/v1/lecturer/review-schedules/active'
      )
      expect(result).toEqual(mockSchedule)
    })

    it('should return null when no active schedule exists', async () => {
      mockGet.mockResolvedValue({
        data: { data: null },
      })

      const result = await getActiveReviewSchedule()

      expect(result).toBeNull()
    })
  })

  // ============================================================================
  // Submission Tracking Operations
  // ============================================================================

  describe('getApprovalTimeline', () => {
    it('should fetch approval timeline for a specific syllabus', async () => {
      const syllabusId = 123
      const mockTimeline: ApprovalTimeline[] = [
        {
          id: 1,
          syllabusId,
          stage: 'Submitted',
          timestamp: '2024-01-01T10:00:00Z',
        },
        {
          id: 2,
          syllabusId,
          stage: 'HoD Review',
          reviewerId: 1,
          reviewerName: 'Dr. Smith',
          reviewerRole: 'HoD',
          timestamp: '2024-01-02T10:00:00Z',
        },
      ]

      mockGet.mockResolvedValue({
        data: { data: mockTimeline },
      })

      const result = await getApprovalTimeline(syllabusId)

      expect(mockGet).toHaveBeenCalledWith(
        `/api/v1/syllabi/${syllabusId}/approval-timeline`
      )
      expect(result).toEqual(mockTimeline)
    })
  })

  describe('getMySubmissions / getSubmissions', () => {
    it('should fetch all submissions by the current lecturer', async () => {
      const mockSubmissions = {
        data: [
          {
            id: 1,
            syllabusId: 123,
            stage: 'Submitted' as const,
            timestamp: '2024-01-01T10:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      }

      mockGet.mockResolvedValue({
        data: { data: mockSubmissions },
      })

      const result = await getMySubmissions()

      expect(mockGet).toHaveBeenCalledWith('/api/v1/lecturer/submissions')
      expect(result).toEqual(mockSubmissions)
    })

    it('should have getSubmissions as an alias for getMySubmissions', () => {
      expect(getSubmissions).toBe(getMySubmissions)
    })
  })

  // ============================================================================
  // Peer Review Operations
  // ============================================================================

  describe('getPeerReviews', () => {
    it('should fetch peer review assignments for the current lecturer', async () => {
      const mockReviews: PeerReviewAssignment[] = [
        {
          id: 1,
          syllabusId: 123,
          syllabus: {
            id: 123,
            courseCode: 'CS101',
            courseName: 'Introduction to Programming',
            academicYear: '2024-2025',
            semester: 'Fall',
            credits: 3,
            totalHours: 45,
            description: 'Test description',
            status: 'Pending Review',
            version: '1.0',
            createdAt: '2024-01-01T10:00:00Z',
            updatedAt: '2024-01-01T10:00:00Z',
            lecturerId: 1,
            courseId: 1,
            clos: [],
            content: [],
            assessments: [],
            references: [],
          },
          assignedAt: '2024-01-01T10:00:00Z',
          dueDate: '2024-01-15T10:00:00Z',
          status: 'Pending',
        },
      ]

      mockGet.mockResolvedValue({
        data: { data: mockReviews },
      })

      const result = await getPeerReviews()

      expect(mockGet).toHaveBeenCalledWith('/api/v1/lecturer/peer-reviews')
      expect(result).toEqual(mockReviews)
    })
  })

  describe('getPeerReview', () => {
    it('should fetch a specific peer review assignment', async () => {
      const reviewId = 1
      const mockReview: PeerReviewAssignment = {
        id: reviewId,
        syllabusId: 123,
        syllabus: {
          id: 123,
          courseCode: 'CS101',
          courseName: 'Introduction to Programming',
          academicYear: '2024-2025',
          semester: 'Fall',
          credits: 3,
          totalHours: 45,
          description: 'Test description',
          status: 'Pending Review',
          version: '1.0',
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
          lecturerId: 1,
          courseId: 1,
          clos: [],
          content: [],
          assessments: [],
          references: [],
        },
        assignedAt: '2024-01-01T10:00:00Z',
        dueDate: '2024-01-15T10:00:00Z',
        status: 'Pending',
      }

      mockGet.mockResolvedValue({
        data: { data: mockReview },
      })

      const result = await getPeerReview(reviewId)

      expect(mockGet).toHaveBeenCalledWith(
        `/api/v1/lecturer/peer-reviews/${reviewId}`
      )
      expect(result).toEqual(mockReview)
    })
  })

  describe('getEvaluationTemplate', () => {
    it('should fetch the evaluation template', async () => {
      const mockTemplate: EvaluationTemplate = {
        id: 1,
        name: 'Default Evaluation Template',
        criteria: [
          {
            id: 1,
            name: 'Learning Outcomes',
            description: 'Quality and clarity of learning outcomes',
            weight: 0.3,
            maxScore: 5,
          },
          {
            id: 2,
            name: 'Content Organization',
            description: 'Logical organization of course content',
            weight: 0.3,
            maxScore: 5,
          },
        ],
      }

      mockGet.mockResolvedValue({
        data: { data: mockTemplate },
      })

      const result = await getEvaluationTemplate()

      expect(mockGet).toHaveBeenCalledWith(
        '/api/v1/evaluation-templates/default'
      )
      expect(result).toEqual(mockTemplate)
    })
  })

  // ============================================================================
  // Peer Evaluation Operations
  // ============================================================================

  describe('createPeerEvaluation', () => {
    it('should create a new peer evaluation', async () => {
      const newEvaluation: Partial<PeerEvaluation> = {
        syllabusId: 123,
        reviewerId: 1,
        criteriaScores: [
          {
            criterionId: 1,
            criterionName: 'Learning Outcomes',
            score: 4,
            comment: 'Good quality',
          },
        ],
        overallScore: 4,
        recommendation: 'Approve',
        summaryComments: 'Well-structured syllabus',
        status: 'Draft',
      }

      const mockResponse: PeerEvaluation = {
        id: 1,
        ...newEvaluation,
      } as PeerEvaluation

      mockPost.mockResolvedValue({
        data: { data: mockResponse },
      })

      const result = await createPeerEvaluation(newEvaluation)

      expect(mockPost).toHaveBeenCalledWith(
        '/api/v1/peer-evaluations',
        newEvaluation
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updatePeerEvaluation', () => {
    it('should update an existing peer evaluation', async () => {
      const evaluationId = 1
      const updates: Partial<PeerEvaluation> = {
        overallScore: 5,
        recommendation: 'Approve',
        summaryComments: 'Excellent syllabus',
      }

      const mockResponse: PeerEvaluation = {
        id: evaluationId,
        syllabusId: 123,
        reviewerId: 1,
        criteriaScores: [],
        overallScore: 5,
        recommendation: 'Approve',
        summaryComments: 'Excellent syllabus',
        status: 'Draft',
      }

      mockPut.mockResolvedValue({
        data: { data: mockResponse },
      })

      const result = await updatePeerEvaluation(evaluationId, updates)

      expect(mockPut).toHaveBeenCalledWith(
        `/api/v1/peer-evaluations/${evaluationId}`,
        updates
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('submitPeerEvaluation', () => {
    it('should submit a peer evaluation', async () => {
      const evaluationId = 1
      const mockResponse: PeerEvaluation = {
        id: evaluationId,
        syllabusId: 123,
        reviewerId: 1,
        criteriaScores: [],
        overallScore: 4,
        recommendation: 'Approve',
        summaryComments: 'Good syllabus',
        status: 'Submitted',
      }

      mockPost.mockResolvedValue({
        data: { data: mockResponse },
      })

      const result = await submitPeerEvaluation(evaluationId)

      expect(mockPost).toHaveBeenCalledWith(
        `/api/v1/peer-evaluations/${evaluationId}/submit`
      )
      expect(result).toEqual(mockResponse)
      expect(result.status).toBe('Submitted')
    })
  })

  describe('getPeerEvaluation', () => {
    it('should fetch a peer evaluation by ID', async () => {
      const evaluationId = 1
      const mockEvaluation: PeerEvaluation = {
        id: evaluationId,
        syllabusId: 123,
        reviewerId: 1,
        criteriaScores: [],
        overallScore: 4,
        recommendation: 'Approve',
        summaryComments: 'Good syllabus',
        status: 'Submitted',
      }

      mockGet.mockResolvedValue({
        data: { data: mockEvaluation },
      })

      const result = await getPeerEvaluation(evaluationId)

      expect(mockGet).toHaveBeenCalledWith(
        `/api/v1/peer-evaluations/${evaluationId}`
      )
      expect(result).toEqual(mockEvaluation)
    })
  })

  describe('getPeerEvaluationBySyllabus', () => {
    it('should fetch a peer evaluation for a specific syllabus', async () => {
      const syllabusId = 123
      const mockEvaluation: PeerEvaluation = {
        id: 1,
        syllabusId,
        reviewerId: 1,
        criteriaScores: [],
        overallScore: 4,
        recommendation: 'Approve',
        summaryComments: 'Good syllabus',
        status: 'Submitted',
      }

      mockGet.mockResolvedValue({
        data: { data: mockEvaluation },
      })

      const result = await getPeerEvaluationBySyllabus(syllabusId)

      expect(mockGet).toHaveBeenCalledWith(
        `/api/v1/peer-evaluations/syllabus/${syllabusId}`
      )
      expect(result).toEqual(mockEvaluation)
    })

    it('should return null when no evaluation exists for the syllabus', async () => {
      const syllabusId = 123

      mockGet.mockResolvedValue({
        data: { data: null },
      })

      const result = await getPeerEvaluationBySyllabus(syllabusId)

      expect(result).toBeNull()
    })
  })
})
