import { CheckCircle2, Loader2, XCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useTranslation } from '../hooks/useTranslation'

interface AutoSaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved?: Date | string
  onRetry?: () => void
  className?: string
}

export function AutoSaveIndicator({
  status,
  lastSaved,
  onRetry,
  className,
}: AutoSaveIndicatorProps) {
  const { t } = useTranslation()

  const formatLastSaved = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)

    if (diffSecs < 10) return t('autoSave.justNow')
    if (diffSecs < 60) return t('autoSave.secondsAgo', { count: diffSecs })
    if (diffMins < 60) return t('autoSave.minutesAgo', { count: diffMins })
    if (diffHours < 24) return t('autoSave.hoursAgo', { count: diffHours })

    return d.toLocaleString('vi-VN')
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm text-muted-foreground',
        className
      )}
      role='status'
      aria-live='polite'
    >
      {status === 'saving' && (
        <>
          <Loader2 className='size-4 animate-spin' aria-hidden='true' />
          <span>{t('autoSave.saving')}</span>
        </>
      )}

      {status === 'saved' && lastSaved && (
        <>
          <CheckCircle2
            className='size-4 text-green-600 dark:text-green-500'
            aria-hidden='true'
          />
          <span>
            {t('autoSave.saved')} {formatLastSaved(lastSaved)}
          </span>
        </>
      )}

      {status === 'error' && (
        <>
          <XCircle className='size-4 text-destructive' aria-hidden='true' />
          <span className='text-destructive'>{t('autoSave.failedToSave')}</span>
          {onRetry && (
            <Button
              variant='ghost'
              size='sm'
              onClick={onRetry}
              className='h-auto p-1 text-destructive hover:text-destructive'
              aria-label={t('autoSave.retry')}
            >
              <RefreshCw className='size-3' />
              <span className='sr-only'>{t('autoSave.retry')}</span>
            </Button>
          )}
        </>
      )}

      {status === 'idle' && lastSaved && (
        <>
          <CheckCircle2
            className='size-4 text-muted-foreground'
            aria-hidden='true'
          />
          <span>
            {t('autoSave.lastSaved')} {formatLastSaved(lastSaved)}
          </span>
        </>
      )}
    </div>
  )
}
