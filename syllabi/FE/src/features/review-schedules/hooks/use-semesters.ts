import { useQuery } from '@tanstack/react-query'
import { getSemesters, getSemesterById } from '../data/api'

/**
 * Hook for fetching all available semesters
 *
 * Requirements: 3.1 - Validate review start date against submission end date
 */
export function useSemesters() {
  return useQuery({
    queryKey: ['semesters'],
    queryFn: getSemesters,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for fetching a specific semester by ID
 *
 * Requirements: 3.1 - Validate review start date against submission end date
 */
export function useSemester(semesterId: string | undefined) {
  return useQuery({
    queryKey: ['semester', semesterId],
    queryFn: () => getSemesterById(semesterId!),
    enabled: !!semesterId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
