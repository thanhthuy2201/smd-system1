import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'

/**
 * Hook for tracking unsaved form changes and preventing accidental navigation
 *
 * @param isDirty - Whether the form has unsaved changes (from React Hook Form's formState.isDirty)
 * @returns Object with confirmation dialog state and navigation handlers
 *
 * @example
 * ```tsx
 * const { formState: { isDirty } } = useForm()
 * const { showConfirmDialog, confirmNavigation, cancelNavigation, checkNavigation } = useFormDirty(isDirty)
 *
 * // Use checkNavigation before programmatic navigation
 * const handleCancel = () => {
 *   if (checkNavigation('/review-schedules')) {
 *     // Navigation allowed (form not dirty)
 *   }
 *   // Otherwise confirmation dialog will be shown
 * }
 *
 * // Render confirmation dialog
 * <AlertDialog open={showConfirmDialog}>
 *   <AlertDialogContent>
 *     <AlertDialogTitle>Bạn có chắc chắn muốn rời đi?</AlertDialogTitle>
 *     <AlertDialogDescription>
 *       Các thay đổi chưa lưu sẽ bị mất.
 *     </AlertDialogDescription>
 *     <AlertDialogFooter>
 *       <AlertDialogCancel onClick={cancelNavigation}>Ở lại</AlertDialogCancel>
 *       <AlertDialogAction onClick={confirmNavigation}>Rời đi</AlertDialogAction>
 *     </AlertDialogFooter>
 *   </AlertDialogContent>
 * </AlertDialog>
 * ```
 */
export function useFormDirty(isDirty: boolean) {
  const navigate = useNavigate()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null
  )

  // Intercept browser navigation (tab close, refresh, back button) when form is dirty
  useEffect(() => {
    if (!isDirty) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      // Modern browsers require returnValue to be set
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  /**
   * Confirm pending navigation and proceed to the stored path
   */
  const confirmNavigation = () => {
    if (pendingNavigation) {
      navigate({ to: pendingNavigation })
    }
    setShowConfirmDialog(false)
    setPendingNavigation(null)
  }

  /**
   * Cancel pending navigation and stay on current page
   */
  const cancelNavigation = () => {
    setPendingNavigation(null)
    setShowConfirmDialog(false)
  }

  /**
   * Check if navigation should proceed or show confirmation dialog
   *
   * @param path - The path to navigate to
   * @returns true if navigation is allowed (form not dirty), false if confirmation is needed
   */
  const checkNavigation = (path: string): boolean => {
    if (isDirty) {
      setPendingNavigation(path)
      setShowConfirmDialog(true)
      return false
    }
    return true
  }

  return {
    showConfirmDialog,
    confirmNavigation,
    cancelNavigation,
    checkNavigation,
  }
}
