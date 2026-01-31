import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  reviewScheduleFormSchema,
  type ReviewScheduleFormInput,
  type ReviewSchedule,
} from '../data/schema'
import { useSemesters, useSemester } from '../hooks/use-semesters'
import { ReviewScheduleDatePicker } from './review-schedule-date-picker'

interface ReviewScheduleFormProps {
  mode: 'create' | 'edit'
  defaultValues?: Partial<ReviewScheduleFormInput>
  onSubmit: (data: ReviewScheduleFormInput) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
  onDirtyChange?: (isDirty: boolean) => void
  existingSchedule?: ReviewSchedule
}

/**
 * Review Schedule Form Component
 *
 * Features:
 * - React Hook Form with Zod validation
 * - Vietnamese labels and placeholders
 * - Field-level error display in Vietnamese
 * - Date pickers with min/max constraints
 * - Deadline extension logic for edit mode (only allow extending, not shortening)
 * - Deadline alert configuration section (placeholder for Task 7)
 * - Save and Cancel buttons
 *
 * Validates Requirements: 2.2, 2.7, 2.8, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 6.3, 6.4
 */
export function ReviewScheduleForm({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  onDirtyChange,
  existingSchedule,
}: ReviewScheduleFormProps) {
  // Fetch available semesters
  const { data: semesters, isLoading: isLoadingSemesters } = useSemesters()

  const form = useForm<ReviewScheduleFormInput>({
    resolver: zodResolver(reviewScheduleFormSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      semesterId: defaultValues?.semesterId || '',
      reviewStartDate: defaultValues?.reviewStartDate,
      l1Deadline: defaultValues?.l1Deadline,
      l2Deadline: defaultValues?.l2Deadline,
      finalApprovalDate: defaultValues?.finalApprovalDate,
      alertConfig: defaultValues?.alertConfig || {
        enabled: true,
        thresholds: [7, 3, 1],
        channels: ['EMAIL', 'IN_APP'],
        sendOverdueAlerts: true,
      },
    },
    mode: 'onChange',
  })

  // Track form dirty state and notify parent (Requirement 6.7)
  useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(form.formState.isDirty)
    }
  }, [form.formState.isDirty, onDirtyChange])

  // Watch fields for validation
  const selectedSemesterId = form.watch('semesterId')
  const reviewStartDate = form.watch('reviewStartDate')
  const l1Deadline = form.watch('l1Deadline')
  const l2Deadline = form.watch('l2Deadline')

  // Fetch selected semester data for validation (Requirement 3.1)
  const { data: selectedSemester } = useSemester(selectedSemesterId)

  // Calculate validation status for review start date against submission end date
  const getSubmissionPeriodValidation = () => {
    if (!selectedSemester || !reviewStartDate) {
      return null
    }

    const submissionEndDate = selectedSemester.submissionEndDate
    const daysDifference = Math.floor(
      (reviewStartDate.getTime() - submissionEndDate.getTime()) /
        (1000 * 60 * 60 * 24)
    )

    // Error: Review start date is before or on submission end date
    if (daysDifference <= 0) {
      return {
        type: 'error' as const,
        message: `Ngày bắt đầu phê duyệt phải sau ngày kết thúc nộp đề cương (${submissionEndDate.toLocaleDateString('vi-VN')})`,
      }
    }

    // Warning: Review start date is very close to submission end date (less than 3 days)
    if (daysDifference < 3) {
      return {
        type: 'warning' as const,
        message: `Ngày bắt đầu phê duyệt chỉ cách ngày kết thúc nộp đề cương ${daysDifference} ngày. Khuyến nghị ít nhất 3 ngày để chuẩn bị.`,
      }
    }

    return null
  }

  const submissionValidation = getSubmissionPeriodValidation()

  const handleSubmit = async (data: ReviewScheduleFormInput) => {
    // Prevent submission if there's a validation error (Requirement 3.1)
    if (submissionValidation?.type === 'error') {
      form.setError('reviewStartDate', {
        type: 'manual',
        message: submissionValidation.message,
      })
      return
    }

    await onSubmit(data)
  }

  // For edit mode, calculate minimum dates (can only extend, not shorten) (Requirement 6.3)
  const getMinDate = (
    field: 'reviewStartDate' | 'l1Deadline' | 'l2Deadline' | 'finalApprovalDate'
  ): Date | undefined => {
    if (mode === 'edit' && existingSchedule) {
      // In edit mode, can only extend deadlines, not shorten them
      return existingSchedule[field]
    }
    return undefined
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
        {/* Review Cycle Name Field (Requirement 2.2) */}
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên chu kỳ phê duyệt</FormLabel>
              <FormControl>
                <Input
                  placeholder='Ví dụ: Phê duyệt đề cương HK1 2024-2025'
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Tên mô tả cho chu kỳ phê duyệt (5-100 ký tự)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Semester Field (Requirement 2.2) */}
        <FormField
          control={form.control}
          name='semesterId'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Học kỳ</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting || mode === 'edit' || isLoadingSemesters}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Chọn học kỳ' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingSemesters ? (
                    <SelectItem value='loading' disabled>
                      Đang tải...
                    </SelectItem>
                  ) : semesters && semesters.length > 0 ? (
                    semesters.map((semester) => (
                      <SelectItem key={semester.id} value={semester.id}>
                        {semester.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value='no-data' disabled>
                      Không có dữ liệu
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                Học kỳ áp dụng cho chu kỳ phê duyệt này
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submission Period Information (Requirement 3.1) */}
        {selectedSemester && (
          <Alert>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              <strong>Thông tin kỳ nộp đề cương:</strong>
              <br />
              Bắt đầu:{' '}
              {selectedSemester.submissionStartDate.toLocaleDateString('vi-VN')}
              {' - '}
              Kết thúc:{' '}
              {selectedSemester.submissionEndDate.toLocaleDateString('vi-VN')}
            </AlertDescription>
          </Alert>
        )}

        {/* Review Start Date Field (Requirement 2.2, 3.1, 3.2) */}
        <FormField
          control={form.control}
          name='reviewStartDate'
          render={({ field }) => (
            <FormItem className='flex flex-col'>
              <FormLabel>Ngày bắt đầu phê duyệt</FormLabel>
              <FormControl>
                <ReviewScheduleDatePicker
                  selected={field.value}
                  onSelect={field.onChange}
                  placeholder='Chọn ngày bắt đầu'
                  disabled={isSubmitting}
                  minDate={getMinDate('reviewStartDate')}
                />
              </FormControl>
              <FormDescription>
                Ngày bắt đầu quá trình phê duyệt đề cương
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submission Period Validation Alerts (Requirement 3.1) */}
        {submissionValidation?.type === 'error' && (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>{submissionValidation.message}</AlertDescription>
          </Alert>
        )}

        {submissionValidation?.type === 'warning' && (
          <Alert>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription>{submissionValidation.message}</AlertDescription>
          </Alert>
        )}

        {/* L1 Deadline Field (Requirement 2.2, 3.2, 3.3, 3.8) */}
        <FormField
          control={form.control}
          name='l1Deadline'
          render={({ field }) => (
            <FormItem className='flex flex-col'>
              <FormLabel>Hạn phê duyệt L1 (Trưởng khoa)</FormLabel>
              <FormControl>
                <ReviewScheduleDatePicker
                  selected={field.value}
                  onSelect={field.onChange}
                  placeholder='Chọn hạn L1'
                  disabled={isSubmitting}
                  minDate={getMinDate('l1Deadline') || reviewStartDate}
                />
              </FormControl>
              <FormDescription>
                Hạn chót cho phê duyệt cấp 1 (phải sau ngày bắt đầu ít nhất 7
                ngày)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* L2 Deadline Field (Requirement 2.2, 3.3, 3.4, 3.8) */}
        <FormField
          control={form.control}
          name='l2Deadline'
          render={({ field }) => (
            <FormItem className='flex flex-col'>
              <FormLabel>Hạn phê duyệt L2 (Phòng Đào tạo)</FormLabel>
              <FormControl>
                <ReviewScheduleDatePicker
                  selected={field.value}
                  onSelect={field.onChange}
                  placeholder='Chọn hạn L2'
                  disabled={isSubmitting}
                  minDate={getMinDate('l2Deadline') || l1Deadline}
                />
              </FormControl>
              <FormDescription>
                Hạn chót cho phê duyệt cấp 2 (phải sau hạn L1 ít nhất 7 ngày)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Final Approval Date Field (Requirement 2.2, 3.4, 3.5) */}
        <FormField
          control={form.control}
          name='finalApprovalDate'
          render={({ field }) => (
            <FormItem className='flex flex-col'>
              <FormLabel>Ngày phê duyệt cuối cùng</FormLabel>
              <FormControl>
                <ReviewScheduleDatePicker
                  selected={field.value}
                  onSelect={field.onChange}
                  placeholder='Chọn ngày phê duyệt cuối'
                  disabled={isSubmitting}
                  minDate={getMinDate('finalApprovalDate') || l2Deadline}
                />
              </FormControl>
              <FormDescription>
                Ngày hoàn tất toàn bộ quá trình phê duyệt (phải sau hạn L2)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Deadline Alert Configuration Section (Requirement 2.2, 7.1, 7.2, 7.3) */}
        <div className='space-y-4 rounded-lg border p-4'>
          <h3 className='mb-4 text-lg font-semibold'>
            Cấu hình nhắc nhở hạn chót
          </h3>

          {/* Enable/Disable Alert Toggle */}
          <FormField
            control={form.control}
            name='alertConfig.enabled'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
                <div className='space-y-0.5'>
                  <FormLabel>Bật nhắc nhở tự động</FormLabel>
                  <FormDescription>
                    Gửi thông báo nhắc nhở đến người phê duyệt trước hạn chót
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Alert Thresholds */}
          <FormField
            control={form.control}
            name='alertConfig.thresholds'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ngưỡng nhắc nhở (số ngày trước hạn)</FormLabel>
                <div className='space-y-2'>
                  {[1, 3, 5, 7].map((days) => (
                    <FormItem
                      key={days}
                      className='flex flex-row items-start space-y-0 space-x-3'
                    >
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(days)}
                          onCheckedChange={(checked) => {
                            const currentThresholds = field.value || []
                            if (checked) {
                              field.onChange(
                                [...currentThresholds, days].sort(
                                  (a, b) => b - a
                                )
                              )
                            } else {
                              field.onChange(
                                currentThresholds.filter((t) => t !== days)
                              )
                            }
                          }}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormLabel className='font-normal'>
                        {days} ngày trước hạn chót
                      </FormLabel>
                    </FormItem>
                  ))}
                </div>
                <FormDescription>
                  Chọn các mốc thời gian để gửi nhắc nhở (ít nhất 1)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notification Channels */}
          <FormField
            control={form.control}
            name='alertConfig.channels'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kênh thông báo</FormLabel>
                <div className='space-y-2'>
                  <FormItem className='flex flex-row items-start space-y-0 space-x-3'>
                    <FormControl>
                      <Checkbox
                        checked={field.value?.includes('EMAIL')}
                        onCheckedChange={(checked) => {
                          const currentChannels = field.value || []
                          if (checked) {
                            field.onChange([...currentChannels, 'EMAIL'])
                          } else {
                            field.onChange(
                              currentChannels.filter((c) => c !== 'EMAIL')
                            )
                          }
                        }}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormLabel className='font-normal'>Email</FormLabel>
                  </FormItem>
                  <FormItem className='flex flex-row items-start space-y-0 space-x-3'>
                    <FormControl>
                      <Checkbox
                        checked={field.value?.includes('IN_APP')}
                        onCheckedChange={(checked) => {
                          const currentChannels = field.value || []
                          if (checked) {
                            field.onChange([...currentChannels, 'IN_APP'])
                          } else {
                            field.onChange(
                              currentChannels.filter((c) => c !== 'IN_APP')
                            )
                          }
                        }}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormLabel className='font-normal'>
                      Thông báo trong ứng dụng
                    </FormLabel>
                  </FormItem>
                </div>
                <FormDescription>
                  Chọn cách thức gửi thông báo (ít nhất 1)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Send Overdue Alerts */}
          <FormField
            control={form.control}
            name='alertConfig.sendOverdueAlerts'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
                <div className='space-y-0.5'>
                  <FormLabel>Gửi thông báo quá hạn</FormLabel>
                  <FormDescription>
                    Gửi thông báo khi đã quá hạn chót nhưng chưa hoàn thành
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Form Actions (Requirement 2.2) */}
        <div className='flex gap-4'>
          <Button
            type='submit'
            disabled={isSubmitting || submissionValidation?.type === 'error'}
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu'}
          </Button>
          <Button
            type='button'
            variant='outline'
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
        </div>
      </form>
    </Form>
  )
}
