import { createFileRoute } from '@tanstack/react-router'
import { LecturerLayout } from '@/features/lecturer/components/LecturerLayout'

/**
 * Create Syllabus Page
 *
 * Multi-step wizard for creating a new syllabus.
 * Includes auto-save functionality and validation.
 */
function CreateSyllabusPage() {
  return (
    <LecturerLayout
      title='Create New Syllabus'
      description='Follow the steps to create a comprehensive course syllabus'
    >
      {/* TODO: Implement SyllabusWizard component */}
      <div className='rounded-lg border p-8 text-center'>
        <p className='text-muted-foreground'>
          Syllabus creation wizard will be implemented here
        </p>
      </div>
    </LecturerLayout>
  )
}

export const Route = createFileRoute('/_authenticated/lecturer/syllabi/create')(
  {
    component: CreateSyllabusPage,
  }
)
