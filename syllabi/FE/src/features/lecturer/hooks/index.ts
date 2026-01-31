/**
 * Lecturer Hooks Index
 *
 * Central export point for all custom hooks used in the lecturer module.
 */

// Form and validation hooks
export { useSyllabusForm } from './useSyllabusForm'
export { useAutoSave } from './useAutoSave'
export { useSyllabusValidation } from './useSyllabusValidation'

// Data fetching hooks
export { useSyllabiList } from './useSyllabiList'
export { useReviewSchedules } from './useReviewSchedules'
export { usePeerReviews } from './usePeerReviews'
export { useMessaging, useConversation } from './useMessaging'
export { useFeedback } from './useFeedback'
export { useNotifications } from './useNotifications'
export {
  useUpdateRequests,
  useUpdateRequestsList,
  useUpdateRequest,
  useApprovedSyllabi,
} from './useUpdateRequests'

// Re-export types for convenience
export type {
  UseSyllabusFormOptions,
  UseSyllabusFormReturn,
} from './useSyllabusForm'
export type { UseAutoSaveOptions } from './useAutoSave'
export type {
  UseSyllabusValidationOptions,
  UseSyllabusValidationReturn,
} from './useSyllabusValidation'
export type {
  UseSyllabiListOptions,
  UseSyllabiListReturn,
} from './useSyllabiList'
export type {
  UseReviewSchedulesOptions,
  UseReviewSchedulesReturn,
} from './useReviewSchedules'
export type {
  UsePeerReviewsOptions,
  UsePeerReviewsReturn,
} from './usePeerReviews'
export type {
  UseMessagingOptions,
  UseMessagingReturn,
  UseConversationOptions,
  UseConversationReturn,
} from './useMessaging'
export type {
  UseFeedbackOptions,
  UseFeedbackReturn,
} from './useFeedback'
