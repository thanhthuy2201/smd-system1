import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../data/api'
import type {
  ReviewScheduleFormInput,
  ReviewerAssignment,
} from '../data/schema'
import { reviewScheduleKeys } from './use-review-schedule'
import { reviewSchedulesKeys } from './use-review-schedules'

/**
 * Hook for creating a new review schedule
 *
 * Features:
 * - Invalidates review schedules list cache on success
 * - Returns mutation state (isLoading, error, etc.)
 *
 * @returns Mutation object with mutate, mutateAsync, and state
 *
 * @example
 * ```tsx
 * const createMutation = useCreateReviewSchedule();
 *
 * const handleSubmit = async (data: ReviewScheduleFormInput) => {
 *   try {
 *     const result = await createMutation.mutateAsync(data);
 *     toast.success('Tạo lịch phê duyệt thành công');
 *     navigate(`/review-schedules/view/${result.data.id}`);
 *   } catch (error) {
 *     toast.error('Có lỗi xảy ra khi tạo lịch phê duyệt');
 *   }
 * };
 * ```
 */
export function useCreateReviewSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ReviewScheduleFormInput) => api.create(data),
    onSuccess: () => {
      // Invalidate all review schedules list queries
      queryClient.invalidateQueries({
        queryKey: reviewSchedulesKeys.lists(),
      })
    },
  })
}

/**
 * Hook for updating an existing review schedule
 *
 * Features:
 * - Invalidates both list and detail caches on success
 * - Returns mutation state (isLoading, error, etc.)
 *
 * @param id - The review schedule ID to update
 * @returns Mutation object with mutate, mutateAsync, and state
 *
 * @example
 * ```tsx
 * const updateMutation = useUpdateReviewSchedule(scheduleId);
 *
 * const handleSubmit = async (data: Partial<ReviewScheduleFormInput>) => {
 *   try {
 *     await updateMutation.mutateAsync(data);
 *     toast.success('Cập nhật lịch phê duyệt thành công');
 *     navigate(`/review-schedules/view/${scheduleId}`);
 *   } catch (error) {
 *     toast.error('Có lỗi xảy ra khi cập nhật lịch phê duyệt');
 *   }
 * };
 * ```
 */
export function useUpdateReviewSchedule(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<ReviewScheduleFormInput>) =>
      api.update(id, data),
    onSuccess: () => {
      // Invalidate all review schedules list queries
      queryClient.invalidateQueries({
        queryKey: reviewSchedulesKeys.lists(),
      })
      // Invalidate the specific schedule detail query
      queryClient.invalidateQueries({
        queryKey: reviewScheduleKeys.detail(id),
      })
    },
  })
}

/**
 * Hook for deleting a review schedule
 *
 * Features:
 * - Invalidates review schedules list cache on success
 * - Returns mutation state (isLoading, error, etc.)
 *
 * @returns Mutation object with mutate, mutateAsync, and state
 *
 * @example
 * ```tsx
 * const deleteMutation = useDeleteReviewSchedule();
 *
 * const handleDelete = async (id: string) => {
 *   if (!confirm('Bạn có chắc chắn muốn xóa lịch phê duyệt này?')) return;
 *
 *   try {
 *     await deleteMutation.mutateAsync(id);
 *     toast.success('Đã xóa lịch phê duyệt');
 *   } catch (error) {
 *     toast.error('Không thể xóa lịch phê duyệt đang hoạt động');
 *   }
 * };
 * ```
 */
export function useDeleteReviewSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.deleteSchedule(id),
    onSuccess: () => {
      // Invalidate all review schedules list queries
      queryClient.invalidateQueries({
        queryKey: reviewSchedulesKeys.lists(),
      })
    },
  })
}

/**
 * Hook for assigning a reviewer to a department
 *
 * Features:
 * - Invalidates the specific schedule detail cache on success
 * - Returns mutation state (isLoading, error, etc.)
 *
 * @param scheduleId - The review schedule ID
 * @returns Mutation object with mutate, mutateAsync, and state
 *
 * @example
 * ```tsx
 * const assignMutation = useAssignReviewer(scheduleId);
 *
 * const handleAssign = async (assignment: ReviewerAssignment) => {
 *   try {
 *     await assignMutation.mutateAsync(assignment);
 *     toast.success('Phân công người phê duyệt thành công');
 *   } catch (error) {
 *     toast.error('Có lỗi xảy ra khi phân công người phê duyệt');
 *   }
 * };
 * ```
 */
export function useAssignReviewer(scheduleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      assignment: Omit<ReviewerAssignment, 'id' | 'assignedAt' | 'assignedBy'>
    ) => api.assignReviewer(scheduleId, assignment),
    onSuccess: () => {
      // Invalidate the specific schedule detail query to refresh assignments
      queryClient.invalidateQueries({
        queryKey: reviewScheduleKeys.detail(scheduleId),
      })
    },
  })
}

/**
 * Hook for updating a reviewer assignment
 *
 * Features:
 * - Invalidates the schedule detail cache on success
 * - Returns mutation state (isLoading, error, etc.)
 *
 * @param scheduleId - The review schedule ID (for cache invalidation)
 * @returns Mutation object with mutate, mutateAsync, and state
 *
 * @example
 * ```tsx
 * const updateAssignmentMutation = useUpdateAssignment(scheduleId);
 *
 * const handleUpdate = async (assignmentId: string, data: Partial<ReviewerAssignment>) => {
 *   try {
 *     await updateAssignmentMutation.mutateAsync({ assignmentId, data });
 *     toast.success('Cập nhật phân công thành công');
 *   } catch (error) {
 *     toast.error('Có lỗi xảy ra khi cập nhật phân công');
 *   }
 * };
 * ```
 */
export function useUpdateAssignment(scheduleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      assignmentId,
      data,
    }: {
      assignmentId: string
      data: Partial<
        Omit<
          ReviewerAssignment,
          'id' | 'scheduleId' | 'assignedAt' | 'assignedBy'
        >
      >
    }) => api.updateAssignment(assignmentId, data),
    onSuccess: () => {
      // Invalidate the specific schedule detail query to refresh assignments
      queryClient.invalidateQueries({
        queryKey: reviewScheduleKeys.detail(scheduleId),
      })
    },
  })
}

/**
 * Hook for removing a reviewer assignment
 *
 * Features:
 * - Invalidates the schedule detail cache on success
 * - Returns mutation state (isLoading, error, etc.)
 *
 * @param scheduleId - The review schedule ID (for cache invalidation)
 * @returns Mutation object with mutate, mutateAsync, and state
 *
 * @example
 * ```tsx
 * const removeAssignmentMutation = useRemoveAssignment(scheduleId);
 *
 * const handleRemove = async (assignmentId: string) => {
 *   if (!confirm('Bạn có chắc chắn muốn xóa phân công này?')) return;
 *
 *   try {
 *     await removeAssignmentMutation.mutateAsync(assignmentId);
 *     toast.success('Đã xóa phân công');
 *   } catch (error) {
 *     toast.error('Có lỗi xảy ra khi xóa phân công');
 *   }
 * };
 * ```
 */
export function useRemoveAssignment(scheduleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (assignmentId: string) => api.removeAssignment(assignmentId),
    onSuccess: () => {
      // Invalidate the specific schedule detail query to refresh assignments
      queryClient.invalidateQueries({
        queryKey: reviewScheduleKeys.detail(scheduleId),
      })
    },
  })
}

/**
 * Hook for sending reminder notifications to reviewers
 *
 * Features:
 * - Does not invalidate cache (reminders don't change data)
 * - Returns mutation state (isLoading, error, etc.)
 *
 * @returns Mutation object with mutate, mutateAsync, and state
 *
 * @example
 * ```tsx
 * const sendRemindersMutation = useSendReminders();
 *
 * const handleSendReminders = async (scheduleId: string, reviewerIds?: string[]) => {
 *   try {
 *     await sendRemindersMutation.mutateAsync({ scheduleId, reviewerIds });
 *     toast.success('Đã gửi nhắc nhở đến người phê duyệt');
 *   } catch (error) {
 *     toast.error('Có lỗi xảy ra khi gửi nhắc nhở');
 *   }
 * };
 * ```
 */
export function useSendReminders() {
  return useMutation({
    mutationFn: ({
      scheduleId,
      reviewerIds,
    }: {
      scheduleId: string
      reviewerIds?: string[]
    }) => api.sendReminders(scheduleId, reviewerIds),
    // No cache invalidation needed - reminders don't change data
  })
}

/**
 * Hook for exporting progress report
 *
 * Features:
 * - Handles blob response for file download
 * - Returns mutation state (isLoading, error, etc.)
 *
 * @returns Mutation object with mutate, mutateAsync, and state
 *
 * @example
 * ```tsx
 * const exportMutation = useExportReport();
 *
 * const handleExport = async (scheduleId: string, format: 'PDF' | 'EXCEL') => {
 *   try {
 *     const blob = await exportMutation.mutateAsync({ scheduleId, format });
 *     // Download the file
 *     const url = window.URL.createObjectURL(blob);
 *     const link = document.createElement('a');
 *     link.href = url;
 *     link.download = `review-schedule-report.${format.toLowerCase()}`;
 *     link.click();
 *     window.URL.revokeObjectURL(url);
 *     toast.success('Đã xuất báo cáo thành công');
 *   } catch (error) {
 *     toast.error('Có lỗi xảy ra khi xuất báo cáo');
 *   }
 * };
 * ```
 */
export function useExportReport() {
  return useMutation({
    mutationFn: ({
      scheduleId,
      format,
    }: {
      scheduleId: string
      format: 'PDF' | 'EXCEL'
    }) => api.exportReport(scheduleId, format),
    // No cache invalidation needed - export doesn't change data
  })
}
