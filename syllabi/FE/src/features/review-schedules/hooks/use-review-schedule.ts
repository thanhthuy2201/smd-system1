import { useQuery } from '@tanstack/react-query'
import * as api from '../data/api'

/**
 * Query key factory for single review schedule
 * Ensures consistent cache keys across the application
 */
export const reviewScheduleKeys = {
  all: ['review-schedule'] as const,
  details: () => [...reviewScheduleKeys.all, 'detail'] as const,
  detail: (id: string) => [...reviewScheduleKeys.details(), id] as const,
}

/**
 * Hook for fetching a single review schedule by ID with full details
 *
 * Features:
 * - Automatic caching with TanStack Query
 * - Only fetches when ID is provided (enabled: !!id)
 * - Automatic refetch on window focus
 * - Stale time of 30 seconds
 *
 * @param id - The review schedule ID
 * @returns Query result with data, loading state, and error state
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useReviewSchedule(scheduleId);
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error loading schedule</div>;
 * if (!data) return null;
 *
 * const { data: schedule, assignments, progress, auditTrail } = data;
 * ```
 */
export function useReviewSchedule(id: string) {
  return useQuery({
    queryKey: reviewScheduleKeys.detail(id),
    queryFn: () => api.getById(id),
    // Only fetch when ID is provided
    enabled: !!id,
    // Consider data stale after 30 seconds
    staleTime: 30000,
  })
}
