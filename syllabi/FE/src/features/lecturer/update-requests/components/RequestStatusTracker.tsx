/**
 * RequestStatusTracker Component
 *
 * Displays update request status with:
 * - Update request status badge
 * - Review progress timeline
 * - Reviewer feedback display
 * - Approval/rejection decision
 *
 * Requirements: 9.11
 */

import { Check, Circle, Clock, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { UpdateRequestStatus } from '../../types'

export type ReviewStage = 'Submitted' | 'Under Review' | 'Decision Made'

export interface ReviewStageInfo {
  stage: ReviewStage
  status: 'completed' | 'current' | 'pending'
  completedAt?: Date | string
  reviewerName?: string
  reviewerRole?: string
}

export interface RequestStatusTrackerProps {
  /** Current status of the update request */
  status: UpdateRequestStatus
  /** Review stages with completion information */
  stages: ReviewStageInfo[]
  /** Reviewer feedback/comments (if any) */
  reviewComments?: string
  /** Name of the reviewer who made the decision */
  reviewedBy?: string
  /** Date when the request was reviewed */
  reviewedAt?: Date | string
  /** Optional CSS class name */
  className?: string
}

/**
 * RequestStatusTracker Component
 *
 * Displays the status and progress of an update request through the review cycle.
 * Shows timeline of stages, reviewer information, and feedback.
 *
 * @example
 * ```tsx
 * <RequestStatusTracker
 *   status="Pending"
 *   stages={[
 *     { stage: 'Submitted', status: 'completed', completedAt: '2026-01-15' },
 *     { stage: 'Under Review', status: 'current', reviewerName: 'Dr. Smith' },
 *     { stage: 'Decision Made', status: 'pending' }
 *   ]}
 * />
 * ```
 */
export function RequestStatusTracker({
  status,
  stages,
  reviewComments,
  reviewedBy,
  reviewedAt,
  className,
}: RequestStatusTrackerProps) {
  const currentStageIndex = stages.findIndex((s) => s.status === 'current')
  const completedStages = stages.filter((s) => s.status === 'completed').length
  const totalStages = stages.length
  const progressPercentage = (completedStages / totalStages) * 100

  /**
   * Get badge variant based on status
   */
  const getStatusVariant = (
    status: UpdateRequestStatus
  ): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (status) {
      case 'Approved':
        return 'default'
      case 'Pending':
      case 'Draft':
        return 'secondary'
      case 'Rejected':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  /**
   * Get status icon based on status
   */
  const getStatusIcon = (status: UpdateRequestStatus) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle2 className='size-4' aria-hidden='true' />
      case 'Rejected':
        return <XCircle className='size-4' aria-hidden='true' />
      case 'Pending':
        return <Clock className='size-4' aria-hidden='true' />
      case 'Draft':
        return <Circle className='size-4' aria-hidden='true' />
      default:
        return null
    }
  }

  /**
   * Get alert variant for feedback display
   */
  const getFeedbackVariant = (
    status: UpdateRequestStatus
  ): 'default' | 'destructive' => {
    return status === 'Rejected' ? 'destructive' : 'default'
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Update Request Status</CardTitle>
          <Badge variant={getStatusVariant(status)} className='flex items-center gap-1.5'>
            {getStatusIcon(status)}
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Progress Bar */}
        <div className='space-y-2'>
          <div className='flex justify-between text-sm text-muted-foreground'>
            <span>
              Stage {completedStages + (currentStageIndex >= 0 ? 1 : 0)} of{' '}
              {totalStages}
            </span>
            <span>{Math.round(progressPercentage)}% Complete</span>
          </div>
          <div
            className='h-2 w-full overflow-hidden rounded-full bg-secondary'
            role='progressbar'
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label='Update request progress'
          >
            <div
              className='h-full bg-primary transition-all duration-500 ease-out'
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Stages Timeline */}
        <div
          className='space-y-4'
          role='list'
          aria-label='Review stages timeline'
        >
          {stages.map((stageInfo, index) => {
            const isLast = index === stages.length - 1

            return (
              <div key={stageInfo.stage} role='listitem' className='relative'>
                <div className='flex items-start gap-4'>
                  {/* Stage Icon */}
                  <div className='relative flex shrink-0 flex-col items-center'>
                    <div
                      className={cn(
                        'flex size-8 items-center justify-center rounded-full border-2 transition-colors',
                        stageInfo.status === 'completed' &&
                          'border-primary bg-primary text-primary-foreground',
                        stageInfo.status === 'current' &&
                          'border-primary bg-background text-primary',
                        stageInfo.status === 'pending' &&
                          'border-muted bg-background text-muted-foreground'
                      )}
                    >
                      {stageInfo.status === 'completed' && (
                        <Check className='size-4' aria-hidden='true' />
                      )}
                      {stageInfo.status === 'current' && (
                        <Clock className='size-4' aria-hidden='true' />
                      )}
                      {stageInfo.status === 'pending' && (
                        <Circle className='size-4' aria-hidden='true' />
                      )}
                    </div>

                    {/* Connector Line */}
                    {!isLast && (
                      <div
                        className={cn(
                          'mt-2 h-12 w-0.5 transition-colors',
                          stageInfo.status === 'completed'
                            ? 'bg-primary'
                            : 'bg-muted'
                        )}
                        aria-hidden='true'
                      />
                    )}
                  </div>

                  {/* Stage Content */}
                  <div className='flex-1 pb-8'>
                    <div className='space-y-1'>
                      <p
                        className={cn(
                          'font-medium',
                          stageInfo.status === 'current' && 'text-primary',
                          stageInfo.status === 'pending' &&
                            'text-muted-foreground'
                        )}
                      >
                        {stageInfo.stage}
                      </p>

                      {stageInfo.reviewerName && (
                        <p className='text-sm text-muted-foreground'>
                          {stageInfo.reviewerRole && (
                            <span className='font-medium'>
                              {stageInfo.reviewerRole}:{' '}
                            </span>
                          )}
                          {stageInfo.reviewerName}
                        </p>
                      )}

                      {stageInfo.completedAt && (
                        <p className='text-xs text-muted-foreground'>
                          Completed on{' '}
                          {new Date(stageInfo.completedAt).toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </p>
                      )}

                      {stageInfo.status === 'current' && (
                        <Badge variant='secondary' className='mt-1'>
                          In Progress
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Reviewer Feedback Section */}
        {(status === 'Approved' || status === 'Rejected') && reviewComments && (
          <Alert variant={getFeedbackVariant(status)}>
            <AlertCircle className='size-4' />
            <AlertTitle>
              {status === 'Approved' ? 'Approval Decision' : 'Rejection Reason'}
            </AlertTitle>
            <AlertDescription className='mt-2 space-y-2'>
              <p className='whitespace-pre-wrap'>{reviewComments}</p>
              {reviewedBy && (
                <p className='text-sm'>
                  <span className='font-medium'>Reviewed by:</span> {reviewedBy}
                  {reviewedAt && (
                    <>
                      {' '}
                      on{' '}
                      {new Date(reviewedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </>
                  )}
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Pending Status Info */}
        {status === 'Pending' && (
          <Alert>
            <Clock className='size-4' />
            <AlertTitle>Under Review</AlertTitle>
            <AlertDescription>
              Your update request is currently being reviewed by the Academic
              Manager. You will be notified once a decision has been made.
            </AlertDescription>
          </Alert>
        )}

        {/* Draft Status Info */}
        {status === 'Draft' && (
          <Alert>
            <Circle className='size-4' />
            <AlertTitle>Draft Status</AlertTitle>
            <AlertDescription>
              This update request is still in draft status. Submit it to begin
              the review process.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
