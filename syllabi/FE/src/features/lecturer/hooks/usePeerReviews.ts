/**
 * usePeerReviews Hook
 *
 * Custom hook for fetching and managing peer review assignments.
 *
 * Features:
 * - Fetch assigned peer reviews
 * - Filter by status
 * - Track completion progress
 * - Submit evaluations
 */
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query'
import {
  getPeerReviews,
  createPeerEvaluation,
  updatePeerEvaluation,
} from '../api/review.api'
import type { PeerReviewAssignment, PeerEvaluation } from '../types'

export interface UsePeerReviewsOptions {
  /** Enable/disable the query */
  enabled?: boolean
}

export type UsePeerReviewsReturn = UseQueryResult<
  PeerReviewAssignment[]
> & {
  /** List of peer review assignments */
  reviews: PeerReviewAssignment[]
  /** Pending reviews (not started) */
  pendingReviews: PeerReviewAssignment[]
  /** In-progress reviews */
  inProgressReviews: PeerReviewAssignment[]
  /** Completed reviews */
  completedReviews: PeerReviewAssignment[]
  /** Total number of reviews */
  totalReviews: number
  /** Number of completed reviews */
  completedCount: number
  /** Completion percentage */
  completionPercentage: number
  /** Submit evaluation mutation */
  submitEvaluation: (evaluation: PeerEvaluation) => void
  /** Whether evaluation is being submitted */
  isSubmitting: boolean
  /** Update evaluation mutation */
  updateEvaluation: (
    evaluationId: number,
    evaluation: Partial<PeerEvaluation>
  ) => void
  /** Whether evaluation is being updated */
  isUpdating: boolean
}

/**
 * Hook for managing peer review assignments
 *
 * @example
 * ```tsx
 * const {
 *   reviews,
 *   pendingReviews,
 *   completionPercentage,
 *   submitEvaluation,
 *   isSubmitting
 * } = usePeerReviews();
 *
 * // Display pending reviews
 * pendingReviews.map(review => (
 *   <ReviewCard key={review.id} review={review} />
 * ));
 *
 * // Submit evaluation
 * submitEvaluation({
 *   syllabusId: 123,
 *   reviewerId: 456,
 *   criteriaScores: [...],
 *   overallScore: 4.5,
 *   recommendation: 'Approve',
 *   summaryComments: 'Excellent work',
 *   status: 'Submitted'
 * });
 * ```
 */
export function usePeerReviews(
  options: UsePeerReviewsOptions = {}
): UsePeerReviewsReturn {
  const { enabled = true } = options
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['lecturer', 'peer-reviews'],
    queryFn: getPeerReviews,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })

  const reviews = query.data || []

  // Filter reviews by status
  const pendingReviews = reviews.filter((r) => r.status === 'Pending')
  const inProgressReviews = reviews.filter((r) => r.status === 'In Progress')
  const completedReviews = reviews.filter((r) => r.status === 'Completed')

  // Calculate completion metrics
  const totalReviews = reviews.length
  const completedCount = completedReviews.length
  const completionPercentage =
    totalReviews > 0 ? Math.round((completedCount / totalReviews) * 100) : 0

  // Submit evaluation mutation
  const submitMutation = useMutation({
    mutationFn: createPeerEvaluation,
    onSuccess: () => {
      // Invalidate peer reviews to refresh the list
      queryClient.invalidateQueries({ queryKey: ['lecturer', 'peer-reviews'] })
    },
  })

  // Update evaluation mutation
  const updateMutation = useMutation({
    mutationFn: ({
      evaluationId,
      evaluation,
    }: {
      evaluationId: number
      evaluation: Partial<PeerEvaluation>
    }) => updatePeerEvaluation(evaluationId, evaluation),
    onSuccess: () => {
      // Invalidate peer reviews to refresh the list
      queryClient.invalidateQueries({ queryKey: ['lecturer', 'peer-reviews'] })
    },
  })

  return {
    ...query,
    reviews,
    pendingReviews,
    inProgressReviews,
    completedReviews,
    totalReviews,
    completedCount,
    completionPercentage,
    submitEvaluation: submitMutation.mutate,
    isSubmitting: submitMutation.isPending,
    updateEvaluation: (
      evaluationId: number,
      evaluation: Partial<PeerEvaluation>
    ) => updateMutation.mutate({ evaluationId, evaluation }),
    isUpdating: updateMutation.isPending,
  }
}
