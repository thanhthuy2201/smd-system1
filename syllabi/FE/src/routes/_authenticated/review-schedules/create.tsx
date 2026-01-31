import { createFileRoute } from '@tanstack/react-router'
import { requireAuthAndRole } from '@/lib/route-guards'
import ReviewScheduleCreate from '@/features/review-schedules/create'

export const Route = createFileRoute('/_authenticated/review-schedules/create')(
  {
    beforeLoad: () => {
      // Require Academic Manager or Admin role to create review schedules (Requirement 2.1)
      requireAuthAndRole(['ACADEMIC_MANAGER', 'ADMIN'])
    },
    component: ReviewScheduleCreate,
  }
)
