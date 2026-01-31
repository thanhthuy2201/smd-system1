import { getRouteApi } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { AcademicYearTable } from './components/academic-year-table'
import { Toolbar } from './components/toolbar'
import { type AcademicYearStatus } from './data/schema'
import { useAcademicYears } from './hooks/use-academic-years'

const route = getRouteApi('/_authenticated/academic-years/')

/**
 * Academic Years List Screen
 * Main page for viewing and managing academic years
 *
 * Features:
 * - Page title "Năm học"
 * - "Thêm năm học" button linking to add route
 * - Search and filter toolbar
 * - Academic years table with pagination
 * - Loading, error, and empty states
 * - Navigation to edit screen
 * - Status change with confirmation
 *
 * Validates Requirements 1.1, 1.2, 1.3, 1.4, 1.6, 1.7, 6.8, 7.4
 */
export function AcademicYears() {
  const navigate = route.useNavigate()
  const search = route.useSearch()

  // Extract query params from URL
  const {
    page = 1,
    pageSize = 10,
    search: searchQuery = '',
    status = 'ALL',
  } = search

  // Fetch academic years with query params
  const { data, isLoading, isError, error, refetch } = useAcademicYears({
    page,
    pageSize,
    search: searchQuery || undefined,
    status: status !== 'ALL' ? (status as AcademicYearStatus) : undefined,
    sortBy: 'startDate',
    sortOrder: 'desc',
  })

  // Handle search change - update URL query params
  const handleSearchChange = (newSearch: string) => {
    void navigate({
      search: {
        page: 1,
        pageSize,
        search: newSearch,
        status,
      },
    })
  }

  // Handle status filter change - update URL query params
  const handleStatusFilterChange = (newStatus: AcademicYearStatus | 'ALL') => {
    void navigate({
      search: {
        page: 1,
        pageSize,
        search: searchQuery,
        status: newStatus,
      },
    })
  }

  // Handle navigation to edit screen
  const handleEdit = (id: string) => {
    void navigate({
      to: '/academic-years/edit/$id',
      params: { id },
    })
  }

  // Handle add button click
  const handleAdd = () => {
    void navigate({
      to: '/academic-years/add',
    })
  }

  // Handle page change - update URL query params
  const handlePageChange = (newPage: number) => {
    void navigate({
      search: {
        page: newPage,
        pageSize,
        search: searchQuery,
        status,
      },
    })
  }

  // Handle page size change - update URL query params
  const handlePageSizeChange = (newPageSize: number) => {
    void navigate({
      search: {
        page: 1,
        pageSize: newPageSize,
        search: searchQuery,
        status,
      },
    })
  }

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
        {/* Page title and add button (Requirement 1.1) */}
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Năm học</h2>
            <p className='text-muted-foreground'>
              Quản lý các năm học trong hệ thống
            </p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className='mr-2 h-4 w-4' />
            Thêm năm học
          </Button>
        </div>

        {/* Search and filter toolbar (Requirements 7.1, 7.2, 7.4) */}
        <Toolbar
          search={searchQuery}
          onSearchChange={handleSearchChange}
          statusFilter={status}
          onStatusFilterChange={handleStatusFilterChange}
        />

        {/* Academic years table with all states (Requirements 1.2, 1.3, 1.4, 1.6, 1.7) */}
        <AcademicYearTable
          data={data?.data || []}
          total={data?.total || 0}
          page={page}
          pageSize={pageSize}
          isLoading={isLoading}
          isError={isError}
          error={error as Error}
          onRetry={refetch}
          onEdit={handleEdit}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </Main>
    </>
  )
}
