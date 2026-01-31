import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
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
import { AcademicYearForm } from './components/academic-year-form'
import { type AcademicYearFormInput } from './data/schema'
import { useAcademicYear } from './hooks/use-academic-year'
import { useUpdateAcademicYear } from './hooks/use-academic-year-mutations'
import { useFormDirty } from './hooks/use-form-dirty'

/**
 * Academic Year Edit Screen
 * Form for updating existing academic years
 *
 * Features:
 * - Page title "Chỉnh sửa năm học"
 * - Fetch academic year details by ID from route params
 * - Handle loading state while fetching
 * - Handle not found error (404) with Vietnamese message
 * - Academic year form in edit mode with defaultValues
 * - Form validation with Vietnamese error messages
 * - Success toast on update
 * - Navigation to list page after success
 * - Unsaved changes detection with confirmation dialog
 *
 * Validates Requirements 5.1, 5.2, 5.4, 5.5, 5.6, 5.7, 5.8, 9.2, 9.3, 11.2, 11.3, 11.4, 12.2
 */
export default function AcademicYearEdit() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false }) as { id: string }
  const [isDirty, setIsDirty] = useState(false)

  // Fetch academic year details (Requirement 5.2)
  const { data, isLoading, isError, error } = useAcademicYear(id)
  const updateMutation = useUpdateAcademicYear(id)

  // Form dirty tracking for unsaved changes detection
  const {
    showConfirmDialog,
    confirmNavigation,
    cancelNavigation,
    checkNavigation,
  } = useFormDirty(isDirty)

  /**
   * Handle form submission
   * Updates academic year and navigates to list on success
   */
  const handleSubmit = async (formData: AcademicYearFormInput) => {
    try {
      await updateMutation.mutateAsync(formData)
      // Clear dirty flag before navigation to avoid confirmation dialog (Requirement 11.5)
      setIsDirty(false)
      // Navigate to list page (Requirement 5.6)
      navigate({ to: '/academic-years' })
    } catch (_error) {
      // Error handling is done in the mutation hook with toast (Requirement 9.3)
      // Errors are already displayed to the user via toast notifications
    }
  }

  /**
   * Handle cancel button click
   * Checks for unsaved changes before navigating away (Requirement 5.8)
   */
  const handleCancel = () => {
    if (checkNavigation('/academic-years')) {
      // No unsaved changes, navigate immediately
      navigate({ to: '/academic-years' })
    }
    // Otherwise, confirmation dialog will be shown (Requirement 11.2)
  }

  // Handle loading state (Requirement 5.2)
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
                Chỉnh sửa năm học
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

  // Handle not found error (404) with Vietnamese message (Requirement 5.2)
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
                Chỉnh sửa năm học
              </h2>
            </div>
          </div>

          <div className='mx-auto w-full max-w-2xl'>
            <div className='rounded-lg border border-destructive bg-destructive/10 p-6 text-center'>
              <h3 className='mb-2 text-lg font-semibold text-destructive'>
                Không tìm thấy năm học
              </h3>
              <p className='mb-4 text-sm text-muted-foreground'>
                {error?.message || 'Năm học không tồn tại hoặc đã bị xóa.'}
              </p>
              <button
                onClick={() => navigate({ to: '/academic-years' })}
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

  const academicYear = data.data

  // Prepare default values for the form (Requirement 5.2)
  const defaultValues: Partial<AcademicYearFormInput> = {
    code: academicYear.code,
    name: academicYear.name || '',
    startDate: academicYear.startDate,
    endDate: academicYear.endDate,
    status: academicYear.status,
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
        {/* Page title (Requirement 5.1) */}
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>
              Chỉnh sửa năm học
            </h2>
            <p className='text-muted-foreground'>
              Cập nhật thông tin năm học {academicYear.code}
            </p>
          </div>
        </div>

        {/* Academic year form in edit mode with defaultValues (Requirement 5.2, 5.4) */}
        <div className='mx-auto w-full max-w-2xl'>
          <AcademicYearForm
            mode='edit'
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={updateMutation.isPending}
            onDirtyChange={setIsDirty}
          />
        </div>
      </Main>

      {/* Unsaved changes confirmation dialog (Requirements 5.7, 11.2, 11.3, 11.4) */}
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
