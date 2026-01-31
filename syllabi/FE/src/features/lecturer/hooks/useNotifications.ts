import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from '../api/notificationApi'
import type { Notification } from '../types/notification.types'

/**
 * useNotifications Hook
 * 
 * Manages notification state and operations.
 * Provides:
 * - List of notifications
 * - Unread count
 * - Mark as read functionality
 * - Real-time updates via polling
 * 
 * Requirements:
 * - Display notification list (Req 14.8)
 * - Show unread count (Req 14.7)
 * - Mark notifications as read (Req 14.9)
 */
export function useNotifications() {
  const queryClient = useQueryClient()

  // Fetch notifications with polling for real-time updates
  const { data, isLoading, error } = useQuery({
    queryKey: ['lecturer', 'notifications'],
    queryFn: notificationApi.getNotifications,
    // Poll every 30 seconds for new notifications
    refetchInterval: 30000,
    // Keep previous data while refetching
    placeholderData: (previousData) => previousData,
  })

  const notifications = data?.data || []
  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) =>
      notificationApi.markAsRead(notificationId),
    onMutate: async (notificationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['lecturer', 'notifications'] })

      // Snapshot previous value
      const previousNotifications = queryClient.getQueryData(['lecturer', 'notifications'])

      // Optimistically update
      queryClient.setQueryData(['lecturer', 'notifications'], (old: any) => {
        if (!old?.data) return old
        return {
          ...old,
          data: old.data.map((n: Notification) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          ),
        }
      })

      return { previousNotifications }
    },
    onError: (_err, _notificationId, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          ['lecturer', 'notifications'],
          context.previousNotifications
        )
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['lecturer', 'notifications'] })
    },
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecturer', 'notifications'] })
    },
  })

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
  }
}
