import { apiClient } from '@/lib/api-client'
import type { Notification, NotificationPreferences } from '../types/notification.types'

/**
 * Notification API
 * 
 * API functions for notification management.
 * Handles fetching, marking as read, and preferences.
 */
export const notificationApi = {
  /**
   * Get all notifications for the current lecturer
   */
  getNotifications: () =>
    apiClient.get<Notification[]>('/api/v1/lecturer/notifications'),

  /**
   * Mark a notification as read
   */
  markAsRead: (notificationId: number) =>
    apiClient.put(`/api/v1/lecturer/notifications/${notificationId}/read`),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: () =>
    apiClient.put('/api/v1/lecturer/notifications/read-all'),

  /**
   * Delete a notification
   */
  deleteNotification: (notificationId: number) =>
    apiClient.delete(`/api/v1/lecturer/notifications/${notificationId}`),

  /**
   * Get notification preferences
   */
  getPreferences: () =>
    apiClient.get<NotificationPreferences>('/api/v1/lecturer/notifications/preferences'),

  /**
   * Update notification preferences
   */
  updatePreferences: (preferences: Partial<NotificationPreferences>) =>
    apiClient.put('/api/v1/lecturer/notifications/preferences', preferences),
}
