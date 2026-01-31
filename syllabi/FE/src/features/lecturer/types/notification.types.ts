/**
 * Notification Types
 * 
 * Type definitions for the notification system.
 * Supports various notification types for different events.
 */

export interface Notification {
  id: number
  userId: number
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  createdAt: string
  relatedResourceType?: 'syllabus' | 'message' | 'review' | 'comment'
  relatedResourceId?: number
}

export type NotificationType =
  | 'status-change'    // Syllabus status changed (approved, revision required)
  | 'peer-review'      // Peer review assigned
  | 'message'          // New message received
  | 'deadline'         // Deadline approaching
  | 'comment'          // Comment added to syllabus
  | 'default'          // Generic notification

export interface NotificationPreferences {
  emailEnabled: boolean
  inAppEnabled: boolean
  notifyOnStatusChange: boolean
  notifyOnPeerReview: boolean
  notifyOnMessage: boolean
  notifyOnDeadline: boolean
  notifyOnComment: boolean
  deadlineReminderDays: number // Days before deadline to send reminder
}
