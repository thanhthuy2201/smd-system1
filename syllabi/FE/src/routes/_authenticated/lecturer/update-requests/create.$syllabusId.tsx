import { createFileRoute } from '@tanstack/react-router'
import { LecturerLayout } from '@/features/lecturer/components/LecturerLayout'
import { UpdateRequestForm } from '@/features/lecturer/update-requests'

/**
 * Create Update Request Page
 *
 * Form for creating an update request for an approved syllabus.
 * Includes change type, justification, and draft changes editor.
 */
function CreateUpdateRequestPage() {
  const { syllabusId } = Route.useParams()
  const syllabusIdNumber = parseInt(syllabusId, 10)

  // TODO: Fetch approved syllabi from API
  const approvedSyllabi: any[] = []

  const handleSubmit = async (_data: any) => {
    // TODO: Implement submission logic
  }

  return (
    <LecturerLayout
      title='Create Update Request'
      description={`Request changes to approved syllabus ID: ${syllabusId}`}
    >
      <UpdateRequestForm
        approvedSyllabi={approvedSyllabi}
        defaultSyllabusId={syllabusIdNumber}
        onSubmit={handleSubmit}
      />
    </LecturerLayout>
  )
}

export const Route = createFileRoute(
  '/_authenticated/lecturer/update-requests/create/$syllabusId'
)({
  component: CreateUpdateRequestPage,
})
