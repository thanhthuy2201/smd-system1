import { createFileRoute } from '@tanstack/react-router'
import { LecturerLayout } from '@/features/lecturer/components/LecturerLayout'

/**
 * Peer Review Evaluation Page
 *
 * Evaluate a specific syllabus using standardized criteria.
 * Includes rubric guide and evaluation form.
 */
function PeerReviewEvaluationPage() {
  const { id } = Route.useParams()

  return (
    <LecturerLayout
      title='Evaluate Syllabus'
      description={`Reviewing syllabus ID: ${id}`}
    >
      {/* TODO: Implement SyllabusViewer, EvaluationForm, and RubricGuide components */}
      <div className='grid gap-4 lg:grid-cols-3'>
        <div className='lg:col-span-2'>
          <div className='rounded-lg border p-8 text-center'>
            <p className='text-muted-foreground'>
              Syllabus viewer and evaluation form will be displayed here
            </p>
          </div>
        </div>
        <div className='lg:col-span-1'>
          <div className='rounded-lg border p-8 text-center'>
            <p className='text-muted-foreground'>
              Rubric guide will be displayed here
            </p>
          </div>
        </div>
      </div>
    </LecturerLayout>
  )
}

export const Route = createFileRoute(
  '/_authenticated/lecturer/reviews/peer-reviews/$id'
)({
  component: PeerReviewEvaluationPage,
})
