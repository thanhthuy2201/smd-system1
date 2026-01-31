import { format } from 'date-fns'
import { Clock, CheckCircle2, XCircle, AlertCircle, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { vi } from '@/features/lecturer/i18n/vi'
import type { SubmissionStatus } from '../types/review.types'

interface SubmissionsTimelineProps {
  submissions: SubmissionStatus[]
  onViewDetails?: (syllabusId: number) => void
}

const statusConfig = {
  'Pending Review': {
    icon: Clock,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    variant: 'secondary' as const,
  },
  'HoD Review': {
    icon: AlertCircle,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    variant: 'default' as const,
  },
  'Academic Manager Review': {
    icon: AlertCircle,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
    variant: 'default' as const,
  },
  Approved: {
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900',
    variant: 'default' as const,
  },
  'Revision Required': {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900',
    variant: 'destructive' as const,
  },
}

const stageOrder = [
  vi.reviewSchedules.timeline.stages.submitted,
  vi.reviewSchedules.timeline.stages.hodReview,
  vi.reviewSchedules.timeline.stages.academicManagerReview,
  vi.reviewSchedules.timeline.stages.approved,
]

function getProgressPercentage(currentStage: string): number {
  const index = stageOrder.indexOf(currentStage)
  if (index === -1) return 0
  return ((index + 1) / stageOrder.length) * 100
}

export function SubmissionsTimeline({
  submissions,
  onViewDetails,
}: SubmissionsTimelineProps) {
  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent className='flex flex-col items-center justify-center py-12'>
          <Clock className='mb-4 h-12 w-12 text-muted-foreground' />
          <p className='text-muted-foreground'>
            {vi.reviewSchedules.timeline.noSubmissions}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle>{vi.reviewSchedules.timeline.title}</CardTitle>
          <CardDescription>
            {vi.reviewSchedules.timeline.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-6'>
            {submissions.map((submission) => {
              const config =
                statusConfig[submission.status as keyof typeof statusConfig] ||
                statusConfig['Pending Review']
              const Icon = config.icon
              const progress = getProgressPercentage(submission.currentStage)

              return (
                <div
                  key={submission.syllabusId}
                  className='space-y-4 rounded-lg border p-4'
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex-1 space-y-1'>
                      <div className='flex items-center gap-2'>
                        <h3 className='font-semibold'>
                          {submission.courseCode} - {submission.courseName}
                        </h3>
                        <Badge
                          variant={config.variant}
                          className='flex items-center gap-1'
                        >
                          <Icon className='h-3 w-3' />
                          {submission.status}
                        </Badge>
                      </div>
                      <div className='space-y-1 text-sm text-muted-foreground'>
                        <div>
                          {vi.reviewSchedules.timeline.submitted}:{' '}
                          {format(
                            new Date(submission.submittedDate),
                            'MMM d, yyyy'
                          )}
                        </div>
                        <div>
                          {vi.reviewSchedules.timeline.lastUpdated}:{' '}
                          {format(
                            new Date(submission.lastUpdated),
                            'MMM d, yyyy h:mm a'
                          )}
                        </div>
                        {submission.reviewers.hodName && (
                          <div>
                            {vi.reviewSchedules.timeline.hod}:{' '}
                            {submission.reviewers.hodName}
                          </div>
                        )}
                        {submission.reviewers.academicManagerName && (
                          <div>
                            {vi.reviewSchedules.timeline.academicManager}:{' '}
                            {submission.reviewers.academicManagerName}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => onViewDetails?.(submission.syllabusId)}
                    >
                      <Eye className='mr-2 h-4 w-4' />
                      {vi.reviewSchedules.timeline.viewDetails}
                    </Button>
                  </div>

                  <div className='space-y-2'>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>
                        {vi.reviewSchedules.timeline.progress}
                      </span>
                      <span className='font-medium'>
                        {submission.currentStage}
                      </span>
                    </div>
                    <Progress value={progress} className='h-2' />
                    <div className='flex justify-between text-xs text-muted-foreground'>
                      {stageOrder.map((stage, index) => (
                        <span
                          key={stage}
                          className={
                            stageOrder.indexOf(submission.currentStage) >= index
                              ? 'font-medium text-foreground'
                              : ''
                          }
                        >
                          {stage}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
