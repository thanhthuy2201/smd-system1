/**
 * Custom Hook for Peer Evaluation
 *
 * This hook provides functionality for creating, updating, and submitting
 * peer evaluations with support for draft and final submission.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  createPeerEvaluation,
  updatePeerEvaluation,
  submitPeerEvaluation,
  getPeerEvaluationBySyllabus,
} from '../api/review.api'
import type { PeerEvaluation } from '../types'
import type { PeerEvaluationFormData } from '../schemas/review.schema'

interface UsePeerEvaluationOptions {
  syllabusId: number
  onSuccess?: () => void
}

/**
 * Hook for managing peer evaluation operations
 */
export function usePeerEvaluation({
  syllabusId,
  onSuccess,
}: UsePeerEvaluationOptions) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Query to fetch existing evaluation for this syllabus
  const {
    data: existingEvaluation,
    isLoading: isLoadingEvaluation,
    error: loadError,
  } = useQuery({
    queryKey: ['lecturer', 'peer-evaluations', 'syllabus', syllabusId],
    queryFn: () => getPeerEvaluationBySyllabus(syllabusId),
    retry: 1,
  })

  // Calculate overall weighted score
  const calculateOverallScore = (
    criteriaScores: PeerEvaluationFormData['criteriaScores'],
    template: { criteria: Array<{ weight: number }> }
  ): number => {
    if (!criteriaScores || criteriaScores.length === 0) return 0

    let totalWeightedScore = 0
    let totalWeight = 0

    criteriaScores.forEach((score, _idx) => {
      const criterion = template.criteria[_idx]
      if (criterion && score.score) {
        totalWeightedScore += score.score * criterion.weight
        totalWeight += criterion.weight
      }
    })

    return totalWeight > 0 ? totalWeightedScore / totalWeight : 0
  }

  // Mutation for saving draft evaluation
  const saveDraftMutation = useMutation({
    mutationFn: async (data: PeerEvaluationFormData) => {
      // Calculate overall score (will be recalculated on server, but we include it)
      const overallScore = calculateOverallScore(data.criteriaScores, {
        criteria: data.criteriaScores.map(() => ({ weight: 20 })), // Default weight
      })

      const evaluationData: Partial<PeerEvaluation> = {
        syllabusId: data.syllabusId,
        criteriaScores: data.criteriaScores,
        overallScore,
        recommendation: data.recommendation,
        summaryComments: data.summaryComments,
        status: 'Draft',
      }

      // Update existing draft or create new one
      if (existingEvaluation?.id && existingEvaluation.status === 'Draft') {
        return updatePeerEvaluation(existingEvaluation.id, evaluationData)
      } else {
        return createPeerEvaluation(evaluationData)
      }
    },
    onSuccess: (data) => {
      // Update cache with new evaluation
      queryClient.setQueryData(
        ['lecturer', 'peer-evaluations', 'syllabus', syllabusId],
        data
      )

      toast.success('Your evaluation has been saved as a draft.')

      onSuccess?.()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save draft evaluation.')
    },
  })

  // Mutation for submitting final evaluation
  const submitEvaluationMutation = useMutation({
    mutationFn: async (data: PeerEvaluationFormData) => {
      // Calculate overall score
      const overallScore = calculateOverallScore(data.criteriaScores, {
        criteria: data.criteriaScores.map(() => ({ weight: 20 })), // Default weight
      })

      const evaluationData: Partial<PeerEvaluation> = {
        syllabusId: data.syllabusId,
        criteriaScores: data.criteriaScores,
        overallScore,
        recommendation: data.recommendation,
        summaryComments: data.summaryComments,
        status: 'Submitted',
      }

      let evaluationId: number

      // Create or update evaluation first
      if (existingEvaluation?.id) {
        if (existingEvaluation.status === 'Submitted') {
          throw new Error('This evaluation has already been submitted.')
        }
        const updated = await updatePeerEvaluation(
          existingEvaluation.id,
          evaluationData
        )
        evaluationId = updated.id!
      } else {
        const created = await createPeerEvaluation(evaluationData)
        evaluationId = created.id!
      }

      // Submit the evaluation (finalize)
      return submitPeerEvaluation(evaluationId)
    },
    onSuccess: (data) => {
      // Invalidate peer review queue to reflect completion
      queryClient.invalidateQueries({
        queryKey: ['lecturer', 'peer-reviews'],
      })

      // Update the specific evaluation cache
      queryClient.setQueryData(
        ['lecturer', 'peer-evaluations', 'syllabus', syllabusId],
        data
      )

      toast.success('Your peer review evaluation has been submitted successfully.')

      onSuccess?.()

      // Navigate back to peer review queue after a short delay
      setTimeout(() => {
        navigate({ to: '/' })
      }, 1500)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit evaluation.')
    },
  })

  return {
    // Existing evaluation data
    existingEvaluation,
    isLoadingEvaluation,
    loadError,

    // Draft operations
    saveDraft: saveDraftMutation.mutate,
    isSavingDraft: saveDraftMutation.isPending,
    saveDraftError: saveDraftMutation.error,

    // Submit operations
    submitEvaluation: submitEvaluationMutation.mutate,
    isSubmitting: submitEvaluationMutation.isPending,
    submitError: submitEvaluationMutation.error,

    // Helper to check if evaluation is already submitted
    isAlreadySubmitted:
      existingEvaluation?.status === 'Submitted' ? true : false,
  }
}
