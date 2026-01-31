import { createFileRoute } from '@tanstack/react-router'
import LecturerSyllabiPage from '@/features/lecturer/syllabi'

export const Route = createFileRoute('/_authenticated/syllabus/')({
  component: LecturerSyllabiPage,
})
