import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ReviewScheduleStatus } from '../data/schema'

interface StatusBadgeProps {
  status: ReviewScheduleStatus
  className?: string
}

/**
 * Status badge component for displaying review schedule status
 *
 * Color coding:
 * - UPCOMING: Gray background with neutral text
 * - ACTIVE: Blue background with blue text
 * - COMPLETED: Green (teal) background with dark text
 * - OVERDUE: Red background with red text
 *
 * Vietnamese labels:
 * - UPCOMING: "Sắp diễn ra"
 * - ACTIVE: "Đang diễn ra"
 * - COMPLETED: "Hoàn thành"
 * - OVERDUE: "Quá hạn"
 *
 * Validates Requirement 1.4
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig = {
    [ReviewScheduleStatus.UPCOMING]: {
      label: 'Sắp diễn ra',
      className:
        'bg-neutral-300/40 text-neutral-700 dark:text-neutral-300 border-neutral-300',
    },
    [ReviewScheduleStatus.ACTIVE]: {
      label: 'Đang diễn ra',
      className:
        'bg-blue-100/30 text-blue-900 dark:text-blue-200 border-blue-200',
    },
    [ReviewScheduleStatus.COMPLETED]: {
      label: 'Hoàn thành',
      className:
        'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200',
    },
    [ReviewScheduleStatus.OVERDUE]: {
      label: 'Quá hạn',
      className: 'bg-red-100/30 text-red-900 dark:text-red-200 border-red-200',
    },
  }

  const config = statusConfig[status]

  return (
    <Badge
      variant='outline'
      className={cn('capitalize', config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
