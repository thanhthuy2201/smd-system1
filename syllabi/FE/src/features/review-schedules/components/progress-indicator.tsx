import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ProgressIndicatorProps {
  /**
   * Number of reviewed items
   */
  reviewed: number

  /**
   * Total number of items
   */
  total: number

  /**
   * Optional pending count for detailed breakdown
   */
  pending?: number

  /**
   * Optional overdue count for detailed breakdown
   */
  overdue?: number

  /**
   * Display variant: 'linear' (default) or 'compact'
   */
  variant?: 'linear' | 'compact'

  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Custom progress bar component with color coding
 */
function CustomProgressBar({
  height = 'h-2',
  percentage,
  progressColor,
}: {
  height?: string
  percentage: number
  progressColor: string
}) {
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-full bg-primary/20',
        height
      )}
    >
      <div
        className={cn('h-full flex-1 transition-all', progressColor)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

/**
 * Progress indicator component for displaying review completion status
 *
 * Features:
 * - Linear progress bar with percentage display
 * - Color coding based on completion percentage:
 *   - Green (>80%): Good progress
 *   - Yellow (50-80%): Moderate progress
 *   - Red (<50%): Low progress
 * - Tooltip with detailed breakdown on hover
 * - Compact variant for table cells
 *
 * Color thresholds:
 * - >= 80%: Green (teal) - bg-teal-500
 * - >= 50%: Yellow (amber) - bg-amber-500
 * - < 50%: Red - bg-red-500
 *
 * Validates Requirements 1.8, 5.2
 */
export function ProgressIndicator({
  reviewed,
  total,
  pending,
  overdue,
  variant = 'linear',
  className,
}: ProgressIndicatorProps) {
  // Calculate percentage
  const percentage = total > 0 ? Math.round((reviewed / total) * 100) : 0

  // Determine color based on percentage
  const getProgressColor = (pct: number): string => {
    if (pct >= 80) return 'bg-teal-500'
    if (pct >= 50) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const progressColor = getProgressColor(percentage)

  // Calculate pending if not provided
  const calculatedPending = pending ?? total - reviewed
  const calculatedOverdue = overdue ?? 0

  // Tooltip content with detailed breakdown
  const tooltipContent = (
    <div className='space-y-1 text-xs'>
      <div className='font-semibold'>Chi tiết tiến độ</div>
      <div className='flex justify-between gap-4'>
        <span>Tổng số:</span>
        <span className='font-medium'>{total}</span>
      </div>
      <div className='flex justify-between gap-4'>
        <span>Đã phê duyệt:</span>
        <span className='font-medium text-teal-300'>{reviewed}</span>
      </div>
      <div className='flex justify-between gap-4'>
        <span>Đang chờ:</span>
        <span className='font-medium text-amber-300'>{calculatedPending}</span>
      </div>
      {calculatedOverdue > 0 && (
        <div className='flex justify-between gap-4'>
          <span>Quá hạn:</span>
          <span className='font-medium text-red-300'>{calculatedOverdue}</span>
        </div>
      )}
      <div className='mt-1 border-t border-primary-foreground/20 pt-1'>
        <div className='flex justify-between gap-4'>
          <span>Hoàn thành:</span>
          <span className='font-semibold'>{percentage}%</span>
        </div>
      </div>
    </div>
  )

  if (variant === 'compact') {
    // Compact variant for table cells
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-2', className)}>
            <div className='min-w-[60px] flex-1'>
              <CustomProgressBar
                percentage={percentage}
                progressColor={progressColor}
              />
            </div>
            <span className='text-sm font-medium whitespace-nowrap text-muted-foreground'>
              {percentage}%
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side='top' className='max-w-xs'>
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    )
  }

  // Linear variant with counts
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('space-y-2', className)}>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>
              {reviewed}/{total} đã phê duyệt
            </span>
            <span className='font-semibold'>{percentage}%</span>
          </div>
          <CustomProgressBar
            height='h-2.5'
            percentage={percentage}
            progressColor={progressColor}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent side='top' className='max-w-xs'>
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  )
}
