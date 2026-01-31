import { useState } from 'react'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { Edit, Power, PowerOff } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type AcademicYear, AcademicYearStatus } from '../data/schema'
import { useUpdateAcademicYearStatus } from '../hooks/use-academic-year-mutations'

type RowActionsProps = {
  row: Row<AcademicYear>
  onEdit: (id: string) => void
}

/**
 * Row actions component for academic year table
 * Provides Edit and Disable/Enable actions with confirmation dialogs
 *
 * Validates Requirements 6.1, 6.2, 6.3, 6.5, 6.7
 */
export function RowActions({ row, onEdit }: RowActionsProps) {
  const academicYear = row.original
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<AcademicYearStatus | null>(
    null
  )

  const updateStatusMutation = useUpdateAcademicYearStatus()

  const handleStatusChange = (newStatus: AcademicYearStatus) => {
    setPendingStatus(newStatus)
    setShowStatusDialog(true)
  }

  const confirmStatusChange = () => {
    if (pendingStatus) {
      updateStatusMutation.mutate({
        id: academicYear.id,
        status: pendingStatus,
      })
    }
    setShowStatusDialog(false)
    setPendingStatus(null)
  }

  const cancelStatusChange = () => {
    setShowStatusDialog(false)
    setPendingStatus(null)
  }

  const isActive = academicYear.status === AcademicYearStatus.ACTIVE
  const actionLabel = isActive ? 'Vô hiệu hóa' : 'Kích hoạt'
  const ActionIcon = isActive ? PowerOff : Power

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
          >
            <DotsHorizontalIcon className='h-4 w-4' />
            <span className='sr-only'>Mở menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-[160px]'>
          <DropdownMenuItem onClick={() => onEdit(academicYear.id)}>
            Chỉnh sửa
            <DropdownMenuShortcut>
              <Edit size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() =>
              handleStatusChange(
                isActive
                  ? AcademicYearStatus.DISABLED
                  : AcademicYearStatus.ACTIVE
              )
            }
          >
            {actionLabel}
            <DropdownMenuShortcut>
              <ActionIcon size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isActive ? 'Vô hiệu hóa năm học' : 'Kích hoạt năm học'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isActive
                ? `Bạn có chắc chắn muốn vô hiệu hóa năm học "${academicYear.code}"? Năm học sẽ không thể sử dụng cho đến khi được kích hoạt lại.`
                : `Bạn có chắc chắn muốn kích hoạt năm học "${academicYear.code}"? Năm học sẽ có thể được sử dụng trong hệ thống.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelStatusChange}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
