/**
 * Messaging API Functions
 *
 * This module contains all API functions for the internal messaging system.
 */
import { apiClient } from '@/lib/api-client'
import type {
  Message,
  MessageThread,
  NewMessage,
  Recipient,
  MessagesQueryParams,
  PaginatedResponse,
  ApiResponse,
} from '../types'

// ============================================================================
// Message Operations
// ============================================================================

/**
 * Get paginated list of messages for the current user
 */
export const getMessages = async (
  params?: MessagesQueryParams
): Promise<PaginatedResponse<Message>> => {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<Message>>>(
    '/api/v1/lecturer/messages',
    { params }
  )
  return response.data.items
}

/**
 * Get a specific message by ID
 */
export const getMessage = async (id: number): Promise<Message> => {
  const response = await apiClient.get<ApiResponse<Message>>(
    `/api/v1/messages/${id}`
  )
  return response.data.items
}

/**
 * Get conversation thread with a specific user
 */
export const getConversation = async (
  userId: number
): Promise<MessageThread> => {
  const response = await apiClient.get<ApiResponse<MessageThread>>(
    `/api/v1/lecturer/messages/conversation/${userId}`
  )
  return response.data.items
}

/**
 * Get unread message count
 */
export const getUnreadCount = async (): Promise<number> => {
  const response = await apiClient.get<ApiResponse<{ count: number }>>(
    '/api/v1/lecturer/messages/unread-count'
  )
  return response.data.items.count
}

// ============================================================================
// Send Message Operations
// ============================================================================

/**
 * Send a new message
 */
export const sendMessage = async (data: NewMessage): Promise<Message> => {
  // If there are attachments, use FormData
  if (data.attachments && data.attachments.length > 0) {
    const formData = new FormData()
    formData.append('recipientId', data.recipientId.toString())
    formData.append('subject', data.subject)
    formData.append('body', data.body)

    if (data.syllabusId) {
      formData.append('syllabusId', data.syllabusId.toString())
    }

    data.attachments.forEach((file) => {
      formData.append('attachments', file)
    })

    const response = await apiClient.upload<ApiResponse<Message>>(
      '/api/v1/messages',
      formData
    )
    return response.data.items
  }

  // No attachments, use regular JSON
  const response = await apiClient.post<ApiResponse<Message>>(
    '/api/v1/messages',
    data
  )
  return response.data.items
}

/**
 * Reply to a message
 */
export const replyToMessage = async (
  messageId: number,
  body: string
): Promise<Message> => {
  const response = await apiClient.post<ApiResponse<Message>>(
    `/api/v1/messages/${messageId}/reply`,
    { body }
  )
  return response.data.items
}

// ============================================================================
// Message State Operations
// ============================================================================

/**
 * Mark a message as read
 */
export const markAsRead = async (id: number): Promise<Message> => {
  const response = await apiClient.post<ApiResponse<Message>>(
    `/api/v1/messages/${id}/read`
  )
  return response.data.items
}

/**
 * Mark multiple messages as read
 */
export const markMultipleAsRead = async (ids: number[]): Promise<void> => {
  await apiClient.post('/api/v1/messages/mark-read', { ids })
}

/**
 * Delete a message
 */
export const deleteMessage = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/v1/messages/${id}`)
}

// ============================================================================
// Recipient Operations
// ============================================================================

/**
 * Search for recipients (authorized users only)
 */
export const searchRecipients = async (query: string): Promise<Recipient[]> => {
  const response = await apiClient.get<ApiResponse<Recipient[]>>(
    '/api/v1/lecturer/recipients/search',
    { params: { q: query } }
  )
  return response.data.items
}

/**
 * Get list of authorized recipients
 */
export const getAuthorizedRecipients = async (): Promise<Recipient[]> => {
  const response = await apiClient.get<ApiResponse<Recipient[]>>(
    '/api/v1/lecturer/recipients'
  )
  return response.data.items
}
