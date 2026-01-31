import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { AcademicYearStatus } from '../data/schema'

interface StatusBadgeProps {
  status: AcademicYearStatus
  className?: string
}

/**
 * Status badge component for displaying academic year status
 *
 * Color coding:
 * - ACTIVE: Green (teal) background with dark text
 * - DISABLED: Gray background with neutral text
 *
 * Vietnamese labels:
 * - ACTIVE: "Hoạt động"
 * - DISABLED: "Vô hiệu hóa"
 *
 * Validates Requirement 1.4
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig = {
    [AcademicYearStatus.ACTIVE]: {
      label: 'Hoạt động',
      className:
        'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200',
    },
    [AcademicYearStatus.DISABLED]: {
      label: 'Vô hiệu hóa',
      className: 'bg-neutral-300/40 border-neutral-300',
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
