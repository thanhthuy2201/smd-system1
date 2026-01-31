/**
 * ConversationThread Component
 *
 * Displays a conversation thread between the lecturer and another user with:
 * - Message history in chronological order
 * - Quick reply functionality
 * - Attachments with download links
 * - Syllabus context if linked
 *
 * Requirements: 8.7, 8.8
 */
import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import {
  Send,
  Paperclip,
  Download,
  FileText,
  X,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'
import { useConversation, useMessaging } from '../../hooks/useMessaging'
import { useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import type { Message } from '../../types'

// Quick reply schema
const quickReplySchema = z.object({
  body: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message must not exceed 5000 characters'),
})

type QuickReplyFormData = z.infer<typeof quickReplySchema>

export interface ConversationThreadProps {
  /** User ID to display conversation with */
  userId: number
  /** Optional class name for styling */
  className?: string
  /** Callback when back button is clicked */
  onBack?: () => void
}

/**
 * ConversationThread displays message history with a contact
 *
 * @example
 * ```tsx
 * <ConversationThread
 *   userId={123}
 *   onBack={() => navigate('/lecturer/messages')}
 * />
 * ```
 */
export function ConversationThread({
  userId,
  className,
  onBack,
}: ConversationThreadProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [attachments, setAttachments] = useState<File[]>([])

  // Fetch conversation thread
  const conversationQuery = useConversation({
    userId,
  })
  
  const { conversation, messages, unreadCount } = conversationQuery
  const isPending = conversationQuery.isPending

  // Get send message mutation
  const { send, isSending } = useMessaging()
  const queryClient = useQueryClient()

  // Initialize quick reply form
  const form = useForm<QuickReplyFormData>({
    resolver: zodResolver(quickReplySchema),
    defaultValues: {
      body: '',
    },
  })

  // Watch body for character count
  const bodyValue = form.getValues('body')
  const [body, setBody] = useState(bodyValue)

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      )
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    // Validate file count
    if (attachments.length + files.length > 5) {
      toast.error('Too many files', {
        description: 'Maximum 5 attachments allowed',
      })
      return
    }

    // Validate file sizes
    const invalidFiles = files.filter((f) => f.size > 10 * 1024 * 1024)
    if (invalidFiles.length > 0) {
      toast.error('File too large', {
        description: 'Each file must be 10MB or less',
      })
      return
    }

    // Add files
    setAttachments([...attachments, ...files])

    // Clear input
    e.target.value = ''
  }

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Handle quick reply submission
  const onSubmit = (data: QuickReplyFormData) => {
    if (!conversation) return

    // Get the last message to determine subject
    const lastMessage = messages[messages.length - 1]
    const subject = lastMessage?.subject.startsWith('Re:')
      ? lastMessage.subject
      : `Re: ${lastMessage?.subject || 'Conversation'}`

    // Send the message
    send({
      recipientId: userId,
      subject,
      body: data.body,
      attachments: attachments.length > 0 ? attachments : undefined,
    })

    // Show success toast and reset form
    toast.success('Reply sent', {
      description: 'Your reply has been sent successfully',
    })
    form.reset()
    setAttachments([])

    // Invalidate conversation query to refresh messages
    queryClient.invalidateQueries({
      queryKey: ['lecturer', 'messages', 'conversation', userId],
    })
  }

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isPending) {
    return (
      <div className={cn('flex h-full items-center justify-center', className)}>
        <Loader2 className='size-8 animate-spin text-muted-foreground' />
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className={cn('flex h-full items-center justify-center', className)}>
        <p className='text-muted-foreground'>Conversation not found</p>
      </div>
    )
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <div className='flex items-center gap-3 border-b p-4'>
        {onBack && (
          <Button variant='ghost' size='icon' onClick={onBack}>
            <span className='sr-only'>Back</span>
            ←
          </Button>
        )}

        <Avatar className='size-10'>
          <AvatarImage src={undefined} alt={conversation.contactName} />
          <AvatarFallback>
            {getInitials(conversation.contactName)}
          </AvatarFallback>
        </Avatar>

        <div className='flex-1'>
          <h2 className='font-semibold'>{conversation.contactName}</h2>
          {conversation.contactEmail && (
            <p className='text-sm text-muted-foreground'>
              {conversation.contactEmail}
            </p>
          )}
        </div>

        {unreadCount > 0 && (
          <Badge variant='default' className='rounded-full'>
            {unreadCount} unread
          </Badge>
        )}
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className='flex-1 p-4'>
        <div className='space-y-4'>
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              isCurrentUser={message.senderId !== userId}
              showDate={
                index === 0 ||
                !isSameDay(
                  new Date(message.sentDate),
                  new Date(messages[index - 1].sentDate)
                )
              }
            />
          ))}
        </div>
      </ScrollArea>

      {/* Quick Reply Form */}
      <div className='border-t p-4'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-3'>
            {/* Attachments Preview */}
            {attachments.length > 0 && (
              <div className='space-y-2'>
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between rounded-md border bg-muted/50 p-2'
                  >
                    <div className='flex items-center gap-2'>
                      <FileText className='size-4 text-muted-foreground' />
                      <div className='flex flex-col'>
                        <span className='text-sm font-medium'>{file.name}</span>
                        <span className='text-xs text-muted-foreground'>
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => removeAttachment(index)}
                    >
                      <X className='size-4' />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Message Input */}
            <FormField
              control={form.control}
              name='body'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className='relative'>
                      <Textarea
                        placeholder='Type your reply...'
                        className='min-h-[80px] resize-none pr-24'
                        {...field}
                        onChange={(e) => {
                          field.onChange(e)
                          setBody(e.target.value)
                        }}
                        maxLength={5000}
                        disabled={isSending}
                      />
                      <div className='absolute bottom-2 right-2 flex items-center gap-1'>
                        <span className='text-xs text-muted-foreground'>
                          {body.length}/5000
                        </span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <input
                  type='file'
                  multiple
                  onChange={handleFileChange}
                  disabled={attachments.length >= 5 || isSending}
                  className='hidden'
                  id='attachment-input'
                  accept='*/*'
                />
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  disabled={attachments.length >= 5 || isSending}
                  onClick={() => {
                    document.getElementById('attachment-input')?.click()
                  }}
                >
                  <Paperclip className='mr-2 size-4' />
                  Attach ({attachments.length}/5)
                </Button>
              </div>

              <Button type='submit' size='sm' disabled={isSending}>
                {isSending ? (
                  <>
                    <Loader2 className='mr-2 size-4 animate-spin' />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className='mr-2 size-4' />
                    Send Reply
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}

/**
 * MessageBubble - Individual message in the conversation
 */
interface MessageBubbleProps {
  message: Message
  isCurrentUser: boolean
  showDate: boolean
}

function MessageBubble({
  message,
  isCurrentUser,
  showDate,
}: MessageBubbleProps) {
  return (
    <div>
      {/* Date Separator */}
      {showDate && (
        <div className='mb-4 flex items-center gap-3'>
          <Separator className='flex-1' />
          <span className='text-xs text-muted-foreground'>
            {format(new Date(message.sentDate), 'MMMM d, yyyy')}
          </span>
          <Separator className='flex-1' />
        </div>
      )}

      {/* Message */}
      <div
        className={cn(
          'flex gap-3',
          isCurrentUser ? 'flex-row-reverse' : 'flex-row'
        )}
      >
        {/* Avatar */}
        <Avatar className='size-8 shrink-0'>
          <AvatarImage src={undefined} alt={message.senderName} />
          <AvatarFallback className='text-xs'>
            {message.senderName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>

        {/* Message Content */}
        <div
          className={cn(
            'flex max-w-[70%] flex-col gap-1',
            isCurrentUser ? 'items-end' : 'items-start'
          )}
        >
          {/* Sender Name and Time */}
          <div
            className={cn(
              'flex items-center gap-2 text-xs text-muted-foreground',
              isCurrentUser ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            <span className='font-medium'>{message.senderName}</span>
            <span>{format(new Date(message.sentDate), 'h:mm a')}</span>
          </div>

          {/* Message Bubble */}
          <div
            className={cn(
              'rounded-lg px-4 py-2',
              isCurrentUser
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            )}
          >
            {/* Subject (if different from previous) */}
            {message.subject && (
              <p
                className={cn(
                  'mb-1 text-sm font-semibold',
                  isCurrentUser ? 'text-primary-foreground' : 'text-foreground'
                )}
              >
                {message.subject}
              </p>
            )}

            {/* Body */}
            <p className='whitespace-pre-wrap text-sm'>{message.body}</p>

            {/* Syllabus Context */}
            {message.syllabusTitle && (
              <div className='mt-2 pt-2 border-t border-current/20'>
                <Badge
                  variant={isCurrentUser ? 'secondary' : 'outline'}
                  className='text-xs'
                >
                  📄 {message.syllabusTitle}
                </Badge>
              </div>
            )}

            {/* Attachments */}
            {message.attachments.length > 0 && (
              <div className='mt-2 space-y-1 pt-2 border-t border-current/20'>
                {message.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.url}
                    download={attachment.fileName}
                    className={cn(
                      'flex items-center gap-2 rounded p-2 text-sm transition-colors',
                      isCurrentUser
                        ? 'hover:bg-primary-foreground/10'
                        : 'hover:bg-accent'
                    )}
                  >
                    <FileText className='size-4' />
                    <div className='flex-1 min-w-0'>
                      <p className='truncate font-medium'>
                        {attachment.fileName}
                      </p>
                      <p
                        className={cn(
                          'text-xs',
                          isCurrentUser
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                        )}
                      >
                        {formatFileSize(attachment.fileSize)}
                      </p>
                    </div>
                    <Download className='size-4 shrink-0' />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to check if two dates are the same day
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
