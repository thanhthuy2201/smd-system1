import { Link } from '@tanstack/react-router'
import { type Row } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type Syllabus } from '../data/schema'

interface DataTableRowActionsProps {
  row: Row<Syllabus>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const syllabus = row.original

  const handleDelete = () => {
    // TODO: Implement delete functionality
    console.log('Delete syllabus:', syllabus.id)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
        >
          <MoreHorizontal className='h-4 w-4' />
          <span className='sr-only'>Mở menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[160px]'>
        <DropdownMenuItem asChild>
          <Link
            to='/syllabus/view/$id'
            params={{ id: syllabus.id }}
            className='flex cursor-pointer items-center'
          >
            <Eye className='mr-2 h-4 w-4' />
            Xem
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            to='/syllabus/edit/$id'
            params={{ id: syllabus.id }}
            className='flex cursor-pointer items-center'
          >
            <Pencil className='mr-2 h-4 w-4' />
            Chỉnh sửa
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete} className='text-destructive'>
          <Trash2 className='mr-2 h-4 w-4' />
          Xóa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
