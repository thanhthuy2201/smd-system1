import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
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
import { useCreateAcademicYear } from './hooks/use-academic-year-mutations'
import { useFormDirty } from './hooks/use-form-dirty'

/**
 * Academic Year Add Screen
 * Form for creating new academic years
 *
 * Features:
 * - Page title "Thêm năm học mới"
 * - Academic year form in create mode
 * - Form validation with Vietnamese error messages
 * - Success toast on creation
 * - Navigation to list page after success
 * - Unsaved changes detection with confirmation dialog
 *
 * Validates Requirements 2.1, 2.3, 2.4, 2.5, 9.2, 9.3, 12.1
 */
export default function AcademicYearAdd() {
  const navigate = useNavigate()
  const createMutation = useCreateAcademicYear()
  const [isDirty, setIsDirty] = useState(false)

  // Form dirty tracking for unsaved changes detection
  const {
    showConfirmDialog,
    confirmNavigation,
    cancelNavigation,
    checkNavigation,
  } = useFormDirty(isDirty)

  /**
   * Handle form submission
   * Creates new academic year and navigates to list on success
   */
  const handleSubmit = async (data: AcademicYearFormInput) => {
    try {
      await createMutation.mutateAsync(data)
      // Clear dirty flag before navigation to avoid confirmation dialog
      setIsDirty(false)
      // Navigate to list page (Requirement 2.4)
      navigate({ to: '/academic-years' })
    } catch (_error) {
      // Error handling is done in the mutation hook with toast (Requirement 9.3)
      // Errors are already displayed to the user via toast notifications
    }
  }

  /**
   * Handle cancel button click
   * Checks for unsaved changes before navigating away
   */
  const handleCancel = () => {
    if (checkNavigation('/academic-years')) {
      // No unsaved changes, navigate immediately
      navigate({ to: '/academic-years' })
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
        {/* Page title (Requirement 2.1) */}
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>
              Thêm năm học mới
            </h2>
            <p className='text-muted-foreground'>
              Tạo năm học mới trong hệ thống
            </p>
          </div>
        </div>

        {/* Academic year form in create mode */}
        <div className='mx-auto w-full max-w-2xl'>
          <AcademicYearForm
            mode='create'
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={createMutation.isPending}
            onDirtyChange={setIsDirty}
          />
        </div>
      </Main>

      {/* Unsaved changes confirmation dialog (Requirements 2.5, 11.2) */}
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
