import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from '../api/notificationApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'
import type { NotificationPreferences as NotificationPreferencesType } from '../types/notification.types'

/**
 * Notification Preferences Component
 * 
 * Allows lecturers to configure notification settings:
 * - Enable/disable email notifications
 * - Enable/disable in-app notifications
 * - Configure notification types
 * - Set deadline reminder timing
 * 
 * Requirements:
 * - Support notification preferences (Req 14.10)
 */
export function NotificationPreferences() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  // Fetch preferences
  const { data, isLoading } = useQuery({
    queryKey: ['lecturer', 'notification-preferences'],
    queryFn: notificationApi.getPreferences,
  })

  const preferences = data?.data

  // Update preferences mutation
  const updateMutation = useMutation({
    mutationFn: (updates: Partial<NotificationPreferencesType>) =>
      notificationApi.updatePreferences(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecturer', 'notification-preferences'] })
      toast.success(t('notificationPreferences.toast.success.title'), {
        description: t('notificationPreferences.toast.success.description'),
      })
    },
    onError: () => {
      toast.error(t('common.error'), {
        description: t('notificationPreferences.toast.error.description'),
      })
    },
  })

  const handleToggle = (key: keyof NotificationPreferencesType, value: boolean) => {
    updateMutation.mutate({ [key]: value })
  }

  const handleDeadlineReminderChange = (value: string) => {
    updateMutation.mutate({ deadlineReminderDays: parseInt(value, 10) })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center p-8'>
          <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
        </CardContent>
      </Card>
    )
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className='p-8 text-center text-sm text-muted-foreground'>
          {t('notificationPreferences.loadError')}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('notificationPreferences.title')}</CardTitle>
        <CardDescription>
          {t('notificationPreferences.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Delivery Methods */}
        <div className='space-y-4'>
          <h3 className='text-sm font-medium'>{t('notificationPreferences.deliveryMethods.title')}</h3>
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label htmlFor='email-enabled'>{t('notificationPreferences.deliveryMethods.email.label')}</Label>
                <p className='text-sm text-muted-foreground'>
                  {t('notificationPreferences.deliveryMethods.email.description')}
                </p>
              </div>
              <Switch
                id='email-enabled'
                checked={preferences.emailEnabled}
                onCheckedChange={(checked) => handleToggle('emailEnabled', checked)}
                disabled={updateMutation.isPending}
                aria-label={t('notificationPreferences.deliveryMethods.email.ariaLabel')}
              />
            </div>
            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label htmlFor='in-app-enabled'>{t('notificationPreferences.deliveryMethods.inApp.label')}</Label>
                <p className='text-sm text-muted-foreground'>
                  {t('notificationPreferences.deliveryMethods.inApp.description')}
                </p>
              </div>
              <Switch
                id='in-app-enabled'
                checked={preferences.inAppEnabled}
                onCheckedChange={(checked) => handleToggle('inAppEnabled', checked)}
                disabled={updateMutation.isPending}
                aria-label={t('notificationPreferences.deliveryMethods.inApp.ariaLabel')}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Notification Types */}
        <div className='space-y-4'>
          <h3 className='text-sm font-medium'>{t('notificationPreferences.types.title')}</h3>
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label htmlFor='status-change'>{t('notificationPreferences.types.statusChange.label')}</Label>
                <p className='text-sm text-muted-foreground'>
                  {t('notificationPreferences.types.statusChange.description')}
                </p>
              </div>
              <Switch
                id='status-change'
                checked={preferences.notifyOnStatusChange}
                onCheckedChange={(checked) => handleToggle('notifyOnStatusChange', checked)}
                disabled={updateMutation.isPending}
                aria-label={t('notificationPreferences.types.statusChange.ariaLabel')}
              />
            </div>
            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label htmlFor='peer-review'>{t('notificationPreferences.types.peerReview.label')}</Label>
                <p className='text-sm text-muted-foreground'>
                  {t('notificationPreferences.types.peerReview.description')}
                </p>
              </div>
              <Switch
                id='peer-review'
                checked={preferences.notifyOnPeerReview}
                onCheckedChange={(checked) => handleToggle('notifyOnPeerReview', checked)}
                disabled={updateMutation.isPending}
                aria-label={t('notificationPreferences.types.peerReview.ariaLabel')}
              />
            </div>
            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label htmlFor='message'>{t('notificationPreferences.types.message.label')}</Label>
                <p className='text-sm text-muted-foreground'>
                  {t('notificationPreferences.types.message.description')}
                </p>
              </div>
              <Switch
                id='message'
                checked={preferences.notifyOnMessage}
                onCheckedChange={(checked) => handleToggle('notifyOnMessage', checked)}
                disabled={updateMutation.isPending}
                aria-label={t('notificationPreferences.types.message.ariaLabel')}
              />
            </div>
            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label htmlFor='deadline'>{t('notificationPreferences.types.deadline.label')}</Label>
                <p className='text-sm text-muted-foreground'>
                  {t('notificationPreferences.types.deadline.description')}
                </p>
              </div>
              <Switch
                id='deadline'
                checked={preferences.notifyOnDeadline}
                onCheckedChange={(checked) => handleToggle('notifyOnDeadline', checked)}
                disabled={updateMutation.isPending}
                aria-label={t('notificationPreferences.types.deadline.ariaLabel')}
              />
            </div>
            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label htmlFor='comment'>{t('notificationPreferences.types.comment.label')}</Label>
                <p className='text-sm text-muted-foreground'>
                  {t('notificationPreferences.types.comment.description')}
                </p>
              </div>
              <Switch
                id='comment'
                checked={preferences.notifyOnComment}
                onCheckedChange={(checked) => handleToggle('notifyOnComment', checked)}
                disabled={updateMutation.isPending}
                aria-label={t('notificationPreferences.types.comment.ariaLabel')}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Deadline Reminder Timing */}
        <div className='space-y-4'>
          <h3 className='text-sm font-medium'>{t('notificationPreferences.timing.title')}</h3>
          <div className='flex items-center gap-4'>
            <Label htmlFor='deadline-days' className='whitespace-nowrap'>
              {t('notificationPreferences.timing.remindMe')}
            </Label>
            <Select
              value={preferences.deadlineReminderDays.toString()}
              onValueChange={handleDeadlineReminderChange}
              disabled={updateMutation.isPending || !preferences.notifyOnDeadline}
            >
              <SelectTrigger id='deadline-days' className='w-[180px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='1'>{t('notificationPreferences.timing.daysBefore', { count: 1 })}</SelectItem>
                <SelectItem value='2'>{t('notificationPreferences.timing.daysBefore', { count: 2 })}</SelectItem>
                <SelectItem value='3'>{t('notificationPreferences.timing.daysBefore', { count: 3 })}</SelectItem>
                <SelectItem value='5'>{t('notificationPreferences.timing.daysBefore', { count: 5 })}</SelectItem>
                <SelectItem value='7'>{t('notificationPreferences.timing.daysBefore', { count: 7 })}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
