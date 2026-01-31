import { createFileRoute } from '@tanstack/react-router'
import { NotificationList } from '@/features/lecturer/components'

/**
 * Lecturer Notifications Page
 * 
 * Displays full notification list with filtering and management.
 * 
 * Requirements:
 * - Display notification history (Req 14.8)
 * - Allow marking notifications as read (Req 14.9)
 */
export const Route = createFileRoute('/_authenticated/lecturer/notifications')({
  component: NotificationsPage,
})

function NotificationsPage() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Notifications</h1>
        <p className='text-muted-foreground'>
          View and manage your notifications
        </p>
      </div>
      <NotificationList />
    </div>
  )
}
