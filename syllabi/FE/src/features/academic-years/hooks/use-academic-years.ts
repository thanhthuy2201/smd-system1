import { useQuery } from '@tanstack/react-query'
import { academicYearsApi } from '../data/api'
import type { AcademicYearsQueryParams } from '../data/schema'

/**
 * TanStack Query hook for fetching academic years list
 * Supports pagination, search, filtering, and sorting
 *
 * Validates Requirement 1.1
 *
 * @param params - Query parameters for filtering and pagination
 * @returns Query result with academic years data, loading state, and error state
 */
export function useAcademicYears(params: AcademicYearsQueryParams = {}) {
  return useQuery({
    queryKey: ['academic-years', params],
    queryFn: () => academicYearsApi.list(params),
    // Keep previous data while fetching new data for smooth pagination
    placeholderData: (previousData) => previousData,
  })
}
