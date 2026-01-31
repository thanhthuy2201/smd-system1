/**
 * useSyllabiList Hook
 *
 * Custom hook for fetching and managing the list of syllabi with
 * filtering, searching, sorting, and pagination.
 *
 * Features:
 * - Paginated data fetching
 * - Search by course code/title
 * - Filter by status, academic year, semester
 * - Sort by various fields
 * - Automatic cache management
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { getSyllabi } from '../api/syllabus.api'
import type { Syllabus, SyllabiQueryParams, PaginatedResponse } from '../types'

export interface UseSyllabiListOptions extends SyllabiQueryParams {
  /** Enable/disable the query */
  enabled?: boolean
}

export type UseSyllabiListReturn = UseQueryResult<
  PaginatedResponse<Syllabus>
> & {
  /** List of syllabi */
  syllabi: Syllabus[]
  /** Total number of syllabi */
  total: number
  /** Current page number */
  page: number
  /** Page size */
  pageSize: number
  /** Total number of pages */
  totalPages: number
  /** Whether there are more pages */
  hasNextPage: boolean
  /** Whether there is a previous page */
  hasPreviousPage: boolean
}

/**
 * Hook for fetching syllabi list with filtering and pagination
 *
 * @example
 * ```tsx
 * const { syllabi, isLoading, total, hasNextPage } = useSyllabiList({
 *   page: 1,
 *   pageSize: 10,
 *   status: 'Draft',
 *   search: 'CS101',
 *   sortBy: 'updatedAt',
 *   sortOrder: 'desc'
 * });
 * ```
 */
export function useSyllabiList(
  options: UseSyllabiListOptions = {}
): UseSyllabiListReturn {
  const {
    enabled = true,
    page = 1,
    pageSize = 10,
    search,
    status,
    academicYear,
    semester,
    sortBy = 'updatedAt',
    sortOrder = 'desc',
  } = options

  const query = useQuery({
    queryKey: [
      'lecturer',
      'syllabi',
      {
        page,
        pageSize,
        search,
        status,
        academicYear,
        semester,
        sortBy,
        sortOrder,
      },
    ],
    queryFn: () =>
      getSyllabi({
        page,
        pageSize,
        search,
        status,
        academicYear,
        semester,
        sortBy,
        sortOrder,
      }),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  })

  const data = query.data || {
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  }

  return {
    ...query,
    syllabi: data.items,
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
    totalPages: data.totalPages,
    hasNextPage: data.page < data.totalPages,
    hasPreviousPage: data.page > 1,
  }
}
