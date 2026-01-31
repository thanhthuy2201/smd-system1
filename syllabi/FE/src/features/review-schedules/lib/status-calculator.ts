import { ReviewScheduleStatus } from '../data/schema'

/**
 * Calculate review schedule status based on dates and progress
 *
 * Status calculation logic:
 * - UPCOMING: Before review start date
 * - ACTIVE: Between start and final approval date
 * - COMPLETED: After final approval date with all reviews done (pendingCount === 0)
 * - OVERDUE: After final approval date with pending reviews (pendingCount > 0)
 *
 * Validates Requirement 10.6
 *
 * @param reviewStartDate - The date when review period starts
 * @param finalApprovalDate - The final deadline for all approvals
 * @param pendingCount - Number of pending reviews
 * @returns The calculated status
 */
export function calculateScheduleStatus(
  reviewStartDate: Date,
  finalApprovalDate: Date,
  pendingCount: number
): ReviewScheduleStatus {
  const now = new Date()

  // Reset time to midnight for accurate date comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startDate = new Date(
    reviewStartDate.getFullYear(),
    reviewStartDate.getMonth(),
    reviewStartDate.getDate()
  )
  const finalDate = new Date(
    finalApprovalDate.getFullYear(),
    finalApprovalDate.getMonth(),
    finalApprovalDate.getDate()
  )

  // UPCOMING: Before review start date
  if (today < startDate) {
    return ReviewScheduleStatus.UPCOMING
  }

  // OVERDUE or COMPLETED: After final approval date
  if (today > finalDate) {
    // OVERDUE: Past final approval date with pending reviews
    if (pendingCount > 0) {
      return ReviewScheduleStatus.OVERDUE
    }
    // COMPLETED: Past final approval date with all reviews done
    return ReviewScheduleStatus.COMPLETED
  }

  // ACTIVE: Between start and final approval date
  return ReviewScheduleStatus.ACTIVE
}

/**
 * Calculate status for a review schedule object
 * Convenience wrapper for calculateScheduleStatus
 *
 * @param schedule - Review schedule object with dates and progress
 * @returns The calculated status
 */
export function calculateScheduleStatusFromObject(schedule: {
  reviewStartDate: Date
  finalApprovalDate: Date
  pendingCount: number
}): ReviewScheduleStatus {
  return calculateScheduleStatus(
    schedule.reviewStartDate,
    schedule.finalApprovalDate,
    schedule.pendingCount
  )
}
