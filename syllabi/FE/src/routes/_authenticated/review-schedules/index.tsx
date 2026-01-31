import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { requireAuthAndRole } from '@/lib/route-guards'
import { ReviewSchedules } from '@/features/review-schedules'

const reviewSchedulesSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  search: z.string().optional().catch(''),
  status: z
    .enum(['UPCOMING', 'ACTIVE', 'COMPLETED', 'OVERDUE', 'ALL'])
    .optional()
    .catch('ALL'),
  semesterId: z.string().optional().catch('ALL'),
  academicYear: z.string().optional().catch('ALL'),
})

export const Route = createFileRoute('/_authenticated/review-schedules/')({
  beforeLoad: () => {
    // Require Academic Manager or Admin role to access review schedules (Requirement 1.1)
    requireAuthAndRole(['ACADEMIC_MANAGER', 'ADMIN'])
  },
  validateSearch: reviewSchedulesSearchSchema,
  component: ReviewSchedules,
})
