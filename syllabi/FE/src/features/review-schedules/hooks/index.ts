/**
 * Review Schedule Management Hooks
 *
 * This module exports all TanStack Query hooks for the review schedule management feature.
 * Import hooks from this file for cleaner imports throughout the application.
 *
 * @example
 * ```tsx
 * import {
 *   useReviewSchedules,
 *   useReviewSchedule,
 *   useCreateReviewSchedule,
 *   useProgressStatistics
 * } from '@/features/review-schedules/hooks';
 * ```
 */

// Query hooks
export { useReviewSchedules, reviewSchedulesKeys } from './use-review-schedules'
export { useReviewSchedule, reviewScheduleKeys } from './use-review-schedule'
export {
  useProgressStatistics,
  progressStatisticsKeys,
} from './use-progress-statistics'

// Mutation hooks
export {
  useCreateReviewSchedule,
  useUpdateReviewSchedule,
  useDeleteReviewSchedule,
  useAssignReviewer,
  useUpdateAssignment,
  useRemoveAssignment,
  useSendReminders,
  useExportReport,
} from './use-review-mutations'

// Utility hooks
export { useFormDirty } from './use-form-dirty'
