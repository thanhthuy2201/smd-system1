import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
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
import { type ReviewScheduleFormInput } from './data/schema'
import { useFormDirty } from './hooks/use-form-dirty'
import { useCreateReviewSchedule } from './hooks/use-review-mutations'
import { handleReviewScheduleError, showErrorToast } from './lib/error-handler'

/**
 * Review Schedule Create Screen
 * Form for creating new review schedules
 *
 * Features:
 * - Page title "Tạo lịch phê duyệt mới"
 * - Review schedule form in create mode
 * - Form validation with Vietnamese error messages
 * - Success toast "Tạo lịch phê duyệt thành công" on creation
 * - Navigation to detail page after success
 * - Unsaved changes detection with confirmation dialog
 *
 * Validates Requirements 2.1, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 12.2, 13.1
 */
export default function ReviewScheduleCreate() {
  const navigate = useNavigate()
  const createMutation = useCreateReviewSchedule()
  const [isDirty, setIsDirty] = useState(false)

  // Form dirty tracking for unsaved changes detection (Requirement 2.6)
  const {
    showConfirmDialog,
    confirmNavigation,
    cancelNavigation,
    checkNavigation,
  } = useFormDirty(isDirty)

  /**
   * Handle form submission
   * Creates new review schedule and navigates to detail page on success
   * (Requirements 2.3, 2.4, 2.5, 13.1)
   */
  const handleSubmit = async (data: ReviewScheduleFormInput) => {
    try {
      const result = await createMutation.mutateAsync(data)
      // Clear dirty flag before navigation to avoid confirmation dialog
      setIsDirty(false)
      // Display success toast (Requirement 13.1)
      toast.success('Tạo lịch phê duyệt thành công')
      // Navigate to detail page (Requirement 2.5)
      navigate({ to: `/review-schedules/view/${result.data.id}` })
    } catch (error) {
      // Handle API errors with Vietnamese messages (Requirement 12.2, 12.8)
      const parsedError = handleReviewScheduleError(
        error,
        'Create Review Schedule'
      )
      showErrorToast(parsedError)
    }
  }

  /**
   * Handle cancel button click
   * Checks for unsaved changes before navigating away (Requirement 2.6)
   */
  const handleCancel = () => {
    if (checkNavigation('/review-schedules')) {
      // No unsaved changes, navigate immediately
      navigate({ to: '/review-schedules' })
    }
    // Otherwise, confirmation dialog will be shown
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
          {/* Page title (Requirement 2.1) */}
          <div className='flex flex-wrap items-end justify-between gap-2'>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>
                Tạo lịch phê duyệt mới
              </h2>
              <p className='text-muted-foreground'>
                Thiết lập chu kỳ phê duyệt đề cương cho học kỳ
              </p>
            </div>
          </div>

          {/* Review schedule form in create mode (Requirement 2.2) */}
          <div className='mx-auto w-full max-w-2xl'>
            <ReviewScheduleForm
              mode='create'
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={createMutation.isPending}
              onDirtyChange={setIsDirty}
            />
          </div>
        </ErrorBoundary>
      </Main>

      {/* Unsaved changes confirmation dialog (Requirement 2.6) */}
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
