/**
 * Feedback API Tests
 *
 * Tests for feedback and commenting API functions
 * Validates Requirements 7.1-7.10
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '@/lib/api-client'
import type {
  Comment,
  CommentReply,
  NewComment,
  NewCommentReply,
} from '../../types'
import {
  getComments,
  getComment,
  addComment,
  updateComment,
  deleteComment,
  resolveComment,
  unresolveComment,
  addReply,
  updateReply,
  deleteReply,
} from '../feedback.api'

// Mock the API client
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('Feedback API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // Comment Operations Tests
  // ============================================================================

  describe('getComments', () => {
    it('should fetch all comments for a syllabus', async () => {
      const syllabusId = 123
      const mockComments: Comment[] = [
        {
          id: 1,
          syllabusId,
          userId: 1,
          userName: 'John Doe',
          type: 'Suggestion',
          text: 'Consider adding more examples',
          isResolved: false,
          createdAt: '2024-01-01T10:00:00Z',
          replies: [],
        },
        {
          id: 2,
          syllabusId,
          userId: 2,
          userName: 'Jane Smith',
          type: 'Error',
          sectionReference: 'CLO Section',
          text: 'CLO1 description is unclear',
          priority: 'High',
          isResolved: false,
          createdAt: '2024-01-02T10:00:00Z',
          replies: [],
        },
      ]

      ;(apiClient.get as any).mockResolvedValue({
        data: { data: mockComments },
      } as any)

      const result = await getComments(syllabusId)

      expect(apiClient.get).toHaveBeenCalledWith(
        `/api/v1/syllabi/${syllabusId}/comments`
      )
      expect(result).toEqual(mockComments)
    })
  })

  describe('getComment', () => {
    it('should fetch a specific comment by ID', async () => {
      const commentId = 1
      const mockComment: Comment = {
        id: commentId,
        syllabusId: 123,
        userId: 1,
        userName: 'John Doe',
        type: 'Question',
        text: 'What is the prerequisite for this course?',
        isResolved: false,
        createdAt: '2024-01-01T10:00:00Z',
        replies: [],
      }

      ;(apiClient.get as any).mockResolvedValue({
        data: { data: mockComment },
      } as any)

      const result = await getComment(commentId)

      expect(apiClient.get).toHaveBeenCalledWith(
        `/api/v1/comments/${commentId}`
      )
      expect(result).toEqual(mockComment)
    })
  })

  describe('addComment', () => {
    it('should add a new comment to a syllabus', async () => {
      const syllabusId = 123
      const newComment: NewComment = {
        type: 'Suggestion',
        sectionReference: 'Assessment Section',
        text: 'Consider adding a project component',
        priority: 'Medium',
      }

      const mockResponse: Comment = {
        id: 1,
        syllabusId,
        userId: 1,
        userName: 'John Doe',
        ...newComment,
        isResolved: false,
        createdAt: '2024-01-01T10:00:00Z',
        replies: [],
      }

      ;(apiClient.post as any).mockResolvedValue({
        data: { data: mockResponse },
      } as any)

      const result = await addComment(syllabusId, newComment)

      expect(apiClient.post).toHaveBeenCalledWith(
        `/api/v1/syllabi/${syllabusId}/comments`,
        newComment
      )
      expect(result).toEqual(mockResponse)
    })

    it('should add a comment without optional fields', async () => {
      const syllabusId = 123
      const newComment: NewComment = {
        type: 'General',
        text: 'Good work overall',
      }

      const mockResponse: Comment = {
        id: 1,
        syllabusId,
        userId: 1,
        userName: 'John Doe',
        ...newComment,
        isResolved: false,
        createdAt: '2024-01-01T10:00:00Z',
        replies: [],
      }

      ;(apiClient.post as any).mockResolvedValue({
        data: { data: mockResponse },
      } as any)

      const result = await addComment(syllabusId, newComment)

      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateComment', () => {
    it('should update an existing comment', async () => {
      const commentId = 1
      const updateData: Partial<NewComment> = {
        text: 'Updated comment text',
        priority: 'High',
      }

      const mockResponse: Comment = {
        id: commentId,
        syllabusId: 123,
        userId: 1,
        userName: 'John Doe',
        type: 'Error',
        text: 'Updated comment text',
        priority: 'High',
        isResolved: false,
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-02T10:00:00Z',
        replies: [],
      }

      ;(apiClient.put as any).mockResolvedValue({
        data: { data: mockResponse },
      } as any)

      const result = await updateComment(commentId, updateData)

      expect(apiClient.put).toHaveBeenCalledWith(
        `/api/v1/comments/${commentId}`,
        updateData
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('deleteComment', () => {
    it('should delete a comment', async () => {
      const commentId = 1

      ;(apiClient.delete as any).mockResolvedValue({} as any)

      await deleteComment(commentId)

      expect(apiClient.delete).toHaveBeenCalledWith(
        `/api/v1/comments/${commentId}`
      )
    })
  })

  describe('resolveComment', () => {
    it('should mark a comment as resolved', async () => {
      const commentId = 1
      const mockResponse: Comment = {
        id: commentId,
        syllabusId: 123,
        userId: 1,
        userName: 'John Doe',
        type: 'Error',
        text: 'This issue has been fixed',
        isResolved: true,
        createdAt: '2024-01-01T10:00:00Z',
        replies: [],
      }

      ;(apiClient.post as any).mockResolvedValue({
        data: { data: mockResponse },
      } as any)

      const result = await resolveComment(commentId)

      expect(apiClient.post).toHaveBeenCalledWith(
        `/api/v1/comments/${commentId}/resolve`
      )
      expect(result).toEqual(mockResponse)
      expect(result.isResolved).toBe(true)
    })
  })

  describe('unresolveComment', () => {
    it('should mark a comment as unresolved', async () => {
      const commentId = 1
      const mockResponse: Comment = {
        id: commentId,
        syllabusId: 123,
        userId: 1,
        userName: 'John Doe',
        type: 'Error',
        text: 'This issue needs more work',
        isResolved: false,
        createdAt: '2024-01-01T10:00:00Z',
        replies: [],
      }

      ;(apiClient.post as any).mockResolvedValue({
        data: { data: mockResponse },
      } as any)

      const result = await unresolveComment(commentId)

      expect(apiClient.post).toHaveBeenCalledWith(
        `/api/v1/comments/${commentId}/unresolve`
      )
      expect(result).toEqual(mockResponse)
      expect(result.isResolved).toBe(false)
    })
  })

  // ============================================================================
  // Comment Reply Operations Tests
  // ============================================================================

  describe('addReply', () => {
    it('should add a reply to a comment', async () => {
      const commentId = 1
      const newReply: NewCommentReply = {
        text: 'I agree with this suggestion',
      }

      const mockResponse: CommentReply = {
        id: 1,
        commentId,
        userId: 2,
        userName: 'Jane Smith',
        text: newReply.text,
        createdAt: '2024-01-02T10:00:00Z',
      }

      ;(apiClient.post as any).mockResolvedValue({
        data: { data: mockResponse },
      } as any)

      const result = await addReply(commentId, newReply)

      expect(apiClient.post).toHaveBeenCalledWith(
        `/api/v1/comments/${commentId}/replies`,
        newReply
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateReply', () => {
    it('should update an existing reply', async () => {
      const replyId = 1
      const updateData: Partial<NewCommentReply> = {
        text: 'Updated reply text',
      }

      const mockResponse: CommentReply = {
        id: replyId,
        commentId: 1,
        userId: 2,
        userName: 'Jane Smith',
        text: 'Updated reply text',
        createdAt: '2024-01-02T10:00:00Z',
        updatedAt: '2024-01-03T10:00:00Z',
      }

      ;(apiClient.put as any).mockResolvedValue({
        data: { data: mockResponse },
      } as any)

      const result = await updateReply(replyId, updateData)

      expect(apiClient.put).toHaveBeenCalledWith(
        `/api/v1/replies/${replyId}`,
        updateData
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('deleteReply', () => {
    it('should delete a reply', async () => {
      const replyId = 1

      ;(apiClient.delete as any).mockResolvedValue({} as any)

      await deleteReply(replyId)

      expect(apiClient.delete).toHaveBeenCalledWith(
        `/api/v1/replies/${replyId}`
      )
    })
  })

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Comment Threading', () => {
    it('should support threaded comments with replies', async () => {
      const syllabusId = 123
      const mockComments: Comment[] = [
        {
          id: 1,
          syllabusId,
          userId: 1,
          userName: 'John Doe',
          type: 'Question',
          text: 'What is the prerequisite?',
          isResolved: false,
          createdAt: '2024-01-01T10:00:00Z',
          replies: [
            {
              id: 1,
              commentId: 1,
              userId: 2,
              userName: 'Jane Smith',
              text: 'CS101 is the prerequisite',
              createdAt: '2024-01-01T11:00:00Z',
            },
            {
              id: 2,
              commentId: 1,
              userId: 1,
              userName: 'John Doe',
              text: 'Thank you for clarifying',
              createdAt: '2024-01-01T12:00:00Z',
            },
          ],
        },
      ]

      ;(apiClient.get as any).mockResolvedValue({
        data: { data: mockComments },
      } as any)

      const result = await getComments(syllabusId)

      expect(result[0].replies).toHaveLength(2)
      expect(result[0].replies[0].commentId).toBe(1)
      expect(result[0].replies[1].commentId).toBe(1)
    })
  })

  describe('Comment Types', () => {
    it('should support all comment types', async () => {
      const syllabusId = 123
      const commentTypes: Array<
        'Suggestion' | 'Question' | 'Error' | 'General'
      > = ['Suggestion', 'Question', 'Error', 'General']

      for (const type of commentTypes) {
        const newComment: NewComment = {
          type,
          text: `This is a ${type} comment`,
        }

        const mockResponse: Comment = {
          id: 1,
          syllabusId,
          userId: 1,
          userName: 'John Doe',
          ...newComment,
          isResolved: false,
          createdAt: '2024-01-01T10:00:00Z',
          replies: [],
        }

        ;(apiClient.post as any).mockResolvedValue({
          data: { data: mockResponse },
        } as any)

        const result = await addComment(syllabusId, newComment)

        expect(result.type).toBe(type)
      }
    })
  })

  describe('Priority Levels', () => {
    it('should support priority levels for error comments', async () => {
      const syllabusId = 123
      const priorities: Array<'Low' | 'Medium' | 'High'> = [
        'Low',
        'Medium',
        'High',
      ]

      for (const priority of priorities) {
        const newComment: NewComment = {
          type: 'Error',
          text: 'This is an error',
          priority,
        }

        const mockResponse: Comment = {
          id: 1,
          syllabusId,
          userId: 1,
          userName: 'John Doe',
          ...newComment,
          isResolved: false,
          createdAt: '2024-01-01T10:00:00Z',
          replies: [],
        }

        ;(apiClient.post as any).mockResolvedValue({
          data: { data: mockResponse },
        } as any)

        const result = await addComment(syllabusId, newComment)

        expect(result.priority).toBe(priority)
      }
    })
  })
})
