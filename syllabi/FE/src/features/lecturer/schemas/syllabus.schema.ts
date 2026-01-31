/**
 * Zod Validation Schemas for Syllabus Forms
 *
 * This module contains all validation schemas for syllabus-related forms,
 * including CLOs, course content, assessments, and references.
 */
import { z } from 'zod'

// ============================================================================
// CLO Schema
// ============================================================================

export const cloSchema = z.object({
  id: z.number().optional(),
  code: z
    .string()
    .regex(/^CLO\d+$/, 'CLO code must be in format CLO1, CLO2, etc.'),
  description: z
    .string()
    .min(20, 'CLO description must be at least 20 characters')
    .refine(
      (val) => /^[A-Z]/.test(val.trim()),
      'CLO description must start with an action verb (capitalized)'
    ),
  bloomLevel: z.enum([
    'Remember',
    'Understand',
    'Apply',
    'Analyze',
    'Evaluate',
    'Create',
  ]),
  mappedPlos: z
    .array(z.string())
    .min(1, 'CLO must be mapped to at least one PLO'),
})

// ============================================================================
// Course Content Schema
// ============================================================================

export const courseContentSchema = z.object({
  id: z.number().optional(),
  weekNumber: z
    .number()
    .int()
    .positive('Week number must be a positive integer'),
  title: z
    .string()
    .min(1, 'Topic title is required')
    .max(200, 'Topic title must not exceed 200 characters'),
  description: z
    .string()
    .min(1, 'Topic description is required')
    .max(1000, 'Topic description must not exceed 1000 characters'),
  lectureHours: z
    .number()
    .min(0, 'Lecture hours cannot be negative')
    .max(10, 'Lecture hours cannot exceed 10 per topic'),
  labHours: z
    .number()
    .min(0, 'Lab hours cannot be negative')
    .max(10, 'Lab hours cannot exceed 10 per topic'),
  relatedClos: z
    .array(z.string())
    .min(1, 'Topic must relate to at least one CLO'),
  teachingMethods: z
    .array(z.string())
    .min(1, 'Select at least one teaching method'),
})

// ============================================================================
// Assessment Schema
// ============================================================================

export const assessmentSchema = z.object({
  id: z.number().optional(),
  type: z.enum([
    'Quiz',
    'Assignment',
    'Midterm',
    'Final',
    'Project',
    'Presentation',
  ]),
  name: z
    .string()
    .min(1, 'Assessment name is required')
    .max(100, 'Assessment name must not exceed 100 characters'),
  weight: z
    .number()
    .min(0, 'Weight cannot be negative')
    .max(100, 'Weight cannot exceed 100%'),
  relatedClos: z
    .array(z.string())
    .min(1, 'Assessment must relate to at least one CLO'),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
})

// ============================================================================
// Reference Schema
// ============================================================================

export const referenceSchema = z.object({
  id: z.number().optional(),
  type: z.enum(['Required', 'Recommended', 'Online Resource']),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(300, 'Title must not exceed 300 characters'),
  authors: z
    .string()
    .min(1, 'Authors are required')
    .max(200, 'Authors must not exceed 200 characters'),
  publisher: z
    .string()
    .max(100, 'Publisher must not exceed 100 characters')
    .optional(),
  year: z
    .number()
    .int('Year must be a whole number')
    .min(1900, 'Year must be 1900 or later')
    .max(
      new Date().getFullYear(),
      `Year cannot be later than ${new Date().getFullYear()}`
    )
    .optional(),
  isbn: z
    .string()
    .regex(
      /^(?:\d{10}|\d{13})$/,
      'Invalid ISBN format (must be 10 or 13 digits)'
    )
    .optional()
    .or(z.literal('')),
  url: z.string().url('Invalid URL format').optional().or(z.literal('')),
})

// ============================================================================
// Complete Syllabus Schema
// ============================================================================

export const syllabusSchema = z.object({
  courseId: z.number().int().positive('Course selection is required'),
  academicYear: z
    .string()
    .regex(
      /^\d{4}-\d{4}$/,
      'Academic year format must be YYYY-YYYY (e.g., 2024-2025)'
    ),
  semester: z.enum(['Fall', 'Spring', 'Summer']),
  credits: z
    .number()
    .int('Credits must be a whole number')
    .min(1, 'Credits must be at least 1')
    .max(10, 'Credits cannot exceed 10'),
  totalHours: z
    .number()
    .int('Total hours must be a whole number')
    .positive('Total hours must be positive'),
  description: z
    .string()
    .min(100, 'Course description must be at least 100 characters')
    .max(2000, 'Course description must not exceed 2000 characters'),
  clos: z.array(cloSchema).min(3, 'Minimum 3 CLOs required'),
  content: z
    .array(courseContentSchema)
    .min(1, 'At least one topic is required'),
  assessments: z
    .array(assessmentSchema)
    .min(1, 'At least one assessment is required')
    .refine((assessments) => {
      const total = assessments.reduce((sum, a) => sum + a.weight, 0)
      return Math.abs(total - 100) < 0.01
    }, 'Assessment weights must total exactly 100%'),
  references: z
    .array(referenceSchema)
    .min(1, 'At least one reference is required')
    .refine(
      (refs) => refs.some((r) => r.type === 'Required'),
      'At least one required textbook must be specified'
    ),
})

// ============================================================================
// Partial Syllabus Schema (for drafts)
// ============================================================================

export const draftSyllabusSchema = z.object({
  courseId: z.number().int().positive().optional(),
  academicYear: z
    .string()
    .regex(/^\d{4}-\d{4}$/, 'Academic year format must be YYYY-YYYY')
    .optional(),
  semester: z.enum(['Fall', 'Spring', 'Summer']).optional(),
  credits: z.number().int().min(1).max(10).optional(),
  totalHours: z.number().int().positive().optional(),
  description: z.string().max(2000).optional(),
  clos: z.array(cloSchema).optional(),
  content: z.array(courseContentSchema).optional(),
  assessments: z.array(assessmentSchema).optional(),
  references: z.array(referenceSchema).optional(),
})

// ============================================================================
// Submission Notes Schema
// ============================================================================

export const submissionNotesSchema = z.object({
  notes: z
    .string()
    .max(1000, 'Notes must not exceed 1000 characters')
    .optional(),
  confirm: z
    .boolean()
    .refine(
      (val) => val === true,
      'You must confirm that the syllabus is ready for submission'
    ),
})

// ============================================================================
// Type Exports
// ============================================================================

export type CLOFormData = z.infer<typeof cloSchema>
export type CourseContentFormData = z.infer<typeof courseContentSchema>
export type AssessmentFormData = z.infer<typeof assessmentSchema>
export type ReferenceFormData = z.infer<typeof referenceSchema>
export type SyllabusFormData = z.infer<typeof syllabusSchema>
export type DraftSyllabusFormData = z.infer<typeof draftSyllabusSchema>
export type SubmissionNotesFormData = z.infer<typeof submissionNotesSchema>
