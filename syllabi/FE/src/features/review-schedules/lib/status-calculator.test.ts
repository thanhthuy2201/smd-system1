import { describe, it, expect } from 'vitest'
import { ReviewScheduleStatus } from '../data/schema'
import { calculateScheduleStatus } from './status-calculator'

describe('calculateScheduleStatus', () => {
  describe('UPCOMING status', () => {
    it('should return UPCOMING when current date is before review start date', () => {
      const reviewStartDate = new Date()
      reviewStartDate.setDate(reviewStartDate.getDate() + 10) // 10 days in future

      const finalApprovalDate = new Date(reviewStartDate)
      finalApprovalDate.setDate(finalApprovalDate.getDate() + 30) // 30 days after start

      const pendingCount = 50

      const status = calculateScheduleStatus(
        reviewStartDate,
        finalApprovalDate,
        pendingCount
      )

      expect(status).toBe(ReviewScheduleStatus.UPCOMING)
    })

    it('should return UPCOMING even with zero pending reviews if before start date', () => {
      const reviewStartDate = new Date()
      reviewStartDate.setDate(reviewStartDate.getDate() + 5)

      const finalApprovalDate = new Date(reviewStartDate)
      finalApprovalDate.setDate(finalApprovalDate.getDate() + 30)

      const pendingCount = 0

      const status = calculateScheduleStatus(
        reviewStartDate,
        finalApprovalDate,
        pendingCount
      )

      expect(status).toBe(ReviewScheduleStatus.UPCOMING)
    })
  })

  describe('ACTIVE status', () => {
    it('should return ACTIVE when current date is between start and final approval dates', () => {
      const reviewStartDate = new Date()
      reviewStartDate.setDate(reviewStartDate.getDate() - 5) // 5 days ago

      const finalApprovalDate = new Date()
      finalApprovalDate.setDate(finalApprovalDate.getDate() + 10) // 10 days in future

      const pendingCount = 20

      const status = calculateScheduleStatus(
        reviewStartDate,
        finalApprovalDate,
        pendingCount
      )

      expect(status).toBe(ReviewScheduleStatus.ACTIVE)
    })

    it('should return ACTIVE even with zero pending if within date range', () => {
      const reviewStartDate = new Date()
      reviewStartDate.setDate(reviewStartDate.getDate() - 10)

      const finalApprovalDate = new Date()
      finalApprovalDate.setDate(finalApprovalDate.getDate() + 5)

      const pendingCount = 0

      const status = calculateScheduleStatus(
        reviewStartDate,
        finalApprovalDate,
        pendingCount
      )

      expect(status).toBe(ReviewScheduleStatus.ACTIVE)
    })
  })

  describe('COMPLETED status', () => {
    it('should return COMPLETED when after final approval date with no pending reviews', () => {
      const reviewStartDate = new Date()
      reviewStartDate.setDate(reviewStartDate.getDate() - 30) // 30 days ago

      const finalApprovalDate = new Date()
      finalApprovalDate.setDate(finalApprovalDate.getDate() - 5) // 5 days ago

      const pendingCount = 0

      const status = calculateScheduleStatus(
        reviewStartDate,
        finalApprovalDate,
        pendingCount
      )

      expect(status).toBe(ReviewScheduleStatus.COMPLETED)
    })

    it('should return COMPLETED when well past final date with zero pending', () => {
      const reviewStartDate = new Date()
      reviewStartDate.setDate(reviewStartDate.getDate() - 60)

      const finalApprovalDate = new Date()
      finalApprovalDate.setDate(finalApprovalDate.getDate() - 30)

      const pendingCount = 0

      const status = calculateScheduleStatus(
        reviewStartDate,
        finalApprovalDate,
        pendingCount
      )

      expect(status).toBe(ReviewScheduleStatus.COMPLETED)
    })
  })

  describe('OVERDUE status', () => {
    it('should return OVERDUE when after final approval date with pending reviews', () => {
      const reviewStartDate = new Date()
      reviewStartDate.setDate(reviewStartDate.getDate() - 30)

      const finalApprovalDate = new Date()
      finalApprovalDate.setDate(finalApprovalDate.getDate() - 5)

      const pendingCount = 10

      const status = calculateScheduleStatus(
        reviewStartDate,
        finalApprovalDate,
        pendingCount
      )

      expect(status).toBe(ReviewScheduleStatus.OVERDUE)
    })

    it('should return OVERDUE even with just one pending review', () => {
      const reviewStartDate = new Date()
      reviewStartDate.setDate(reviewStartDate.getDate() - 40)

      const finalApprovalDate = new Date()
      finalApprovalDate.setDate(finalApprovalDate.getDate() - 10)

      const pendingCount = 1

      const status = calculateScheduleStatus(
        reviewStartDate,
        finalApprovalDate,
        pendingCount
      )

      expect(status).toBe(ReviewScheduleStatus.OVERDUE)
    })
  })

  describe('Edge cases', () => {
    it('should handle same-day start date correctly', () => {
      const reviewStartDate = new Date()
      reviewStartDate.setHours(0, 0, 0, 0) // Today at midnight

      const finalApprovalDate = new Date(reviewStartDate)
      finalApprovalDate.setDate(finalApprovalDate.getDate() + 20)

      const pendingCount = 15

      const status = calculateScheduleStatus(
        reviewStartDate,
        finalApprovalDate,
        pendingCount
      )

      expect(status).toBe(ReviewScheduleStatus.ACTIVE)
    })

    it('should handle same-day final approval date correctly with pending', () => {
      const reviewStartDate = new Date()
      reviewStartDate.setDate(reviewStartDate.getDate() - 20)

      const finalApprovalDate = new Date()
      finalApprovalDate.setHours(0, 0, 0, 0) // Today at midnight

      const pendingCount = 5

      const status = calculateScheduleStatus(
        reviewStartDate,
        finalApprovalDate,
        pendingCount
      )

      // Today is not after final date, so should be ACTIVE
      expect(status).toBe(ReviewScheduleStatus.ACTIVE)
    })

    it('should handle same-day final approval date correctly without pending', () => {
      const reviewStartDate = new Date()
      reviewStartDate.setDate(reviewStartDate.getDate() - 20)

      const finalApprovalDate = new Date()
      finalApprovalDate.setHours(0, 0, 0, 0)

      const pendingCount = 0

      const status = calculateScheduleStatus(
        reviewStartDate,
        finalApprovalDate,
        pendingCount
      )

      expect(status).toBe(ReviewScheduleStatus.ACTIVE)
    })
  })

  describe('Date normalization', () => {
    it('should ignore time components when comparing dates', () => {
      const reviewStartDate = new Date()
      reviewStartDate.setDate(reviewStartDate.getDate() - 10)
      reviewStartDate.setHours(23, 59, 59, 999) // Late in the day

      const finalApprovalDate = new Date()
      finalApprovalDate.setDate(finalApprovalDate.getDate() + 10)
      finalApprovalDate.setHours(0, 0, 0, 0) // Early in the day

      const pendingCount = 10

      const status = calculateScheduleStatus(
        reviewStartDate,
        finalApprovalDate,
        pendingCount
      )

      expect(status).toBe(ReviewScheduleStatus.ACTIVE)
    })
  })
})
