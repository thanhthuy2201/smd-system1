import { useQuery } from '@tanstack/react-query'
import * as api from '../data/api'
import type { ReviewSchedulesQueryParams } from '../data/schema'

/**
 * Query key factory for review schedules list
 * Ensures consistent cache keys across the application
 */
export const reviewSchedulesKeys = {
  all: ['review-schedules'] as const,
  lists: () => [...reviewSchedulesKeys.all, 'list'] as const,
  list: (params: ReviewSchedulesQueryParams) =>
    [...reviewSchedulesKeys.lists(), params] as const,
}

/**
 * Hook for fetching review schedules list with filtering, sorting, and pagination
 *
 * Features:
 * - Automatic caching with TanStack Query
 * - Keeps previous data while fetching new data (for smooth pagination)
 * - Automatic refetch on window focus
 * - Stale time of 30 seconds
 *
 * @param params - Query parameters for filtering, sorting, and pagination
 * @returns Query result with data, loading state, and error state
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useReviewSchedules({
 *   page: 1,
 *   pageSize: 20,
 *   search: 'HK1',
 *   status: 'ACTIVE'
 * });
 * ```
 */
export function useReviewSchedules(params: ReviewSchedulesQueryParams = {}) {
  return useQuery({
    queryKey: reviewSchedulesKeys.list(params),
    queryFn: () => api.list(params),
    // Keep previous data while fetching new data (smooth pagination)
    placeholderData: (previousData) => previousData,
    // Consider data stale after 30 seconds
    staleTime: 30000,
  })
}
