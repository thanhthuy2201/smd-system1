import { createFileRoute } from '@tanstack/react-router'
import SyllabusEditPage from '@/features/syllabus/edit'

export const Route = createFileRoute('/_authenticated/syllabus/edit/$id')({
  component: SyllabusEditPage,
})
