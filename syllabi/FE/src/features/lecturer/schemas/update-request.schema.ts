/**
 * Zod Validation Schemas for Update Requests
 *
 * This module contains validation schemas for post-approval update requests.
 */
import { z } from 'zod'

// ============================================================================
// Update Request Schema
// ============================================================================

export const updateRequestSchema = z.object({
  syllabusId: z
    .number()
    .int('Syllabus ID must be a valid number')
    .positive('Please select a syllabus'),
  changeType: z.enum(['Minor Update', 'Content Revision', 'Major Restructure']),
  affectedSections: z
    .array(z.string())
    .min(1, 'Select at least one affected section'),
  justification: z
    .string()
    .min(50, 'Justification must be at least 50 characters')
    .max(2000, 'Justification must not exceed 2000 characters'),
  effectiveSemester: z
    .string()
    .min(1, 'Effective semester is required')
    .regex(
      /^\d{4}-(Fall|Spring|Summer)$/,
      'Format must be YYYY-Semester (e.g., 2025-Fall)'
    ),
  urgency: z.enum(['Normal', 'High']),
  supportingDocuments: z
    .array(z.instanceof(File))
    .max(10, 'Maximum 10 supporting documents allowed')
    .refine(
      (files) => files.every((f) => f.size <= 10 * 1024 * 1024),
      'Each file must be 10MB or less'
    )
    .optional(),
})

// ============================================================================
// Type Exports
// ============================================================================

export type UpdateRequestFormData = z.infer<typeof updateRequestSchema>
