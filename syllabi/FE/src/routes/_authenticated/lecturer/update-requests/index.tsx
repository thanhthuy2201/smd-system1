import { createFileRoute } from '@tanstack/react-router'
import { LecturerLayout } from '@/features/lecturer/components/LecturerLayout'

/**
 * Update Requests List Page
 *
 * Displays all update requests for approved syllabi.
 * Shows request status and allows creating new requests.
 */
function UpdateRequestsListPage() {
  return (
    <LecturerLayout
      title='Update Requests'
      description='Request updates to approved syllabi'
    >
      {/* TODO: Implement UpdateRequestsList component */}
      <div className='rounded-lg border p-8 text-center'>
        <p className='text-muted-foreground'>
          Update requests list will be displayed here
        </p>
      </div>
    </LecturerLayout>
  )
}

export const Route = createFileRoute(
  '/_authenticated/lecturer/update-requests/'
)({
  component: UpdateRequestsListPage,
})
