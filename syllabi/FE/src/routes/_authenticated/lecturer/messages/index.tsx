import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LecturerLayout } from '@/features/lecturer/components/LecturerLayout'
import { MessageInbox } from '@/features/lecturer/messaging'

/**
 * Messages Inbox Page
 *
 * Displays message inbox with unread indicators.
 * Allows filtering and searching messages.
 */
function MessagesInboxPage() {
  const navigate = useNavigate()

  const handleCompose = () => {
    navigate({ to: '/lecturer/messages/compose' })
  }

  return (
    <LecturerLayout
      title='Messages'
      description='Communicate with academic staff and reviewers'
      actions={
        <Button onClick={handleCompose} size='lg'>
          <Plus className='h-4 w-4' />
          Compose Message
        </Button>
      }
    >
      <MessageInbox />
    </LecturerLayout>
  )
}

export const Route = createFileRoute('/_authenticated/lecturer/messages/')({
  component: MessagesInboxPage,
})
