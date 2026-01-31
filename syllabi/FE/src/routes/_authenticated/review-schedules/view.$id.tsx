import { createFileRoute } from '@tanstack/react-router'
import { requireAuthAndRole } from '@/lib/route-guards'
import ReviewScheduleDetail from '@/features/review-schedules/detail'

export const Route = createFileRoute(
  '/_authenticated/review-schedules/view/$id'
)({
  beforeLoad: () => {
    // Require Academic Manager or Admin role to view review schedule details (Requirement 8.1)
    requireAuthAndRole(['ACADEMIC_MANAGER', 'ADMIN'])
  },
  component: ReviewScheduleDetail,
})
