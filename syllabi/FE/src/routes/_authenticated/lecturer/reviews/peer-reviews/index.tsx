import { createFileRoute } from '@tanstack/react-router'
import { LecturerLayout } from '@/features/lecturer/components/LecturerLayout'

/**
 * Peer Review Queue Page
 *
 * Displays syllabi assigned to the lecturer for peer review.
 * Shows review status and links to evaluation forms.
 */
function PeerReviewQueuePage() {
  return (
    <LecturerLayout
      title='Peer Review Queue'
      description='Syllabi assigned to you for peer evaluation'
    >
      {/* TODO: Implement PeerReviewQueue component */}
      <div className='rounded-lg border p-8 text-center'>
        <p className='text-muted-foreground'>
          Peer review queue will be displayed here
        </p>
      </div>
    </LecturerLayout>
  )
}

export const Route = createFileRoute(
  '/_authenticated/lecturer/reviews/peer-reviews/'
)({
  component: PeerReviewQueuePage,
})
