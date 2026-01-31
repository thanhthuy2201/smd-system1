import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LecturerLayout } from '@/features/lecturer/components/LecturerLayout'
import { SyllabiList } from '@/features/lecturer/syllabi/components/SyllabiList'

/**
 * Lecturer Syllabi List Page
 *
 * Main page for lecturers to view and manage their syllabi.
 * Displays a data table with search, filter, and action capabilities.
 */
function LecturerSyllabiPage() {
  const navigate = useNavigate()

  const handleCreateNew = () => {
    navigate({ to: '/lecturer/syllabi/create' })
  }

  return (
    <LecturerLayout
      title='My Syllabi'
      description='Manage your course syllabi and track their approval status'
      actions={
        <Button onClick={handleCreateNew} size='lg'>
          <Plus className='h-4 w-4' />
          Create New Syllabus
        </Button>
      }
    >
      <SyllabiList />
    </LecturerLayout>
  )
}

export const Route = createFileRoute('/_authenticated/lecturer/syllabi/')({
  component: LecturerSyllabiPage,
})
