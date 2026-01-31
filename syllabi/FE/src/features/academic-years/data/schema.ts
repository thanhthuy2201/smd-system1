import { z } from 'zod'

/**
 * Academic Year Status Enum
 * Represents the operational state of an academic year
 */
export enum AcademicYearStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
}

/**
 * Zod schema for Academic Year Status
 */
export const academicYearStatusSchema = z.nativeEnum(AcademicYearStatus)

/**
 * Academic Year Code validation schema
 * Format: YYYY-YYYY where the second year equals the first year plus one
 * Example: 2025-2026
 *
 * Validates Requirements 3.1, 3.2
 */
export const academicYearCodeSchema = z
  .string()
  .regex(/^\d{4}-\d{4}$/, 'Mã năm học phải có định dạng YYYY-YYYY')
  .refine(
    (code) => {
      const [startYear, endYear] = code.split('-').map(Number)
      return endYear === startYear + 1
    },
    { message: 'Năm kết thúc phải bằng năm bắt đầu cộng 1' }
  )

/**
 * Date range validation schema
 * Ensures end date is after start date
 *
 * Validates Requirement 4.1
 */
export const dateRangeSchema = z
  .object({
    startDate: z.date({ message: 'Ngày bắt đầu là bắt buộc' }),
    endDate: z.date({ message: 'Ngày kết thúc là bắt buộc' }),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'Ngày kết thúc phải sau ngày bắt đầu',
    path: ['endDate'],
  })

/**
 * Complete Academic Year form validation schema
 * Used for both create and update operations
 *
 * Validates Requirements 3.1, 3.2, 4.1
 */
export const academicYearFormSchema = z
  .object({
    code: academicYearCodeSchema,
    name: z.string().optional(),
    startDate: z.date({ message: 'Ngày bắt đầu là bắt buộc' }),
    endDate: z.date({ message: 'Ngày kết thúc là bắt buộc' }),
    status: academicYearStatusSchema,
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'Ngày kết thúc phải sau ngày bắt đầu',
    path: ['endDate'],
  })

/**
 * Academic Year form input type
 * Inferred from the form schema
 */
export type AcademicYearFormInput = z.infer<typeof academicYearFormSchema>

/**
 * Core Academic Year type
 * Represents a complete academic year record from the database
 */
export const academicYearSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: academicYearStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type AcademicYear = z.infer<typeof academicYearSchema>

/**
 * Academic Year list schema
 * Used for validating arrays of academic years
 */
export const academicYearListSchema = z.array(academicYearSchema)

/**
 * API response types
 */

/**
 * List response with pagination metadata
 */
export interface AcademicYearsListResponse {
  data: AcademicYear[]
  total: number
  page: number
  pageSize: number
}

/**
 * Single academic year detail response
 */
export interface AcademicYearDetailResponse {
  data: AcademicYear
}

/**
 * Query parameters for listing academic years
 */
export interface AcademicYearsQueryParams {
  page?: number
  pageSize?: number
  search?: string
  status?: AcademicYearStatus | 'ALL'
  sortBy?: 'startDate' | 'code' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Code uniqueness check response
 */
export interface CodeUniquenessResponse {
  isUnique: boolean
}
