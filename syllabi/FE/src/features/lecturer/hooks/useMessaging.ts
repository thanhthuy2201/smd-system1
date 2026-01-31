/**
 * useMessaging Hook
 *
 * Custom hook for managing internal messaging system.
 *
 * Features:
 * - Fetch message inbox with pagination
 * - Fetch conversation threads
 * - Send messages
 * - Mark messages as read
 * - Delete messages
 * - Track unread count
 */
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query'
import {
  getMessages,
  getConversation,
  sendMessage,
  markAsRead as markMessageAsRead,
  deleteMessage,
} from '../api/message.api'
import type {
  Message,
  MessageThread,
  NewMessage,
  MessagesQueryParams,
  PaginatedResponse,
} from '../types'

export interface UseMessagingOptions extends MessagesQueryParams {
  /** Enable/disable the query */
  enabled?: boolean
}

export type UseMessagingReturn = UseQueryResult<
  PaginatedResponse<Message>
> & {
  /** List of messages */
  messages: Message[]
  /** Total number of messages */
  total: number
  /** Current page */
  page: number
  /** Page size */
  pageSize: number
  /** Total pages */
  totalPages: number
  /** Unread message count */
  unreadCount: number
  /** Send message mutation */
  send: (message: NewMessage) => void
  /** Whether message is being sent */
  isSending: boolean
  /** Mark as read mutation */
  markAsRead: (messageId: number) => void
  /** Whether marking as read */
  isMarkingAsRead: boolean
  /** Delete message mutation */
  remove: (messageId: number) => void
  /** Whether deleting */
  isDeleting: boolean
}

export interface UseConversationOptions {
  /** User ID to get conversation with */
  userId: number
  /** Enable/disable the query */
  enabled?: boolean
}

export type UseConversationReturn = UseQueryResult<MessageThread> & {
  /** Conversation thread */
  conversation?: MessageThread
  /** Messages in the conversation */
  messages: Message[]
  /** Unread count in this conversation */
  unreadCount: number
}

/**
 * Hook for managing message inbox
 *
 * @example
 * ```tsx
 * const {
 *   messages,
 *   unreadCount,
 *   send,
 *   markAsRead,
 *   isLoading
 * } = useMessaging({
 *   page: 1,
 *   pageSize: 20,
 *   unreadOnly: false
 * });
 *
 * // Send a message
 * send({
 *   recipientId: 123,
 *   subject: 'Question about syllabus',
 *   body: 'I have a question...',
 *   syllabusId: 456
 * });
 *
 * // Mark as read
 * markAsRead(messageId);
 * ```
 */
export function useMessaging(
  options: UseMessagingOptions = {}
): UseMessagingReturn {
  const {
    enabled = true,
    page = 1,
    pageSize = 20,
    search,
    unreadOnly = false,
    sortBy = 'sentDate',
    sortOrder = 'desc',
  } = options

  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: [
      'lecturer',
      'messages',
      { page, pageSize, search, unreadOnly, sortBy, sortOrder },
    ],
    queryFn: () =>
      getMessages({
        page,
        pageSize,
        search,
        unreadOnly,
        sortBy,
        sortOrder,
      }),
    enabled,
    staleTime: 1 * 60 * 1000, // 1 minute (messages update frequently)
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  const data = query.data || {
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  }

  // Calculate unread count
  const unreadCount = data.items.filter((m) => !m.isRead).length

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      // Invalidate messages to refresh inbox
      queryClient.invalidateQueries({ queryKey: ['lecturer', 'messages'] })
    },
  })

  // Mark as read mutation with optimistic update
  const markAsReadMutation = useMutation({
    mutationFn: markMessageAsRead,
    onMutate: async (messageId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['lecturer', 'messages'] })

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData([
        'lecturer',
        'messages',
        { page, pageSize, search, unreadOnly, sortBy, sortOrder },
      ])

      // Optimistically update
      queryClient.setQueryData(
        [
          'lecturer',
          'messages',
          { page, pageSize, search, unreadOnly, sortBy, sortOrder },
        ],
        (old: PaginatedResponse<Message> | undefined) => {
          if (!old) return old
          return {
            ...old,
            data: old.items.map((msg) =>
              msg.id === messageId ? { ...msg, isRead: true } : msg
            ),
          }
        }
      )

      return { previousMessages }
    },
    onError: (_err, _messageId, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          [
            'lecturer',
            'messages',
            { page, pageSize, search, unreadOnly, sortBy, sortOrder },
          ],
          context.previousMessages
        )
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['lecturer', 'messages'] })
    },
  })

  // Delete message mutation
  const deleteMutation = useMutation({
    mutationFn: deleteMessage,
    onSuccess: () => {
      // Invalidate messages to refresh inbox
      queryClient.invalidateQueries({ queryKey: ['lecturer', 'messages'] })
    },
  })

  return {
    ...query,
    messages: data.items,
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
    totalPages: data.totalPages,
    unreadCount,
    send: sendMutation.mutate,
    isSending: sendMutation.isPending,
    markAsRead: markAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    remove: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  }
}

/**
 * Hook for fetching a conversation thread with a specific user
 *
 * @example
 * ```tsx
 * const { conversation, messages, unreadCount, isLoading } = useConversation({
 *   userId: 123
 * });
 *
 * // Display conversation
 * messages.map(message => (
 *   <MessageBubble key={message.id} message={message} />
 * ));
 * ```
 */
export function useConversation(
  options: UseConversationOptions
): UseConversationReturn {
  const { userId, enabled = true } = options

  const query = useQuery({
    queryKey: ['lecturer', 'messages', 'conversation', userId],
    queryFn: () => getConversation(userId),
    enabled: enabled && userId > 0,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  const conversation = query.data
  const messages = conversation?.messages || []
  const unreadCount = conversation?.unreadCount || 0

  return {
    ...query,
    conversation,
    messages,
    unreadCount,
  }
}
