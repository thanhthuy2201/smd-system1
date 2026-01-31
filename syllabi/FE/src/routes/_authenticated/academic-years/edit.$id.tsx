import { createFileRoute } from '@tanstack/react-router'
import { requireAuthAndRole } from '@/lib/route-guards'
import AcademicYearEdit from '@/features/academic-years/edit'

export const Route = createFileRoute('/_authenticated/academic-years/edit/$id')(
  {
    beforeLoad: () => {
      // Require Academic Manager or Admin role to edit academic years
      requireAuthAndRole(['ACADEMIC_MANAGER', 'ADMIN'])
    },
    component: AcademicYearEdit,
  }
)
