import { AxiosError } from 'axios'
import { toast } from 'sonner'

/**
 * API Error Response Structure
 */
interface ApiErrorResponse {
  message?: string
  error?: string
  details?: Record<string, string[]>
  code?: string
  statusCode?: number
}

/**
 * Error Types for Review Schedule Management
 */
export enum ReviewScheduleErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  BUSINESS_RULE_ERROR = 'BUSINESS_RULE_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Structured Error Information
 */
export interface ReviewScheduleError {
  type: ReviewScheduleErrorType
  message: string
  originalError?: unknown
  statusCode?: number
  details?: Record<string, string[]>
}

/**
 * Vietnamese Error Messages
 * Maps error types and codes to user-friendly Vietnamese messages
 *
 * Validates Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Network errors (Requirement 12.6)
  NETWORK_ERROR: 'Lỗi kết nối mạng. Vui lòng thử lại.',
  TIMEOUT_ERROR: 'Yêu cầu quá thời gian chờ. Vui lòng thử lại.',

  // Permission errors (Requirement 12.7)
  PERMISSION_ERROR: 'Bạn không có quyền thực hiện thao tác này',
  FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này',

  // Not found errors (Requirement 12.4)
  NOT_FOUND: 'Không tìm thấy lịch phê duyệt',
  SCHEDULE_NOT_FOUND: 'Không tìm thấy lịch phê duyệt',

  // Conflict errors (Requirement 12.5)
  DUPLICATE_SCHEDULE: 'Lịch phê duyệt đã tồn tại cho học kỳ này',
  SCHEDULE_EXISTS: 'Lịch phê duyệt đã tồn tại cho học kỳ này',

  // Business rule violations (Requirement 12.6, 12.7)
  CANNOT_DELETE_ACTIVE: 'Không thể xóa lịch phê duyệt đang hoạt động',
  CANNOT_SHORTEN_DEADLINE: 'Không thể rút ngắn hạn chót. Chỉ có thể gia hạn.',
  CANNOT_EDIT_COMPLETED: 'Không thể chỉnh sửa lịch phê duyệt đã hoàn thành',
  HAS_REVIEWS: 'Không thể xóa lịch phê duyệt đã có đề cương được phê duyệt',

  // Validation errors (Requirement 12.2)
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.',
  INVALID_DATE_SEQUENCE: 'Thứ tự ngày không hợp lệ',
  INVALID_SEMESTER: 'Học kỳ không hợp lệ',
  INVALID_REVIEWER: 'Người phê duyệt không hợp lệ',

  // Server errors (Requirement 12.3)
  SERVER_ERROR: 'Lỗi máy chủ. Vui lòng thử lại sau.',
  INTERNAL_ERROR: 'Lỗi hệ thống. Vui lòng liên hệ quản trị viên.',

  // Default error
  UNKNOWN_ERROR: 'Có lỗi xảy ra. Vui lòng thử lại.',
}

/**
 * Parse API error response to extract error information
 */
function parseApiError(
  error: AxiosError<ApiErrorResponse>
): ReviewScheduleError {
  const response = error.response
  const statusCode = response?.status
  const data = response?.data

  // Network error (no response)
  if (!response) {
    return {
      type: ReviewScheduleErrorType.NETWORK_ERROR,
      message: ERROR_MESSAGES.NETWORK_ERROR,
      originalError: error,
    }
  }

  // Extract error message from response
  const errorMessage = data?.message || data?.error || error.message

  // Determine error type based on status code
  switch (statusCode) {
    case 400:
      // Bad Request - could be validation or business rule
      if (
        errorMessage.toLowerCase().includes('delete') &&
        errorMessage.toLowerCase().includes('active')
      ) {
        return {
          type: ReviewScheduleErrorType.BUSINESS_RULE_ERROR,
          message: ERROR_MESSAGES.CANNOT_DELETE_ACTIVE,
          originalError: error,
          statusCode,
        }
      }
      if (
        errorMessage.toLowerCase().includes('deadline') &&
        errorMessage.toLowerCase().includes('shorten')
      ) {
        return {
          type: ReviewScheduleErrorType.BUSINESS_RULE_ERROR,
          message: ERROR_MESSAGES.CANNOT_SHORTEN_DEADLINE,
          originalError: error,
          statusCode,
        }
      }
      if (errorMessage.toLowerCase().includes('completed')) {
        return {
          type: ReviewScheduleErrorType.BUSINESS_RULE_ERROR,
          message: ERROR_MESSAGES.CANNOT_EDIT_COMPLETED,
          originalError: error,
          statusCode,
        }
      }
      if (errorMessage.toLowerCase().includes('review')) {
        return {
          type: ReviewScheduleErrorType.BUSINESS_RULE_ERROR,
          message: ERROR_MESSAGES.HAS_REVIEWS,
          originalError: error,
          statusCode,
        }
      }
      return {
        type: ReviewScheduleErrorType.VALIDATION_ERROR,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        originalError: error,
        statusCode,
        details: data?.details,
      }

    case 401:
      // Unauthorized - handled by API client interceptor
      return {
        type: ReviewScheduleErrorType.PERMISSION_ERROR,
        message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        originalError: error,
        statusCode,
      }

    case 403:
      // Forbidden
      return {
        type: ReviewScheduleErrorType.PERMISSION_ERROR,
        message: ERROR_MESSAGES.PERMISSION_ERROR,
        originalError: error,
        statusCode,
      }

    case 404:
      // Not Found
      return {
        type: ReviewScheduleErrorType.NOT_FOUND_ERROR,
        message: ERROR_MESSAGES.NOT_FOUND,
        originalError: error,
        statusCode,
      }

    case 409:
      // Conflict
      return {
        type: ReviewScheduleErrorType.CONFLICT_ERROR,
        message: ERROR_MESSAGES.DUPLICATE_SCHEDULE,
        originalError: error,
        statusCode,
      }

    case 422:
      // Unprocessable Entity - validation error
      return {
        type: ReviewScheduleErrorType.VALIDATION_ERROR,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        originalError: error,
        statusCode,
        details: data?.details,
      }

    case 500:
    case 502:
    case 503:
      // Server errors
      return {
        type: ReviewScheduleErrorType.SERVER_ERROR,
        message: ERROR_MESSAGES.SERVER_ERROR,
        originalError: error,
        statusCode,
      }

    default:
      return {
        type: ReviewScheduleErrorType.UNKNOWN_ERROR,
        message: errorMessage || ERROR_MESSAGES.UNKNOWN_ERROR,
        originalError: error,
        statusCode,
      }
  }
}

/**
 * Handle review schedule errors
 * Parses error, logs to console, and returns structured error information
 *
 * @param error - The error to handle
 * @param context - Optional context for logging
 * @returns Structured error information
 *
 * Validates Requirements 12.1, 12.8
 */
export function handleReviewScheduleError(
  error: unknown,
  context?: string
): ReviewScheduleError {
  // Log error to console for debugging (Requirement 12.8)
  console.error('[Review Schedule Error]', {
    context,
    error,
    timestamp: new Date().toISOString(),
  })

  // Handle Axios errors
  if (error instanceof AxiosError) {
    return parseApiError(error)
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Check for network errors
    if (error.message.toLowerCase().includes('network')) {
      return {
        type: ReviewScheduleErrorType.NETWORK_ERROR,
        message: ERROR_MESSAGES.NETWORK_ERROR,
        originalError: error,
      }
    }

    // Check for timeout errors
    if (error.message.toLowerCase().includes('timeout')) {
      return {
        type: ReviewScheduleErrorType.NETWORK_ERROR,
        message: ERROR_MESSAGES.TIMEOUT_ERROR,
        originalError: error,
      }
    }

    return {
      type: ReviewScheduleErrorType.UNKNOWN_ERROR,
      message: error.message || ERROR_MESSAGES.UNKNOWN_ERROR,
      originalError: error,
    }
  }

  // Handle unknown error types
  return {
    type: ReviewScheduleErrorType.UNKNOWN_ERROR,
    message: ERROR_MESSAGES.UNKNOWN_ERROR,
    originalError: error,
  }
}

/**
 * Display error toast notification with Vietnamese message
 *
 * @param error - The error to display
 * @param customMessage - Optional custom message to override default
 *
 * Validates Requirements 12.1, 12.3
 */
export function showErrorToast(
  error: ReviewScheduleError,
  customMessage?: string
): void {
  const message = customMessage || error.message

  toast.error(message, {
    duration: 5000,
    description: error.statusCode ? `Mã lỗi: ${error.statusCode}` : undefined,
  })
}

/**
 * Handle error with automatic toast notification
 * Convenience function that combines error handling and toast display
 *
 * @param error - The error to handle
 * @param context - Optional context for logging
 * @param customMessage - Optional custom message to override default
 * @returns Structured error information
 *
 * Validates Requirements 12.1, 12.3, 12.8
 */
export function handleAndShowError(
  error: unknown,
  context?: string,
  customMessage?: string
): ReviewScheduleError {
  const parsedError = handleReviewScheduleError(error, context)
  showErrorToast(parsedError, customMessage)
  return parsedError
}

/**
 * Format validation errors for field-level display
 * Converts API validation error details to field-specific messages
 *
 * @param details - Validation error details from API
 * @returns Map of field names to error messages
 *
 * Validates Requirement 12.2
 */
export function formatValidationErrors(
  details?: Record<string, string[]>
): Record<string, string> {
  if (!details) return {}

  const formatted: Record<string, string> = {}

  for (const [field, messages] of Object.entries(details)) {
    // Join multiple messages with comma
    formatted[field] = messages.join(', ')
  }

  return formatted
}

/**
 * Check if error is a specific type
 * Utility function for conditional error handling
 */
export function isErrorType(
  error: ReviewScheduleError,
  type: ReviewScheduleErrorType
): boolean {
  return error.type === type
}

/**
 * Check if error is retryable
 * Determines if the operation should be retried based on error type
 */
export function isRetryableError(error: ReviewScheduleError): boolean {
  return (
    error.type === ReviewScheduleErrorType.NETWORK_ERROR ||
    error.type === ReviewScheduleErrorType.SERVER_ERROR
  )
}
