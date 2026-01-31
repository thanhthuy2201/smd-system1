/**
 * Zod Validation Schemas for Peer Review and Evaluation
 *
 * This module contains validation schemas for the peer review system.
 */
import { z } from 'zod'

// ============================================================================
// Criterion Score Schema
// ============================================================================

export const criterionScoreSchema = z.object({
  criterionId: z.number().int().positive(),
  criterionName: z.string(),
  score: z
    .number()
    .int('Score must be a whole number')
    .min(1, 'Score must be at least 1')
    .max(5, 'Score cannot exceed 5'),
  comment: z
    .string()
    .max(500, 'Comment must not exceed 500 characters')
    .optional(),
})

// ============================================================================
// Peer Evaluation Schema
// ============================================================================

export const peerEvaluationSchema = z.object({
  syllabusId: z.number().int().positive(),
  criteriaScores: z
    .array(criterionScoreSchema)
    .min(1, 'At least one criterion must be scored')
    .refine((scores) => {
      // Check if any score is 2 or lower and requires a comment
      return scores.every((score) => {
        if (score.score <= 2) {
          return score.comment && score.comment.trim().length > 0
        }
        return true
      })
    }, 'Scores of 2 or lower require a comment explaining the low score'),
  recommendation: z.enum(['Approve', 'Needs Revision', 'Reject']),
  summaryComments: z
    .string()
    .min(50, 'Summary comments must be at least 50 characters')
    .max(2000, 'Summary comments must not exceed 2000 characters'),
})

// ============================================================================
// Type Exports
// ============================================================================

export type CriterionScoreFormData = z.infer<typeof criterionScoreSchema>
export type PeerEvaluationFormData = z.infer<typeof peerEvaluationSchema>
