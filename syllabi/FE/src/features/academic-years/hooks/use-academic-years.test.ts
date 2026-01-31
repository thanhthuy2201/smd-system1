import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AcademicYearStatus } from '../data/schema'
import { useAcademicYears } from './use-academic-years'

// Create a wrapper with QueryClient for testing hooks
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useAcademicYears', () => {
  it('should fetch academic years list', async () => {
    const { result } = renderHook(() => useAcademicYears(), {
      wrapper: createWrapper(),
    })

    // Initially loading
    expect(result.current.isLoading).toBe(true)

    // Wait for data to load
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Check data structure
    expect(result.current.data).toBeDefined()
    expect(result.current.data?.data).toBeInstanceOf(Array)
    expect(result.current.data?.total).toBeGreaterThan(0)
  })

  it('should fetch with query parameters', async () => {
    const { result } = renderHook(
      () =>
        useAcademicYears({
          page: 1,
          pageSize: 5,
          status: AcademicYearStatus.ACTIVE,
        }),
      {
        wrapper: createWrapper(),
      }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.page).toBe(1)
    expect(result.current.data?.pageSize).toBe(5)
    expect(result.current.data?.data.length).toBeLessThanOrEqual(5)
  })

  it('should handle search parameter', async () => {
    const { result } = renderHook(
      () =>
        useAcademicYears({
          search: '2024',
        }),
      {
        wrapper: createWrapper(),
      }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // All results should match the search query
    result.current.data?.data.forEach((ay) => {
      const matchesSearch =
        ay.code.includes('2024') || ay.name?.includes('2024')
      expect(matchesSearch).toBe(true)
    })
  })
})
