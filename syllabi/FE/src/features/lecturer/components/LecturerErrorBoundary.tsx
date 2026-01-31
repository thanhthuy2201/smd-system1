import { Component, type ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

/**
 * LecturerErrorBoundary Component
 * 
 * Error boundary for the lecturer module that catches JavaScript errors
 * anywhere in the child component tree, logs those errors, and displays
 * a fallback UI instead of crashing the entire application.
 * 
 * Features:
 * - Catches and displays errors with user-friendly messages
 * - Logs errors for debugging (can be extended to send to error tracking service)
 * - Provides retry functionality to attempt recovery
 * - Supports custom fallback UI
 * 
 * @example
 * ```tsx
 * <LecturerErrorBoundary>
 *   <SyllabusWizard />
 * </LecturerErrorBoundary>
 * ```
 */
export class LecturerErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('[Lecturer Module Error]', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    })

    // Store error info in state
    this.setState({ errorInfo })

    // TODO: Send error to error tracking service (e.g., Sentry, LogRocket)
    // Example:
    // errorTrackingService.logError({
    //   error,
    //   errorInfo,
    //   context: 'lecturer-module',
    //   timestamp: new Date().toISOString(),
    // })
  }

  handleReset = () => {
    // Reset error state
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
    
    // Call optional onReset callback
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTitle>Error Details</AlertTitle>
                <AlertDescription className="mt-2">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </AlertDescription>
              </Alert>

              {import.meta.env.DEV && this.state.errorInfo && (
                <details className="rounded-md border p-4">
                  <summary className="cursor-pointer font-medium">
                    Technical Details (Development Only)
                  </summary>
                  <pre className="mt-2 overflow-auto text-xs">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleReset} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/lecturer'}
                >
                  Go to Dashboard
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                If this problem persists, please contact support or try refreshing the page.
              </p>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
