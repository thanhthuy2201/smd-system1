import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as api from '../data/api'

/**
 * Query key factory for progress statistics
 * Ensures consistent cache keys across the application
 */
export const progressStatisticsKeys = {
  all: ['review-schedule-progress'] as const,
  progress: (scheduleId: string) =>
    [...progressStatisticsKeys.all, scheduleId] as const,
}

/**
 * Hook to detect user inactivity
 * Pauses auto-refresh when user is inactive for specified duration
 *
 * @param inactivityTimeout - Time in milliseconds before considering user inactive (default: 5 minutes)
 * @returns Boolean indicating if user is active
 */
function useUserActivity(inactivityTimeout = 5 * 60 * 1000) {
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const resetTimer = () => {
      setIsActive(true)
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setIsActive(false)
      }, inactivityTimeout)
    }

    // Events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ]

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, resetTimer, true)
    })

    // Initialize timer
    resetTimer()

    // Cleanup
    return () => {
      clearTimeout(timeoutId)
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer, true)
      })
    }
  }, [inactivityTimeout])

  return isActive
}

/**
 * Hook for fetching progress statistics with automatic refresh
 *
 * Features:
 * - Automatic caching with TanStack Query
 * - Auto-refresh every 60 seconds (configurable)
 * - Only fetches when schedule ID is provided
 * - Stale time of 30 seconds
 * - Pauses auto-refresh when user is inactive
 * - Graceful error handling
 *
 * @param scheduleId - The review schedule ID
 * @param options - Optional configuration
 * @param options.refetchInterval - Refresh interval in milliseconds (default: 60000 = 60 seconds)
 * @param options.enabled - Whether to enable the query (default: true if scheduleId exists)
 * @param options.pauseOnInactive - Whether to pause auto-refresh when user is inactive (default: true)
 * @param options.inactivityTimeout - Time in milliseconds before considering user inactive (default: 5 minutes)
 * @returns Query result with data, loading state, error state, and refetch function
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, isRefetching, refetch } = useProgressStatistics(scheduleId);
 *
 * if (isLoading) return <div>Loading progress...</div>;
 * if (error) return <div>Error loading progress</div>;
 * if (!data) return null;
 *
 * return (
 *   <div>
 *     <p>Overall Progress: {data.overall.percentage}%</p>
 *     {isRefetching && <span>Refreshing...</span>}
 *     <button onClick={() => refetch()}>Manual Refresh</button>
 *   </div>
 * );
 * ```
 *
 * @example
 * ```tsx
 * // Custom refresh interval (30 seconds)
 * const { data } = useProgressStatistics(scheduleId, { refetchInterval: 30000 });
 * ```
 *
 * @example
 * ```tsx
 * // Disable auto-refresh
 * const { data } = useProgressStatistics(scheduleId, { refetchInterval: false });
 * ```
 *
 * @example
 * ```tsx
 * // Disable pause on inactive
 * const { data } = useProgressStatistics(scheduleId, { pauseOnInactive: false });
 * ```
 *
 * Validates Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.8
 */
export function useProgressStatistics(
  scheduleId: string,
  options?: {
    refetchInterval?: number | false
    enabled?: boolean
    pauseOnInactive?: boolean
    inactivityTimeout?: number
  }
) {
  const {
    refetchInterval = 60000,
    enabled = true,
    pauseOnInactive = true,
    inactivityTimeout = 5 * 60 * 1000, // 5 minutes default
  } = options || {}

  // Track user activity
  const isUserActive = useUserActivity(inactivityTimeout)

  // Determine if auto-refresh should be active
  const shouldAutoRefresh = pauseOnInactive ? isUserActive : true

  return useQuery({
    queryKey: progressStatisticsKeys.progress(scheduleId),
    queryFn: () => api.getProgress(scheduleId),
    // Only fetch when schedule ID is provided and enabled is true
    enabled: !!scheduleId && enabled,
    // Consider data stale after 30 seconds
    staleTime: 30000,
    // Auto-refresh every 60 seconds (or custom interval)
    // Pause when user is inactive if pauseOnInactive is true
    refetchInterval: shouldAutoRefresh ? refetchInterval : false,
    // Continue refetching even when window is not focused
    refetchIntervalInBackground: false,
    // Retry on error with exponential backoff
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}
