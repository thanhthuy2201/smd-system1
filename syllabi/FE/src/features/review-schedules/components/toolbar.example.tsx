/**
 * Example usage of the Toolbar component
 * This file demonstrates how to integrate the toolbar with TanStack Router
 *
 * This is a reference implementation and should be adapted for actual use
 */
import { getRouteApi } from '@tanstack/react-router'
import { type ReviewScheduleStatus } from '../data/schema'
import { Toolbar } from './toolbar'

const route = getRouteApi('/_authenticated/review-schedules/')

export function ToolbarExample() {
  const navigate = route.useNavigate()
  const search = route.useSearch()

  // Extract query params from URL
  const {
    pageSize = 10,
    search: searchQuery = '',
    status = 'ALL',
    semesterId = 'ALL',
    academicYear = 'ALL',
  } = search

  // Mock data - in real implementation, fetch from API
  const mockSemesters = [
    { id: '1', name: 'Học kỳ 1 - 2024-2025' },
    { id: '2', name: 'Học kỳ 2 - 2024-2025' },
    { id: '3', name: 'Học kỳ 3 - 2024-2025' },
  ]

  const mockAcademicYears = [
    { year: '2024-2025', label: '2024-2025' },
    { year: '2023-2024', label: '2023-2024' },
    { year: '2022-2023', label: '2022-2023' },
  ]

  // Handle search change - update URL query parameters
  const handleSearchChange = (newSearch: string) => {
    void navigate({
      search: {
        page: 1,
        pageSize,
        search: newSearch,
        status,
        semesterId,
        academicYear,
      },
    })
  }

  // Handle status filter change - update URL query parameters
  const handleStatusFilterChange = (
    newStatus: ReviewScheduleStatus | 'ALL'
  ) => {
    void navigate({
      search: {
        page: 1,
        pageSize,
        search: searchQuery,
        status: newStatus as any,
        semesterId,
        academicYear,
      },
    })
  }

  // Handle semester filter change - update URL query parameters
  const handleSemesterFilterChange = (newSemesterId: string) => {
    void navigate({
      search: {
        page: 1,
        pageSize,
        search: searchQuery,
        status,
        semesterId: newSemesterId,
        academicYear,
      },
    })
  }

  // Handle academic year filter change - update URL query parameters
  const handleAcademicYearFilterChange = (newAcademicYear: string) => {
    void navigate({
      search: {
        page: 1,
        pageSize,
        search: searchQuery,
        status,
        semesterId,
        academicYear: newAcademicYear,
      },
    })
  }

  return (
    <Toolbar
      search={searchQuery}
      onSearchChange={handleSearchChange}
      statusFilter={status as ReviewScheduleStatus | 'ALL'}
      onStatusFilterChange={handleStatusFilterChange}
      semesterFilter={semesterId}
      onSemesterFilterChange={handleSemesterFilterChange}
      academicYearFilter={academicYear}
      onAcademicYearFilterChange={handleAcademicYearFilterChange}
      semesters={mockSemesters}
      academicYears={mockAcademicYears}
    />
  )
}
