import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from '../hooks/useTranslation'

export interface ValidationCriterion {
  name: string
  passed: boolean
  message: string
}

export interface ValidationResultsProps {
  criteria: ValidationCriterion[]
  isValid: boolean
  className?: string
}

export function ValidationResults({
  criteria,
  isValid,
  className,
}: ValidationResultsProps) {
  const { t } = useTranslation()
  const failedCount = criteria.filter((c) => !c.passed).length
  const passedCount = criteria.filter((c) => c.passed).length

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          {isValid ? (
            <>
              <CheckCircle2
                className='size-5 text-green-600 dark:text-green-500'
                aria-hidden='true'
              />
              <span>{t('validationResults.allPassed')}</span>
            </>
          ) : (
            <>
              <AlertCircle
                className='size-5 text-destructive'
                aria-hidden='true'
              />
              <span>{t('validationResults.issuesFound')}</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {!isValid && (
          <Alert variant='destructive'>
            <AlertDescription>
              {t('validationResults.failedChecks', { failed: failedCount, total: criteria.length })}
            </AlertDescription>
          </Alert>
        )}

        <div className='space-y-2' role='list' aria-label='Validation criteria'>
          {criteria.map((criterion, index) => (
            <div
              key={index}
              role='listitem'
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                criterion.passed
                  ? 'border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/20'
                  : 'border-destructive/30 bg-destructive/5'
              )}
            >
              <div className='mt-0.5 shrink-0'>
                {criterion.passed ? (
                  <CheckCircle2
                    className='size-4 text-green-600 dark:text-green-500'
                    aria-hidden='true'
                  />
                ) : (
                  <XCircle
                    className='size-4 text-destructive'
                    aria-hidden='true'
                  />
                )}
              </div>
              <div className='flex-1 space-y-1'>
                <p
                  className={cn(
                    'text-sm font-medium',
                    criterion.passed
                      ? 'text-green-900 dark:text-green-100'
                      : 'text-destructive'
                  )}
                >
                  {criterion.name}
                </p>
                <p
                  className={cn(
                    'text-sm',
                    criterion.passed
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-destructive/90'
                  )}
                >
                  {criterion.message}
                </p>
              </div>
            </div>
          ))}
        </div>

        {isValid && (
          <div className='rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900/50 dark:bg-green-950/20'>
            <p className='text-sm text-green-900 dark:text-green-100'>
              {t('validationResults.allPassedMessage', { count: passedCount })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
