/**
 * Syllabi Table Column Definitions
 *
 * Defines columns for the syllabi data table including:
 * - Course code and name
 * - Status badges with colors
 * - Academic year and semester
 * - Last updated date
 * - Action buttons based on status
 */
import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import type { Syllabus } from '../../types'
import { SyllabiRowActions } from './syllabi-row-actions'

/**
 * Status badge configuration
 */
const statusConfig: Record<
  Syllabus['status'],
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
    className: string
  }
> = {
  Draft: {
    label: 'Draft',
    variant: 'secondary',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
  },
  'Pending Review': {
    label: 'Pending Review',
    variant: 'default',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  },
  'Revision Required': {
    label: 'Revision Required',
    variant: 'outline',
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 border-yellow-300',
  },
  Approved: {
    label: 'Approved',
    variant: 'outline',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-300',
  },
  Archived: {
    label: 'Archived',
    variant: 'outline',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  },
}

/**
 * Column definitions for syllabi table
 */
export const syllabusColumns: ColumnDef<Syllabus>[] = [
  {
    accessorKey: 'courseCode',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Course Code' />
    ),
    cell: ({ row }) => {
      const courseCode = row.getValue('courseCode') as string
      const courseName = row.original.courseName
      return (
        <div className='flex flex-col'>
          <span className='font-medium'>{courseCode}</span>
          <span className='text-sm text-muted-foreground'>{courseName}</span>
        </div>
      )
    },
    enableSorting: true,
  },
  {
    accessorKey: 'academicYear',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Academic Year' />
    ),
    cell: ({ row }) => {
      const academicYear = row.getValue('academicYear') as string
      const semester = row.original.semester
      return (
        <div className='flex flex-col'>
          <span className='font-medium'>{academicYear}</span>
          <span className='text-sm text-muted-foreground'>{semester}</span>
        </div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as Syllabus['status']
      const config = statusConfig[status]

      return (
        <Badge variant={config.variant} className={config.className}>
          {config.label}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: false,
  },
  {
    accessorKey: 'version',
    header: 'Version',
    cell: ({ row }) => {
      const version = row.getValue('version') as string
      return <span className='font-mono text-sm'>{version}</span>
    },
    enableSorting: false,
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Last Updated' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('updatedAt'))
      return (
        <div className='flex flex-col'>
          <span className='text-sm'>{date.toLocaleDateString()}</span>
          <span className='text-xs text-muted-foreground'>
            {date.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      )
    },
    sortingFn: (rowA, rowB) => {
      const dateA = new Date(rowA.getValue('updatedAt'))
      const dateB = new Date(rowB.getValue('updatedAt'))
      return dateA.getTime() - dateB.getTime()
    },
    enableSorting: true,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'))
      return <span className='text-sm'>{date.toLocaleDateString()}</span>
    },
    sortingFn: (rowA, rowB) => {
      const dateA = new Date(rowA.getValue('createdAt'))
      const dateB = new Date(rowB.getValue('createdAt'))
      return dateA.getTime() - dateB.getTime()
    },
    enableSorting: true,
  },
  {
    id: 'actions',
    cell: ({ row }) => <SyllabiRowActions row={row} />,
    meta: {
      className: 'w-[80px]',
    },
  },
]
