import { useState } from 'react'
import {
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination } from '@/components/data-table'
import { type ReviewSchedule, ReviewScheduleStatus } from '../data/schema'
import { getReviewScheduleColumns } from './columns'

interface ReviewScheduleTableProps {
  data: ReviewSchedule[]
  total?: number
  page?: number
  pageSize?: number
  isLoading?: boolean
  isError?: boolean
  error?: Error | null
  onRetry?: () => void
  onView: (id: string) => void
  onEdit: (id: string) => void
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

/**
 * Review Schedule Table Component
 * Displays review schedules in a sortable, paginated table
 *
 * Features:
 * - Loading state with skeleton loader
 * - Empty state with Vietnamese message "Chưa có lịch phê duyệt nào"
 * - Error state with Vietnamese message and retry button
 * - Default sort by reviewStartDate descending
 * - Pagination with page size options (10, 20, 50)
 * - Sort indicators on column headers
 * - Row actions (view, edit, delete, send reminder)
 * - Highlight overdue schedules with red background
 *
 * Validates Requirements 1.2, 1.3, 1.6, 1.7, 5.6, 5.7
 */
export function ReviewScheduleTable({
  data,
  total = 0,
  page = 1,
  pageSize = 10,
  isLoading = false,
  isError = false,
  error = null,
  onRetry,
  onView,
  onEdit,
  onPageChange,
  onPageSizeChange,
}: ReviewScheduleTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'reviewStartDate', desc: true }, // Default sort by reviewStartDate descending (Requirement 1.7)
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const columns = getReviewScheduleColumns(onView, onEdit)

  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil(total / pageSize),
    state: {
      sorting,
      columnFilters,
      pagination: {
        pageIndex: page - 1, // TanStack Table uses 0-based index
        pageSize,
      },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newPagination = updater({
          pageIndex: page - 1,
          pageSize,
        })
        if (newPagination.pageIndex !== page - 1) {
          onPageChange?.(newPagination.pageIndex + 1)
        }
        if (newPagination.pageSize !== pageSize) {
          onPageSizeChange?.(newPagination.pageSize)
        }
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: true, // Server-side pagination
  })

  // Loading state (Requirement 1.2)
  if (isLoading) {
    return (
      <div className='flex flex-1 flex-col gap-4'>
        <div className='overflow-hidden rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((_, index) => (
                  <TableHead key={index}>
                    <Skeleton className='h-4 w-full' />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <Skeleton className='h-4 w-full' />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  // Error state (Requirements 1.6, 9.5)
  if (isError) {
    return (
      <div className='flex flex-1 flex-col gap-4'>
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription className='flex items-center justify-between'>
            <span>
              {error?.message ||
                'Không thể tải danh sách lịch phê duyệt. Vui lòng thử lại.'}
            </span>
            {onRetry && (
              <Button
                variant='outline'
                size='sm'
                onClick={onRetry}
                className='ml-4'
              >
                Thử lại
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                // Highlight overdue schedules with red background (Requirement 5.7)
                const isOverdue =
                  row.original.status === ReviewScheduleStatus.OVERDUE
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className={cn(
                      isOverdue &&
                        'bg-red-50/50 hover:bg-red-50/70 dark:bg-red-950/20 dark:hover:bg-red-950/30'
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            ) : (
              // Empty state (Requirement 1.3)
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  Chưa có lịch phê duyệt nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination with page size options: 10, 20, 50 (Requirement 1.7) */}
      <DataTablePagination table={table} pageSizeOptions={[10, 20, 50]} />
    </div>
  )
}
