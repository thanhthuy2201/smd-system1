import { format } from 'date-fns'
import { type ColumnDef } from '@tanstack/react-table'
import { vi } from 'date-fns/locale'
import { DataTableColumnHeader } from '@/components/data-table'
import { type ReviewSchedule } from '../data/schema'
import { ProgressIndicator } from './progress-indicator'
import { RowActions } from './row-actions'
import { StatusBadge } from './status-badge'

/**
 * Table column definitions for Review Schedules
 *
 * Columns:
 * - STT (Row number)
 * - Tên chu kỳ (Review Cycle Name)
 * - Học kỳ (Semester)
 * - Ngày bắt đầu (Review Start Date)
 * - Hạn L1 (L1 Deadline)
 * - Hạn L2 (L2 Deadline)
 * - Ngày phê duyệt cuối (Final Approval Date)
 * - Trạng thái (Status)
 * - Tiến độ (Progress)
 * - Hành động (Actions)
 *
 * Features:
 * - Vietnamese column headers
 * - Date formatting with Vietnamese locale (dd/MM/yyyy)
 * - Sequential row numbering
 * - Status badge with color coding
 * - Progress indicator with percentage and tooltip
 * - Row actions with conditional visibility
 *
 * Validates Requirements 1.4, 1.5, 1.7, 1.8
 *
 * @param onView - Callback function when View action is clicked
 * @param onEdit - Callback function when Edit action is clicked
 * @returns Array of column definitions for TanStack Table
 */
export function getReviewScheduleColumns(
  onView: (id: string) => void,
  onEdit: (id: string) => void
): ColumnDef<ReviewSchedule>[] {
  return [
    {
      id: 'rowNumber',
      header: 'STT',
      cell: ({ row, table }) => {
        const pageIndex = table.getState().pagination.pageIndex
        const pageSize = table.getState().pagination.pageSize
        return (
          <div className='w-[50px]'>{pageIndex * pageSize + row.index + 1}</div>
        )
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Tên chu kỳ' />
      ),
      cell: ({ row }) => {
        const name = row.getValue('name') as string
        return <div className='max-w-[250px] truncate font-medium'>{name}</div>
      },
    },
    {
      accessorKey: 'semesterName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Học kỳ' />
      ),
      cell: ({ row }) => {
        const semesterName = row.getValue('semesterName') as string
        const academicYear = row.original.academicYear
        return (
          <div className='max-w-[150px] truncate'>
            {semesterName}
            {academicYear && (
              <span className='text-muted-foreground'> ({academicYear})</span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'reviewStartDate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Ngày bắt đầu' />
      ),
      cell: ({ row }) => {
        const date = row.getValue('reviewStartDate') as Date
        return (
          <div className='text-nowrap'>
            {format(date, 'dd/MM/yyyy', { locale: vi })}
          </div>
        )
      },
      sortingFn: (rowA, rowB) => {
        const dateA = new Date(rowA.getValue('reviewStartDate'))
        const dateB = new Date(rowB.getValue('reviewStartDate'))
        return dateA.getTime() - dateB.getTime()
      },
    },
    {
      accessorKey: 'l1Deadline',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Hạn L1' />
      ),
      cell: ({ row }) => {
        const date = row.getValue('l1Deadline') as Date
        return (
          <div className='text-nowrap'>
            {format(date, 'dd/MM/yyyy', { locale: vi })}
          </div>
        )
      },
      sortingFn: (rowA, rowB) => {
        const dateA = new Date(rowA.getValue('l1Deadline'))
        const dateB = new Date(rowB.getValue('l1Deadline'))
        return dateA.getTime() - dateB.getTime()
      },
    },
    {
      accessorKey: 'l2Deadline',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Hạn L2' />
      ),
      cell: ({ row }) => {
        const date = row.getValue('l2Deadline') as Date
        return (
          <div className='text-nowrap'>
            {format(date, 'dd/MM/yyyy', { locale: vi })}
          </div>
        )
      },
      sortingFn: (rowA, rowB) => {
        const dateA = new Date(rowA.getValue('l2Deadline'))
        const dateB = new Date(rowB.getValue('l2Deadline'))
        return dateA.getTime() - dateB.getTime()
      },
    },
    {
      accessorKey: 'finalApprovalDate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Ngày phê duyệt cuối' />
      ),
      cell: ({ row }) => {
        const date = row.getValue('finalApprovalDate') as Date
        return (
          <div className='text-nowrap'>
            {format(date, 'dd/MM/yyyy', { locale: vi })}
          </div>
        )
      },
      sortingFn: (rowA, rowB) => {
        const dateA = new Date(rowA.getValue('finalApprovalDate'))
        const dateB = new Date(rowB.getValue('finalApprovalDate'))
        return dateA.getTime() - dateB.getTime()
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Trạng thái' />
      ),
      cell: ({ row }) => {
        const status = row.original.status
        return <StatusBadge status={status} />
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: 'progressPercentage',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Tiến độ' />
      ),
      cell: ({ row }) => {
        const { reviewedCount, totalSyllabi, pendingCount, overdueCount } =
          row.original
        return (
          <div className='min-w-[150px]'>
            <ProgressIndicator
              reviewed={reviewedCount}
              total={totalSyllabi}
              pending={pendingCount}
              overdue={overdueCount}
              variant='compact'
            />
          </div>
        )
      },
      sortingFn: (rowA, rowB) => {
        const percentageA = rowA.original.progressPercentage
        const percentageB = rowB.original.progressPercentage
        return percentageA - percentageB
      },
    },
    {
      id: 'actions',
      header: 'Hành động',
      cell: ({ row }) => {
        return <RowActions row={row} onView={onView} onEdit={onEdit} />
      },
      enableSorting: false,
      enableHiding: false,
    },
  ]
}
