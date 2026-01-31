/**
 * useUpdateRequests Hook
 *
 * Custom hook for managing update requests with TanStack Query.
 * Provides functions for fetching, creating, updating, and managing update requests.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getUpdateRequests,
  getUpdateRequest,
  getApprovedSyllabi,
  createUpdateRequest,
  updateUpdateRequest,
  saveDraftChanges,
  submitUpdateRequest,
  cancelUpdateRequest,
  deleteUpdateRequest,
} from '../api/update-request.api'
import type {
  NewUpdateRequest,
  Syllabus,
  UpdateRequestsQueryParams,
} from '../types'

/**
 * Hook for fetching paginated list of update requests
 */
export function useUpdateRequestsList(params?: UpdateRequestsQueryParams) {
  return useQuery({
    queryKey: ['lecturer', 'update-requests', params],
    queryFn: () => getUpdateRequests(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for fetching a single update request
 */
export function useUpdateRequest(id: number) {
  return useQuery({
    queryKey: ['lecturer', 'update-requests', id],
    queryFn: () => getUpdateRequest(id),
    enabled: id > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for fetching approved syllabi eligible for update requests
 */
export function useApprovedSyllabi() {
  return useQuery<Syllabus[]>({
    queryKey: ['lecturer', 'syllabi', 'approved'],
    queryFn: getApprovedSyllabi,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook for managing update request operations (create, update, submit, cancel, delete)
 */
export function useUpdateRequests() {
  const queryClient = useQueryClient()

  // Create update request mutation
  const createMutation = useMutation({
    mutationFn: (data: NewUpdateRequest) => createUpdateRequest(data),
    onSuccess: (newRequest) => {
      queryClient.invalidateQueries({
        queryKey: ['lecturer', 'update-requests'],
      })
      queryClient.setQueryData(
        ['lecturer', 'update-requests', newRequest.id],
        newRequest
      )
      toast.success('Update request created successfully')
    },
    onError: (error: Error) => {
      toast.error('Failed to create update request', {
        description: error.message,
      })
    },
  })

  // Update update request mutation (draft only)
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: Partial<NewUpdateRequest>
    }) => updateUpdateRequest(id, data),
    onSuccess: (updatedRequest) => {
      queryClient.invalidateQueries({
        queryKey: ['lecturer', 'update-requests'],
      })
      queryClient.setQueryData(
        ['lecturer', 'update-requests', updatedRequest.id],
        updatedRequest
      )
      toast.success('Update request saved successfully')
    },
    onError: (error: Error) => {
      toast.error('Failed to save update request', {
        description: error.message,
      })
    },
  })

  // Save draft changes mutation (for proposed syllabus modifications)
  const saveDraftChangesMutation = useMutation({
    mutationFn: ({
      id,
      draftChanges,
    }: {
      id: number
      draftChanges: Partial<Syllabus>
    }) => saveDraftChanges(id, draftChanges),
    onSuccess: (updatedRequest) => {
      queryClient.invalidateQueries({
        queryKey: ['lecturer', 'update-requests'],
      })
      queryClient.setQueryData(
        ['lecturer', 'update-requests', updatedRequest.id],
        updatedRequest
      )
      toast.success('Draft changes saved successfully')
    },
    onError: (error: Error) => {
      toast.error('Failed to save draft changes', {
        description: error.message,
      })
    },
  })

  // Submit update request mutation
  const submitMutation = useMutation({
    mutationFn: (id: number) => submitUpdateRequest(id),
    onSuccess: (submittedRequest) => {
      queryClient.invalidateQueries({
        queryKey: ['lecturer', 'update-requests'],
      })
      queryClient.setQueryData(
        ['lecturer', 'update-requests', submittedRequest.id],
        submittedRequest
      )
      toast.success('Update request submitted for review')
    },
    onError: (error: Error) => {
      toast.error('Failed to submit update request', {
        description: error.message,
      })
    },
  })

  // Cancel update request mutation
  const cancelMutation = useMutation({
    mutationFn: (id: number) => cancelUpdateRequest(id),
    onSuccess: (cancelledRequest) => {
      queryClient.invalidateQueries({
        queryKey: ['lecturer', 'update-requests'],
      })
      queryClient.setQueryData(
        ['lecturer', 'update-requests', cancelledRequest.id],
        cancelledRequest
      )
      toast.success('Update request cancelled')
    },
    onError: (error: Error) => {
      toast.error('Failed to cancel update request', {
        description: error.message,
      })
    },
  })

  // Delete update request mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUpdateRequest(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: ['lecturer', 'update-requests'],
      })
      queryClient.removeQueries({
        queryKey: ['lecturer', 'update-requests', id],
      })
      toast.success('Update request deleted')
    },
    onError: (error: Error) => {
      toast.error('Failed to delete update request', {
        description: error.message,
      })
    },
  })

  return {
    // Create
    create: createMutation.mutate,
    createAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    // Update
    update: updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    // Save draft changes
    saveDraft: saveDraftChangesMutation.mutate,
    saveDraftAsync: saveDraftChangesMutation.mutateAsync,
    isSavingDraft: saveDraftChangesMutation.isPending,
    saveDraftError: saveDraftChangesMutation.error,

    // Submit
    submit: submitMutation.mutate,
    submitAsync: submitMutation.mutateAsync,
    isSubmitting: submitMutation.isPending,
    submitError: submitMutation.error,

    // Cancel
    cancel: cancelMutation.mutate,
    cancelAsync: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
    cancelError: cancelMutation.error,

    // Delete
    deleteRequest: deleteMutation.mutate,
    deleteAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,

    // Combined loading state
    isLoading:
      createMutation.isPending ||
      updateMutation.isPending ||
      saveDraftChangesMutation.isPending ||
      submitMutation.isPending ||
      cancelMutation.isPending ||
      deleteMutation.isPending,
  }
}
