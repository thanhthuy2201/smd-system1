/**
 * Notification Trigger Service
 * 
 * Handles triggering notifications for various events in the lecturer module.
 * This service is called by mutations and other operations to create notifications.
 * 
 * Requirements:
 * - Trigger notification on syllabus status change (Req 14.1)
 * - Trigger notification on syllabus approval (Req 14.2)
 * - Trigger notification on peer review assignment (Req 14.3)
 * - Trigger notification on message receipt (Req 14.4)
 * - Trigger notification on approaching deadline (Req 14.5)
 * - Trigger notification on comment addition (Req 14.6)
 */

import { apiClient } from '@/lib/api-client'
import type { NotificationType } from '../types/notification.types'

interface CreateNotificationParams {
  userId: number
  type: NotificationType
  title: string
  message: string
  relatedResourceType?: 'syllabus' | 'message' | 'review' | 'comment'
  relatedResourceId?: number
}

/**
 * Base function to create a notification
 */
async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    await apiClient.post('/api/v1/lecturer/notifications', params)
  } catch (error) {
    console.error('Failed to create notification:', error)
    // Don't throw - notifications are non-critical
  }
}

/**
 * Trigger notification when syllabus status changes to "Revision Required"
 * 
 * @param lecturerId - ID of the lecturer who owns the syllabus
 * @param syllabusId - ID of the syllabus
 * @param syllabusTitle - Title/name of the syllabus
 * @param reviewerComments - Optional comments from the reviewer
 */
export async function triggerSyllabusRevisionRequiredNotification(
  lecturerId: number,
  syllabusId: number,
  syllabusTitle: string,
  reviewerComments?: string
): Promise<void> {
  await createNotification({
    userId: lecturerId,
    type: 'status-change',
    title: 'Syllabus Revision Required',
    message: `Your syllabus "${syllabusTitle}" requires revision. ${reviewerComments ? `Reviewer comments: ${reviewerComments}` : 'Please review the feedback and make necessary changes.'}`,
    relatedResourceType: 'syllabus',
    relatedResourceId: syllabusId,
  })
}

/**
 * Trigger notification when syllabus is approved
 * 
 * @param lecturerId - ID of the lecturer who owns the syllabus
 * @param syllabusId - ID of the syllabus
 * @param syllabusTitle - Title/name of the syllabus
 */
export async function triggerSyllabusApprovedNotification(
  lecturerId: number,
  syllabusId: number,
  syllabusTitle: string
): Promise<void> {
  await createNotification({
    userId: lecturerId,
    type: 'status-change',
    title: 'Syllabus Approved',
    message: `Congratulations! Your syllabus "${syllabusTitle}" has been approved.`,
    relatedResourceType: 'syllabus',
    relatedResourceId: syllabusId,
  })
}

/**
 * Trigger notification when syllabus status changes (generic)
 * 
 * @param lecturerId - ID of the lecturer who owns the syllabus
 * @param syllabusId - ID of the syllabus
 * @param syllabusTitle - Title/name of the syllabus
 * @param newStatus - The new status of the syllabus
 */
export async function triggerSyllabusStatusChangeNotification(
  lecturerId: number,
  syllabusId: number,
  syllabusTitle: string,
  newStatus: string
): Promise<void> {
  await createNotification({
    userId: lecturerId,
    type: 'status-change',
    title: 'Syllabus Status Updated',
    message: `Your syllabus "${syllabusTitle}" status has been changed to "${newStatus}".`,
    relatedResourceType: 'syllabus',
    relatedResourceId: syllabusId,
  })
}

/**
 * Trigger notification when a peer review is assigned
 * 
 * @param reviewerId - ID of the lecturer assigned to review
 * @param syllabusId - ID of the syllabus to review
 * @param syllabusTitle - Title/name of the syllabus
 * @param authorName - Name of the syllabus author
 */
export async function triggerPeerReviewAssignedNotification(
  reviewerId: number,
  syllabusId: number,
  syllabusTitle: string,
  authorName: string
): Promise<void> {
  await createNotification({
    userId: reviewerId,
    type: 'peer-review',
    title: 'New Peer Review Assignment',
    message: `You have been assigned to review the syllabus "${syllabusTitle}" by ${authorName}.`,
    relatedResourceType: 'review',
    relatedResourceId: syllabusId,
  })
}

/**
 * Trigger notification when a new message is received
 * 
 * @param recipientId - ID of the message recipient
 * @param messageId - ID of the message
 * @param senderName - Name of the message sender
 * @param subject - Subject of the message
 */
export async function triggerMessageReceivedNotification(
  recipientId: number,
  messageId: number,
  senderName: string,
  subject: string
): Promise<void> {
  await createNotification({
    userId: recipientId,
    type: 'message',
    title: 'New Message',
    message: `You have a new message from ${senderName}: "${subject}"`,
    relatedResourceType: 'message',
    relatedResourceId: messageId,
  })
}

/**
 * Trigger notification when a deadline is approaching
 * 
 * @param lecturerId - ID of the lecturer
 * @param syllabusId - ID of the syllabus with approaching deadline
 * @param syllabusTitle - Title/name of the syllabus
 * @param daysRemaining - Number of days until deadline
 * @param deadlineType - Type of deadline (e.g., "submission", "review")
 */
export async function triggerDeadlineApproachingNotification(
  lecturerId: number,
  syllabusId: number,
  syllabusTitle: string,
  daysRemaining: number,
  deadlineType: string
): Promise<void> {
  await createNotification({
    userId: lecturerId,
    type: 'deadline',
    title: 'Deadline Approaching',
    message: `The ${deadlineType} deadline for "${syllabusTitle}" is in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.`,
    relatedResourceType: 'syllabus',
    relatedResourceId: syllabusId,
  })
}

/**
 * Trigger notification when a comment is added to a syllabus
 * 
 * @param syllabusOwnerId - ID of the syllabus owner
 * @param commentId - ID of the comment
 * @param syllabusId - ID of the syllabus
 * @param syllabusTitle - Title/name of the syllabus
 * @param commenterName - Name of the person who added the comment
 * @param commentType - Type of comment (e.g., "Suggestion", "Question", "Error")
 */
export async function triggerCommentAddedNotification(
  syllabusOwnerId: number,
  commentId: number,
  _syllabusId: number,
  syllabusTitle: string,
  commenterName: string,
  commentType: string
): Promise<void> {
  await createNotification({
    userId: syllabusOwnerId,
    type: 'comment',
    title: 'New Comment on Your Syllabus',
    message: `${commenterName} added a ${commentType.toLowerCase()} comment on "${syllabusTitle}".`,
    relatedResourceType: 'comment',
    relatedResourceId: commentId,
  })
}

/**
 * Trigger notification when a reply is added to a comment
 * 
 * @param originalCommenterId - ID of the original commenter
 * @param commentId - ID of the comment that was replied to
 * @param syllabusId - ID of the syllabus
 * @param syllabusTitle - Title/name of the syllabus
 * @param replierName - Name of the person who replied
 */
export async function triggerCommentReplyNotification(
  originalCommenterId: number,
  commentId: number,
  _syllabusId: number,
  syllabusTitle: string,
  replierName: string
): Promise<void> {
  await createNotification({
    userId: originalCommenterId,
    type: 'comment',
    title: 'Reply to Your Comment',
    message: `${replierName} replied to your comment on "${syllabusTitle}".`,
    relatedResourceType: 'comment',
    relatedResourceId: commentId,
  })
}

/**
 * Trigger notification when an update request is approved
 * 
 * @param lecturerId - ID of the lecturer who requested the update
 * @param syllabusId - ID of the syllabus
 * @param syllabusTitle - Title/name of the syllabus
 */
export async function triggerUpdateRequestApprovedNotification(
  lecturerId: number,
  syllabusId: number,
  syllabusTitle: string
): Promise<void> {
  await createNotification({
    userId: lecturerId,
    type: 'status-change',
    title: 'Update Request Approved',
    message: `Your update request for "${syllabusTitle}" has been approved.`,
    relatedResourceType: 'syllabus',
    relatedResourceId: syllabusId,
  })
}

/**
 * Trigger notification when an update request is rejected
 * 
 * @param lecturerId - ID of the lecturer who requested the update
 * @param syllabusId - ID of the syllabus
 * @param syllabusTitle - Title/name of the syllabus
 * @param rejectionReason - Optional reason for rejection
 */
export async function triggerUpdateRequestRejectedNotification(
  lecturerId: number,
  syllabusId: number,
  syllabusTitle: string,
  rejectionReason?: string
): Promise<void> {
  await createNotification({
    userId: lecturerId,
    type: 'status-change',
    title: 'Update Request Rejected',
    message: `Your update request for "${syllabusTitle}" has been rejected. ${rejectionReason ? `Reason: ${rejectionReason}` : ''}`,
    relatedResourceType: 'syllabus',
    relatedResourceId: syllabusId,
  })
}

/**
 * Batch trigger notifications for multiple users
 * Useful for notifying multiple reviewers at once
 * 
 * @param userIds - Array of user IDs to notify
 * @param type - Type of notification
 * @param title - Notification title
 * @param message - Notification message
 * @param relatedResourceType - Optional related resource type
 * @param relatedResourceId - Optional related resource ID
 */
export async function triggerBatchNotifications(
  userIds: number[],
  type: NotificationType,
  title: string,
  message: string,
  relatedResourceType?: 'syllabus' | 'message' | 'review' | 'comment',
  relatedResourceId?: number
): Promise<void> {
  const promises = userIds.map((userId) =>
    createNotification({
      userId,
      type,
      title,
      message,
      relatedResourceType,
      relatedResourceId,
    })
  )

  await Promise.allSettled(promises)
}
