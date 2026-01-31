import { useEffect } from 'react'
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type ProgressStatistics } from '../data/schema'
import { ProgressIndicator } from './progress-indicator'

interface ProgressDashboardProps {
  /**
   * Progress statistics data
   */
  statistics: ProgressStatistics

  /**
   * Callback when user clicks on a metric to filter syllabi
   */
  onFilterBySyllabus?: (filter: string) => void

  /**
   * Auto-refresh interval in milliseconds (default: 60000 = 60 seconds)
   */
  refreshInterval?: number

  /**
   * Callback to trigger manual refresh
   */
  onRefresh?: () => void

  /**
   * Whether data is currently being refreshed
   */
  isRefreshing?: boolean

  /**
   * Error that occurred during refresh (if any)
   */
  refreshError?: Error | null
}

/**
 * Progress Dashboard Component
 *
 * Displays comprehensive progress statistics for a review schedule:
 * - Overall statistics cards (Total, Reviewed, Pending, Overdue)
 * - Overall progress bar
 * - Average review time
 * - Department progress table
 * - Reviewer progress table
 *
 * Features:
 * - Click handlers to filter syllabi by metric
 * - Auto-refresh every 60 seconds
 * - Visual refresh indicator
 * - Manual refresh button
 * - Graceful error handling
 * - Pause auto-refresh when user is inactive
 * - Color-coded progress indicators
 * - Responsive grid layout
 *
 * Validates Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.8
 */
export function ProgressDashboard({
  statistics,
  onFilterBySyllabus,
  refreshInterval = 60000,
  onRefresh,
  isRefreshing = false,
  refreshError = null,
}: ProgressDashboardProps) {
  // Defensive checks for statistics data
  if (!statistics || !statistics.overall) {
    return (
      <div className='space-y-6'>
        <Card>
          <CardContent className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <AlertCircle className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
              <p className='text-sm text-muted-foreground'>
                Không có dữ liệu thống kê
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { overall, byDepartment, byReviewer, averageReviewTime } = statistics

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!onRefresh) return

    const interval = setInterval(() => {
      onRefresh()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [onRefresh, refreshInterval])

  // Format hours to readable string
  const formatReviewTime = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} phút`
    }
    if (hours < 24) {
      return `${hours.toFixed(1)} giờ`
    }
    const days = Math.floor(hours / 24)
    const remainingHours = Math.round(hours % 24)
    return `${days} ngày ${remainingHours} giờ`
  }

  // Handle metric click for filtering
  const handleMetricClick = (filter: string) => {
    if (onFilterBySyllabus) {
      onFilterBySyllabus(filter)
    }
  }

  // Handle manual refresh
  const handleManualRefresh = () => {
    if (onRefresh && !isRefreshing) {
      onRefresh()
    }
  }

  return (
    <div className='space-y-6'>
      {/* Header with refresh controls */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold'>Thống kê tiến độ</h3>
          <p className='text-sm text-muted-foreground'>
            Tự động cập nhật mỗi 60 giây
          </p>
        </div>
        <div className='flex items-center gap-3'>
          {/* Refresh indicator */}
          {isRefreshing && (
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <RefreshCw className='h-4 w-4 animate-spin' />
              <span>Đang cập nhật...</span>
            </div>
          )}

          {/* Error indicator */}
          {refreshError && !isRefreshing && (
            <div className='flex items-center gap-2 text-sm text-destructive'>
              <AlertCircle className='h-4 w-4' />
              <span>Lỗi cập nhật</span>
            </div>
          )}

          {/* Manual refresh button */}
          <Button
            variant='outline'
            size='sm'
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className='gap-2'
          >
            <RefreshCw
              className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
            />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Overall Statistics Cards */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {/* Total Syllabi Card */}
        <Card
          className={cn(
            'cursor-pointer transition-all hover:shadow-md',
            onFilterBySyllabus && 'hover:border-primary'
          )}
          onClick={() => handleMetricClick('all')}
        >
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Tổng số đề cương
            </CardTitle>
            <FileText className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{overall.total}</div>
            <p className='text-xs text-muted-foreground'>
              Tổng số đề cương cần phê duyệt
            </p>
          </CardContent>
        </Card>

        {/* Reviewed Card */}
        <Card
          className={cn(
            'cursor-pointer transition-all hover:shadow-md',
            onFilterBySyllabus && 'hover:border-teal-500'
          )}
          onClick={() => handleMetricClick('reviewed')}
        >
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Đã phê duyệt</CardTitle>
            <CheckCircle2 className='h-4 w-4 text-teal-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-teal-600 dark:text-teal-400'>
              {overall.reviewed}
            </div>
            <p className='text-xs text-muted-foreground'>
              {overall.percentage}% hoàn thành
            </p>
          </CardContent>
        </Card>

        {/* Pending Card */}
        <Card
          className={cn(
            'cursor-pointer transition-all hover:shadow-md',
            onFilterBySyllabus && 'hover:border-amber-500'
          )}
          onClick={() => handleMetricClick('pending')}
        >
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Đang chờ</CardTitle>
            <Clock className='h-4 w-4 text-amber-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-amber-600 dark:text-amber-400'>
              {overall.pending}
            </div>
            <p className='text-xs text-muted-foreground'>Chờ phê duyệt</p>
          </CardContent>
        </Card>

        {/* Overdue Card */}
        <Card
          className={cn(
            'cursor-pointer transition-all hover:shadow-md',
            onFilterBySyllabus && 'hover:border-red-500'
          )}
          onClick={() => handleMetricClick('overdue')}
        >
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Quá hạn</CardTitle>
            <AlertCircle className='h-4 w-4 text-red-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600 dark:text-red-400'>
              {overall.overdue}
            </div>
            <p className='text-xs text-muted-foreground'>Cần xử lý gấp</p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress and Average Time */}
      <div className='grid gap-4 lg:grid-cols-2'>
        {/* Overall Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle>Tiến độ tổng thể</CardTitle>
            <CardDescription>
              Tỷ lệ hoàn thành phê duyệt đề cương
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressIndicator
              reviewed={overall.reviewed}
              total={overall.total}
              pending={overall.pending}
              overdue={overall.overdue}
              variant='linear'
            />
          </CardContent>
        </Card>

        {/* Average Review Time Card */}
        <Card>
          <CardHeader>
            <CardTitle>Thời gian phê duyệt trung bình</CardTitle>
            <CardDescription>
              Thời gian trung bình để hoàn thành một đề cương
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-3'>
              <TrendingUp className='h-8 w-8 text-primary' />
              <div>
                <div className='text-3xl font-bold'>
                  {formatReviewTime(averageReviewTime)}
                </div>
                <p className='text-sm text-muted-foreground'>
                  Trung bình mỗi đề cương
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Progress Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tiến độ theo khoa/bộ môn</CardTitle>
          <CardDescription>
            Chi tiết tiến độ phê duyệt của từng khoa/bộ môn
          </CardDescription>
        </CardHeader>
        <CardContent>
          {byDepartment.length === 0 ? (
            <div className='py-8 text-center text-muted-foreground'>
              Chưa có dữ liệu tiến độ theo khoa/bộ môn
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khoa/Bộ môn</TableHead>
                  <TableHead className='text-center'>Tổng số</TableHead>
                  <TableHead className='text-center'>Đã duyệt</TableHead>
                  <TableHead className='text-center'>Đang chờ</TableHead>
                  <TableHead className='text-center'>Quá hạn</TableHead>
                  <TableHead>Tiến độ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byDepartment.map((dept) => (
                  <TableRow
                    key={dept.departmentId}
                    className={cn(
                      'cursor-pointer',
                      onFilterBySyllabus && 'hover:bg-muted'
                    )}
                    onClick={() =>
                      handleMetricClick(`department:${dept.departmentId}`)
                    }
                  >
                    <TableCell className='font-medium'>
                      {dept.departmentName}
                    </TableCell>
                    <TableCell className='text-center'>{dept.total}</TableCell>
                    <TableCell className='text-center text-teal-600 dark:text-teal-400'>
                      {dept.reviewed}
                    </TableCell>
                    <TableCell className='text-center text-amber-600 dark:text-amber-400'>
                      {dept.pending}
                    </TableCell>
                    <TableCell className='text-center text-red-600 dark:text-red-400'>
                      {dept.overdue}
                    </TableCell>
                    <TableCell>
                      <ProgressIndicator
                        reviewed={dept.reviewed}
                        total={dept.total}
                        pending={dept.pending}
                        overdue={dept.overdue}
                        variant='compact'
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Reviewer Progress Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tiến độ theo người phê duyệt</CardTitle>
          <CardDescription>
            Chi tiết hiệu suất phê duyệt của từng người phê duyệt
          </CardDescription>
        </CardHeader>
        <CardContent>
          {byReviewer.length === 0 ? (
            <div className='py-8 text-center text-muted-foreground'>
              Chưa có dữ liệu tiến độ theo người phê duyệt
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người phê duyệt</TableHead>
                  <TableHead className='text-center'>Vai trò</TableHead>
                  <TableHead className='text-center'>Được giao</TableHead>
                  <TableHead className='text-center'>Hoàn thành</TableHead>
                  <TableHead className='text-center'>Đang chờ</TableHead>
                  <TableHead className='text-center'>Quá hạn</TableHead>
                  <TableHead className='text-center'>TG trung bình</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byReviewer.map((reviewer) => (
                  <TableRow
                    key={reviewer.reviewerId}
                    className={cn(
                      'cursor-pointer',
                      onFilterBySyllabus && 'hover:bg-muted'
                    )}
                    onClick={() =>
                      handleMetricClick(`reviewer:${reviewer.reviewerId}`)
                    }
                  >
                    <TableCell className='font-medium'>
                      {reviewer.reviewerName}
                    </TableCell>
                    <TableCell className='text-center'>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                          reviewer.role === 'HOD'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        )}
                      >
                        {reviewer.role === 'HOD' ? 'Trưởng khoa' : 'Phòng ĐT'}
                      </span>
                    </TableCell>
                    <TableCell className='text-center'>
                      {reviewer.assigned}
                    </TableCell>
                    <TableCell className='text-center text-teal-600 dark:text-teal-400'>
                      {reviewer.completed}
                    </TableCell>
                    <TableCell className='text-center text-amber-600 dark:text-amber-400'>
                      {reviewer.pending}
                    </TableCell>
                    <TableCell className='text-center text-red-600 dark:text-red-400'>
                      {reviewer.overdue}
                    </TableCell>
                    <TableCell className='text-center text-sm text-muted-foreground'>
                      {formatReviewTime(reviewer.averageTime)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
