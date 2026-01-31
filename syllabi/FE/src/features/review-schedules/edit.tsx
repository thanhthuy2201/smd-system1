import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
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
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ErrorBoundary } from './components/error-boundary'
import { ReviewScheduleForm } from './components/review-schedule-form'
import {
  type ReviewScheduleFormInput,
  ReviewScheduleStatus,
} from './data/schema'
import { useFormDirty } from './hooks/use-form-dirty'
import { useUpdateReviewSchedule } from './hooks/use-review-mutations'
import { useReviewSchedule } from './hooks/use-review-schedule'
import { handleReviewScheduleError, showErrorToast } from './lib/error-handler'

/**
 * Review Schedule Edit Screen
 * Form for updating existing review schedules
 *
 * Features:
 * - Page title "Chỉnh sửa lịch phê duyệt"
 * - Fetch review schedule details by ID from route params
 * - Handle loading state while fetching
 * - Handle not found error (404) with Vietnamese message
 * - Review schedule form in edit mode with defaultValues
 * - Deadline extension validation (only allow extending for active schedules)
 * - Form read-only for COMPLETED schedules
 * - Form validation with Vietnamese error messages
 * - Success toast "Cập nhật lịch phê duyệt thành công" on update
 * - Send notifications to affected reviewers when deadlines are extended
 * - Navigation to detail page after success
 * - Unsaved changes detection with confirmation dialog
 *
 * Validates Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 12.2, 13.2
 */
export default function ReviewScheduleEdit() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false }) as { id: string }
  const [isDirty, setIsDirty] = useState(false)

  // Fetch review schedule details (Requirement 6.2)
  const { data, isLoading, isError, error } = useReviewSchedule(id)
  const updateMutation = useUpdateReviewSchedule(id)

  // Form dirty tracking for unsaved changes detection (Requirement 6.7)
  const {
    showConfirmDialog,
    confirmNavigation,
    cancelNavigation,
    checkNavigation,
  } = useFormDirty(isDirty)

  /**
   * Handle form submission
   * Updates review schedule and navigates to detail page on success
   * (Requirements 6.5, 6.6, 13.2)
   */
  const handleSubmit = async (formData: ReviewScheduleFormInput) => {
    try {
      await updateMutation.mutateAsync(formData)
      // Clear dirty flag before navigation to avoid confirmation dialog
      setIsDirty(false)
      // Display success toast (Requirement 13.2)
      toast.success('Cập nhật lịch phê duyệt thành công')
      // Navigate to detail page (Requirement 6.5)
      navigate({ to: `/review-schedules/view/${id}` })
      // Note: Notifications to affected reviewers when deadlines are extended
      // are handled by the backend API (Requirement 6.6)
    } catch (error) {
      // Handle API errors with Vietnamese messages (Requirement 12.2, 12.8)
      const parsedError = handleReviewScheduleError(
        error,
        'Update Review Schedule'
      )
      showErrorToast(parsedError)
    }
  }

  /**
   * Handle cancel button click
   * Checks for unsaved changes before navigating away (Requirement 6.7)
   */
  const handleCancel = () => {
    if (checkNavigation(`/review-schedules/view/${id}`)) {
      // No unsaved changes, navigate immediately
      navigate({ to: `/review-schedules/view/${id}` })
    }
    // Otherwise, confirmation dialog will be shown
  }

  // Handle loading state (Requirement 6.2)
  if (isLoading) {
    return (
      <>
        <Header fixed>
          <Search />
          <div className='ms-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <ConfigDrawer />
            <ProfileDropdown />
          </div>
        </Header>

        <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
          <div className='flex flex-wrap items-end justify-between gap-2'>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>
                Chỉnh sửa lịch phê duyệt
              </h2>
              <p className='text-muted-foreground'>Đang tải dữ liệu...</p>
            </div>
          </div>

          <div className='mx-auto w-full max-w-2xl'>
            <div className='flex items-center justify-center py-12'>
              <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
            </div>
          </div>
        </Main>
      </>
    )
  }

  // Handle not found error (404) with Vietnamese message (Requirement 6.2)
  if (isError || !data?.data) {
    return (
      <>
        <Header fixed>
          <Search />
          <div className='ms-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <ConfigDrawer />
            <ProfileDropdown />
          </div>
        </Header>

        <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
          <div className='flex flex-wrap items-end justify-between gap-2'>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>
                Chỉnh sửa lịch phê duyệt
              </h2>
            </div>
          </div>

          <div className='mx-auto w-full max-w-2xl'>
            <div className='rounded-lg border border-destructive bg-destructive/10 p-6 text-center'>
              <h3 className='mb-2 text-lg font-semibold text-destructive'>
                Không tìm thấy lịch phê duyệt
              </h3>
              <p className='mb-4 text-sm text-muted-foreground'>
                {error?.message ||
                  'Lịch phê duyệt không tồn tại hoặc đã bị xóa.'}
              </p>
              <button
                onClick={() => navigate({ to: '/review-schedules' })}
                className='inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90'
              >
                Quay lại danh sách
              </button>
            </div>
          </div>
        </Main>
      </>
    )
  }

  const schedule = data.data

  // Check if schedule is completed - make form read-only (Requirement 6.4)
  const isCompleted = schedule.status === ReviewScheduleStatus.COMPLETED

  // Prepare default values for the form (Requirement 6.2)
  const defaultValues: Partial<ReviewScheduleFormInput> = {
    name: schedule.name,
    semesterId: schedule.semesterId,
    reviewStartDate: schedule.reviewStartDate,
    l1Deadline: schedule.l1Deadline,
    l2Deadline: schedule.l2Deadline,
    finalApprovalDate: schedule.finalApprovalDate,
    alertConfig: schedule.alertConfig,
  }

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <ErrorBoundary>
          {/* Page title (Requirement 6.1) */}
          <div className='flex flex-wrap items-end justify-between gap-2'>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>
                Chỉnh sửa lịch phê duyệt
              </h2>
              <p className='text-muted-foreground'>
                Cập nhật thông tin lịch phê duyệt {schedule.name}
              </p>
              {isCompleted && (
                <p className='mt-2 text-sm font-medium text-amber-600'>
                  ⚠️ Lịch phê duyệt đã hoàn thành. Không thể chỉnh sửa.
                </p>
              )}
            </div>
          </div>

          {/* Review schedule form in edit mode with defaultValues (Requirements 6.2, 6.3, 6.4) */}
          <div className='mx-auto w-full max-w-2xl'>
            {isCompleted ? (
              // Read-only view for completed schedules (Requirement 6.4)
              <div className='rounded-lg border bg-muted/50 p-6'>
                <div className='space-y-4'>
                  <div>
                    <h3 className='text-sm font-medium text-muted-foreground'>
                      Tên chu kỳ phê duyệt
                    </h3>
                    <p className='mt-1 text-base'>{schedule.name}</p>
                  </div>
                  <div>
                    <h3 className='text-sm font-medium text-muted-foreground'>
                      Học kỳ
                    </h3>
                    <p className='mt-1 text-base'>
                      {schedule.semesterName} - {schedule.academicYear}
                    </p>
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <h3 className='text-sm font-medium text-muted-foreground'>
                        Ngày bắt đầu
                      </h3>
                      <p className='mt-1 text-base'>
                        {new Date(schedule.reviewStartDate).toLocaleDateString(
                          'vi-VN'
                        )}
                      </p>
                    </div>
                    <div>
                      <h3 className='text-sm font-medium text-muted-foreground'>
                        Hạn L1
                      </h3>
                      <p className='mt-1 text-base'>
                        {new Date(schedule.l1Deadline).toLocaleDateString(
                          'vi-VN'
                        )}
                      </p>
                    </div>
                    <div>
                      <h3 className='text-sm font-medium text-muted-foreground'>
                        Hạn L2
                      </h3>
                      <p className='mt-1 text-base'>
                        {new Date(schedule.l2Deadline).toLocaleDateString(
                          'vi-VN'
                        )}
                      </p>
                    </div>
                    <div>
                      <h3 className='text-sm font-medium text-muted-foreground'>
                        Ngày phê duyệt cuối
                      </h3>
                      <p className='mt-1 text-base'>
                        {new Date(
                          schedule.finalApprovalDate
                        ).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <div className='pt-4'>
                    <button
                      onClick={() =>
                        navigate({ to: `/review-schedules/view/${id}` })
                      }
                      className='inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90'
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Editable form for non-completed schedules (Requirements 6.2, 6.3)
              <ReviewScheduleForm
                mode='edit'
                defaultValues={defaultValues}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isSubmitting={updateMutation.isPending}
                onDirtyChange={setIsDirty}
                existingSchedule={schedule}
              />
            )}
          </div>
        </ErrorBoundary>
      </Main>

      {/* Unsaved changes confirmation dialog (Requirements 6.7) */}
      <AlertDialog open={showConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn rời đi?</AlertDialogTitle>
            <AlertDialogDescription>
              Các thay đổi chưa lưu sẽ bị mất. Bạn có muốn tiếp tục?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelNavigation}>
              Ở lại
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmNavigation}>
              Rời đi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
