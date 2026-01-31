/**
 * useFeedback Hook
 *
 * Custom hook for managing collaborative feedback and comments system.
 *
 * Features:
 * - Fetch comments for a syllabus
 * - Add comments with optimistic updates
 * - Reply to comments
 * - Edit comments with ownership check
 * - Delete comments with ownership check
 * - Resolve/unresolve comments
 */
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getComments,
  addComment,
  updateComment,
  deleteComment,
  resolveComment,
  unresolveComment,
  addReply,
  updateReply,
  deleteReply,
} from '../api/feedback.api'
import type { Comment, NewComment, NewCommentReply } from '../types'

export interface UseFeedbackOptions {
  /** Syllabus ID to fetch comments for */
  syllabusId: number
  /** Enable/disable the query */
  enabled?: boolean
  /** Current user ID for ownership checks */
  currentUserId?: number
}

export type UseFeedbackReturn = UseQueryResult<Comment[]> & {
  /** List of comments */
  comments: Comment[]
  /** Add comment mutation */
  addComment: (data: NewComment) => void
  /** Whether comment is being added */
  isAddingComment: boolean
  /** Reply to comment mutation */
  replyToComment: (commentId: number, data: NewCommentReply) => void
  /** Whether reply is being added */
  isAddingReply: boolean
  /** Edit comment mutation */
  editComment: (commentId: number, data: Partial<NewComment>) => void
  /** Whether comment is being edited */
  isEditingComment: boolean
  /** Delete comment mutation */
  removeComment: (commentId: number) => void
  /** Whether comment is being deleted */
  isDeletingComment: boolean
  /** Resolve comment mutation */
  resolve: (commentId: number) => void
  /** Whether comment is being resolved */
  isResolving: boolean
  /** Unresolve comment mutation */
  unresolve: (commentId: number) => void
  /** Whether comment is being unresolved */
  isUnresolving: boolean
  /** Edit reply mutation */
  editReply: (replyId: number, data: Partial<NewCommentReply>) => void
  /** Whether reply is being edited */
  isEditingReply: boolean
  /** Delete reply mutation */
  removeReply: (replyId: number) => void
  /** Whether reply is being deleted */
  isDeletingReply: boolean
}

/**
 * Hook for managing feedback and comments
 *
 * @example
 * ```tsx
 * const {
 *   comments,
 *   addComment,
 *   replyToComment,
 *   editComment,
 *   removeComment,
 *   resolve,
 *   isLoading
 * } = useFeedback({
 *   syllabusId: 123,
 *   currentUserId: 456
 * });
 *
 * // Add a comment
 * addComment({
 *   type: 'Suggestion',
 *   text: 'Consider adding more examples',
 *   sectionReference: 'Learning Outcomes'
 * });
 *
 * // Reply to a comment
 * replyToComment(commentId, {
 *   text: 'Thank you for the suggestion!'
 * });
 *
 * // Edit a comment (ownership checked)
 * editComment(commentId, {
 *   text: 'Updated comment text'
 * });
 *
 * // Delete a comment (ownership checked)
 * removeComment(commentId);
 *
 * // Resolve a comment
 * resolve(commentId);
 * ```
 */
export function useFeedback(options: UseFeedbackOptions): UseFeedbackReturn {
  const { syllabusId, enabled = true, currentUserId } = options

  const queryClient = useQueryClient()
  const queryKey = ['lecturer', 'syllabi', syllabusId, 'comments']

  // Fetch comments query
  const query = useQuery({
    queryKey,
    queryFn: () => getComments(syllabusId),
    enabled: enabled && syllabusId > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  const comments = query.data || []

  // Add comment mutation with optimistic update
  const addCommentMutation = useMutation({
    mutationFn: (data: NewComment) => addComment(syllabusId, data),
    onMutate: async (newComment) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot previous value
      const previousComments = queryClient.getQueryData<Comment[]>(queryKey)

      // Optimistically update with temporary comment
      queryClient.setQueryData<Comment[]>(queryKey, (old = []) => [
        ...old,
        {
          id: Date.now(), // Temporary ID
          syllabusId,
          userId: currentUserId || 0,
          userName: 'You',
          type: newComment.type,
          sectionReference: newComment.sectionReference,
          text: newComment.text,
          priority: newComment.priority,
          isResolved: false,
          createdAt: new Date().toISOString(),
          replies: [],
        } as Comment,
      ])

      return { previousComments }
    },
    onError: (_err, _newComment, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(queryKey, context.previousComments)
      }
      toast.error('Failed to add comment. Please try again.')
    },
    onSuccess: () => {
      toast.success('Comment added successfully.')
    },
    onSettled: () => {
      // Refetch to get the real data from server
      queryClient.invalidateQueries({ queryKey })
    },
  })

  // Reply to comment mutation
  const replyMutation = useMutation({
    mutationFn: ({ commentId, data }: { commentId: number; data: NewCommentReply }) =>
      addReply(commentId, data),
    onMutate: async ({ commentId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot previous value
      const previousComments = queryClient.getQueryData<Comment[]>(queryKey)

      // Optimistically update with temporary reply
      queryClient.setQueryData<Comment[]>(queryKey, (old = []) =>
        old.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                replies: [
                  ...comment.replies,
                  {
                    id: Date.now(), // Temporary ID
                    commentId,
                    userId: currentUserId || 0,
                    userName: 'You',
                    text: data.text,
                    createdAt: new Date().toISOString(),
                  },
                ],
              }
            : comment
        )
      )

      return { previousComments }
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(queryKey, context.previousComments)
      }
      toast.error('Failed to add reply. Please try again.')
    },
    onSuccess: () => {
      toast.success('Reply added successfully.')
    },
    onSettled: () => {
      // Refetch to get the real data from server
      queryClient.invalidateQueries({ queryKey })
    },
  })

  // Edit comment mutation with ownership check
  const editCommentMutation = useMutation({
    mutationFn: ({
      commentId,
      data,
    }: {
      commentId: number
      data: Partial<NewComment>
    }) => {
      // Client-side ownership check
      const comment = comments.find((c) => c.id === commentId)
      if (comment && currentUserId && comment.userId !== currentUserId) {
        return Promise.reject(
          new Error('You can only edit your own comments')
        )
      }
      return updateComment(commentId, data)
    },
    onMutate: async ({ commentId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot previous value
      const previousComments = queryClient.getQueryData<Comment[]>(queryKey)

      // Optimistically update
      queryClient.setQueryData<Comment[]>(queryKey, (old = []) =>
        old.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                ...data,
                updatedAt: new Date().toISOString(),
              }
            : comment
        )
      )

      return { previousComments }
    },
    onError: (err, _variables, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(queryKey, context.previousComments)
      }
      toast.error(err instanceof Error ? err.message : 'Failed to edit comment.')
    },
    onSuccess: () => {
      toast.success('Comment updated successfully.')
    },
    onSettled: () => {
      // Refetch to get the real data from server
      queryClient.invalidateQueries({ queryKey })
    },
  })

  // Delete comment mutation with ownership check
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => {
      // Client-side ownership check
      const comment = comments.find((c) => c.id === commentId)
      if (comment && currentUserId && comment.userId !== currentUserId) {
        return Promise.reject(
          new Error('You can only delete your own comments')
        )
      }
      return deleteComment(commentId)
    },
    onMutate: async (commentId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot previous value
      const previousComments = queryClient.getQueryData<Comment[]>(queryKey)

      // Optimistically remove comment
      queryClient.setQueryData<Comment[]>(
        queryKey,
        (old = []) => old.filter((comment) => comment.id !== commentId)
      )

      return { previousComments }
    },
    onError: (err, _commentId, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(queryKey, context.previousComments)
      }
      toast.error(err instanceof Error ? err.message : 'Failed to delete comment.')
    },
    onSuccess: () => {
      toast.success('Comment deleted successfully.')
    },
    onSettled: () => {
      // Refetch to get the real data from server
      queryClient.invalidateQueries({ queryKey })
    },
  })

  // Resolve comment mutation
  const resolveMutation = useMutation({
    mutationFn: resolveComment,
    onMutate: async (commentId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot previous value
      const previousComments = queryClient.getQueryData<Comment[]>(queryKey)

      // Optimistically update
      queryClient.setQueryData<Comment[]>(queryKey, (old = []) =>
        old.map((comment) =>
          comment.id === commentId
            ? { ...comment, isResolved: true }
            : comment
        )
      )

      return { previousComments }
    },
    onError: (_err, _commentId, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(queryKey, context.previousComments)
      }
      toast.error('Failed to resolve comment. Please try again.')
    },
    onSuccess: () => {
      toast.success('Comment marked as resolved.')
    },
    onSettled: () => {
      // Refetch to get the real data from server
      queryClient.invalidateQueries({ queryKey })
    },
  })

  // Unresolve comment mutation
  const unresolveMutation = useMutation({
    mutationFn: unresolveComment,
    onMutate: async (commentId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot previous value
      const previousComments = queryClient.getQueryData<Comment[]>(queryKey)

      // Optimistically update
      queryClient.setQueryData<Comment[]>(queryKey, (old = []) =>
        old.map((comment) =>
          comment.id === commentId
            ? { ...comment, isResolved: false }
            : comment
        )
      )

      return { previousComments }
    },
    onError: (_err, _commentId, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(queryKey, context.previousComments)
      }
      toast.error('Failed to unresolve comment. Please try again.')
    },
    onSuccess: () => {
      toast.success('Comment marked as unresolved.')
    },
    onSettled: () => {
      // Refetch to get the real data from server
      queryClient.invalidateQueries({ queryKey })
    },
  })

  // Edit reply mutation with ownership check
  const editReplyMutation = useMutation({
    mutationFn: ({
      replyId,
      data,
    }: {
      replyId: number
      data: Partial<NewCommentReply>
    }) => {
      // Client-side ownership check
      const reply = comments
        .flatMap((c) => c.replies)
        .find((r) => r.id === replyId)
      if (reply && currentUserId && reply.userId !== currentUserId) {
        return Promise.reject(
          new Error('You can only edit your own replies')
        )
      }
      return updateReply(replyId, data)
    },
    onMutate: async ({ replyId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot previous value
      const previousComments = queryClient.getQueryData<Comment[]>(queryKey)

      // Optimistically update
      queryClient.setQueryData<Comment[]>(queryKey, (old = []) =>
        old.map((comment) => ({
          ...comment,
          replies: comment.replies.map((reply) =>
            reply.id === replyId
              ? {
                  ...reply,
                  ...data,
                  updatedAt: new Date().toISOString(),
                }
              : reply
          ),
        }))
      )

      return { previousComments }
    },
    onError: (err, _variables, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(queryKey, context.previousComments)
      }
      toast.error(err instanceof Error ? err.message : 'Failed to edit reply.')
    },
    onSuccess: () => {
      toast.success('Reply updated successfully.')
    },
    onSettled: () => {
      // Refetch to get the real data from server
      queryClient.invalidateQueries({ queryKey })
    },
  })

  // Delete reply mutation with ownership check
  const deleteReplyMutation = useMutation({
    mutationFn: (replyId: number) => {
      // Client-side ownership check
      const reply = comments
        .flatMap((c) => c.replies)
        .find((r) => r.id === replyId)
      if (reply && currentUserId && reply.userId !== currentUserId) {
        return Promise.reject(
          new Error('You can only delete your own replies')
        )
      }
      return deleteReply(replyId)
    },
    onMutate: async (replyId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot previous value
      const previousComments = queryClient.getQueryData<Comment[]>(queryKey)

      // Optimistically remove reply
      queryClient.setQueryData<Comment[]>(queryKey, (old = []) =>
        old.map((comment) => ({
          ...comment,
          replies: comment.replies.filter((reply) => reply.id !== replyId),
        }))
      )

      return { previousComments }
    },
    onError: (err, _replyId, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(queryKey, context.previousComments)
      }
      toast.error(err instanceof Error ? err.message : 'Failed to delete reply.')
    },
    onSuccess: () => {
      toast.success('Reply deleted successfully.')
    },
    onSettled: () => {
      // Refetch to get the real data from server
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return {
    ...query,
    comments,
    addComment: addCommentMutation.mutate,
    isAddingComment: addCommentMutation.isPending,
    replyToComment: (commentId: number, data: NewCommentReply) =>
      replyMutation.mutate({ commentId, data }),
    isAddingReply: replyMutation.isPending,
    editComment: (commentId: number, data: Partial<NewComment>) =>
      editCommentMutation.mutate({ commentId, data }),
    isEditingComment: editCommentMutation.isPending,
    removeComment: deleteCommentMutation.mutate,
    isDeletingComment: deleteCommentMutation.isPending,
    resolve: resolveMutation.mutate,
    isResolving: resolveMutation.isPending,
    unresolve: unresolveMutation.mutate,
    isUnresolving: unresolveMutation.isPending,
    editReply: (replyId: number, data: Partial<NewCommentReply>) =>
      editReplyMutation.mutate({ replyId, data }),
    isEditingReply: editReplyMutation.isPending,
    removeReply: deleteReplyMutation.mutate,
    isDeletingReply: deleteReplyMutation.isPending,
  }
}
