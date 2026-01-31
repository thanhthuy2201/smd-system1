/**
 * SyllabiList Component
 *
 * Displays syllabi in a data table with:
 * - Status badges
 * - Search and filter functionality
 * - Sorting by date and course code
 * - Action buttons based on status
 *
 * Requirements: 3.1-3.5, 15.1-15.8
 */
import { useState } from 'react'
import {
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { useSyllabiList } from '../../hooks/useSyllabiList'
import type { Semester, SyllabusStatus } from '../../types'
import { syllabusColumns } from './syllabi-columns'

interface SyllabiListProps {
  /** Optional CSS class name */
  className?: string
}

/**
 * SyllabiList displays a data table of syllabi with filtering, sorting, and actions
 */
export function SyllabiList({ className }: SyllabiListProps) {
  // Local UI state
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'updatedAt', desc: true }, // Default sort by last updated
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  // Pagination state
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  // Extract filter values for API query
  const statusFilter = columnFilters.find((f) => f.id === 'status')?.value as
    | SyllabusStatus
    | undefined
  const academicYearFilter = columnFilters.find((f) => f.id === 'academicYear')
    ?.value as string | undefined
  const semesterFilter = columnFilters.find((f) => f.id === 'semester')
    ?.value as Semester | undefined

  // Fetch syllabi data
  const { syllabi, isLoading, isError, error, total, totalPages } =
    useSyllabiList({
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      search: globalFilter || undefined,
      status: statusFilter,
      academicYear: academicYearFilter,
      semester: semesterFilter,
      sortBy:
        (sorting[0]?.id as 'createdAt' | 'updatedAt' | 'courseCode') ||
        'updatedAt',
      sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
    })

  // Configure table
  const table = useReactTable({
    data: syllabi || [],
    columns: syllabusColumns,
    state: {
      sorting,
      pagination,
      rowSelection,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    enableRowSelection: false, // Disable row selection for now
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: totalPages,
    rowCount: total,
  })

  // Handle loading state
  if (isLoading) {
    return (
      <div className={cn('flex flex-1 flex-col gap-4', className)}>
        <div className='flex h-[400px] items-center justify-center'>
          <div className='text-center'>
            <div className='mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
            <p className='text-sm text-muted-foreground'>Loading syllabi...</p>
          </div>
        </div>
      </div>
    )
  }

  // Handle error state
  if (isError) {
    return (
      <div className={cn('flex flex-1 flex-col gap-4', className)}>
        <div className='flex h-[400px] items-center justify-center'>
          <div className='text-center'>
            <p className='mb-2 text-sm font-medium text-destructive'>
              Failed to load syllabi
            </p>
            <p className='text-sm text-muted-foreground'>
              {error?.message || 'An error occurred'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'max-sm:has-[div[role="toolbar"]]:mb-16', // Add margin bottom on mobile when toolbar is visible
        'flex flex-1 flex-col gap-4',
        className
      )}
    >
      <DataTableToolbar
        table={table}
        searchPlaceholder='Search by course code or title...'
        filters={[
          {
            columnId: 'status',
            title: 'Status',
            options: [
              { label: 'Draft', value: 'Draft' },
              { label: 'Pending Review', value: 'Pending Review' },
              { label: 'Revision Required', value: 'Revision Required' },
              { label: 'Approved', value: 'Approved' },
              { label: 'Archived', value: 'Archived' },
            ],
          },
          {
            columnId: 'semester',
            title: 'Semester',
            options: [
              { label: 'Fall', value: 'Fall' },
              { label: 'Spring', value: 'Spring' },
              { label: 'Summer', value: 'Summer' },
            ],
          },
        ]}
      />

      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className='group/row'>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                        header.column.columnDef.meta?.className,
                        header.column.columnDef.meta?.thClassName
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className='group/row'
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                        cell.column.columnDef.meta?.className,
                        cell.column.columnDef.meta?.tdClassName
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={syllabusColumns.length}
                  className='h-24 text-center'
                >
                  No syllabi found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} className='mt-auto' />
    </div>
  )
}
