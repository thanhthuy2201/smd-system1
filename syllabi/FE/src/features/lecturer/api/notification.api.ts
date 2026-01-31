/**
 * Notification API Functions
 *
 * This module contains all API functions for the notification system.
 */
import { apiClient } from '@/lib/api-client'
import type { Notification, PaginatedResponse, ApiResponse } from '../types'

// ============================================================================
// Notification Operations
// ============================================================================

/**
 * Get paginated list of notifications for the current user
 */
export const getNotifications = async (
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<Notification>> => {
  const response = await apiClient.get<
    ApiResponse<PaginatedResponse<Notification>>
  >('/api/v1/notifications/my-notifications', { params: { page, pageSize } })
  return response.data.items
}

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = async (): Promise<number> => {
  const response = await apiClient.get<ApiResponse<{ count: number }>>(
    '/api/v1/lecturer/notifications/unread-count'
  )
  return response.data.items.count
}

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (
  id: number
): Promise<Notification> => {
  const response = await apiClient.post<ApiResponse<Notification>>(
    `/api/v1/notifications/${id}/mask-as-read`
  )
  return response.data.items
}

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (): Promise<void> => {
  await apiClient.post('/api/v1/notifications/mark-all-read')
}

/**
 * Delete a notification
 */
export const deleteNotification = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/v1/notifications/${id}`)
}
