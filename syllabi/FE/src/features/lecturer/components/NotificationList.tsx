import { useState } from 'react'
import { CheckCheck, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useNotifications } from '../hooks/useNotifications'
import { useTranslation } from '../hooks/useTranslation'
import { NotificationItem } from './NotificationItem'
import type { NotificationType, Notification } from '@/features/lecturer/types/notification.types'

/**
 * Notification List Component
 * 
 * Full-page notification list with filtering and bulk actions.
 * 
 * Features:
 * - Filter by notification type
 * - Filter by read/unread status
 * - Mark all as read
 * - Individual notification actions
 * 
 * Requirements:
 * - Display notification history (Req 14.8)
 * - Mark notifications as read (Req 14.9)
 */
export function NotificationList() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications()
  const { t } = useTranslation()
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all')

  // Apply filters
  const filteredNotifications = notifications.filter((notification: Notification) => {
    const typeMatch = typeFilter === 'all' || notification.type === typeFilter
    const statusMatch =
      statusFilter === 'all' ||
      (statusFilter === 'unread' && !notification.isRead) ||
      (statusFilter === 'read' && notification.isRead)
    return typeMatch && statusMatch
  })

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>{t('notifications.title')}</CardTitle>
            {unreadCount > 0 && (
              <Badge variant='secondary' className='mt-2'>
                {unreadCount} {t('notificationList.unread')}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => markAllAsRead()}
              aria-label={t('notifications.markAllAsRead')}
            >
              <CheckCheck className='mr-2 h-4 w-4' />
              {t('notifications.markAllAsRead')}
            </Button>
          )}
        </div>
      </CardHeader>
      <Separator />
      <CardContent className='p-0'>
        {/* Filters */}
        <div className='flex gap-4 p-4'>
          <div className='flex items-center gap-2'>
            <Filter className='h-4 w-4 text-muted-foreground' />
            <span className='text-sm font-medium'>{t('common.filter')}:</span>
          </div>
          <Select
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as NotificationType | 'all')}
          >
            <SelectTrigger className='w-[180px]' aria-label={t('notificationList.filterByType')}>
              <SelectValue placeholder={t('notificationList.allTypes')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>{t('notificationList.allTypes')}</SelectItem>
              <SelectItem value='status-change'>{t('notificationList.types.statusChange')}</SelectItem>
              <SelectItem value='peer-review'>{t('notificationList.types.peerReview')}</SelectItem>
              <SelectItem value='message'>{t('notificationList.types.message')}</SelectItem>
              <SelectItem value='deadline'>{t('notificationList.types.deadline')}</SelectItem>
              <SelectItem value='comment'>{t('notificationList.types.comment')}</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as 'all' | 'unread' | 'read')}
          >
            <SelectTrigger className='w-[150px]' aria-label={t('notificationList.filterByStatus')}>
              <SelectValue placeholder={t('notificationList.allStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>{t('notificationList.all')}</SelectItem>
              <SelectItem value='unread'>{t('notificationList.unread')}</SelectItem>
              <SelectItem value='read'>{t('notificationList.read')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Separator />

        {/* Notification list */}
        <ScrollArea className='h-[600px]'>
          {isLoading ? (
            <div className='p-8 text-center text-sm text-muted-foreground'>
              {t('common.loading')}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className='p-8 text-center text-sm text-muted-foreground'>
              {statusFilter === 'unread' && notifications.length > 0
                ? t('notificationList.noUnread')
                : t('notifications.noNotifications')}
            </div>
          ) : (
            <div className='divide-y'>
              {filteredNotifications.map((notification: Notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
