import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { academicYearsApi } from '../data/api'
import {
  type AcademicYear,
  type AcademicYearFormInput,
  type AcademicYearsListResponse,
  AcademicYearStatus,
} from '../data/schema'

/**
 * TanStack Query mutation hook for creating a new academic year
 * Invalidates the academic years list cache on success
 *
 * Validates Requirements 2.3, 12.1
 *
 * @returns Mutation object with mutate function and state
 */
export function useCreateAcademicYear() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AcademicYearFormInput) => academicYearsApi.create(data),
    onSuccess: () => {
      // Invalidate and refetch academic years list
      queryClient.invalidateQueries({ queryKey: ['academic-years'] })
      toast.success('Tạo năm học thành công')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể tạo năm học')
    },
  })
}

/**
 * TanStack Query mutation hook for updating an existing academic year
 * Invalidates both the list and detail caches on success
 *
 * Validates Requirements 5.5, 12.2
 *
 * @param id - Academic year ID to update
 * @returns Mutation object with mutate function and state
 */
export function useUpdateAcademicYear(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<AcademicYearFormInput>) =>
      academicYearsApi.update(id, data),
    onSuccess: () => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: ['academic-years'] })
      queryClient.invalidateQueries({ queryKey: ['academic-year', id] })
      toast.success('Cập nhật năm học thành công')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể cập nhật năm học')
    },
  })
}

/**
 * TanStack Query mutation hook for updating academic year status
 * Implements optimistic updates for immediate UI feedback
 * Rolls back on error
 *
 * Validates Requirements 6.4, 6.6, 6.8, 12.3
 *
 * @returns Mutation object with mutate function and state
 */
export function useUpdateAcademicYearStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AcademicYearStatus }) =>
      academicYearsApi.updateStatus(id, status),

    // Optimistic update: Update UI immediately before API call completes
    onMutate: async ({ id, status }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['academic-years'] })

      // Snapshot the previous value
      const previousData = queryClient.getQueriesData({
        queryKey: ['academic-years'],
      })

      // Optimistically update all matching queries
      queryClient.setQueriesData<AcademicYearsListResponse>(
        { queryKey: ['academic-years'] },
        (old) => {
          if (!old) return old

          return {
            ...old,
            data: old.data.map((item: AcademicYear) =>
              item.id === id ? { ...item, status, updatedAt: new Date() } : item
            ),
          }
        }
      )

      // Return context with snapshot for rollback
      return { previousData }
    },

    onSuccess: (_data, variables) => {
      // Invalidate queries to ensure data is fresh
      queryClient.invalidateQueries({ queryKey: ['academic-years'] })

      // Show success message based on action
      const message =
        variables.status === AcademicYearStatus.DISABLED
          ? 'Vô hiệu hóa năm học thành công'
          : 'Kích hoạt năm học thành công'
      toast.success(message)
    },

    onError: (error: Error, _variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }

      // Show error message
      toast.error(error.message || 'Không thể thay đổi trạng thái năm học')
    },

    // Always refetch after error or success to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] })
    },
  })
}
