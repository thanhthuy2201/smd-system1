import { useState } from 'react'
import { format } from 'date-fns'
import { useNavigate, useParams } from '@tanstack/react-router'
import { vi } from 'date-fns/locale'
import { Calendar, Edit, Send, FileDown, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { AuditTrail } from './components/audit-trail'
import { ErrorBoundary } from './components/error-boundary'
import { ProgressDashboard } from './components/progress-dashboard'
import { ReviewerAssignmentComponent } from './components/reviewer-assignment'
import { StatusBadge } from './components/status-badge'
import { ReviewScheduleStatus } from './data/schema'
import { useProgressStatistics } from './hooks/use-progress-statistics'
import { useSendReminders, useExportReport } from './hooks/use-review-mutations'
import { useReviewSchedule } from './hooks/use-review-schedule'
import { handleReviewScheduleError, showErrorToast } from './lib/error-handler'

/**
 * Review Schedule Detail Screen
 * Comprehensive view of schedule details, assignments, and progress
 *
 * Features:
 * - Page title with schedule name
 * - Schedule information section (dates, semester, status)
 * - Progress dashboard with auto-refresh
 * - Reviewer assignment interface
 * - Deadline alert configuration display
 * - Audit trail of changes
 * - Quick action buttons: Edit Schedule, Assign Reviewers, Send Reminder, Export Report
 * - Loading state while fetching
 * - Not found error (404) with Vietnamese message
 * - Send reminder action with confirmation
 * - Export report action with format selection
 *
 * Validates Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
 */
export default function ReviewScheduleDetail() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false }) as { id: string }
  const [showReminderDialog, setShowReminderDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportFormat, setExportFormat] = useState<'PDF' | 'EXCEL'>('PDF')
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(true)

  // Fetch review schedule details (Requirement 8.1, 8.2)
  const { data, isLoading, isError, error } = useReviewSchedule(id)

  // Fetch progress statistics with auto-refresh (Requirement 8.4)
  const {
    data: progressData,
    isLoading: isProgressLoading,
    isRefetching: isProgressRefetching,
    error: progressError,
    refetch: refetchProgress,
  } = useProgressStatistics(id, {
    refetchInterval: 60000, // Auto-refresh every 60 seconds
    pauseOnInactive: true, // Pause when user is inactive
  })

  const sendRemindersMutation = useSendReminders()
  const exportReportMutation = useExportReport()

  /**
   * Get list of reviewers with pending reviews
   * Extracts unique reviewers from progress statistics
   */
  const getReviewersWithPendingReviews = () => {
    if (!progressData?.byReviewer) return []

    // Filter reviewers who have pending or overdue reviews
    return progressData.byReviewer.filter(
      (reviewer) => reviewer.pending > 0 || reviewer.overdue > 0
    )
  }

  /**
   * Handle opening reminder dialog
   * Initializes selected reviewers list
   */
  const handleOpenReminderDialog = () => {
    const reviewers = getReviewersWithPendingReviews()
    setSelectedReviewers(reviewers.map((r) => r.reviewerId))
    setSelectAll(true)
    setShowReminderDialog(true)
  }

  /**
   * Handle select all toggle
   */
  const handleSelectAllToggle = () => {
    const reviewers = getReviewersWithPendingReviews()
    if (selectAll) {
      setSelectedReviewers([])
      setSelectAll(false)
    } else {
      setSelectedReviewers(reviewers.map((r) => r.reviewerId))
      setSelectAll(true)
    }
  }

  /**
   * Handle individual reviewer selection toggle
   */
  const handleReviewerToggle = (reviewerId: string) => {
    setSelectedReviewers((prev) => {
      const newSelection = prev.includes(reviewerId)
        ? prev.filter((id) => id !== reviewerId)
        : [...prev, reviewerId]

      // Update selectAll state
      const reviewers = getReviewersWithPendingReviews()
      setSelectAll(newSelection.length === reviewers.length)

      return newSelection
    })
  }

  /**
   * Handle send reminder action with reviewer selection (Requirements 7.4, 7.8, 13.5)
   */
  const handleSendReminders = async () => {
    try {
      // Validate that at least one reviewer is selected
      if (selectedReviewers.length === 0) {
        toast.error('Vui lòng chọn ít nhất một người phê duyệt')
        return
      }

      await sendRemindersMutation.mutateAsync({
        scheduleId: id,
        reviewerIds: selectAll ? undefined : selectedReviewers,
      })

      toast.success('Đã gửi nhắc nhở đến người phê duyệt')
      setShowReminderDialog(false)
    } catch (error) {
      // Handle errors with Vietnamese messages (Requirement 12.1, 12.8)
      const parsedError = handleReviewScheduleError(error, 'Send Reminders')
      showErrorToast(parsedError)
    }
  }

  /**
   * Handle export report action with format selection (Requirement 8.8)
   */
  const handleExportReport = async () => {
    try {
      const blob = await exportReportMutation.mutateAsync({
        scheduleId: id,
        format: exportFormat,
      })

      // Download the file
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const extension = exportFormat === 'PDF' ? 'pdf' : 'xlsx'
      const fileName = `bao-cao-tien-do-${id}-${format(new Date(), 'yyyyMMdd')}.${extension}`
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Đã xuất báo cáo thành công')
      setShowExportDialog(false)
    } catch (error) {
      // Handle errors with Vietnamese messages (Requirement 12.1, 12.8)
      const parsedError = handleReviewScheduleError(error, 'Export Report')
      showErrorToast(parsedError)
    }
  }

  /**
   * Handle manual refresh of progress data
   */
  const handleRefreshProgress = () => {
    refetchProgress()
  }

  // Handle loading state (Requirement 8.2)
  if (isLoading) {
    return (
      <>
        <Header fixed>
          <Search />
          <div className='ms-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <ConfigDrawer />
            <ProfileDropdown />
          </div>
        </Header>

        <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
          <div className='flex flex-wrap items-end justify-between gap-2'>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>
                Chi tiết lịch phê duyệt
              </h2>
              <p className='text-muted-foreground'>Đang tải dữ liệu...</p>
            </div>
          </div>

          <div className='flex items-center justify-center py-12'>
            <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
          </div>
        </Main>
      </>
    )
  }

  // Handle not found error (404) with Vietnamese message (Requirement 8.2)
  if (isError || !data?.data) {
    return (
      <>
        <Header fixed>
          <Search />
          <div className='ms-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <ConfigDrawer />
            <ProfileDropdown />
          </div>
        </Header>

        <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
          <div className='flex flex-wrap items-end justify-between gap-2'>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>
                Chi tiết lịch phê duyệt
              </h2>
            </div>
          </div>

          <div className='mx-auto w-full max-w-2xl'>
            <div className='rounded-lg border border-destructive bg-destructive/10 p-6 text-center'>
              <AlertCircle className='mx-auto mb-4 h-12 w-12 text-destructive' />
              <h3 className='mb-2 text-lg font-semibold text-destructive'>
                Không tìm thấy lịch phê duyệt
              </h3>
              <p className='mb-4 text-sm text-muted-foreground'>
                {error?.message ||
                  'Lịch phê duyệt không tồn tại hoặc đã bị xóa.'}
              </p>
              <Button onClick={() => navigate({ to: '/review-schedules' })}>
                Quay lại danh sách
              </Button>
            </div>
          </div>
        </Main>
      </>
    )
  }

  const schedule = data.data
  const assignments = data.assignments || []
  const auditTrail = data.auditTrail || []

  // Format date in Vietnamese locale
  const formatDate = (date: Date): string => {
    return format(date, 'dd/MM/yyyy', { locale: vi })
  }

  // Check if schedule is active (can send reminders)
  const canSendReminders = schedule.status === ReviewScheduleStatus.ACTIVE

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <ErrorBoundary>
          {/* Page title with schedule name (Requirement 8.1) */}
          <div className='flex flex-wrap items-end justify-between gap-2'>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>
                {schedule.name}
              </h2>
              <p className='text-muted-foreground'>
                Chi tiết lịch phê duyệt đề cương
              </p>
            </div>

            {/* Quick action buttons (Requirement 8.8) */}
            <div className='flex flex-wrap gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => navigate({ to: `/review-schedules/edit/${id}` })}
                disabled={schedule.status === ReviewScheduleStatus.COMPLETED}
              >
                <Edit className='h-4 w-4' />
                Chỉnh sửa
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={handleOpenReminderDialog}
                disabled={!canSendReminders || sendRemindersMutation.isPending}
              >
                <Send className='h-4 w-4' />
                Gửi nhắc nhở
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowExportDialog(true)}
                disabled={exportReportMutation.isPending}
              >
                <FileDown className='h-4 w-4' />
                Xuất báo cáo
              </Button>
            </div>
          </div>

          {/* Schedule information section (Requirement 8.2) */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Calendar className='h-5 w-5' />
                Thông tin lịch phê duyệt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                <div>
                  <h3 className='text-sm font-medium text-muted-foreground'>
                    Học kỳ
                  </h3>
                  <p className='mt-1 text-base font-medium'>
                    {schedule.semesterName}
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    {schedule.academicYear}
                  </p>
                </div>

                <div>
                  <h3 className='text-sm font-medium text-muted-foreground'>
                    Trạng thái
                  </h3>
                  <div className='mt-1'>
                    <StatusBadge status={schedule.status} />
                  </div>
                </div>

                <div>
                  <h3 className='text-sm font-medium text-muted-foreground'>
                    Tiến độ
                  </h3>
                  <p className='mt-1 text-base font-medium'>
                    {schedule.progressPercentage}%
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    {schedule.reviewedCount}/{schedule.totalSyllabi} đề cương
                  </p>
                </div>

                <div>
                  <h3 className='text-sm font-medium text-muted-foreground'>
                    Ngày bắt đầu phê duyệt
                  </h3>
                  <p className='mt-1 text-base'>
                    {formatDate(schedule.reviewStartDate)}
                  </p>
                </div>

                <div>
                  <h3 className='text-sm font-medium text-muted-foreground'>
                    Hạn L1 (Trưởng khoa)
                  </h3>
                  <p className='mt-1 text-base'>
                    {formatDate(schedule.l1Deadline)}
                  </p>
                </div>

                <div>
                  <h3 className='text-sm font-medium text-muted-foreground'>
                    Hạn L2 (Phòng ĐT)
                  </h3>
                  <p className='mt-1 text-base'>
                    {formatDate(schedule.l2Deadline)}
                  </p>
                </div>

                <div>
                  <h3 className='text-sm font-medium text-muted-foreground'>
                    Ngày phê duyệt cuối
                  </h3>
                  <p className='mt-1 text-base'>
                    {formatDate(schedule.finalApprovalDate)}
                  </p>
                </div>

                <div>
                  <h3 className='text-sm font-medium text-muted-foreground'>
                    Người tạo
                  </h3>
                  <p className='mt-1 text-base'>{schedule.createdBy}</p>
                  <p className='text-sm text-muted-foreground'>
                    {formatDate(schedule.createdAt)}
                  </p>
                </div>

                <div>
                  <h3 className='text-sm font-medium text-muted-foreground'>
                    Cập nhật lần cuối
                  </h3>
                  <p className='mt-1 text-base'>
                    {formatDate(schedule.updatedAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deadline alert configuration (Requirement 8.6) */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <AlertCircle className='h-5 w-5' />
                Cấu hình nhắc nhở hạn chót
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium'>Trạng thái:</span>
                  <Badge
                    variant={
                      schedule.alertConfig.enabled ? 'default' : 'secondary'
                    }
                  >
                    {schedule.alertConfig.enabled ? 'Đã bật' : 'Đã tắt'}
                  </Badge>
                </div>

                {schedule.alertConfig.enabled && (
                  <>
                    <div>
                      <h3 className='mb-2 text-sm font-medium text-muted-foreground'>
                        Ngưỡng nhắc nhở
                      </h3>
                      <div className='flex flex-wrap gap-2'>
                        {schedule.alertConfig.thresholds.map((threshold) => (
                          <Badge key={threshold} variant='outline'>
                            {threshold} ngày trước hạn
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className='mb-2 text-sm font-medium text-muted-foreground'>
                        Kênh thông báo
                      </h3>
                      <div className='flex flex-wrap gap-2'>
                        {schedule.alertConfig.channels.map((channel) => (
                          <Badge key={channel} variant='outline'>
                            {channel === 'EMAIL' ? 'Email' : 'Trong ứng dụng'}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-medium'>
                        Nhắc nhở quá hạn:
                      </span>
                      <Badge
                        variant={
                          schedule.alertConfig.sendOverdueAlerts
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {schedule.alertConfig.sendOverdueAlerts
                          ? 'Có'
                          : 'Không'}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Progress Dashboard (Requirement 8.4) */}
          {isProgressLoading ? (
            <Card>
              <CardContent className='flex items-center justify-center py-12'>
                <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
              </CardContent>
            </Card>
          ) : progressData ? (
            <ProgressDashboard
              statistics={progressData}
              onRefresh={handleRefreshProgress}
              isRefreshing={isProgressRefetching}
              refreshError={progressError as Error | null}
            />
          ) : (
            <Card>
              <CardContent className='flex items-center justify-center py-12'>
                <div className='text-center'>
                  <AlertCircle className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
                  <p className='text-sm text-muted-foreground'>
                    Không thể tải dữ liệu thống kê tiến độ
                  </p>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleRefreshProgress}
                    className='mt-4'
                  >
                    Thử lại
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Reviewer Assignment (Requirement 8.3) */}
          <ReviewerAssignmentComponent
            scheduleId={id}
            assignments={assignments}
            departments={[
              // Mock departments - in real app, fetch from API
              { id: '1', name: 'Khoa Công nghệ Thông tin' },
              { id: '2', name: 'Khoa Kinh tế' },
              { id: '3', name: 'Khoa Ngoại ngữ' },
            ]}
          />

          <Separator />

          {/* Audit Trail (Requirement 8.7) */}
          <AuditTrail entries={auditTrail} />
        </ErrorBoundary>
      </Main>

      {/* Send Reminder Dialog with Reviewer Selection (Requirements 7.4, 7.8, 13.5) */}
      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Gửi nhắc nhở đến người phê duyệt</DialogTitle>
            <DialogDescription>
              Chọn người phê duyệt sẽ nhận được thông báo nhắc nhở về các đề
              cương đang chờ xử lý
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            {/* Select All Checkbox */}
            <div className='flex items-center space-x-2 rounded-lg border p-4'>
              <Checkbox
                id='select-all'
                checked={selectAll}
                onCheckedChange={handleSelectAllToggle}
              />
              <label
                htmlFor='select-all'
                className='flex-1 cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
              >
                Chọn tất cả người phê duyệt
              </label>
              <Badge variant='secondary'>
                {getReviewersWithPendingReviews().length} người
              </Badge>
            </div>

            {/* Reviewers List */}
            <div className='space-y-2'>
              <h4 className='text-sm font-medium text-muted-foreground'>
                Danh sách người phê duyệt có đề cương chờ xử lý:
              </h4>

              {getReviewersWithPendingReviews().length === 0 ? (
                <div className='rounded-lg border border-dashed p-8 text-center'>
                  <p className='text-sm text-muted-foreground'>
                    Không có người phê duyệt nào có đề cương chờ xử lý
                  </p>
                </div>
              ) : (
                <ScrollArea className='h-[300px] rounded-lg border'>
                  <div className='space-y-2 p-4'>
                    {getReviewersWithPendingReviews().map((reviewer) => (
                      <div
                        key={reviewer.reviewerId}
                        className='flex items-start space-x-3 rounded-lg border p-3 transition-colors hover:bg-muted/50'
                      >
                        <Checkbox
                          id={`reviewer-${reviewer.reviewerId}`}
                          checked={selectedReviewers.includes(
                            reviewer.reviewerId
                          )}
                          onCheckedChange={() =>
                            handleReviewerToggle(reviewer.reviewerId)
                          }
                        />
                        <div className='flex-1 space-y-1'>
                          <label
                            htmlFor={`reviewer-${reviewer.reviewerId}`}
                            className='cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                          >
                            {reviewer.reviewerName}
                          </label>
                          <div className='flex flex-wrap gap-2'>
                            <Badge variant='outline' className='text-xs'>
                              {reviewer.role === 'HOD'
                                ? 'Trưởng khoa'
                                : 'Phòng ĐT'}
                            </Badge>
                            {reviewer.pending > 0 && (
                              <Badge variant='secondary' className='text-xs'>
                                {reviewer.pending} đang chờ
                              </Badge>
                            )}
                            {reviewer.overdue > 0 && (
                              <Badge variant='destructive' className='text-xs'>
                                {reviewer.overdue} quá hạn
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Selected Count */}
            {selectedReviewers.length > 0 && (
              <div className='rounded-lg bg-muted p-3'>
                <p className='text-sm text-muted-foreground'>
                  Đã chọn{' '}
                  <span className='font-medium text-foreground'>
                    {selectedReviewers.length}
                  </span>{' '}
                  người phê duyệt
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowReminderDialog(false)}
              disabled={sendRemindersMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSendReminders}
              disabled={
                sendRemindersMutation.isPending ||
                selectedReviewers.length === 0 ||
                getReviewersWithPendingReviews().length === 0
              }
            >
              {sendRemindersMutation.isPending ? (
                <>
                  <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent' />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className='mr-2 h-4 w-4' />
                  Gửi nhắc nhở
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Report Dialog (Requirement 8.8) */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xuất báo cáo tiến độ</DialogTitle>
            <DialogDescription>
              Chọn định dạng file để xuất báo cáo tiến độ phê duyệt
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Định dạng file</label>
              <div className='flex gap-4'>
                <button
                  onClick={() => setExportFormat('PDF')}
                  className={`flex-1 rounded-lg border-2 p-4 text-center transition-colors ${
                    exportFormat === 'PDF'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <FileDown className='mx-auto mb-2 h-8 w-8' />
                  <div className='font-medium'>PDF</div>
                  <div className='text-xs text-muted-foreground'>
                    Định dạng in ấn
                  </div>
                </button>
                <button
                  onClick={() => setExportFormat('EXCEL')}
                  className={`flex-1 rounded-lg border-2 p-4 text-center transition-colors ${
                    exportFormat === 'EXCEL'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <FileDown className='mx-auto mb-2 h-8 w-8' />
                  <div className='font-medium'>Excel</div>
                  <div className='text-xs text-muted-foreground'>
                    Định dạng dữ liệu
                  </div>
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowExportDialog(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleExportReport}
              disabled={exportReportMutation.isPending}
            >
              {exportReportMutation.isPending ? 'Đang xuất...' : 'Xuất báo cáo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
