import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useNotifications } from '../hooks/useNotifications'
import { useTranslation } from '../hooks/useTranslation'
import { NotificationItem } from './NotificationItem'

/**
 * Notification Badge Component
 * 
 * Displays notification icon with unread count badge.
 * Opens popover with notification list when clicked.
 * 
 * Requirements:
 * - Display unread notification count (Req 14.7)
 * - Show notification list (Req 14.8)
 * - Allow marking as read (Req 14.9)
 */
export function NotificationBadge() {
  const { notifications, unreadCount, markAsRead, isLoading } = useNotifications()
  const { t } = useTranslation()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='relative'
          aria-label={`${t('notifications.title')}${unreadCount > 0 ? ` (${unreadCount} ${t('notificationBadge.unread')})` : ''}`}
        >
          <Bell className='h-5 w-5' />
          {unreadCount > 0 && (
            <Badge
              variant='destructive'
              className='absolute -right-1 -top-1 h-5 min-w-5 rounded-full px-1 text-xs'
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80 p-0' align='end'>
        <div className='flex items-center justify-between p-4'>
          <h3 className='font-semibold'>{t('notifications.title')}</h3>
          {unreadCount > 0 && (
            <Badge variant='secondary'>{unreadCount} {t('notificationBadge.new')}</Badge>
          )}
        </div>
        <Separator />
        <ScrollArea className='h-[400px]'>
          {isLoading ? (
            <div className='p-4 text-center text-sm text-muted-foreground'>
              {t('common.loading')}
            </div>
          ) : notifications.length === 0 ? (
            <div className='p-4 text-center text-sm text-muted-foreground'>
              {t('notifications.noNotifications')}
            </div>
          ) : (
            <div className='divide-y'>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
