import { formatDistanceToNow } from 'date-fns'
import { CheckCircle2, MessageSquare, FileEdit, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Notification } from '@/features/lecturer/types/notification.types'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: number) => void
}

const notificationIcons = {
  'status-change': FileEdit,
  'peer-review': CheckCircle2,
  'message': MessageSquare,
  'deadline': Clock,
  'comment': MessageSquare,
  'default': AlertCircle,
}

/**
 * Notification Item Component
 * 
 * Displays a single notification with:
 * - Type-specific icon
 * - Title and message
 * - Timestamp
 * - Read/unread indicator
 * - Mark as read action
 */
export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const Icon = notificationIcons[notification.type as keyof typeof notificationIcons] || notificationIcons.default

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id)
    }
    // TODO: Navigate to related resource if notification has a link
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full p-4 text-left transition-colors hover:bg-muted/50',
        !notification.isRead && 'bg-muted/30'
      )}
    >
      <div className='flex gap-3'>
        <div className='mt-0.5'>
          <Icon className={cn(
            'h-5 w-5',
            !notification.isRead ? 'text-primary' : 'text-muted-foreground'
          )} />
        </div>
        <div className='flex-1 space-y-1'>
          <div className='flex items-start justify-between gap-2'>
            <p className={cn(
              'text-sm',
              !notification.isRead && 'font-semibold'
            )}>
              {notification.title}
            </p>
            {!notification.isRead && (
              <div className='h-2 w-2 rounded-full bg-primary' />
            )}
          </div>
          <p className='text-sm text-muted-foreground line-clamp-2'>
            {notification.message}
          </p>
          <p className='text-xs text-muted-foreground'>
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
    </button>
  )
}
