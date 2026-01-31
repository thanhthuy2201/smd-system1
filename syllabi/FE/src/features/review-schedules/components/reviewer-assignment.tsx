import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserPlus, Pencil, Trash2, Users } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { SelectDropdown } from '@/components/select-dropdown'
import { getAvailableReviewers } from '../data/api'
import {
  reviewerAssignmentSchema,
  type ReviewerAssignment,
  type AvailableReviewer,
} from '../data/schema'
import {
  useAssignReviewer,
  useUpdateAssignment,
  useRemoveAssignment,
} from '../hooks/use-review-mutations'

interface ReviewerAssignmentProps {
  scheduleId: string
  assignments: ReviewerAssignment[]
  departments?: { id: string; name: string }[]
}

type AssignmentFormData = {
  departmentId: string
  primaryReviewerId: string
  backupReviewerId?: string
}

export function ReviewerAssignmentComponent({
  scheduleId,
  assignments,
  departments = [],
}: ReviewerAssignmentProps) {
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] =
    useState<ReviewerAssignment | null>(null)
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<
    string | null
  >(null)
  const [availableReviewers, setAvailableReviewers] = useState<
    AvailableReviewer[]
  >([])
  const [isLoadingReviewers, setIsLoadingReviewers] = useState(false)

  const assignMutation = useAssignReviewer(scheduleId)
  const updateMutation = useUpdateAssignment(scheduleId)
  const removeMutation = useRemoveAssignment(scheduleId)

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(reviewerAssignmentSchema),
    defaultValues: {
      departmentId: '',
      primaryReviewerId: '',
      backupReviewerId: '',
    },
  })

  // Load available reviewers when dialog opens or department changes
  const loadReviewers = async (departmentId?: string) => {
    setIsLoadingReviewers(true)
    try {
      const reviewers = await getAvailableReviewers(departmentId)
      setAvailableReviewers(reviewers)
    } catch (_error) {
      toast.error('Không thể tải danh sách người phê duyệt')
    } finally {
      setIsLoadingReviewers(false)
    }
  }

  const handleOpenAssignDialog = () => {
    form.reset({
      departmentId: '',
      primaryReviewerId: '',
      backupReviewerId: '',
    })
    setEditingAssignment(null)
    setIsAssignDialogOpen(true)
    loadReviewers()
  }

  const handleOpenEditDialog = (assignment: ReviewerAssignment) => {
    form.reset({
      departmentId: assignment.departmentId,
      primaryReviewerId: assignment.primaryReviewerId,
      backupReviewerId: assignment.backupReviewerId || '',
    })
    setEditingAssignment(assignment)
    setIsAssignDialogOpen(true)
    loadReviewers(assignment.departmentId)
  }

  const handleCloseDialog = () => {
    setIsAssignDialogOpen(false)
    setEditingAssignment(null)
    form.reset()
  }

  const handleSubmit = async (data: AssignmentFormData) => {
    try {
      if (editingAssignment) {
        // Update existing assignment
        await updateMutation.mutateAsync({
          assignmentId: editingAssignment.id,
          data: {
            departmentId: data.departmentId,
            primaryReviewerId: data.primaryReviewerId,
            backupReviewerId: data.backupReviewerId || undefined,
          },
        })
        toast.success('Cập nhật phân công thành công')
      } else {
        // Create new assignment
        await assignMutation.mutateAsync({
          scheduleId,
          departmentId: data.departmentId,
          departmentName:
            departments.find((d) => d.id === data.departmentId)?.name || '',
          primaryReviewerId: data.primaryReviewerId,
          primaryReviewerName:
            availableReviewers.find((r) => r.id === data.primaryReviewerId)
              ?.name || '',
          primaryReviewerRole:
            availableReviewers.find((r) => r.id === data.primaryReviewerId)
              ?.role || 'HOD',
          backupReviewerId: data.backupReviewerId || undefined,
          backupReviewerName: data.backupReviewerId
            ? availableReviewers.find((r) => r.id === data.backupReviewerId)
                ?.name
            : undefined,
        })
        toast.success('Phân công người phê duyệt thành công')
      }
      handleCloseDialog()
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Có lỗi xảy ra: ${error.message}`)
      } else {
        toast.error('Có lỗi xảy ra khi phân công người phê duyệt')
      }
    }
  }

  const handleRemoveAssignment = async () => {
    if (!deletingAssignmentId) return

    try {
      await removeMutation.mutateAsync(deletingAssignmentId)
      toast.success('Đã xóa phân công')
      setDeletingAssignmentId(null)
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Có lỗi xảy ra: ${error.message}`)
      } else {
        toast.error('Có lỗi xảy ra khi xóa phân công')
      }
    }
  }

  // Get unassigned departments
  const assignedDepartmentIds = new Set(assignments.map((a) => a.departmentId))
  const unassignedDepartments = departments.filter(
    (d) => !assignedDepartmentIds.has(d.id)
  )

  // Filter reviewers based on selected department
  const selectedDepartmentId = form.watch('departmentId')
  const filteredReviewers = selectedDepartmentId
    ? availableReviewers.filter(
        (r) =>
          !r.departmentId ||
          r.departmentId === selectedDepartmentId ||
          r.role === 'AA'
      )
    : availableReviewers

  // Filter out primary reviewer from backup options
  const primaryReviewerId = form.watch('primaryReviewerId')
  const backupReviewerOptions = filteredReviewers.filter(
    (r) => r.id !== primaryReviewerId
  )

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Users className='h-5 w-5' />
          <h3 className='text-lg font-semibold'>Phân công người phê duyệt</h3>
        </div>
        <Button onClick={handleOpenAssignDialog}>
          <UserPlus className='h-4 w-4' />
          Phân công người phê duyệt
        </Button>
      </div>

      {/* Assigned Departments */}
      {assignments.length > 0 ? (
        <div className='grid gap-4 md:grid-cols-2'>
          {assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader className='pb-3'>
                <div className='flex items-start justify-between'>
                  <CardTitle className='text-base'>
                    {assignment.departmentName}
                  </CardTitle>
                  <div className='flex gap-1'>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8'
                      onClick={() => handleOpenEditDialog(assignment)}
                    >
                      <Pencil className='h-4 w-4' />
                      <span className='sr-only'>Chỉnh sửa</span>
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 text-destructive'
                      onClick={() => setDeletingAssignmentId(assignment.id)}
                    >
                      <Trash2 className='h-4 w-4' />
                      <span className='sr-only'>Xóa</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div>
                  <div className='mb-1 flex items-center gap-2'>
                    <span className='text-sm font-medium'>
                      Người phê duyệt chính:
                    </span>
                    <Badge variant='secondary'>
                      {assignment.primaryReviewerRole}
                    </Badge>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    {assignment.primaryReviewerName}
                  </p>
                </div>
                {assignment.backupReviewerName && (
                  <div>
                    <p className='mb-1 text-sm font-medium'>
                      Người phê duyệt dự phòng:
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      {assignment.backupReviewerName}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-10'>
            <Users className='mb-4 h-12 w-12 text-muted-foreground' />
            <p className='text-center text-sm text-muted-foreground'>
              Chưa có phân công người phê duyệt nào.
              <br />
              Nhấn nút "Phân công người phê duyệt" để bắt đầu.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Unassigned Departments Notice */}
      {unassignedDepartments.length > 0 && (
        <Card className='border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20'>
          <CardContent className='pt-6'>
            <p className='text-sm font-medium text-yellow-800 dark:text-yellow-200'>
              Các khoa/bộ môn chưa được phân công:{' '}
              {unassignedDepartments.map((d) => d.name).join(', ')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader className='text-start'>
            <DialogTitle className='flex items-center gap-2'>
              <UserPlus className='h-5 w-5' />
              {editingAssignment
                ? 'Chỉnh sửa phân công'
                : 'Phân công người phê duyệt'}
            </DialogTitle>
            <DialogDescription>
              {editingAssignment
                ? 'Cập nhật thông tin phân công người phê duyệt cho khoa/bộ môn.'
                : 'Chọn khoa/bộ môn và người phê duyệt để phân công.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              id='assignment-form'
              onSubmit={form.handleSubmit(handleSubmit)}
              className='space-y-4'
            >
              <FormField
                control={form.control}
                name='departmentId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Khoa/Bộ môn</FormLabel>
                    <SelectDropdown
                      defaultValue={field.value}
                      onValueChange={(value) => {
                        field.onChange(value)
                        // Reload reviewers when department changes
                        loadReviewers(value)
                        // Reset reviewer selections
                        form.setValue('primaryReviewerId', '')
                        form.setValue('backupReviewerId', '')
                      }}
                      placeholder='Chọn khoa/bộ môn'
                      items={departments.map((d) => ({
                        label: d.name,
                        value: d.id,
                      }))}
                      disabled={!!editingAssignment}
                      isControlled
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='primaryReviewerId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Người phê duyệt chính</FormLabel>
                    <SelectDropdown
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder='Chọn người phê duyệt chính'
                      isPending={isLoadingReviewers}
                      items={filteredReviewers.map((r) => ({
                        label: `${r.name} (${r.role}) - ${r.currentAssignments} phân công`,
                        value: r.id,
                      }))}
                      disabled={!selectedDepartmentId}
                      isControlled
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='backupReviewerId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Người phê duyệt dự phòng (tùy chọn)</FormLabel>
                    <SelectDropdown
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder='Chọn người phê duyệt dự phòng'
                      isPending={isLoadingReviewers}
                      items={backupReviewerOptions.map((r) => ({
                        label: `${r.name} (${r.role}) - ${r.currentAssignments} phân công`,
                        value: r.id,
                      }))}
                      disabled={!selectedDepartmentId || !primaryReviewerId}
                      isControlled
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
          <DialogFooter className='gap-y-2'>
            <DialogClose asChild>
              <Button variant='outline'>Hủy</Button>
            </DialogClose>
            <Button
              type='submit'
              form='assignment-form'
              disabled={assignMutation.isPending || updateMutation.isPending}
            >
              {assignMutation.isPending || updateMutation.isPending
                ? 'Đang xử lý...'
                : editingAssignment
                  ? 'Cập nhật'
                  : 'Phân công'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingAssignmentId}
        onOpenChange={(open) => !open && setDeletingAssignmentId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa phân công</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa phân công này? Hành động này không thể
              hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveAssignment}
              disabled={removeMutation.isPending}
              className='text-destructive-foreground bg-destructive hover:bg-destructive/90'
            >
              {removeMutation.isPending ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
