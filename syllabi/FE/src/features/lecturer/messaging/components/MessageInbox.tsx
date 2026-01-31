/**
 * MessageInbox Component
 *
 * Displays a list of messages with:
 * - Unread indicators and count badge
 * - Read/unread filtering
 * - Search functionality
 * - Links to conversation threads
 *
 * Requirements: 8.1
 */
import { useState } from 'react'
import { Search as SearchIcon, Mail, MailOpen, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMessaging } from '../../hooks/useMessaging'
import type { Message } from '../../types'

export interface MessageInboxProps {
  /** Optional class name for styling */
  className?: string
  /** Callback when a message is selected */
  onMessageSelect?: (message: Message) => void
  /** Page size for pagination */
  pageSize?: number
}

/**
 * MessageInbox displays a list of messages with filtering and search
 *
 * @example
 * ```tsx
 * <MessageInbox
 *   onMessageSelect={(message) => navigate(`/lecturer/messages/conversation/${message.senderId}`)}
 *   pageSize={20}
 * />
 * ```
 */
export function MessageInbox({
  className,
  onMessageSelect,
  pageSize = 20,
}: MessageInboxProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch messages with current filters
  const messaging = useMessaging({
    page: currentPage,
    pageSize,
    search: search.trim() || undefined,
    unreadOnly: filter === 'unread',
  })

  const {
    messages,
    unreadCount,
    total,
    totalPages,
    markAsRead,
    remove,
    isDeleting,
  } = messaging

  // Access isPending from the spread query result
  const isPending = 'isPending' in messaging ? messaging.isPending : false

  // Filter messages by read status on client side if needed
  const filteredMessages =
    filter === 'read'
      ? messages.filter((msg) => msg.isRead)
      : filter === 'unread'
        ? messages.filter((msg) => !msg.isRead)
        : messages

  const handleMessageClick = (message: Message) => {
    // Mark as read if unread
    if (!message.isRead) {
      markAsRead(message.id)
    }

    // Call callback if provided
    if (onMessageSelect) {
      onMessageSelect(message)
    }
  }

  const handleDelete = (messageId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this message?')) {
      remove(messageId)
    }
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header with unread count */}
      <div className='flex items-center justify-between border-b p-4'>
        <div className='flex items-center gap-2'>
          <h2 className='text-xl font-semibold'>Inbox</h2>
          {unreadCount > 0 && (
            <Badge variant='default' className='rounded-full'>
              {unreadCount}
            </Badge>
          )}
        </div>

        <Button size='sm' onClick={() => window.alert('Compose message - route not implemented yet')}>
          Compose
        </Button>
      </div>

      {/* Search and Filter */}
      <div className='space-y-3 border-b p-4'>
        {/* Search Input */}
        <div className='relative'>
          <SearchIcon className='absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            type='text'
            placeholder='Search messages...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-9'
          />
        </div>

        {/* Filter Dropdown */}
        <Select
          value={filter}
          onValueChange={(value) => setFilter(value as typeof filter)}
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Filter messages' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Messages</SelectItem>
            <SelectItem value='unread'>Unread Only</SelectItem>
            <SelectItem value='read'>Read Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Message List */}
      <ScrollArea className='flex-1'>
        {isPending ? (
          <div className='flex h-32 items-center justify-center'>
            <p className='text-sm text-muted-foreground'>Loading messages...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className='flex h-32 flex-col items-center justify-center gap-2'>
            <Mail className='size-8 text-muted-foreground' />
            <p className='text-sm text-muted-foreground'>
              {search
                ? 'No messages found'
                : filter === 'unread'
                  ? 'No unread messages'
                  : 'No messages yet'}
            </p>
          </div>
        ) : (
          <div className='divide-y'>
            {filteredMessages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                onClick={() => handleMessageClick(message)}
                onDelete={(e) => handleDelete(message.id, e)}
                isDeleting={isDeleting}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='flex items-center justify-between border-t p-4'>
          <p className='text-sm text-muted-foreground'>
            Page {currentPage} of {totalPages} ({total} total)
          </p>
          <div className='flex gap-2'>
            <Button
              size='sm'
              variant='outline'
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * MessageItem - Individual message in the inbox list
 */
interface MessageItemProps {
  message: Message
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
  isDeleting: boolean
}

function MessageItem({
  message,
  onClick,
  onDelete,
  isDeleting,
}: MessageItemProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'group relative flex w-full gap-3 p-4 text-left transition-colors hover:bg-accent',
        !message.isRead && 'bg-muted/50'
      )}
    >
      {/* Avatar */}
      <Avatar className='size-10 shrink-0'>
        <AvatarImage src={undefined} alt={message.senderName} />
        <AvatarFallback>{getInitials(message.senderName)}</AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className='min-w-0 flex-1'>
        {/* Header: Sender name and date */}
        <div className='mb-1 flex items-start justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <span
              className={cn(
                'text-sm font-medium',
                !message.isRead && 'font-semibold'
              )}
            >
              {message.senderName}
            </span>
            {!message.isRead && (
              <Badge variant='default' className='h-5 rounded-full px-1.5'>
                <Mail className='size-3' />
              </Badge>
            )}
          </div>
          <span className='shrink-0 text-xs text-muted-foreground'>
            {format(new Date(message.sentDate), 'MMM d, h:mm a')}
          </span>
        </div>

        {/* Subject */}
        <p
          className={cn(
            'mb-1 text-sm',
            !message.isRead ? 'font-semibold' : 'font-medium'
          )}
        >
          {message.subject}
        </p>

        {/* Body Preview */}
        <p className='line-clamp-2 text-sm text-muted-foreground'>
          {message.body}
        </p>

        {/* Syllabus Link (if present) */}
        {message.syllabusTitle && (
          <div className='mt-2 flex items-center gap-1'>
            <Badge variant='outline' className='text-xs'>
              📄 {message.syllabusTitle}
            </Badge>
          </div>
        )}

        {/* Attachments indicator */}
        {message.attachments.length > 0 && (
          <div className='mt-2 flex items-center gap-1 text-xs text-muted-foreground'>
            📎 {message.attachments.length} attachment
            {message.attachments.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Delete Button (visible on hover) */}
      <Button
        size='icon'
        variant='ghost'
        className='absolute top-4 right-4 size-8 opacity-0 transition-opacity group-hover:opacity-100'
        onClick={onDelete}
        disabled={isDeleting}
      >
        <Trash2 className='size-4 text-muted-foreground hover:text-destructive' />
      </Button>

      {/* Read/Unread Indicator */}
      {message.isRead ? (
        <MailOpen className='absolute bottom-4 right-4 size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100' />
      ) : (
        <div className='absolute top-1/2 right-4 size-2 -translate-y-1/2 rounded-full bg-primary' />
      )}
    </button>
  )
}
