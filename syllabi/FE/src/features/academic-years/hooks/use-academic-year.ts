import { useQuery } from '@tanstack/react-query'
import { academicYearsApi } from '../data/api'

/**
 * TanStack Query hook for fetching a single academic year by ID
 * Used in the edit screen to load existing academic year data
 *
 * Validates Requirement 5.2
 *
 * @param id - Academic year ID
 * @returns Query result with academic year data, loading state, and error state
 */
export function useAcademicYear(id: string) {
  return useQuery({
    queryKey: ['academic-year', id],
    queryFn: () => academicYearsApi.getById(id),
    enabled: !!id, // Only fetch if ID is provided
  })
}
