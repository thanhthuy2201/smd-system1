import { Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

/**
 * Loading States Components
 * 
 * Provides various loading indicators and skeleton loaders for the lecturer module
 * to improve perceived performance and user experience during async operations.
 * 
 * Components:
 * - LoadingSpinner: Simple spinner for inline loading
 * - LoadingOverlay: Full-screen or container overlay with spinner
 * - SkeletonCard: Skeleton loader for card content
 * - SkeletonTable: Skeleton loader for data tables
 * - SkeletonForm: Skeleton loader for forms
 * - UploadProgress: Progress bar for file uploads
 */

/**
 * LoadingSpinner Component
 * Simple animated spinner for inline loading states
 */
export function LoadingSpinner({
  size = 'default',
  className = '',
}: {
  size?: 'sm' | 'default' | 'lg'
  className?: string
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  return (
    <Loader2
      className={`animate-spin ${sizeClasses[size]} ${className}`}
      aria-label="Loading"
    />
  )
}

/**
 * LoadingOverlay Component
 * Full-screen or container overlay with loading spinner and optional message
 */
export function LoadingOverlay({
  message = 'Loading...',
  fullScreen = false,
}: {
  message?: string
  fullScreen?: boolean
}) {
  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50'
    : 'absolute inset-0 z-10'

  return (
    <div
      className={`${containerClasses} flex items-center justify-center bg-background/80 backdrop-blur-sm`}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  )
}

/**
 * SkeletonCard Component
 * Skeleton loader for card-based content
 */
export function SkeletonCard({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </CardContent>
        </Card>
      ))}
    </>
  )
}

/**
 * SkeletonTable Component
 * Skeleton loader for data tables
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
}: {
  rows?: number
  columns?: number
}) {
  return (
    <div className="space-y-3">
      {/* Table header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`header-${index}`} className="h-10 flex-1" />
        ))}
      </div>

      {/* Table rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              className="h-12 flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * SkeletonForm Component
 * Skeleton loader for form fields
 */
export function SkeletonForm({ fields = 5 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-32" /> {/* Label */}
          <Skeleton className="h-10 w-full" /> {/* Input */}
        </div>
      ))}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" /> {/* Button */}
        <Skeleton className="h-10 w-24" /> {/* Button */}
      </div>
    </div>
  )
}

/**
 * SkeletonList Component
 * Skeleton loader for list items
 */
export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" /> {/* Avatar */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * UploadProgress Component
 * Progress bar for file upload operations
 */
export function UploadProgress({
  progress,
  fileName,
  onCancel,
}: {
  progress: number
  fileName?: string
  onCancel?: () => void
}) {
  return (
    <div className="space-y-2">
      {fileName && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{fileName}</p>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-sm text-muted-foreground hover:text-foreground"
              type="button"
            >
              Cancel
            </button>
          )}
        </div>
      )}
      <Progress value={progress} className="h-2" />
      <p className="text-xs text-muted-foreground">{progress}% complete</p>
    </div>
  )
}

/**
 * SkeletonSyllabusWizard Component
 * Skeleton loader specifically for the syllabus wizard
 */
export function SkeletonSyllabusWizard() {
  return (
    <div className="space-y-6">
      {/* Steps indicator */}
      <div className="flex justify-between">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-10 rounded-full" />
        ))}
      </div>

      {/* Form content */}
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <SkeletonForm fields={6} />
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}

/**
 * SkeletonSyllabusList Component
 * Skeleton loader for the syllabi list page
 */
export function SkeletonSyllabusList() {
  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table */}
      <SkeletonTable rows={10} columns={6} />

      {/* Pagination */}
      <div className="flex justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-64" />
      </div>
    </div>
  )
}

/**
 * SkeletonReviewCalendar Component
 * Skeleton loader for the review calendar
 */
export function SkeletonReviewCalendar() {
  return (
    <div className="space-y-4">
      {/* Calendar header */}
      <div className="flex justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
    </div>
  )
}

/**
 * SkeletonMessageInbox Component
 * Skeleton loader for the message inbox
 */
export function SkeletonMessageInbox() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="flex items-start gap-4 rounded-lg border p-4"
        >
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * InlineLoader Component
 * Small inline loader for buttons and inline actions
 */
export function InlineLoader({ text }: { text?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LoadingSpinner size="sm" />
      {text && <span>{text}</span>}
    </span>
  )
}

/**
 * PageLoader Component
 * Full-page loading state with centered spinner
 */
export function PageLoader({ message }: { message?: string }) {
  return (
    <div
      className="flex min-h-[400px] items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  )
}

/**
 * ButtonLoader Component
 * Loading state for buttons with spinner and text
 */
export function ButtonLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      {text}
    </>
  )
}
