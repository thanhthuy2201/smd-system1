/**
 * useSyllabusForm Hook
 *
 * Custom hook for managing syllabus form state with React Hook Form,
 * Zod validation, and auto-save functionality.
 *
 * Features:
 * - Form initialization with default values
 * - Zod schema validation
 * - Auto-save every 30 seconds
 * - Last saved timestamp tracking
 * - Submit mutation handling
 */
import { useState, useEffect } from 'react'
import type { z } from 'zod'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createSyllabus, updateSyllabus, saveDraft } from '../api/syllabus.api'
import { syllabusSchema } from '../schemas/syllabus.schema'
import type { Syllabus } from '../types'
import { useAutoSave } from './useAutoSave'

// Infer the form type from the schema
type SyllabusFormData = z.infer<typeof syllabusSchema>

export interface UseSyllabusFormOptions {
  syllabusId?: number
  initialData?: Partial<Syllabus>
  onSuccess?: (syllabus: Syllabus) => void
  onError?: (error: Error) => void
  onSyllabusIdChange?: (id: number) => void
  onDraftSaved?: (syllabus: Syllabus) => void
  onDraftError?: (error: Error) => void
}

export interface UseSyllabusFormReturn {
  form: UseFormReturn<SyllabusFormData>
  isAutoSaving: boolean
  lastSaved?: Date
  submit: (data: SyllabusFormData) => void
  saveDraft: (data?: Partial<SyllabusFormData>) => void
  isSubmitting: boolean
  submitError: Error | null
}

/**
 * Hook for managing syllabus form with auto-save
 */
export function useSyllabusForm({
  syllabusId: initialSyllabusId,
  initialData,
  onSuccess,
  onError,
  onSyllabusIdChange,
  onDraftSaved,
  onDraftError,
}: UseSyllabusFormOptions = {}): UseSyllabusFormReturn {
  const queryClient = useQueryClient()
  
  // Track the current syllabus ID (may change after first save)
  const [currentSyllabusId, setCurrentSyllabusId] = useState(initialSyllabusId)

  // Initialize form with React Hook Form and Zod validation
  const form = useForm<SyllabusFormData>({
    resolver: zodResolver(syllabusSchema),
    defaultValues: initialData || {
      courseId: 0,
      academicYear: '',
      semester: 'Fall',
      credits: 3,
      totalHours: 45,
      description: '',
      clos: [],
      content: [],
      assessments: [],
      references: [],
    },
    mode: 'onChange', // Validate on change for better UX
  })

  // Reset form when initialData changes (e.g., when API loads syllabus data)
  // Use the syllabus ID as dependency to ensure it triggers when data loads
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      if (import.meta.env.DEV) {
        console.log('[useSyllabusForm] Resetting form with initialData:', initialData)
      }
      // Reset form with the loaded data, keeping isDirty as false
      form.reset(initialData as SyllabusFormData, {
        keepDefaultValues: false,
      })
    }
  }, [initialSyllabusId, initialData?.id]) // Trigger when syllabus ID changes

  // Auto-save mutation
  const autoSaveMutation = useMutation({
    mutationFn: async (data: Partial<Syllabus>) => {
      if (currentSyllabusId) {
        // Update existing draft
        return await saveDraft(currentSyllabusId, data)
      } else {
        // Create new syllabus as draft
        return await createSyllabus({ ...data, status: 'Draft' })
      }
    },
    onSuccess: (response) => {
      // Update cache with saved data
      queryClient.setQueryData(['lecturer', 'syllabi', response.id], response)

      // If this was a new syllabus, save the ID to prevent creating duplicates
      if (!currentSyllabusId && response.id) {
        setCurrentSyllabusId(response.id)
        onSyllabusIdChange?.(response.id)
        queryClient.invalidateQueries({ queryKey: ['lecturer', 'syllabi'] })
      }
      
      // Call success callback for draft save
      onDraftSaved?.(response)
    },
    onError: (error: Error) => {
      // Call error callback for draft save
      onDraftError?.(error)
    },
  })

  // Enable auto-save with 30-second debounce
  useAutoSave({
    data: form.watch(),
    onSave: (data) => {
      // Only auto-save if form is dirty and has no validation errors
      if (form.formState.isDirty) {
        autoSaveMutation.mutate(data as Partial<Syllabus>)
      }
    },
    interval: 30000, // 30 seconds
    enabled: form.formState.isDirty,
  })

  // Submit mutation for final save
  const submitMutation = useMutation({
    mutationFn: async (data: SyllabusFormData) => {
      if (currentSyllabusId) {
        return await updateSyllabus(currentSyllabusId, data)
      } else {
        return await createSyllabus(data)
      }
    },
    onSuccess: (response) => {
      // Update cache
      queryClient.setQueryData(['lecturer', 'syllabi', response.id], response)
      queryClient.invalidateQueries({ queryKey: ['lecturer', 'syllabi'] })

      // Save ID if it's a new syllabus
      if (!currentSyllabusId && response.id) {
        setCurrentSyllabusId(response.id)
        onSyllabusIdChange?.(response.id)
      }

      // Reset form dirty state
      form.reset(response as SyllabusFormData)

      // Call success callback
      onSuccess?.(response)
    },
    onError: (error: Error) => {
      onError?.(error)
    },
  })

  return {
    form,
    isAutoSaving: autoSaveMutation.isPending,
    lastSaved: autoSaveMutation.data
      ? new Date(autoSaveMutation.data.updatedAt)
      : undefined,
    submit: submitMutation.mutate,
    saveDraft: (data?: Partial<SyllabusFormData>) => {
      // Manual draft save - uses current form values if no data provided
      const dataToSave = data || form.getValues()
      autoSaveMutation.mutate(dataToSave as Partial<Syllabus>)
    },
    isSubmitting: submitMutation.isPending,
    submitError: submitMutation.error,
  }
}
