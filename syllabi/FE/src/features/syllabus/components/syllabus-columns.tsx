import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { type Syllabus, statusConfig } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export const syllabusColumns: ColumnDef<Syllabus>[] = [
  {
    accessorKey: 'courseCode',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Mã khóa học' />
    ),
  },
  {
    accessorKey: 'version',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Phiên bản' />
    ),
  },
  {
    accessorKey: 'status',
    header: 'Trạng thái',
    cell: ({ row }) => {
      const status = row.getValue('status') as Syllabus['status']
      const config = statusConfig[status]

      return (
        <Badge variant='outline' className='gap-1'>
          <div className={`h-2 w-2 rounded-full ${config.color}`} />
          {config.label}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'lastUpdated',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Ngày cập nhật' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('lastUpdated'))
      return date.toLocaleDateString('vi-VN')
    },
    sortingFn: (rowA, rowB) => {
      const dateA = new Date(rowA.getValue('lastUpdated'))
      const dateB = new Date(rowB.getValue('lastUpdated'))
      return dateA.getTime() - dateB.getTime()
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
