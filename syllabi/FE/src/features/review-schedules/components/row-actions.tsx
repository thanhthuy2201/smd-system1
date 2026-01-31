import { useState } from 'react'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { Eye, Pencil, Trash2, Bell } from 'lucide-react'
import { toast } from 'sonner'
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
import { type ReviewSchedule, ReviewScheduleStatus } from '../data/schema'
import {
  useDeleteReviewSchedule,
  useSendReminders,
} from '../hooks/use-review-mutations'
import { handleReviewScheduleError, showErrorToast } from '../lib/error-handler'

type RowActionsProps = {
  row: Row<ReviewSchedule>
  onView: (id: string) => void
  onEdit: (id: string) => void
}

/**
 * Row actions component for review schedule table
 * Provides View, Edit, Delete, and Send Reminder actions with conditional visibility
 *
 * Action visibility rules:
 * - View: Always visible
 * - Edit: Only for UPCOMING and ACTIVE schedules
 * - Delete: Only for UPCOMING schedules with no reviews (reviewedCount === 0)
 * - Send Reminder: Only for ACTIVE schedules
 *
 * Validates Requirements 6.1, 9.1, 9.2, 9.3, 9.4, 9.5
 */
export function RowActions({ row, onView, onEdit }: RowActionsProps) {
  const schedule = row.original
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const deleteMutation = useDeleteReviewSchedule()
  const sendRemindersMutation = useSendReminders()

  // Determine which actions should be visible
  const canEdit =
    schedule.status === ReviewScheduleStatus.UPCOMING ||
    schedule.status === ReviewScheduleStatus.ACTIVE
  const canDelete =
    schedule.status === ReviewScheduleStatus.UPCOMING &&
    schedule.reviewedCount === 0
  const canSendReminder = schedule.status === ReviewScheduleStatus.ACTIVE

  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    try {
      await deleteMutation.mutateAsync(schedule.id)
      toast.success('Đã xóa lịch phê duyệt')
      setShowDeleteDialog(false)
    } catch (error) {
      // Handle errors with Vietnamese messages (Requirements 9.4, 9.5, 12.4, 12.6, 12.7, 12.8)
      const parsedError = handleReviewScheduleError(
        error,
        'Delete Review Schedule'
      )
      showErrorToast(parsedError)
      setShowDeleteDialog(false)
    }
  }

  const cancelDelete = () => {
    setShowDeleteDialog(false)
  }

  const handleSendReminder = async () => {
    try {
      await sendRemindersMutation.mutateAsync({
        scheduleId: schedule.id,
      })
      toast.success('Đã gửi nhắc nhở đến người phê duyệt')
    } catch (error) {
      // Handle errors with Vietnamese messages (Requirement 12.1, 12.8)
      const parsedError = handleReviewScheduleError(error, 'Send Reminder')
      showErrorToast(parsedError)
    }
  }

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
        <DropdownMenuContent align='end' className='w-[180px]'>
          <DropdownMenuItem onClick={() => onView(schedule.id)}>
            Xem chi tiết
            <DropdownMenuShortcut>
              <Eye size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>

          {canEdit && (
            <DropdownMenuItem onClick={() => onEdit(schedule.id)}>
              Chỉnh sửa
              <DropdownMenuShortcut>
                <Pencil size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          )}

          {(canDelete || canSendReminder) && <DropdownMenuSeparator />}

          {canSendReminder && (
            <DropdownMenuItem onClick={handleSendReminder}>
              Gửi nhắc nhở
              <DropdownMenuShortcut>
                <Bell size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          )}

          {canDelete && (
            <DropdownMenuItem onClick={handleDelete}>
              Xóa
              <DropdownMenuShortcut>
                <Trash2 size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa lịch phê duyệt</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa lịch phê duyệt "{schedule.name}"? Hành
              động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
