/**
 * Syllabus API Functions
 *
 * This module contains all API functions for syllabus CRUD operations,
 * submission, validation, and version management.
 */
import { apiClient } from '@/lib/api-client'
import type {
  Syllabus,
  Course,
  PLO,
  SubmissionValidation,
  VersionHistory,
  SyllabiQueryParams,
  PaginatedResponse,
  ApiResponse,
} from '../types'

// ============================================================================
// Data Transformation Helpers
// ============================================================================

/**
 * Transform frontend camelCase data to backend snake_case format
 */
const transformToBackend = (data: Partial<Syllabus>): any => {
  const payload: any = {
    course_id: data.courseId,
    academic_year: data.academicYear,
    semester: data.semester,
    credits: data.credits,
    total_hours: data.totalHours,
    description: data.description,
    title: data.courseName,
    status: data.status,
  }

  // Transform CLOs array to backend format
  if (data.clos && data.clos.length > 0) {
    payload.clos = data.clos.map(clo => ({
      code: clo.code,
      description: clo.description,
      bloom_level: clo.bloomLevel,
      plo_mappings: clo.mappedPlos || [],
    }))
  }

  // Transform course content to backend format
  if (data.content && data.content.length > 0) {
    payload.content = data.content.map(item => ({
      week_number: item.weekNumber,
      title: item.title,
      description: item.description,
      lecture_hours: item.lectureHours,
      lab_hours: item.labHours,
      related_clos: item.relatedClos || [],
      teaching_methods: item.teachingMethods || [],
    }))
  }

  // Transform assessments to backend format (JSON array)
  if (data.assessments && data.assessments.length > 0) {
    payload.assessments = data.assessments.map(assessment => ({
      assessment_type: assessment.type,
      name: assessment.name,
      weight: assessment.weight,
      related_clos: assessment.relatedClos || [],
      description: assessment.description || '',
    }))
  }

  // Transform references to backend format (JSON array)
  if (data.references && data.references.length > 0) {
    payload.references = data.references.map(ref => ({
      reference_type: ref.type,
      title: ref.title,
      authors: ref.authors || '',
      publisher: ref.publisher || '',
      year: ref.year || new Date().getFullYear(),
      isbn: ref.isbn || '',
      url: ref.url || '',
    }))
  }

  if (import.meta.env.DEV) {
    console.log('[transformToBackend] Transformed payload:', payload)
  }

  return payload
}

/**
 * Transform backend snake_case data to frontend camelCase format
 */
const transformFromBackend = (data: any): Syllabus => {
  if (!data) {
    throw new Error('No data received from backend')
  }

  return {
    id: data.syllabus_id || data.id || 0,
    courseId: data.course_id || 0,
    courseCode: data.course_code || '',
    courseName: data.course_name || data.title || '',
    academicYear: data.academic_year || '',
    semester: data.semester || 'Fall',
    credits: data.credits || 0,
    totalHours: data.total_hours || 0,
    description: data.description || '',
    status: data.status || 'Draft',
    version: data.version || '1.0',
    lecturerId: data.lecturer_id || 0,
    createdAt: data.created_date || data.created_at || new Date().toISOString(),
    updatedAt: data.updated_at || new Date().toISOString(),
    // Parse CLOs from backend format
    clos: data.clos?.map((clo: any, idx: number) => ({
      id: clo.id || idx + 1,
      code: clo.code || `CLO${idx + 1}`,
      description: clo.description || '',
      bloomLevel: clo.bloom_level || 'Understand',
      mappedPlos: clo.plo_mappings || [],
    })) || 
    // Fallback: parse from learning_outcomes string
    data.learning_outcomes?.split('\n').filter(Boolean).map((desc: string, idx: number) => ({
      id: idx + 1,
      code: `CLO${idx + 1}`,
      description: desc,
      bloomLevel: 'Understand',
      mappedPlos: [],
    })) || [],
    content: data.content?.map((item: any, idx: number) => ({
      id: item.id || idx + 1,
      weekNumber: item.week_number || item.weekNumber || idx + 1,
      title: item.title || '',
      description: item.description || '',
      lectureHours: item.lecture_hours || item.lectureHours || 0,
      labHours: item.lab_hours || item.labHours || 0,
      relatedClos: item.related_clos || item.relatedClos || [],
      teachingMethods: item.teaching_methods || item.teachingMethods || [],
    })) || [],
    // Parse assessments from backend format (JSON array or string)
    assessments: Array.isArray(data.assessments) 
      ? data.assessments.map((assessment: any, idx: number) => ({
          id: assessment.id || idx + 1,
          type: assessment.assessment_type || assessment.type || 'Assignment',
          name: assessment.name || '',
          weight: assessment.weight || 0,
          relatedClos: assessment.related_clos || assessment.relatedClos || [],
          description: assessment.description || '',
        }))
      : data.assessment_methods?.split('\n').filter(Boolean).map((line: string, idx: number) => {
          const [name, weight] = line.split(':')
          return {
            id: idx + 1,
            type: 'Assignment' as const,
            name: name?.trim() || '',
            weight: parseInt(weight?.replace('%', '').trim() || '0'),
            relatedClos: [],
            description: '',
          }
        }) || [],
    // Parse references from backend format (JSON array or string)
    references: Array.isArray(data.references)
      ? data.references.map((ref: any, idx: number) => ({
          id: ref.id || idx + 1,
          type: ref.reference_type || ref.type || 'Required',
          title: ref.title || '',
          authors: ref.authors || '',
          publisher: ref.publisher || '',
          year: ref.year || new Date().getFullYear(),
          isbn: ref.isbn || '',
          url: ref.url || '',
        }))
      : data.textbooks?.split('\n').filter(Boolean).map((title: string, idx: number) => ({
          id: idx + 1,
          type: 'Required' as const,
          title: title.trim(),
          authors: '',
          year: new Date().getFullYear(),
        })) || [],
  }
}

// ============================================================================
// Course Catalog Operations
// ============================================================================

/**
 * Get list of courses assigned to the current lecturer
 */
export const getAssignedCourses = async (): Promise<Course[]> => {
  const response = await apiClient.get<Course[]>(
    '/api/v1/lecturer/courses'
  )
  return response.data
}

/**
 * Get PLOs for a specific program
 */
export const getProgramPLOs = async (programId: number): Promise<PLO[]> => {
  const response = await apiClient.get<{ items: PLO[] }>(
    `/api/v1/programs/${programId}/plos`
  )
  return response.data.items
}

// ============================================================================
// Syllabus List Operations
// ============================================================================

/**
 * Get paginated list of syllabi with filtering and sorting
 */
export const getSyllabi = async (
  params?: SyllabiQueryParams
): Promise<PaginatedResponse<Syllabus>> => {
  const response = await apiClient.get<any>(
    '/api/v1/lecturer/syllabi',
    { params }
  )

  // Log the raw response for debugging
  if (import.meta.env.DEV) {
    console.log('[getSyllabi] Raw response:', response.data)
  }

  // The backend returns the data directly, not wrapped
  const data = response.data

  if (import.meta.env.DEV) {
    console.log('[getSyllabi] Data structure:', {
      hasItems: !!data.items,
      itemsLength: data.items?.length,
      total: data.total,
      page: data.page,
    })
  }

  // Transform backend response to frontend format
  const result = {
    items: (data.items || []).map(transformFromBackend),
    total: data.total || 0,
    page: data.page || 1,
    pageSize: data.page_size || data.pageSize || 10,
    totalPages: data.total_pages || data.totalPages || 1,
  }

  if (import.meta.env.DEV) {
    console.log('[getSyllabi] Transformed result:', {
      itemsCount: result.items.length,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    })
  }

  return result
}

/**
 * Get a single syllabus by ID
 */
export const getSyllabus = async (id: number): Promise<Syllabus> => {
  const response = await apiClient.get<any>(
    `/api/v1/lecturer/syllabi/${id}`
  )

  // Log the raw response for debugging
  if (import.meta.env.DEV) {
    console.log('[getSyllabus] Raw response:', response.data)
  }

  // Handle different response structures
  // Case 1: Response is wrapped in ApiResponse format { status, items, message }
  // Case 2: Response is direct syllabus data
  const data = response.data.items || response.data

  if (import.meta.env.DEV) {
    console.log('[getSyllabus] Extracted data:', data)
  }

  const result = transformFromBackend(data)

  if (import.meta.env.DEV) {
    console.log('[getSyllabus] Transformed result:', result)
  }

  return result
}

// ============================================================================
// Syllabus Create/Update Operations
// ============================================================================

/**
 * Create a new syllabus
 */
export const createSyllabus = async (
  data: Partial<Syllabus>
): Promise<Syllabus> => {
  const backendData = transformToBackend(data)
  const response = await apiClient.post<ApiResponse<any>>(
    '/api/v1/syllabi',
    backendData
  )
  
  // Handle different response structures
  const responseData = response.data.items || response.data
  return transformFromBackend(responseData)
}

/**
 * Update an existing syllabus
 */
export const updateSyllabus = async (
  id: number,
  data: Partial<Syllabus>
): Promise<Syllabus> => {
  const backendData = transformToBackend(data)
  const response = await apiClient.put<ApiResponse<any>>(
    `/api/v1/syllabi/${id}`,
    backendData
  )
  
  // Handle different response structures
  const responseData = response.data.items || response.data
  return transformFromBackend(responseData)
}

/**
 * Save syllabus as draft (auto-save)
 */
export const saveDraft = async (
  id: number,
  data: Partial<Syllabus>
): Promise<Syllabus> => {
  const backendData = transformToBackend(data)
  const response = await apiClient.put<ApiResponse<any>>(
    `/api/v1/lecturer/syllabi/${id}/draft`,
    backendData
  )
  
  // Handle different response structures
  const responseData = response.data.items || response.data
  return transformFromBackend(responseData)
}

/**
 * Delete a syllabus (only allowed for drafts)
 */
export const deleteSyllabus = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/v1/syllabi/${id}`)
}

// ============================================================================
// Submission Operations
// ============================================================================

/**
 * Validate syllabus before submission
 */
export const validateSyllabus = async (
  id: number
): Promise<SubmissionValidation> => {
  const response = await apiClient.post<ApiResponse<SubmissionValidation>>(
    `/api/v1/syllabi/${id}/validate`
  )
  return response.data.items
}

/**
 * Submit syllabus for review
 */
export const submitSyllabus = async (
  id: number,
  notes?: string
): Promise<Syllabus> => {
  const response = await apiClient.post<ApiResponse<Syllabus>>(
    `/api/v1/syllabi/${id}/submit`,
    { notes }
  )
  return response.data.items
}

/**
 * Withdraw a submitted syllabus (return to draft)
 */
export const withdrawSubmission = async (id: number): Promise<Syllabus> => {
  const response = await apiClient.post<ApiResponse<Syllabus>>(
    `/api/v1/syllabi/${id}/withdraw`
  )
  return response.data.items
}

// ============================================================================
// Version Operations
// ============================================================================

/**
 * Get version history for a syllabus
 */
export const getVersionHistory = async (
  id: number
): Promise<VersionHistory[]> => {
  const response = await apiClient.get<ApiResponse<VersionHistory[]>>(
    `/api/v1/syllabi/${id}/versions`
  )
  return response.data.items
}

/**
 * Get a specific version of a syllabus
 */
export const getSyllabusVersion = async (
  id: number,
  version: string
): Promise<Syllabus> => {
  const response = await apiClient.get<ApiResponse<Syllabus>>(
    `/api/v1/syllabi/${id}/versions/${version}`
  )
  return response.data.items
}

// ============================================================================
// Preview Operations
// ============================================================================

/**
 * Get formatted preview of syllabus
 */
export const getPreview = async (id: number): Promise<string> => {
  const response = await apiClient.get<ApiResponse<{ html: string }>>(
    `/api/v1/syllabi/${id}/preview`
  )
  return response.data.items.html
}

/**
 * Export syllabus as PDF
 */
export const exportPDF = async (
  id: number,
  filename: string
): Promise<void> => {
  await apiClient.download(`/api/v1/syllabi/${id}/export/pdf`, filename)
}
