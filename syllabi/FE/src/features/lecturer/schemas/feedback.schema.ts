/**
 * Zod Validation Schemas for Feedback and Comments
 *
 * This module contains validation schemas for the collaborative feedback system.
 */
import { z } from 'zod'

// ============================================================================
// Comment Schema
// ============================================================================

export const commentSchema = z.object({
  type: z.enum(['Suggestion', 'Question', 'Error', 'General']),
  sectionReference: z
    .string()
    .max(100, 'Section reference must not exceed 100 characters')
    .optional(),
  text: z
    .string()
    .min(10, 'Comment must be at least 10 characters')
    .max(1000, 'Comment must not exceed 1000 characters'),
  priority: z
    .enum(['Low', 'Medium', 'High'])
    .optional(),
})

// ============================================================================
// Comment Reply Schema
// ============================================================================

export const commentReplySchema = z.object({
  text: z
    .string()
    .min(10, 'Reply must be at least 10 characters')
    .max(1000, 'Reply must not exceed 1000 characters'),
})

// ============================================================================
// Type Exports
// ============================================================================

export type CommentFormData = z.infer<typeof commentSchema>
export type CommentReplyFormData = z.infer<typeof commentReplySchema>
