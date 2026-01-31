import { createFileRoute } from '@tanstack/react-router'
import SyllabusViewPage from '@/features/syllabus/view'

export const Route = createFileRoute('/_authenticated/syllabus/view/$id')({
  component: SyllabusViewPage,
})
