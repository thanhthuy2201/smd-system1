/**
 * useReviewSchedules Hook
 *
 * Custom hook for fetching review schedules and tracking deadlines.
 *
 * Features:
 * - Fetch review schedules for lecturer's department
 * - Filter by status (upcoming, active, completed)
 * - Calculate days until deadline
 * - Identify approaching deadlines
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { getReviewSchedules } from '../api/review.api'
import type { ReviewSchedule } from '../types'

export interface UseReviewSchedulesOptions {
  /** Enable/disable the query */
  enabled?: boolean
}

export type UseReviewSchedulesReturn = UseQueryResult<
  ReviewSchedule[]
> & {
  /** List of review schedules */
  schedules: ReviewSchedule[]
  /** Active review schedules */
  activeSchedules: ReviewSchedule[]
  /** Upcoming review schedules */
  upcomingSchedules: ReviewSchedule[]
  /** Completed review schedules */
  completedSchedules: ReviewSchedule[]
  /** Schedules with deadlines within 7 days */
  approachingDeadlines: Array<ReviewSchedule & { daysUntilDeadline: number }>
}

/**
 * Hook for fetching review schedules
 *
 * @example
 * ```tsx
 * const { schedules, activeSchedules, approachingDeadlines, isLoading } = useReviewSchedules();
 *
 * // Display active schedules
 * activeSchedules.map(schedule => (
 *   <div key={schedule.id}>{schedule.reviewType}</div>
 * ));
 *
 * // Show deadline alerts
 * approachingDeadlines.map(schedule => (
 *   <Alert key={schedule.id}>
 *     Deadline in {schedule.daysUntilDeadline} days
 *   </Alert>
 * ));
 * ```
 */
export function useReviewSchedules(
  options: UseReviewSchedulesOptions = {}
): UseReviewSchedulesReturn {
  const { enabled = true } = options

  const query = useQuery({
    queryKey: ['lecturer', 'reviews', 'schedules'],
    queryFn: getReviewSchedules,
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })

  const schedules = query.data || []

  // Filter schedules by status
  const activeSchedules = schedules.filter((s) => s.status === 'Active')
  const upcomingSchedules = schedules.filter((s) => s.status === 'Upcoming')
  const completedSchedules = schedules.filter((s) => s.status === 'Completed')

  // Calculate approaching deadlines (within 7 days)
  const now = new Date()
  const approachingDeadlines = schedules
    .filter((s) => s.status === 'Active' || s.status === 'Upcoming')
    .map((schedule) => {
      const endDate = new Date(schedule.endDate)
      const daysUntilDeadline = Math.ceil(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      return { ...schedule, daysUntilDeadline }
    })
    .filter((s) => s.daysUntilDeadline >= 0 && s.daysUntilDeadline <= 7)
    .sort((a, b) => a.daysUntilDeadline - b.daysUntilDeadline)

  return {
    ...query,
    schedules,
    activeSchedules,
    upcomingSchedules,
    completedSchedules,
    approachingDeadlines,
  }
}
