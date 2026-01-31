/**
 * useSyllabusValidation Hook
 *
 * Custom hook for validating syllabus before submission.
 * Performs server-side validation and returns detailed validation results.
 *
 * Features:
 * - Server-side validation via API
 * - Detailed validation criteria results
 * - Error message formatting
 * - Loading and error states
 */
import { useMutation } from '@tanstack/react-query'
import { validateSyllabus } from '../api/syllabus.api'
import type { SubmissionValidation, ValidationCriterion } from '../types'

export interface UseSyllabusValidationOptions {
  syllabusId: number
  onSuccess?: (validation: SubmissionValidation) => void
  onError?: (error: Error) => void
}

export interface UseSyllabusValidationReturn {
  /** Trigger validation */
  validate: () => void
  /** Validation is in progress */
  isValidating: boolean
  /** Validation results */
  validation?: SubmissionValidation
  /** Validation error */
  error: Error | null
  /** Whether the syllabus is valid */
  isValid: boolean
  /** Failed validation criteria */
  failedCriteria: ValidationCriterion[]
  /** Passed validation criteria */
  passedCriteria: ValidationCriterion[]
  /** Reset validation state */
  reset: () => void
}

/**
 * Hook for validating syllabus before submission
 *
 * @example
 * ```tsx
 * const { validate, isValidating, isValid, failedCriteria } = useSyllabusValidation({
 *   syllabusId: 123
 * });
 *
 * // Trigger validation
 * validate();
 *
 * // Check results
 * if (isValid) {
 *   // Proceed with submission
 * } else {
 *   // Show failed criteria
 *   console.log(failedCriteria);
 * }
 * ```
 */
export function useSyllabusValidation({
  syllabusId,
  onSuccess,
  onError,
}: UseSyllabusValidationOptions): UseSyllabusValidationReturn {
  const mutation = useMutation({
    mutationFn: () => validateSyllabus(syllabusId),
    onSuccess: (data) => {
      onSuccess?.(data)
    },
    onError: (error: Error) => {
      console.error('[useSyllabusValidation] Validation failed:', error)
      onError?.(error)
    },
  })

  // Extract failed and passed criteria
  const failedCriteria = mutation.data?.criteria.filter((c) => !c.passed) || []
  const passedCriteria = mutation.data?.criteria.filter((c) => c.passed) || []

  return {
    validate: mutation.mutate,
    isValidating: mutation.isPending,
    validation: mutation.data,
    error: mutation.error,
    isValid: mutation.data?.isValid ?? false,
    failedCriteria,
    passedCriteria,
    reset: mutation.reset,
  }
}
