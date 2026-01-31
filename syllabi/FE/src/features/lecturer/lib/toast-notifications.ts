import { toast } from 'sonner'
import { type AxiosError } from 'axios'
import { type ApiError } from '@/lib/api-client'

/**
 * Toast Notifications Utility
 * 
 * Provides standardized toast notifications for the lecturer module
 * with consistent styling, messaging, and error handling.
 * 
 * Features:
 * - Success toasts for completed operations
 * - Error toasts with retry options
 * - Loading toasts for long operations
 * - Info/warning toasts for user guidance
 * - Automatic error message extraction from API responses
 */

/**
 * Show success toast notification
 * @param message - Success message to display
 * @param description - Optional detailed description
 */
export function showSuccessToast(message: string, description?: string) {
  toast.success(message, {
    description,
    duration: 4000,
  })
}

/**
 * Show error toast notification
 * @param message - Error message to display
 * @param description - Optional detailed description
 * @param onRetry - Optional retry callback function
 */
export function showErrorToast(
  message: string,
  description?: string,
  onRetry?: () => void
) {
  toast.error(message, {
    description,
    duration: 6000,
    action: onRetry
      ? {
          label: 'Retry',
          onClick: onRetry,
        }
      : undefined,
  })
}

/**
 * Show loading toast notification
 * Returns toast ID that can be used to dismiss or update the toast
 * @param message - Loading message to display
 * @param description - Optional detailed description
 */
export function showLoadingToast(message: string, description?: string) {
  return toast.loading(message, {
    description,
  })
}

/**
 * Show info toast notification
 * @param message - Info message to display
 * @param description - Optional detailed description
 */
export function showInfoToast(message: string, description?: string) {
  toast.info(message, {
    description,
    duration: 5000,
  })
}

/**
 * Show warning toast notification
 * @param message - Warning message to display
 * @param description - Optional detailed description
 */
export function showWarningToast(message: string, description?: string) {
  toast.warning(message, {
    description,
    duration: 5000,
  })
}

/**
 * Dismiss a specific toast by ID
 * @param toastId - ID of the toast to dismiss
 */
export function dismissToast(toastId: string | number) {
  toast.dismiss(toastId)
}

/**
 * Update an existing toast
 * @param toastId - ID of the toast to update
 * @param options - New toast options
 */
export function updateToast(
  toastId: string | number,
  options: {
    message?: string
    description?: string
    type?: 'success' | 'error' | 'info' | 'warning'
  }
) {
  const { message, description, type = 'success' } = options

  if (type === 'success') {
    toast.success(message, { id: toastId, description })
  } else if (type === 'error') {
    toast.error(message, { id: toastId, description })
  } else if (type === 'info') {
    toast.info(message, { id: toastId, description })
  } else if (type === 'warning') {
    toast.warning(message, { id: toastId, description })
  }
}

/**
 * Extract user-friendly error message from API error
 * @param error - Axios error object
 * @returns User-friendly error message
 */
function extractErrorMessage(error: AxiosError<ApiError>): string {
  // Check if error has userMessage attached by interceptor
  if ((error as any).userMessage) {
    return (error as any).userMessage
  }

  // Extract from response data
  if (error.response?.data?.message) {
    return error.response.data.message
  }

  // Default messages based on status
  const status = error.response?.status
  switch (status) {
    case 401:
      return 'Your session has expired. Please log in again.'
    case 403:
      return 'You do not have permission to perform this action.'
    case 404:
      return 'The requested resource was not found.'
    case 409:
      return 'This action conflicts with the current state.'
    case 422:
      return 'Please check your input and try again.'
    case 500:
    case 502:
    case 503:
      return 'A server error occurred. Please try again later.'
    default:
      return error.message || 'An unexpected error occurred.'
  }
}

/**
 * Extract validation errors from API error
 * @param error - Axios error object
 * @returns Array of validation error messages
 */
function extractValidationErrors(error: AxiosError<ApiError>): string[] {
  const details = error.response?.data?.details
  if (details && Array.isArray(details)) {
    return details.map((d) => `${d.field}: ${d.message}`)
  }
  return []
}

/**
 * Show error toast from API error
 * Automatically extracts appropriate message from error response
 * @param error - Axios error object
 * @param fallbackMessage - Fallback message if extraction fails
 * @param onRetry - Optional retry callback function
 */
export function showApiErrorToast(
  error: unknown,
  fallbackMessage: string = 'An error occurred',
  onRetry?: () => void
) {
  const axiosError = error as AxiosError<ApiError>
  const message = extractErrorMessage(axiosError)

  // For validation errors, show detailed field errors
  if (axiosError.response?.status === 422) {
    const validationErrors = extractValidationErrors(axiosError)
    if (validationErrors.length > 0) {
      showErrorToast(
        'Validation Error',
        validationErrors.join('\n'),
        onRetry
      )
      return
    }
  }

  showErrorToast(message || fallbackMessage, undefined, onRetry)
}

/**
 * Syllabus-specific toast notifications
 */
export const syllabusToasts = {
  created: () => showSuccessToast('Syllabus created successfully'),
  updated: () => showSuccessToast('Syllabus updated successfully'),
  deleted: () => showSuccessToast('Syllabus deleted successfully'),
  submitted: () =>
    showSuccessToast(
      'Syllabus submitted for review',
      'You will be notified when the review is complete'
    ),
  withdrawn: () => showSuccessToast('Submission withdrawn successfully'),
  autoSaved: () =>
    showInfoToast('Draft saved', 'Your changes have been saved automatically'),
  autoSaveFailed: (onRetry?: () => void) =>
    showErrorToast(
      'Auto-save failed',
      'Your changes could not be saved. Retrying...',
      onRetry
    ),
}

/**
 * Review-specific toast notifications
 */
export const reviewToasts = {
  evaluationSubmitted: () =>
    showSuccessToast('Evaluation submitted successfully'),
  evaluationSaved: () => showSuccessToast('Evaluation saved as draft'),
  commentAdded: () => showSuccessToast('Comment added successfully'),
  commentResolved: () => showSuccessToast('Comment marked as resolved'),
  commentDeleted: () => showSuccessToast('Comment deleted successfully'),
}

/**
 * Message-specific toast notifications
 */
export const messageToasts = {
  sent: () => showSuccessToast('Message sent successfully'),
  deleted: () => showSuccessToast('Message deleted successfully'),
  markedAsRead: () => showInfoToast('Message marked as read'),
  attachmentTooLarge: () =>
    showErrorToast(
      'Attachment too large',
      'Each file must be 10MB or less'
    ),
  tooManyAttachments: () =>
    showErrorToast(
      'Too many attachments',
      'Maximum 5 attachments allowed'
    ),
}

/**
 * Update request-specific toast notifications
 */
export const updateRequestToasts = {
  created: () =>
    showSuccessToast(
      'Update request created',
      'Your request has been submitted for review'
    ),
  submitted: () =>
    showSuccessToast(
      'Update request submitted',
      'You will be notified when the review is complete'
    ),
  cancelled: () => showSuccessToast('Update request cancelled'),
  approved: () =>
    showSuccessToast(
      'Update request approved',
      'Your changes have been applied to the syllabus'
    ),
  rejected: () =>
    showWarningToast(
      'Update request rejected',
      'Please review the feedback and submit a new request'
    ),
}

/**
 * General operation toast notifications
 */
export const operationToasts = {
  saving: () => showLoadingToast('Saving...'),
  loading: () => showLoadingToast('Loading...'),
  uploading: () => showLoadingToast('Uploading...'),
  processing: () => showLoadingToast('Processing...'),
  networkError: (onRetry?: () => void) =>
    showErrorToast(
      'Network error',
      'Please check your connection and try again',
      onRetry
    ),
  unauthorized: () =>
    showErrorToast(
      'Unauthorized',
      'Your session has expired. Please log in again'
    ),
  forbidden: () =>
    showErrorToast(
      'Access denied',
      'You do not have permission to perform this action'
    ),
  notFound: () =>
    showErrorToast('Not found', 'The requested resource was not found'),
  conflict: () =>
    showErrorToast(
      'Conflict',
      'This action conflicts with the current state'
    ),
}
