import { createFileRoute } from '@tanstack/react-router'
import { requireAuthAndRole } from '@/lib/route-guards'
import ReviewScheduleEdit from '@/features/review-schedules/edit'

export const Route = createFileRoute(
  '/_authenticated/review-schedules/edit/$id'
)({
  beforeLoad: () => {
    // Require Academic Manager or Admin role to edit review schedules (Requirement 6.1)
    requireAuthAndRole(['ACADEMIC_MANAGER', 'ADMIN'])
  },
  component: ReviewScheduleEdit,
})
