import { differenceInDays, format } from 'date-fns'
import { AlertTriangle, Clock, Bell } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { vi } from '@/features/lecturer/i18n/vi'

interface Deadline {
  id: number
  syllabusId: number
  courseCode: string
  courseName: string
  deadlineDate: string
  type: 'submission' | 'revision' | 'review'
}

interface DeadlineAlertsProps {
  deadlines: Deadline[]
}

function getUrgencyLevel(daysUntil: number): 'critical' | 'warning' | 'info' {
  if (daysUntil <= 1) return 'critical'
  if (daysUntil <= 3) return 'warning'
  return 'info'
}

function getUrgencyColor(urgency: 'critical' | 'warning' | 'info') {
  switch (urgency) {
    case 'critical':
      return {
        badge: 'destructive' as const,
        icon: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
      }
    case 'warning':
      return {
        badge: 'secondary' as const,
        icon: 'text-yellow-600 dark:text-yellow-400',
        bg: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800',
      }
    case 'info':
      return {
        badge: 'outline' as const,
        icon: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
      }
  }
}

function getDeadlineText(daysUntil: number): string {
  if (daysUntil === 0) return vi.reviewSchedules.alerts.dueToday
  if (daysUntil === 1) return vi.reviewSchedules.alerts.dueTomorrow
  if (daysUntil < 0)
    return vi.reviewSchedules.alerts.overdue.replace(
      '{count}',
      Math.abs(daysUntil).toString()
    )
  return vi.reviewSchedules.alerts.daysRemaining.replace(
    '{count}',
    daysUntil.toString()
  )
}

export function DeadlineAlerts({ deadlines }: DeadlineAlertsProps) {
  const now = new Date()

  // Filter deadlines within 7 days and calculate days until
  const upcomingDeadlines = deadlines
    .map((deadline) => {
      const deadlineDate = new Date(deadline.deadlineDate)
      const daysUntil = differenceInDays(deadlineDate, now)
      return {
        ...deadline,
        deadlineDate,
        daysUntil,
        urgency: getUrgencyLevel(daysUntil),
      }
    })
    .filter((deadline) => deadline.daysUntil <= 7)
    .sort((a, b) => a.daysUntil - b.daysUntil)

  if (upcomingDeadlines.length === 0) {
    return (
      <Card>
        <CardContent className='flex flex-col items-center justify-center py-12'>
          <Bell className='mb-4 h-12 w-12 text-muted-foreground' />
          <p className='text-muted-foreground'>
            {vi.reviewSchedules.alerts.noUpcomingDeadlines}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <AlertTriangle className='h-5 w-5' />
          {vi.reviewSchedules.alerts.title}
        </CardTitle>
        <CardDescription>
          {vi.reviewSchedules.alerts.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {upcomingDeadlines.map((deadline) => {
            const colors = getUrgencyColor(deadline.urgency)
            const typeLabel =
              vi.reviewSchedules.alerts.type[
                deadline.type as keyof typeof vi.reviewSchedules.alerts.type
              ] || deadline.type

            return (
              <Alert key={deadline.id} className={colors.bg}>
                <div className='flex items-start justify-between gap-4'>
                  <div className='flex-1 space-y-2'>
                    <div className='flex items-center gap-2'>
                      <Clock className={`h-4 w-4 ${colors.icon}`} />
                      <span className='font-semibold'>
                        {deadline.courseCode} - {deadline.courseName}
                      </span>
                      <Badge variant={colors.badge}>{typeLabel}</Badge>
                    </div>
                    <AlertDescription>
                      <div className='space-y-1'>
                        <div className='font-medium'>
                          {getDeadlineText(deadline.daysUntil)}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {vi.reviewSchedules.alerts.due}:{' '}
                          {format(deadline.deadlineDate, 'EEEE, MMMM d, yyyy')}
                        </div>
                      </div>
                    </AlertDescription>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      // Navigate to syllabus edit page
                      window.location.href = `/lecturer/syllabi/${deadline.syllabusId}/edit`
                    }}
                  >
                    {vi.common.view}
                  </Button>
                </div>
              </Alert>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
