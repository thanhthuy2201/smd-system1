import { createFileRoute } from '@tanstack/react-router'
import { requireAuthAndRole } from '@/lib/route-guards'
import AcademicYearAdd from '@/features/academic-years/add'

export const Route = createFileRoute('/_authenticated/academic-years/add')({
  beforeLoad: () => {
    // Require Academic Manager or Admin role to add academic years
    requireAuthAndRole(['ACADEMIC_MANAGER', 'ADMIN'])
  },
  component: AcademicYearAdd,
})
