import { createFileRoute } from '@tanstack/react-router'
import { LecturerLayout } from '@/features/lecturer/components/LecturerLayout'

/**
 * Edit Syllabus Page
 *
 * Edit an existing syllabus with status-based access control.
 * Shows revision feedback panel when applicable.
 */
function EditSyllabusPage() {
  const { id } = Route.useParams()

  return (
    <LecturerLayout
      title='Edit Syllabus'
      description={`Editing syllabus ID: ${id}`}
    >
      {/* TODO: Implement SyllabusEditor component */}
      <div className='rounded-lg border p-8 text-center'>
        <p className='text-muted-foreground'>
          Syllabus editor will be implemented here
        </p>
      </div>
    </LecturerLayout>
  )
}

export const Route = createFileRoute(
  '/_authenticated/lecturer/syllabi/$id/edit'
)({
  component: EditSyllabusPage,
})
