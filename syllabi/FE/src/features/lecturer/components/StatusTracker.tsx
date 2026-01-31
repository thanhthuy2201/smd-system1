import { Check, Circle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from '../hooks/useTranslation'

export type ApprovalStage =
  | 'Submitted'
  | 'HoD Review'
  | 'Academic Manager Review'
  | 'Approved'

export interface ApprovalStageInfo {
  stage: ApprovalStage
  status: 'completed' | 'current' | 'pending'
  completedAt?: Date | string
  reviewerName?: string
  reviewerRole?: string
}

export interface StatusTrackerProps {
  stages: ApprovalStageInfo[]
  currentStatus: string
  className?: string
}

export function StatusTracker({
  stages,
  currentStatus,
  className,
}: StatusTrackerProps) {
  const { t } = useTranslation()
  const currentStageIndex = stages.findIndex((s) => s.status === 'current')
  const completedStages = stages.filter((s) => s.status === 'completed').length
  const totalStages = stages.length
  const progressPercentage = (completedStages / totalStages) * 100

  const getStatusVariant = (
    status: string
  ): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'đã phê duyệt':
        return 'default'
      case 'pending review':
      case 'hod review':
      case 'academic manager review':
      case 'chờ xem xét':
      case 'trưởng khoa xem xét':
      case 'quản lý học thuật xem xét':
        return 'secondary'
      case 'revision required':
      case 'rejected':
      case 'yêu cầu sửa đổi':
      case 'bị từ chối':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getStageTranslation = (stage: ApprovalStage): string => {
    switch (stage) {
      case 'Submitted':
        return t('statusTracker.stages.submitted')
      case 'HoD Review':
        return t('statusTracker.stages.hodReview')
      case 'Academic Manager Review':
        return t('statusTracker.stages.academicManagerReview')
      case 'Approved':
        return t('statusTracker.stages.approved')
      default:
        return stage
    }
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>{t('statusTracker.title')}</CardTitle>
          <Badge variant={getStatusVariant(currentStatus)}>
            {currentStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Progress Bar */}
        <div className='space-y-2'>
          <div className='flex justify-between text-sm text-muted-foreground'>
            <span>
              {t('statusTracker.stage')}{' '}
              {completedStages + (currentStageIndex >= 0 ? 1 : 0)}{' '}
              {t('statusTracker.of')} {totalStages}
            </span>
            <span>
              {Math.round(progressPercentage)}% {t('statusTracker.complete')}
            </span>
          </div>
          <div
            className='h-2 w-full overflow-hidden rounded-full bg-secondary'
            role='progressbar'
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('statusTracker.title')}
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
          aria-label={t('statusTracker.title')}
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
                        {getStageTranslation(stageInfo.stage)}
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
                          {t('statusTracker.completedOn')}{' '}
                          {new Date(stageInfo.completedAt).toLocaleDateString(
                            'vi-VN',
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
                          {t('statusTracker.inProgress')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
