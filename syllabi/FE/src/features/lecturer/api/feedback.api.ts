/**
 * Feedback and Comments API Functions
 *
 * This module contains all API functions for the collaborative feedback system.
 */
import { apiClient } from '@/lib/api-client'
import type {
  Comment,
  CommentReply,
  NewComment,
  NewCommentReply,
  ApiResponse,
} from '../types'

// ============================================================================
// Comment Operations
// ============================================================================

/**
 * Get all comments for a syllabus
 */
export const getComments = async (syllabusId: number): Promise<Comment[]> => {
  const response = await apiClient.get<ApiResponse<Comment[]>>(
    `/api/v1/syllabi/${syllabusId}/comments`
  )
  return response.data.items
}

/**
 * Get a specific comment by ID
 */
export const getComment = async (commentId: number): Promise<Comment> => {
  const response = await apiClient.get<ApiResponse<Comment>>(
    `/api/v1/comments/${commentId}`
  )
  return response.data.items
}

/**
 * Add a new comment to a syllabus
 */
export const addComment = async (
  syllabusId: number,
  data: NewComment
): Promise<Comment> => {
  const response = await apiClient.post<ApiResponse<Comment>>(
    `/api/v1/syllabi/${syllabusId}/comments`,
    data
  )
  return response.data.items
}

/**
 * Update an existing comment
 */
export const updateComment = async (
  commentId: number,
  data: Partial<NewComment>
): Promise<Comment> => {
  const response = await apiClient.put<ApiResponse<Comment>>(
    `/api/v1/comments/${commentId}`,
    data
  )
  return response.data.items
}

/**
 * Delete a comment
 */
export const deleteComment = async (commentId: number): Promise<void> => {
  await apiClient.delete(`/api/v1/comments/${commentId}`)
}

/**
 * Mark a comment as resolved
 */
export const resolveComment = async (commentId: number): Promise<Comment> => {
  const response = await apiClient.post<ApiResponse<Comment>>(
    `/api/v1/comments/${commentId}/resolve`
  )
  return response.data.items
}

/**
 * Mark a comment as unresolved
 */
export const unresolveComment = async (commentId: number): Promise<Comment> => {
  const response = await apiClient.post<ApiResponse<Comment>>(
    `/api/v1/comments/${commentId}/unresolve`
  )
  return response.data.items
}

// ============================================================================
// Comment Reply Operations
// ============================================================================

/**
 * Add a reply to a comment
 */
export const addReply = async (
  commentId: number,
  data: NewCommentReply
): Promise<CommentReply> => {
  const response = await apiClient.post<ApiResponse<CommentReply>>(
    `/api/v1/comments/${commentId}/replies`,
    data
  )
  return response.data.items
}

/**
 * Update a reply
 */
export const updateReply = async (
  replyId: number,
  data: Partial<NewCommentReply>
): Promise<CommentReply> => {
  const response = await apiClient.put<ApiResponse<CommentReply>>(
    `/api/v1/replies/${replyId}`,
    data
  )
  return response.data.items
}

/**
 * Delete a reply
 */
export const deleteReply = async (replyId: number): Promise<void> => {
  await apiClient.delete(`/api/v1/replies/${replyId}`)
}
