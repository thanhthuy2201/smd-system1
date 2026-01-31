/**
 * Messaging API Tests
 *
 * Tests for internal messaging API functions
 * Validates Requirements 8.1-8.11
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '@/lib/api-client'
import type {
  Message,
  MessageThread,
  NewMessage,
  Recipient,
  MessagesQueryParams,
  PaginatedResponse,
} from '../../types'
import {
  getMessages,
  getMessage,
  getConversation,
  getUnreadCount,
  sendMessage,
  replyToMessage,
  markAsRead,
  markMultipleAsRead,
  deleteMessage,
  searchRecipients,
  getAuthorizedRecipients,
} from '../message.api'

// Mock the API client
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    upload: vi.fn(),
  },
}))

describe('Messaging API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // Message Retrieval Tests
  // ============================================================================

  describe('getMessages', () => {
    it('should fetch paginated list of messages', async () => {
      const params: MessagesQueryParams = {
        page: 1,
        pageSize: 20,
        unreadOnly: false,
      }

      const mockResponse: PaginatedResponse<Message> = {
        items: [
          {
            id: 1,
            senderId: 2,
            senderName: 'Jane Smith',
            recipientId: 1,
            recipientName: 'John Doe',
            subject: 'Syllabus Review',
            body: 'Please review the updated syllabus',
            isRead: false,
            sentDate: '2024-01-01T10:00:00Z',
            attachments: [],
          },
          {
            id: 2,
            senderId: 3,
            senderName: 'Bob Johnson',
            recipientId: 1,
            recipientName: 'John Doe',
            subject: 'Meeting Request',
            body: 'Can we schedule a meeting?',
            isRead: true,
            sentDate: '2024-01-02T10:00:00Z',
            attachments: [],
          },
        ],
        total: 2,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      }

      ;(apiClient.get as any).mockResolvedValue({
        data: { data: mockResponse },
      } as any)

      const result = await getMessages(params)

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/lecturer/messages', {
        params,
      })
      expect(result).toEqual(mockResponse)
      expect(result.items).toHaveLength(2)
    })

    it('should fetch messages without parameters', async () => {
      const mockResponse: PaginatedResponse<Message> = {
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      }

      ;(apiClient.get as any).mockResolvedValue({
        data: { data: mockResponse },
      } as any)

      const result = await getMessages()

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/lecturer/messages', {
        params: undefined,
      })
      expect(result).toEqual(mockResponse)
    })

    it('should filter unread messages only', async () => {
      const params: MessagesQueryParams = {
        unreadOnly: true,
      }

      const mockResponse: PaginatedResponse<Message> = {
        items: [
          {
            id: 1,
            senderId: 2,
            senderName: 'Jane Smith',
            recipientId: 1,
            recipientName: 'John Doe',
            subject: 'Urgent Review',
            body: 'Please review ASAP',
            isRead: false,
            sentDate: '2024-01-01T10:00:00Z',
            attachments: [],
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      }

      ;(apiClient.get as any).mockResolvedValue({
        data: { data: mockResponse },
      } as any)

      const result = await getMessages(params)

      expect(result.items.every((msg) => !msg.isRead)).toBe(true)
    })
  })

  describe('getMessage', () => {
    it('should fetch a specific message by ID', async () => {
      const messageId = 1
      const mockMessage: Message = {
        id: messageId,
        senderId: 2,
        senderName: 'Jane Smith',
        senderEmail: 'jane@example.com',
        recipientId: 1,
        recipientName: 'John Doe',
        recipientEmail: 'john@example.com',
        subject: 'Syllabus Review',
        body: 'Please review the updated syllabus for CS101',
        syllabusId: 123,
        syllabusTitle: 'CS101 - Introduction to Programming',
        isRead: false,
        sentDate: '2024-01-01T10:00:00Z',
        attachments: [
          {
            id: 1,
            fileName: 'syllabus_draft.pdf',
            fileSize: 1024000,
            fileType: 'application/pdf',
            url: '/files/syllabus_draft.pdf',
          },
        ],
      }

      ;(apiClient.get as any).mockResolvedValue({
        data: { data: mockMessage },
      } as any)

      const result = await getMessage(messageId)

      expect(apiClient.get).toHaveBeenCalledWith(
        `/api/v1/messages/${messageId}`
      )
      expect(result).toEqual(mockMessage)
    })
  })

  describe('getConversation', () => {
    it('should fetch conversation thread with a specific user', async () => {
      const userId = 2
      const mockThread: MessageThread = {
        contactId: userId,
        contactName: 'Jane Smith',
        contactEmail: 'jane@example.com',
        messages: [
          {
            id: 1,
            senderId: 1,
            senderName: 'John Doe',
            recipientId: userId,
            recipientName: 'Jane Smith',
            subject: 'Re: Syllabus Review',
            body: 'I have reviewed the syllabus',
            isRead: true,
            sentDate: '2024-01-01T10:00:00Z',
            attachments: [],
          },
          {
            id: 2,
            senderId: userId,
            senderName: 'Jane Smith',
            recipientId: 1,
            recipientName: 'John Doe',
            subject: 'Re: Syllabus Review',
            body: 'Thank you for the feedback',
            isRead: false,
            sentDate: '2024-01-01T11:00:00Z',
            attachments: [],
          },
        ],
        unreadCount: 1,
        lastMessageDate: '2024-01-01T11:00:00Z',
      }

      ;(apiClient.get as any).mockResolvedValue({
        data: { data: mockThread },
      } as any)

      const result = await getConversation(userId)

      expect(apiClient.get).toHaveBeenCalledWith(
        `/api/v1/lecturer/messages/conversation/${userId}`
      )
      expect(result).toEqual(mockThread)
      expect(result.messages).toHaveLength(2)
    })
  })

  describe('getUnreadCount', () => {
    it('should fetch unread message count', async () => {
      const mockCount = 5

      ;(apiClient.get as any).mockResolvedValue({
        data: { data: { count: mockCount } },
      } as any)

      const result = await getUnreadCount()

      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/v1/lecturer/messages/unread-count'
      )
      expect(result).toBe(mockCount)
    })

    it('should return zero when no unread messages', async () => {
      ;(apiClient.get as any).mockResolvedValue({
        data: { data: { count: 0 } },
      } as any)

      const result = await getUnreadCount()

      expect(result).toBe(0)
    })
  })

  // ============================================================================
  // Send Message Tests
  // ============================================================================

  describe('sendMessage', () => {
    it('should send a message without attachments', async () => {
      const newMessage: NewMessage = {
        recipientId: 2,
        subject: 'Syllabus Review Request',
        body: 'Please review the attached syllabus',
        syllabusId: 123,
      }

      const mockResponse: Message = {
        id: 1,
        senderId: 1,
        senderName: 'John Doe',
        recipientId: newMessage.recipientId,
        recipientName: 'Jane Smith',
        subject: newMessage.subject,
        body: newMessage.body,
        syllabusId: newMessage.syllabusId,
        isRead: false,
        sentDate: '2024-01-01T10:00:00Z',
        attachments: [],
      }

      ;(apiClient.post as any).mockResolvedValue({
        data: { data: mockResponse },
      } as any)

      const result = await sendMessage(newMessage)

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/messages',
        newMessage
      )
      expect(result).toEqual(mockResponse)
    })

    it('should send a message with attachments using FormData', async () => {
      const file1 = new File(['content1'], 'document1.pdf', {
        type: 'application/pdf',
      })
      const file2 = new File(['content2'], 'document2.pdf', {
        type: 'application/pdf',
      })

      const newMessage: NewMessage = {
        recipientId: 2,
        subject: 'Documents for Review',
        body: 'Please review these documents',
        attachments: [file1, file2],
      }

      const mockResponse: Message = {
        id: 1,
        senderId: 1,
        senderName: 'John Doe',
        recipientId: newMessage.recipientId,
        recipientName: 'Jane Smith',
        subject: newMessage.subject,
        body: newMessage.body,
        isRead: false,
        sentDate: '2024-01-01T10:00:00Z',
        attachments: [
          {
            id: 1,
            fileName: 'document1.pdf',
            fileSize: 1024,
            fileType: 'application/pdf',
            url: '/files/document1.pdf',
          },
          {
            id: 2,
            fileName: 'document2.pdf',
            fileSize: 2048,
            fileType: 'application/pdf',
            url: '/files/document2.pdf',
          },
        ],
      }

      ;(apiClient.upload as any).mockResolvedValue({
        data: { data: mockResponse },
      } as any)

      const result = await sendMessage(newMessage)

      expect(apiClient.upload).toHaveBeenCalled()
      const formDataArg = (apiClient.upload as any).mock.calls[0][1]
      expect(formDataArg).toBeInstanceOf(FormData)
      expect(result).toEqual(mockResponse)
      expect(result.attachments).toHaveLength(2)
    })

    it('should send a message without optional syllabus reference', async () => {
      const newMessage: NewMessage = {
        recipientId: 2,
        subject: 'General Question',
        body: 'I have a question about the course',
      }

      const mockResponse: Message = {
        id: 1,
        senderId: 1,
        senderName: 'John Doe',
        recipientId: newMessage.recipientId,
        recipientName: 'Jane Smith',
        subject: newMessage.subject,
        body: newMessage.body,
        isRead: false,
        sentDate: '2024-01-01T10:00:00Z',
        attachments: [],
      }

      ;(apiClient.post as any).mockResolvedValue({
        data: { data: mockResponse },
      } as any)

      const result = await sendMessage(newMessage)

      expect(result.syllabusId).toBeUndefined()
    })
  })

  describe('replyToMessage', () => {
    it('should reply to an existing message', async () => {
      const messageId = 1
      const replyBody = 'Thank you for your message'

      const mockResponse: Message = {
        id: 2,
        senderId: 1,
        senderName: 'John Doe',
        recipientId: 2,
        recipientName: 'Jane Smith',
        subject: 'Re: Original Subject',
        body: replyBody,
        isRead: false,
        sentDate: '2024-01-01T11:00:00Z',
        attachments: [],
      }

      ;(apiClient.post as any).mockResolvedValue({
        data: { data: mockResponse },
      } as any)

      const result = await replyToMessage(messageId, replyBody)

      expect(apiClient.post).toHaveBeenCalledWith(
        `/api/v1/messages/${messageId}/reply`,
        { body: replyBody }
      )
      expect(result).toEqual(mockResponse)
    })
  })

  // ============================================================================
  // Message State Tests
  // ============================================================================

  describe('markAsRead', () => {
    it('should mark a message as read', async () => {
      const messageId = 1
      const mockResponse: Message = {
        id: messageId,
        senderId: 2,
        senderName: 'Jane Smith',
        recipientId: 1,
        recipientName: 'John Doe',
        subject: 'Test Message',
        body: 'Test body',
        isRead: true,
        sentDate: '2024-01-01T10:00:00Z',
        attachments: [],
      }

      ;(apiClient.post as any).mockResolvedValue({
        data: { data: mockResponse },
      } as any)

      const result = await markAsRead(messageId)

      expect(apiClient.post).toHaveBeenCalledWith(
        `/api/v1/messages/${messageId}/read`
      )
      expect(result).toEqual(mockResponse)
      expect(result.isRead).toBe(true)
    })
  })

  describe('markMultipleAsRead', () => {
    it('should mark multiple messages as read', async () => {
      const messageIds = [1, 2, 3]

      ;(apiClient.post as any).mockResolvedValue({} as any)

      await markMultipleAsRead(messageIds)

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/messages/mark-read',
        {
          ids: messageIds,
        }
      )
    })
  })

  describe('deleteMessage', () => {
    it('should delete a message', async () => {
      const messageId = 1

      ;(apiClient.delete as any).mockResolvedValue({} as any)

      await deleteMessage(messageId)

      expect(apiClient.delete).toHaveBeenCalledWith(
        `/api/v1/messages/${messageId}`
      )
    })
  })

  // ============================================================================
  // Recipient Tests
  // ============================================================================

  describe('searchRecipients', () => {
    it('should search for recipients by query', async () => {
      const query = 'jane'
      const mockRecipients: Recipient[] = [
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'Lecturer',
          departmentId: 1,
          departmentName: 'Computer Science',
        },
        {
          id: 3,
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
          role: 'Academic Manager',
          departmentId: 1,
          departmentName: 'Computer Science',
        },
      ]

      ;(apiClient.get as any).mockResolvedValue({
        data: { data: mockRecipients },
      } as any)

      const result = await searchRecipients(query)

      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/v1/lecturer/recipients/search',
        { params: { q: query } }
      )
      expect(result).toEqual(mockRecipients)
      expect(result).toHaveLength(2)
    })

    it('should return empty array when no recipients match', async () => {
      const query = 'nonexistent'

      ;(apiClient.get as any).mockResolvedValue({
        data: { data: [] },
      } as any)

      const result = await searchRecipients(query)

      expect(result).toEqual([])
    })
  })

  describe('getAuthorizedRecipients', () => {
    it('should fetch list of authorized recipients', async () => {
      const mockRecipients: Recipient[] = [
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'Lecturer',
          departmentId: 1,
          departmentName: 'Computer Science',
        },
        {
          id: 3,
          name: 'Bob Johnson',
          email: 'bob@example.com',
          role: 'HoD',
          departmentId: 1,
          departmentName: 'Computer Science',
        },
        {
          id: 4,
          name: 'Alice Williams',
          email: 'alice@example.com',
          role: 'Academic Manager',
        },
      ]

      ;(apiClient.get as any).mockResolvedValue({
        data: { data: mockRecipients },
      } as any)

      const result = await getAuthorizedRecipients()

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/lecturer/recipients')
      expect(result).toEqual(mockRecipients)
      expect(result).toHaveLength(3)
    })
  })

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Message Attachments', () => {
    it('should handle messages with multiple attachments', async () => {
      const messageId = 1
      const mockMessage: Message = {
        id: messageId,
        senderId: 2,
        senderName: 'Jane Smith',
        recipientId: 1,
        recipientName: 'John Doe',
        subject: 'Documents',
        body: 'Here are the requested documents',
        isRead: false,
        sentDate: '2024-01-01T10:00:00Z',
        attachments: [
          {
            id: 1,
            fileName: 'document1.pdf',
            fileSize: 1024000,
            fileType: 'application/pdf',
            url: '/files/document1.pdf',
          },
          {
            id: 2,
            fileName: 'document2.docx',
            fileSize: 512000,
            fileType:
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            url: '/files/document2.docx',
          },
          {
            id: 3,
            fileName: 'image.png',
            fileSize: 256000,
            fileType: 'image/png',
            url: '/files/image.png',
          },
        ],
      }

      ;(apiClient.get as any).mockResolvedValue({
        data: { data: mockMessage },
      } as any)

      const result = await getMessage(messageId)

      expect(result.attachments).toHaveLength(3)
      expect(result.attachments[0].fileName).toBe('document1.pdf')
      expect(result.attachments[1].fileName).toBe('document2.docx')
      expect(result.attachments[2].fileName).toBe('image.png')
    })
  })

  describe('Syllabus Context', () => {
    it('should link messages to specific syllabi', async () => {
      const syllabusId = 123
      const newMessage: NewMessage = {
        recipientId: 2,
        subject: 'Syllabus Review',
        body: 'Please review this syllabus',
        syllabusId,
      }

      const mockResponse: Message = {
        id: 1,
        senderId: 1,
        senderName: 'John Doe',
        recipientId: newMessage.recipientId,
        recipientName: 'Jane Smith',
        subject: newMessage.subject,
        body: newMessage.body,
        syllabusId,
        syllabusTitle: 'CS101 - Introduction to Programming',
        isRead: false,
        sentDate: '2024-01-01T10:00:00Z',
        attachments: [],
      }

      ;(apiClient.post as any).mockResolvedValue({
        data: { data: mockResponse },
      } as any)

      const result = await sendMessage(newMessage)

      expect(result.syllabusId).toBe(syllabusId)
      expect(result.syllabusTitle).toBeDefined()
    })
  })
})
