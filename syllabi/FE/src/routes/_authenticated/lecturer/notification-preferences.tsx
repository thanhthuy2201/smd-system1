import { createFileRoute } from '@tanstack/react-router'
import { NotificationPreferences } from '@/features/lecturer/components'

/**
 * Notification Preferences Page
 * 
 * Allows lecturers to configure notification settings.
 * 
 * Requirements:
 * - Support notification preferences (Req 14.10)
 */
export const Route = createFileRoute(
  '/_authenticated/lecturer/notification-preferences'
)({
  component: NotificationPreferencesPage,
})

function NotificationPreferencesPage() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>
          Notification Preferences
        </h1>
        <p className='text-muted-foreground'>
          Configure how and when you receive notifications
        </p>
      </div>
      <NotificationPreferences />
    </div>
  )
}
