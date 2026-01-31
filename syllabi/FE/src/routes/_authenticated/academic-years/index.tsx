import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { requireAuthAndRole } from '@/lib/route-guards'
import { AcademicYears } from '@/features/academic-years'
import { AcademicYearStatus } from '@/features/academic-years/data/schema'

/**
 * Search schema for academic years list route
 * Defines URL query parameters for pagination, search, and filtering
 */
const academicYearsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  search: z.string().optional().catch(''),
  status: z
    .enum([AcademicYearStatus.ACTIVE, AcademicYearStatus.DISABLED, 'ALL'])
    .optional()
    .catch('ALL'),
})

export const Route = createFileRoute('/_authenticated/academic-years/')({
  beforeLoad: () => {
    // Require Academic Manager or Admin role to view academic years
    requireAuthAndRole(['ACADEMIC_MANAGER', 'ADMIN'])
  },
  validateSearch: academicYearsSearchSchema,
  component: AcademicYears,
})
