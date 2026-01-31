import { createFileRoute } from '@tanstack/react-router'
import { LecturerLayout } from '@/features/lecturer/components/LecturerLayout'
import { ConversationThread } from '@/features/lecturer/messaging'

/**
 * Conversation Thread Page
 *
 * Displays message history with a specific contact.
 * Allows replying and viewing attachments.
 */
function ConversationThreadPage() {
  const { userId } = Route.useParams()
  const userIdNumber = parseInt(userId, 10)

  return (
    <LecturerLayout
      title='Conversation'
      description={`Message thread with user ID: ${userId}`}
    >
      <ConversationThread userId={userIdNumber} />
    </LecturerLayout>
  )
}

export const Route = createFileRoute(
  '/_authenticated/lecturer/messages/conversation/$userId'
)({
  component: ConversationThreadPage,
})
