import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { SyllabusEditor } from '@/features/lecturer/syllabi/components/SyllabusEditor'
import type { Syllabus } from '@/features/lecturer/types'

function EditSyllabusPage() {
  const navigate = useNavigate()
  const { id } = useParams({ from: '/_authenticated/syllabus/$id/edit' })
  const syllabusId = parseInt(id, 10)

  const handleComplete = (syllabus: Syllabus) => {
    console.log('Syllabus updated:', syllabus)
    // Navigate to the syllabus list or view page
    navigate({ to: '/syllabus' })
  }

  const handleCancel = () => {
    // Navigate back to syllabus list
    navigate({ to: '/syllabus' })
  }

  return (
    <SyllabusEditor
      syllabusId={syllabusId}
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  )
}

export const Route = createFileRoute('/_authenticated/syllabus/$id/edit')({
  component: EditSyllabusPage,
})
