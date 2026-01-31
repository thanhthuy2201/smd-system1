/**
 * Zod Validation Schemas for Internal Messaging
 *
 * This module contains validation schemas for the internal messaging system.
 */
import { z } from 'zod'

// ============================================================================
// Message Schema
// ============================================================================

export const messageSchema = z.object({
  recipientId: z
    .number()
    .int('Recipient ID must be a valid number')
    .positive('Please select a recipient'),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200, 'Subject must not exceed 200 characters'),
  body: z
    .string()
    .min(1, 'Message body is required')
    .max(5000, 'Message body must not exceed 5000 characters'),
  syllabusId: z.number().int().positive().optional(),
  attachments: z
    .array(z.instanceof(File))
    .max(5, 'Maximum 5 attachments allowed')
    .refine(
      (files) => files.every((f) => f.size <= 10 * 1024 * 1024),
      'Each file must be 10MB or less'
    )
    .optional(),
})

// ============================================================================
// Type Exports
// ============================================================================

export type MessageFormData = z.infer<typeof messageSchema>
