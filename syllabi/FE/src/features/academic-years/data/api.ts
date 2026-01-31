import { faker } from '@faker-js/faker'
import {
  type AcademicYear,
  type AcademicYearDetailResponse,
  type AcademicYearFormInput,
  type AcademicYearsListResponse,
  type AcademicYearsQueryParams,
  AcademicYearStatus,
  type CodeUniquenessResponse,
} from './schema'

// Set a fixed seed for consistent data generation
faker.seed(54321)

// Generate mock academic years data
const generateMockAcademicYears = (): AcademicYear[] => {
  const academicYears: AcademicYear[] = []
  const currentYear = new Date().getFullYear()

  // Generate academic years from 5 years ago to 3 years in the future
  for (let i = -5; i <= 3; i++) {
    const startYear = currentYear + i
    const endYear = startYear + 1
    const code = `${startYear}-${endYear}`

    const startDate = new Date(startYear, 8, 1) // September 1st
    const endDate = new Date(endYear, 5, 30) // June 30th

    academicYears.push({
      id: faker.string.uuid(),
      code,
      name: `Năm học ${code}`,
      startDate,
      endDate,
      status:
        i >= -1 && i <= 1
          ? AcademicYearStatus.ACTIVE
          : AcademicYearStatus.DISABLED,
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent({ days: 30 }),
    })
  }

  return academicYears
}

// In-memory data store
const mockData: AcademicYear[] = generateMockAcademicYears()

/**
 * Simulate network delay for realistic API behavior
 */
const delay = (ms: number = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms))

/**
 * API Client for Academic Years
 * This is a mock implementation that simulates API calls with in-memory data
 * In a real application, replace these with actual HTTP requests using axios
 */
export const academicYearsApi = {
  /**
   * List academic years with pagination, search, filter, and sort
   * Validates Requirement 1.1
   */
  async list(
    params: AcademicYearsQueryParams = {}
  ): Promise<AcademicYearsListResponse> {
    await delay()

    const {
      page = 1,
      pageSize = 10,
      search = '',
      status = 'ALL',
      sortBy = 'startDate',
      sortOrder = 'desc',
    } = params

    // Filter by search query (code or name)
    let filtered = mockData.filter((ay) => {
      const searchLower = search.toLowerCase()
      const matchesSearch =
        !search ||
        ay.code.toLowerCase().includes(searchLower) ||
        ay.name?.toLowerCase().includes(searchLower)

      const matchesStatus = status === 'ALL' || ay.status === status

      return matchesSearch && matchesStatus
    })

    // Sort
    filtered = filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'startDate':
          comparison = a.startDate.getTime() - b.startDate.getTime()
          break
        case 'code':
          comparison = a.code.localeCompare(b.code)
          break
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime()
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    // Paginate
    const total = filtered.length
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const data = filtered.slice(start, end)

    return {
      data,
      total,
      page,
      pageSize,
    }
  },

  /**
   * Get a single academic year by ID
   * Validates Requirement 5.2
   */
  async getById(id: string): Promise<AcademicYearDetailResponse> {
    await delay()

    const academicYear = mockData.find((ay) => ay.id === id)

    if (!academicYear) {
      throw new Error('Academic year not found')
    }

    return {
      data: academicYear,
    }
  },

  /**
   * Create a new academic year
   * Validates Requirements 2.3, 2.7
   */
  async create(
    input: AcademicYearFormInput
  ): Promise<AcademicYearDetailResponse> {
    await delay()

    // Check for duplicate code
    const duplicate = mockData.find((ay) => ay.code === input.code)
    if (duplicate) {
      throw new Error('Mã năm học đã tồn tại')
    }

    const newAcademicYear: AcademicYear = {
      id: faker.string.uuid(),
      code: input.code,
      name: input.name || null,
      startDate: input.startDate,
      endDate: input.endDate,
      status: input.status || AcademicYearStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockData.push(newAcademicYear)

    return {
      data: newAcademicYear,
    }
  },

  /**
   * Update an existing academic year
   * Validates Requirement 5.5
   */
  async update(
    id: string,
    input: Partial<AcademicYearFormInput>
  ): Promise<AcademicYearDetailResponse> {
    await delay()

    const index = mockData.findIndex((ay) => ay.id === id)

    if (index === -1) {
      throw new Error('Academic year not found')
    }

    const existing = mockData[index]

    // If code is being changed, check for duplicates
    if (input.code && input.code !== existing.code) {
      const duplicate = mockData.find((ay) => ay.code === input.code)
      if (duplicate) {
        throw new Error('Mã năm học đã tồn tại')
      }
    }

    const updated: AcademicYear = {
      ...existing,
      ...(input.code && { code: input.code }),
      ...(input.name !== undefined && { name: input.name || null }),
      ...(input.startDate && { startDate: input.startDate }),
      ...(input.endDate && { endDate: input.endDate }),
      ...(input.status && { status: input.status }),
      updatedAt: new Date(),
    }

    mockData[index] = updated

    return {
      data: updated,
    }
  },

  /**
   * Update academic year status (Enable/Disable)
   * Validates Requirements 6.4, 6.6
   */
  async updateStatus(
    id: string,
    status: AcademicYearStatus
  ): Promise<AcademicYearDetailResponse> {
    await delay()

    const index = mockData.findIndex((ay) => ay.id === id)

    if (index === -1) {
      throw new Error('Academic year not found')
    }

    // Simulate business rule: cannot disable if in use (randomly for demo)
    if (status === AcademicYearStatus.DISABLED && Math.random() < 0.1) {
      throw new Error('Không thể vô hiệu hóa năm học đang được sử dụng')
    }

    const updated: AcademicYear = {
      ...mockData[index],
      status,
      updatedAt: new Date(),
    }

    mockData[index] = updated

    return {
      data: updated,
    }
  },

  /**
   * Check if an academic year code is unique
   * Validates Requirement 3.5
   */
  async checkCodeUniqueness(
    code: string,
    excludeId?: string
  ): Promise<CodeUniquenessResponse> {
    await delay(100) // Shorter delay for validation

    const existing = mockData.find(
      (ay) => ay.code === code && ay.id !== excludeId
    )

    return {
      isUnique: !existing,
    }
  },
}
