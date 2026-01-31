import React, { Component, type ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Error Boundary Props
 */
interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

/**
 * Error Boundary State
 */
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 *
 * Features:
 * - Catches component-level errors
 * - Displays user-friendly error message in Vietnamese
 * - Provides retry button to reset error state
 * - Logs errors to console for debugging
 * - Supports custom fallback UI
 *
 * Validates Requirements 12.1, 12.8
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  /**
   * Log error details when an error is caught
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console for debugging (Requirement 12.8)
    console.error('[Error Boundary] Component error caught:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    })

    // Update state with error info
    this.setState({
      errorInfo,
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  /**
   * Reset error state and retry rendering
   */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className='flex min-h-[400px] items-center justify-center p-4'>
          <Card className='w-full max-w-2xl'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-destructive'>
                <AlertCircle className='h-6 w-6' />
                Đã xảy ra lỗi
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='rounded-lg bg-destructive/10 p-4'>
                <p className='text-sm text-muted-foreground'>
                  Rất tiếc, đã có lỗi xảy ra khi hiển thị nội dung này. Vui lòng
                  thử lại hoặc liên hệ với quản trị viên nếu lỗi vẫn tiếp diễn.
                </p>
                {this.state.error && import.meta.env.DEV && (
                  <div className='mt-4 space-y-2'>
                    <p className='text-xs font-medium text-destructive'>
                      Chi tiết lỗi (chỉ hiển thị trong môi trường phát triển):
                    </p>
                    <pre className='overflow-auto rounded bg-muted p-2 text-xs'>
                      {this.state.error.message}
                    </pre>
                    {this.state.error.stack && (
                      <pre className='overflow-auto rounded bg-muted p-2 text-xs'>
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                )}
              </div>

              <div className='flex gap-2'>
                <Button onClick={this.handleReset} className='gap-2'>
                  <RefreshCw className='h-4 w-4' />
                  Thử lại
                </Button>
                <Button
                  variant='outline'
                  onClick={() => (window.location.href = '/review-schedules')}
                >
                  Quay lại danh sách
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
