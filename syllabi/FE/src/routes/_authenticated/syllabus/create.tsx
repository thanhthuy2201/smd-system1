import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { SyllabusWizard } from '@/features/lecturer/syllabi/components/SyllabusWizard'
import type { Syllabus } from '@/features/lecturer/types'

function CreateSyllabusPage() {
  const navigate = useNavigate()

  const handleComplete = (syllabus: Syllabus) => {
    console.log('Syllabus created:', syllabus)
    // Navigate to the syllabus list or view page
    navigate({ to: '/syllabus' })
  }

  const handleCancel = () => {
    // Navigate back to syllabus list
    navigate({ to: '/syllabus' })
  }

  return <SyllabusWizard onComplete={handleComplete} onCancel={handleCancel} />
}

export const Route = createFileRoute('/_authenticated/syllabus/create')({
  component: CreateSyllabusPage,
})
