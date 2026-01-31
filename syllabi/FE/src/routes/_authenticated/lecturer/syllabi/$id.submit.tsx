import { createFileRoute } from '@tanstack/react-router'
import { LecturerLayout } from '@/features/lecturer/components/LecturerLayout'

/**
 * Submit Syllabus Page
 *
 * Submission workflow with validation checklist and confirmation.
 * Validates all requirements before allowing submission.
 */
function SubmitSyllabusPage() {
  const { id } = Route.useParams()

  return (
    <LecturerLayout
      title='Submit Syllabus for Review'
      description={`Review validation checklist before submitting syllabus ID: ${id}`}
    >
      {/* TODO: Implement SubmissionChecklist and SubmissionConfirmation components */}
      <div className='rounded-lg border p-8 text-center'>
        <p className='text-muted-foreground'>
          Submission workflow will be implemented here
        </p>
      </div>
    </LecturerLayout>
  )
}

export const Route = createFileRoute(
  '/_authenticated/lecturer/syllabi/$id/submit'
)({
  component: SubmitSyllabusPage,
})
