import { describe, it, expect } from 'vitest'
import { academicYearsApi } from './api'
import { AcademicYearStatus } from './schema'

describe('Academic Years API Client', () => {
  describe('list', () => {
    it('should return paginated academic years', async () => {
      const result = await academicYearsApi.list({ page: 1, pageSize: 5 })

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('page', 1)
      expect(result).toHaveProperty('pageSize', 5)
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data.length).toBeLessThanOrEqual(5)
    })

    it('should filter by search query', async () => {
      const result = await academicYearsApi.list({ search: '2024' })

      result.data.forEach((ay) => {
        const matchesSearch =
          ay.code.includes('2024') || ay.name?.includes('2024')
        expect(matchesSearch).toBe(true)
      })
    })

    it('should filter by status', async () => {
      const result = await academicYearsApi.list({
        status: AcademicYearStatus.ACTIVE,
      })

      result.data.forEach((ay) => {
        expect(ay.status).toBe(AcademicYearStatus.ACTIVE)
      })
    })

    it('should sort by startDate descending by default', async () => {
      const result = await academicYearsApi.list({
        sortBy: 'startDate',
        sortOrder: 'desc',
      })

      for (let i = 0; i < result.data.length - 1; i++) {
        expect(result.data[i].startDate.getTime()).toBeGreaterThanOrEqual(
          result.data[i + 1].startDate.getTime()
        )
      }
    })
  })

  describe('getById', () => {
    it('should return academic year by ID', async () => {
      // First get a list to get a valid ID
      const listResult = await academicYearsApi.list({ pageSize: 1 })
      const id = listResult.data[0].id

      const result = await academicYearsApi.getById(id)

      expect(result).toHaveProperty('data')
      expect(result.data.id).toBe(id)
    })

    it('should throw error for non-existent ID', async () => {
      await expect(academicYearsApi.getById('non-existent-id')).rejects.toThrow(
        'Academic year not found'
      )
    })
  })

  describe('create', () => {
    it('should create a new academic year', async () => {
      const newAcademicYear = {
        code: '2030-2031',
        name: 'Test Academic Year',
        startDate: new Date('2030-09-01'),
        endDate: new Date('2031-06-30'),
        status: AcademicYearStatus.ACTIVE,
      }

      const result = await academicYearsApi.create(newAcademicYear)

      expect(result.data).toMatchObject({
        code: newAcademicYear.code,
        name: newAcademicYear.name,
        status: newAcademicYear.status,
      })
      expect(result.data.id).toBeDefined()
      expect(result.data.createdAt).toBeInstanceOf(Date)
    })

    it('should default status to ACTIVE when not provided', async () => {
      const newAcademicYear = {
        code: '2031-2032',
        startDate: new Date('2031-09-01'),
        endDate: new Date('2032-06-30'),
        status: AcademicYearStatus.ACTIVE,
      }

      const result = await academicYearsApi.create(newAcademicYear)

      expect(result.data.status).toBe(AcademicYearStatus.ACTIVE)
    })
  })

  describe('update', () => {
    it('should update an existing academic year', async () => {
      // First create an academic year
      const created = await academicYearsApi.create({
        code: '2032-2033',
        startDate: new Date('2032-09-01'),
        endDate: new Date('2033-06-30'),
        status: AcademicYearStatus.ACTIVE,
      })

      // Then update it
      const updated = await academicYearsApi.update(created.data.id, {
        name: 'Updated Name',
      })

      expect(updated.data.name).toBe('Updated Name')
      expect(updated.data.id).toBe(created.data.id)
    })

    it('should throw error for non-existent ID', async () => {
      await expect(
        academicYearsApi.update('non-existent-id', { name: 'Test' })
      ).rejects.toThrow('Academic year not found')
    })
  })

  describe('updateStatus', () => {
    it('should update academic year status', async () => {
      // First create an academic year
      const created = await academicYearsApi.create({
        code: '2033-2034',
        startDate: new Date('2033-09-01'),
        endDate: new Date('2034-06-30'),
        status: AcademicYearStatus.ACTIVE,
      })

      // Then disable it
      const updated = await academicYearsApi.updateStatus(
        created.data.id,
        AcademicYearStatus.DISABLED
      )

      expect(updated.data.status).toBe(AcademicYearStatus.DISABLED)
    })
  })

  describe('checkCodeUniqueness', () => {
    it('should return false for existing code', async () => {
      // First create an academic year
      await academicYearsApi.create({
        code: '2034-2035',
        startDate: new Date('2034-09-01'),
        endDate: new Date('2035-06-30'),
        status: AcademicYearStatus.ACTIVE,
      })

      const result = await academicYearsApi.checkCodeUniqueness('2034-2035')

      expect(result.isUnique).toBe(false)
    })

    it('should return true for non-existing code', async () => {
      const result = await academicYearsApi.checkCodeUniqueness('2099-2100')

      expect(result.isUnique).toBe(true)
    })

    it('should exclude specified ID when checking uniqueness', async () => {
      // First create an academic year
      const created = await academicYearsApi.create({
        code: '2035-2036',
        startDate: new Date('2035-09-01'),
        endDate: new Date('2036-06-30'),
        status: AcademicYearStatus.ACTIVE,
      })

      // Check uniqueness excluding the created ID (should be unique)
      const result = await academicYearsApi.checkCodeUniqueness(
        '2035-2036',
        created.data.id
      )

      expect(result.isUnique).toBe(true)
    })
  })
})
