import { getRouteApi } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ErrorBoundary } from './components/error-boundary'
import { ReviewScheduleTable } from './components/review-schedule-table'
import { Toolbar } from './components/toolbar'
import { type ReviewScheduleStatus } from './data/schema'
import { useReviewSchedules } from './hooks/use-review-schedules'

const route = getRouteApi('/_authenticated/review-schedules/')

/**
 * Review Schedules List Screen
 * Main page for viewing and managing review schedules
 *
 * Features:
 * - Page title "Lịch phê duyệt đề cương" with description
 * - "Tạo lịch phê duyệt" button linking to create route
 * - Search and filter toolbar with debounced search
 * - Review schedules table with pagination
 * - Loading, error, and empty states
 * - Navigation to detail/edit screens on row actions
 * - Delete with confirmation and toast notifications
 * - Send reminder action with toast feedback
 *
 * Validates Requirements 1.1, 1.2, 1.3, 1.4, 1.6, 1.7, 1.8, 10.4, 10.5
 */
export function ReviewSchedules() {
  const navigate = route.useNavigate()
  const search = route.useSearch()

  // Extract query params from URL (Requirement 10.8)
  const {
    page = 1,
    pageSize = 10,
    search: searchQuery = '',
    status = 'ALL',
    semesterId = 'ALL',
    academicYear = 'ALL',
  } = search

  // Fetch review schedules with query params (Requirement 1.1)
  const { data, isLoading, isError, error, refetch } = useReviewSchedules({
    page,
    pageSize,
    search: searchQuery || undefined,
    status: status !== 'ALL' ? (status as ReviewScheduleStatus) : undefined,
    semesterId: semesterId !== 'ALL' ? semesterId : undefined,
    academicYear: academicYear !== 'ALL' ? academicYear : undefined,
    sortBy: 'reviewStartDate',
    sortOrder: 'desc',
  })

  // Handle search change - update URL query params (Requirement 10.4, 10.7)
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

  // Handle status filter change - update URL query params (Requirement 10.3, 10.4)
  const handleStatusFilterChange = (
    newStatus: ReviewScheduleStatus | 'ALL'
  ) => {
    void navigate({
      search: {
        page: 1,
        pageSize,
        search: searchQuery,
        status: newStatus,
        semesterId,
        academicYear,
      },
    })
  }

  // Handle semester filter change - update URL query params (Requirement 10.2, 10.4)
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

  // Handle academic year filter change - update URL query params (Requirement 10.2, 10.4)
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

  // Handle navigation to detail screen (Requirement 8.1)
  const handleView = (id: string) => {
    void navigate({
      to: '/review-schedules/view/$id',
      params: { id },
    })
  }

  // Handle navigation to edit screen (Requirement 6.1)
  const handleEdit = (id: string) => {
    void navigate({
      to: '/review-schedules/edit/$id',
      params: { id },
    })
  }

  // Handle create button click (Requirement 2.1)
  const handleCreate = () => {
    void navigate({
      to: '/review-schedules/create',
    })
  }

  // Handle page change - update URL query params (Requirement 10.4)
  const handlePageChange = (newPage: number) => {
    void navigate({
      search: {
        page: newPage,
        pageSize,
        search: searchQuery,
        status,
        semesterId,
        academicYear,
      },
    })
  }

  // Handle page size change - update URL query params (Requirement 10.4)
  const handlePageSizeChange = (newPageSize: number) => {
    void navigate({
      search: {
        page: 1,
        pageSize: newPageSize,
        search: searchQuery,
        status,
        semesterId,
        academicYear,
      },
    })
  }

  // Mock data for filters - in production, these would come from API
  const semesters = [
    { id: '1', name: 'HK1 2024-2025' },
    { id: '2', name: 'HK2 2024-2025' },
    { id: '3', name: 'HK3 2024-2025' },
  ]

  const academicYears = [
    { year: '2024-2025', label: '2024-2025' },
    { year: '2023-2024', label: '2023-2024' },
    { year: '2022-2023', label: '2022-2023' },
  ]

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <ErrorBoundary>
          {/* Page title and create button (Requirement 1.1, 2.1) */}
          <div className='flex flex-wrap items-end justify-between gap-2'>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>
                Lịch phê duyệt đề cương
              </h2>
              <p className='text-muted-foreground'>
                Quản lý lịch phê duyệt và theo dõi tiến độ phê duyệt đề cương
              </p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className='mr-2 h-4 w-4' />
              Tạo lịch phê duyệt
            </Button>
          </div>

          {/* Search and filter toolbar (Requirements 10.1, 10.2, 10.3, 10.4) */}
          <Toolbar
            search={searchQuery}
            onSearchChange={handleSearchChange}
            statusFilter={status as ReviewScheduleStatus | 'ALL'}
            onStatusFilterChange={handleStatusFilterChange}
            semesterFilter={semesterId}
            onSemesterFilterChange={handleSemesterFilterChange}
            academicYearFilter={academicYear}
            onAcademicYearFilterChange={handleAcademicYearFilterChange}
            semesters={semesters}
            academicYears={academicYears}
          />

          {/* Review schedules table with all states (Requirements 1.2, 1.3, 1.4, 1.6, 1.7, 1.8) */}
          <ReviewScheduleTable
            data={data?.data || []}
            total={data?.total || 0}
            page={page}
            pageSize={pageSize}
            isLoading={isLoading}
            isError={isError}
            error={error as Error}
            onRetry={refetch}
            onView={handleView}
            onEdit={handleEdit}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </ErrorBoundary>
      </Main>
    </>
  )
}
