# Error Handling Implementation - Review Schedule Management

## Overview

This document describes the comprehensive error handling implementation for the Review Schedule Management feature. The implementation follows task 26 requirements and validates Requirements 9.4, 9.5, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8.

## Components

### 1. Error Boundary Component

**Location:** `src/features/review-schedules/components/error-boundary.tsx`

**Purpose:** Catches JavaScript errors anywhere in the child component tree and displays a fallback UI.

**Features:**

- Catches component-level errors (Requirement 12.1)
- Displays user-friendly error message in Vietnamese
- Provides retry button to reset error state
- Logs errors to console for debugging (Requirement 12.8)
- Supports custom fallback UI
- Shows detailed error information in development mode

**Usage:**

```tsx
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### 2. Error Handler Utility

**Location:** `src/features/review-schedules/lib/error-handler.ts`

**Purpose:** Centralized error handling logic with Vietnamese error messages.

**Key Functions:**

#### `handleReviewScheduleError(error, context?)`

Parses errors and returns structured error information with Vietnamese messages.

**Parameters:**

- `error`: The error to handle (any type)
- `context`: Optional context string for logging

**Returns:** `ReviewScheduleError` object with:

- `type`: Error type enum
- `message`: Vietnamese error message
- `originalError`: Original error object
- `statusCode`: HTTP status code (if applicable)
- `details`: Validation error details (if applicable)

#### `showErrorToast(error, customMessage?)`

Displays error toast notification with Vietnamese message.

#### `handleAndShowError(error, context?, customMessage?)`

Convenience function that combines error handling and toast display.

#### `formatValidationErrors(details?)`

Converts API validation error details to field-specific messages for form display.

#### `isRetryableError(error)`

Determines if the operation should be retried based on error type.

### 3. Error Types

**Enum:** `ReviewScheduleErrorType`

- `NETWORK_ERROR` - Network connectivity issues (Requirement 12.6)
- `VALIDATION_ERROR` - Form validation errors (Requirement 12.2)
- `PERMISSION_ERROR` - Authorization errors (Requirement 12.7)
- `NOT_FOUND_ERROR` - Resource not found (Requirement 12.4)
- `CONFLICT_ERROR` - Duplicate resources (Requirement 12.5)
- `BUSINESS_RULE_ERROR` - Business logic violations (Requirements 12.6, 12.7)
- `SERVER_ERROR` - Server-side errors (Requirement 12.3)
- `UNKNOWN_ERROR` - Unclassified errors

## Error Messages

All error messages are in Vietnamese and mapped to specific error scenarios:

### Network Errors (Requirement 12.6)

- `NETWORK_ERROR`: "Lỗi kết nối mạng. Vui lòng thử lại."
- `TIMEOUT_ERROR`: "Yêu cầu quá thời gian chờ. Vui lòng thử lại."

### Permission Errors (Requirement 12.7)

- `PERMISSION_ERROR`: "Bạn không có quyền thực hiện thao tác này"
- `FORBIDDEN`: "Bạn không có quyền thực hiện thao tác này"

### Not Found Errors (Requirement 12.4)

- `NOT_FOUND`: "Không tìm thấy lịch phê duyệt"
- `SCHEDULE_NOT_FOUND`: "Không tìm thấy lịch phê duyệt"

### Conflict Errors (Requirement 12.5)

- `DUPLICATE_SCHEDULE`: "Lịch phê duyệt đã tồn tại cho học kỳ này"
- `SCHEDULE_EXISTS`: "Lịch phê duyệt đã tồn tại cho học kỳ này"

### Business Rule Violations (Requirements 12.6, 12.7)

- `CANNOT_DELETE_ACTIVE`: "Không thể xóa lịch phê duyệt đang hoạt động"
- `CANNOT_SHORTEN_DEADLINE`: "Không thể rút ngắn hạn chót. Chỉ có thể gia hạn."
- `CANNOT_EDIT_COMPLETED`: "Không thể chỉnh sửa lịch phê duyệt đã hoàn thành"
- `HAS_REVIEWS`: "Không thể xóa lịch phê duyệt đã có đề cương được phê duyệt"

### Validation Errors (Requirement 12.2)

- `VALIDATION_ERROR`: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại."
- Field-level errors displayed below specific form fields

### Server Errors (Requirement 12.3)

- `SERVER_ERROR`: "Lỗi máy chủ. Vui lòng thử lại sau."
- `INTERNAL_ERROR`: "Lỗi hệ thống. Vui lòng liên hệ quản trị viên."

## Implementation in Components

### List Screen (`index.tsx`)

- Wrapped content in `<ErrorBoundary>`
- Table component handles loading, error, and empty states
- Error state displays Vietnamese message with retry button

### Create Screen (`create.tsx`)

- Wrapped form in `<ErrorBoundary>`
- Uses `handleReviewScheduleError` and `showErrorToast` for API errors
- Handles validation errors with field-level display
- Handles network, permission, conflict, and server errors

### Edit Screen (`edit.tsx`)

- Wrapped form in `<ErrorBoundary>`
- Uses `handleReviewScheduleError` and `showErrorToast` for API errors
- Handles 404 errors for not found schedules
- Handles business rule violations (cannot edit completed, cannot shorten deadlines)
- Displays loading state while fetching

### Detail Screen (`detail.tsx`)

- Wrapped content in `<ErrorBoundary>`
- Uses `handleReviewScheduleError` and `showErrorToast` for API errors
- Handles 404 errors for not found schedules
- Handles errors in send reminder and export report actions
- Displays loading state while fetching

### Table Component (`review-schedule-table.tsx`)

- Displays loading state with skeleton loader
- Displays error state with Vietnamese message and retry button
- Displays empty state with Vietnamese message

### Row Actions Component (`row-actions.tsx`)

- Uses `handleReviewScheduleError` and `showErrorToast` for delete errors
- Handles business rule violations (cannot delete active schedule)
- Uses `handleReviewScheduleError` and `showErrorToast` for send reminder errors

## Error Logging

All errors are logged to console for debugging (Requirement 12.8):

```typescript
console.error('[Review Schedule Error]', {
  context,
  error,
  timestamp: new Date().toISOString(),
})
```

Error logs include:

- Context (operation being performed)
- Error object with full details
- Timestamp in ISO format

## HTTP Status Code Handling

The error handler maps HTTP status codes to appropriate error types and messages:

- **400 Bad Request**: Validation or business rule errors
- **401 Unauthorized**: Session expired (handled by API client interceptor)
- **403 Forbidden**: Permission denied
- **404 Not Found**: Resource not found
- **409 Conflict**: Duplicate resource
- **422 Unprocessable Entity**: Validation error
- **500/502/503**: Server errors

## Validation Error Display

Validation errors are displayed at two levels:

1. **Field-level**: Errors appear below specific form fields with red text
2. **Form-level**: General validation errors appear at the top of the form

The `formatValidationErrors` utility converts API validation error details to field-specific messages for React Hook Form integration.

## Retry Functionality

The error handler provides `isRetryableError()` to determine if an operation should be retried:

- **Retryable**: Network errors, server errors
- **Not Retryable**: Validation errors, permission errors, business rule violations

The table component provides a retry button for retryable errors.

## Testing Error Handling

To test error handling:

1. **Network Errors**: Disconnect network or use browser DevTools to simulate offline
2. **Validation Errors**: Submit forms with invalid data
3. **Permission Errors**: Mock 403 responses from API
4. **Not Found Errors**: Navigate to non-existent schedule ID
5. **Conflict Errors**: Try to create duplicate schedule
6. **Business Rule Violations**: Try to delete active schedule or shorten deadlines
7. **Server Errors**: Mock 500 responses from API

## Best Practices

1. **Always use error boundary**: Wrap feature components in `<ErrorBoundary>`
2. **Use error handler utility**: Don't manually parse errors
3. **Log all errors**: Errors are automatically logged by the handler
4. **Show user-friendly messages**: All messages are in Vietnamese
5. **Provide retry options**: For retryable errors, show retry button
6. **Handle specific cases**: Check for specific error types and show appropriate messages

## Future Enhancements

1. **Error reporting service**: Send errors to external monitoring service (e.g., Sentry)
2. **User feedback**: Allow users to report errors with additional context
3. **Offline support**: Queue operations when offline and retry when online
4. **Error analytics**: Track error frequency and patterns
5. **Localization**: Support multiple languages beyond Vietnamese

## Requirements Validation

✅ **Requirement 9.4**: Delete operation errors handled with specific messages  
✅ **Requirement 9.5**: Business rule violations handled (cannot delete active schedule)  
✅ **Requirement 12.1**: All API errors display Vietnamese messages  
✅ **Requirement 12.2**: Validation errors displayed at field level  
✅ **Requirement 12.3**: Server errors handled with toast notifications  
✅ **Requirement 12.4**: 404 errors handled with "Không tìm thấy lịch phê duyệt"  
✅ **Requirement 12.5**: List load failures display error state with retry option  
✅ **Requirement 12.6**: Network errors display "Lỗi kết nối mạng. Vui lòng thử lại."  
✅ **Requirement 12.7**: 403 errors display "Bạn không có quyền thực hiện thao tác này"  
✅ **Requirement 12.8**: All errors logged to console for debugging

## Conclusion

The error handling implementation provides comprehensive coverage of all error scenarios with user-friendly Vietnamese messages, proper logging, and retry functionality. The implementation follows React best practices with error boundaries and centralized error handling logic.
