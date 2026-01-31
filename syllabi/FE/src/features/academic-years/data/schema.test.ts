import { describe, expect, it } from 'vitest'
import {
  AcademicYearStatus,
  academicYearCodeSchema,
  dateRangeSchema,
  academicYearFormSchema,
} from './schema'

describe('Academic Year Schema Validation', () => {
  describe('academicYearCodeSchema', () => {
    it('should accept valid academic year codes', () => {
      const validCodes = ['2024-2025', '2025-2026', '2030-2031']

      validCodes.forEach((code) => {
        const result = academicYearCodeSchema.safeParse(code)
        expect(result.success).toBe(true)
      })
    })

    it('should reject codes with invalid format', () => {
      const invalidCodes = ['2025', '25-26', '2025/2026', 'abc-def']

      invalidCodes.forEach((code) => {
        const result = academicYearCodeSchema.safeParse(code)
        expect(result.success).toBe(false)
      })
    })

    it('should reject codes where second year is not first year plus one', () => {
      const invalidCodes = ['2025-2025', '2025-2027', '2025-2024']

      invalidCodes.forEach((code) => {
        const result = academicYearCodeSchema.safeParse(code)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain(
            'Năm kết thúc phải bằng năm bắt đầu cộng 1'
          )
        }
      })
    })
  })

  describe('dateRangeSchema', () => {
    it('should accept valid date ranges where end date is after start date', () => {
      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-12-31')

      const result = dateRangeSchema.safeParse({ startDate, endDate })
      expect(result.success).toBe(true)
    })

    it('should reject date ranges where end date is before start date', () => {
      const startDate = new Date('2025-12-31')
      const endDate = new Date('2025-01-01')

      const result = dateRangeSchema.safeParse({ startDate, endDate })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Ngày kết thúc phải sau ngày bắt đầu'
        )
      }
    })

    it('should reject date ranges where end date equals start date', () => {
      const date = new Date('2025-06-15')

      const result = dateRangeSchema.safeParse({
        startDate: date,
        endDate: date,
      })
      expect(result.success).toBe(false)
    })

    it('should require both start and end dates', () => {
      const resultNoStart = dateRangeSchema.safeParse({ endDate: new Date() })
      expect(resultNoStart.success).toBe(false)

      const resultNoEnd = dateRangeSchema.safeParse({ startDate: new Date() })
      expect(resultNoEnd.success).toBe(false)
    })
  })

  describe('academicYearFormSchema', () => {
    it('should accept valid form data', () => {
      const validData = {
        code: '2025-2026',
        name: 'Năm học 2025-2026',
        startDate: new Date('2025-09-01'),
        endDate: new Date('2026-06-30'),
        status: AcademicYearStatus.ACTIVE,
      }

      const result = academicYearFormSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept form data without optional name', () => {
      const validData = {
        code: '2025-2026',
        startDate: new Date('2025-09-01'),
        endDate: new Date('2026-06-30'),
      }

      const result = academicYearFormSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should default status to ACTIVE when not provided', () => {
      const validData = {
        code: '2025-2026',
        startDate: new Date('2025-09-01'),
        endDate: new Date('2026-06-30'),
      }

      const result = academicYearFormSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe(AcademicYearStatus.ACTIVE)
      }
    })

    it('should reject form data with invalid code', () => {
      const invalidData = {
        code: '2025-2027',
        startDate: new Date('2025-09-01'),
        endDate: new Date('2026-06-30'),
      }

      const result = academicYearFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject form data with invalid date range', () => {
      const invalidData = {
        code: '2025-2026',
        startDate: new Date('2026-06-30'),
        endDate: new Date('2025-09-01'),
      }

      const result = academicYearFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject form data with missing required fields', () => {
      const invalidData = {
        code: '2025-2026',
      }

      const result = academicYearFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
