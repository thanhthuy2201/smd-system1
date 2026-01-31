# useFormDirty Hook - Usage Example

## Overview

The `useFormDirty` hook provides form dirty tracking and navigation guards to prevent users from accidentally losing unsaved changes.

## Features

1. **Browser Navigation Protection**: Intercepts browser events (tab close, refresh, back button) when form has unsaved changes
2. **In-App Navigation Guard**: Provides confirmation dialog for programmatic navigation within the app
3. **Confirmation Dialog State**: Manages dialog visibility and pending navigation state

## Basic Usage

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useFormDirty } from '@/features/academic-years/hooks'

function AcademicYearForm() {
  const form = useForm({
    resolver: zodResolver(academicYearFormSchema),
    defaultValues: {
      code: '',
      name: '',
      startDate: new Date(),
      endDate: new Date(),
      status: 'ACTIVE',
    },
  })

  // Get isDirty from React Hook Form
  const { isDirty } = form.formState

  // Initialize the hook
  const {
    showConfirmDialog,
    confirmNavigation,
    cancelNavigation,
    checkNavigation,
  } = useFormDirty(isDirty)

  // Use checkNavigation before programmatic navigation
  const handleCancel = () => {
    if (checkNavigation('/academic-years')) {
      // Navigation allowed (form not dirty)
      // This line won't execute if form is dirty
    }
    // If form is dirty, confirmation dialog will be shown automatically
  }

  const handleSubmit = async (data: AcademicYearFormInput) => {
    // Submit logic here
    // After successful submit, form.reset() will clear isDirty
  }

  return (
    <>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        {/* Form fields */}

        <div className='flex gap-2'>
          <Button type='button' variant='outline' onClick={handleCancel}>
            Hủy
          </Button>
          <Button type='submit'>Lưu</Button>
        </div>
      </form>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Bạn có chắc chắn muốn rời đi?</AlertDialogTitle>
          <AlertDialogDescription>
            Các thay đổi chưa lưu sẽ bị mất. Bạn có muốn tiếp tục?
          </AlertDialogDescription>
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
```

## How It Works

### 1. Browser Navigation Protection

When `isDirty` is `true`, the hook adds a `beforeunload` event listener that prevents the browser from closing/refreshing without confirmation:

```typescript
useEffect(() => {
  if (!isDirty) return

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    e.preventDefault()
    e.returnValue = '' // Required by modern browsers
  }

  window.addEventListener('beforeunload', handleBeforeUnload)
  return () => window.removeEventListener('beforeunload', handleBeforeUnload)
}, [isDirty])
```

### 2. In-App Navigation Guard

The `checkNavigation` function checks if navigation should proceed:

- If form is **not dirty**: Returns `true`, navigation proceeds normally
- If form is **dirty**: Shows confirmation dialog, returns `false`

```typescript
const checkNavigation = (path: string): boolean => {
  if (isDirty) {
    setPendingNavigation(path)
    setShowConfirmDialog(true)
    return false // Block navigation
  }
  return true // Allow navigation
}
```

### 3. Confirmation Dialog Actions

- **confirmNavigation()**: Proceeds with the pending navigation
- **cancelNavigation()**: Cancels navigation and stays on current page

## Integration with React Hook Form

The hook is designed to work seamlessly with React Hook Form's `isDirty` flag:

```typescript
const {
  formState: { isDirty },
} = useForm()
const dirtyTracking = useFormDirty(isDirty)
```

After successful form submission, call `form.reset()` to clear the dirty flag:

```typescript
const handleSubmit = async (data: AcademicYearFormInput) => {
  await createAcademicYear(data)
  form.reset() // Clears isDirty flag
  navigate({ to: '/academic-years' }) // Safe to navigate now
}
```

## Requirements Satisfied

- **Requirement 11.1**: Tracks form modifications via `isDirty` parameter
- **Requirement 11.2**: Displays confirmation dialog on navigation attempt with unsaved changes
- **Requirement 11.5**: Clears unsaved changes flag after successful save (via form.reset())

## Notes

- The browser's `beforeunload` dialog text cannot be customized due to browser security restrictions
- The in-app confirmation dialog can be fully customized with Vietnamese text
- The hook automatically cleans up event listeners when component unmounts
- Works with TanStack Router's navigation system
