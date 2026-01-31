import { createFileRoute } from '@tanstack/react-router'
import { LecturerLayout } from '@/features/lecturer/components/LecturerLayout'
import { ComposeMessage } from '@/features/lecturer/messaging'

/**
 * Compose Message Page
 *
 * Form for composing a new message with:
 * - Recipient autocomplete
 * - Subject and body inputs
 * - File attachments
 * - Optional syllabus reference
 */
function ComposeMessagePage() {
  return (
    <LecturerLayout
      title='Compose Message'
      description='Send a message to academic staff or reviewers'
    >
      <ComposeMessage />
    </LecturerLayout>
  )
}

export const Route = createFileRoute(
  '/_authenticated/lecturer/messages/compose'
)({
  component: ComposeMessagePage,
})
