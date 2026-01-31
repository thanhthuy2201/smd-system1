import { format } from 'date-fns'
import { type ColumnDef } from '@tanstack/react-table'
import { vi } from 'date-fns/locale'
import { DataTableColumnHeader } from '@/components/data-table'
import { type AcademicYear } from '../data/schema'
import { RowActions } from './row-actions'
import { StatusBadge } from './status-badge'

/**
 * Table column definitions for Academic Years
 *
 * Columns:
 * - No. (Row number)
 * - Mã năm học (Academic Year Code)
 * - Tên/Nhãn (Name/Label)
 * - Ngày bắt đầu (Start Date)
 * - Ngày kết thúc (End Date)
 * - Trạng thái (Status)
 * - Ngày tạo (Created At)
 * - Ngày cập nhật (Updated At)
 * - Hành động (Actions)
 *
 * Validates Requirements 1.4, 1.5, 1.8
 *
 * @param onEdit - Callback function to handle edit action
 * @returns Array of column definitions
 */
export function getAcademicYearColumns(
  onEdit: (id: string) => void
): ColumnDef<AcademicYear>[] {
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
      accessorKey: 'code',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Mã năm học' />
      ),
      cell: ({ row }) => (
        <div className='font-medium'>{row.getValue('code')}</div>
      ),
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Tên/Nhãn' />
      ),
      cell: ({ row }) => {
        const name = row.getValue('name') as string | null
        return <div className='max-w-[200px] truncate'>{name || '-'}</div>
      },
    },
    {
      accessorKey: 'startDate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Ngày bắt đầu' />
      ),
      cell: ({ row }) => {
        const date = row.getValue('startDate') as Date
        return (
          <div className='text-nowrap'>
            {format(date, 'dd/MM/yyyy', { locale: vi })}
          </div>
        )
      },
      sortingFn: (rowA, rowB) => {
        const dateA = new Date(rowA.getValue('startDate'))
        const dateB = new Date(rowB.getValue('startDate'))
        return dateA.getTime() - dateB.getTime()
      },
    },
    {
      accessorKey: 'endDate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Ngày kết thúc' />
      ),
      cell: ({ row }) => {
        const date = row.getValue('endDate') as Date
        return (
          <div className='text-nowrap'>
            {format(date, 'dd/MM/yyyy', { locale: vi })}
          </div>
        )
      },
      sortingFn: (rowA, rowB) => {
        const dateA = new Date(rowA.getValue('endDate'))
        const dateB = new Date(rowB.getValue('endDate'))
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
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Ngày tạo' />
      ),
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as Date
        return (
          <div className='text-nowrap'>
            {format(date, 'dd/MM/yyyy', { locale: vi })}
          </div>
        )
      },
      sortingFn: (rowA, rowB) => {
        const dateA = new Date(rowA.getValue('createdAt'))
        const dateB = new Date(rowB.getValue('createdAt'))
        return dateA.getTime() - dateB.getTime()
      },
    },
    {
      accessorKey: 'updatedAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Ngày cập nhật' />
      ),
      cell: ({ row }) => {
        const date = row.getValue('updatedAt') as Date
        return (
          <div className='text-nowrap'>
            {format(date, 'dd/MM/yyyy', { locale: vi })}
          </div>
        )
      },
      sortingFn: (rowA, rowB) => {
        const dateA = new Date(rowA.getValue('updatedAt'))
        const dateB = new Date(rowB.getValue('updatedAt'))
        return dateA.getTime() - dateB.getTime()
      },
    },
    {
      id: 'actions',
      header: 'Hành động',
      cell: ({ row }) => <RowActions row={row} onEdit={onEdit} />,
      enableSorting: false,
      enableHiding: false,
    },
  ]
}
