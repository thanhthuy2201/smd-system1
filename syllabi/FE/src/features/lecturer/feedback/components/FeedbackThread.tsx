/**
 * FeedbackThread Component
 * 
 * Displays comments organized by section with threaded replies.
 * Supports filtering by resolved/active status and provides actions
 * for replying, editing, deleting, and resolving comments.
 * 
 * Requirements: 7.1, 7.6, 7.9, 7.10
 */

import { useState, useMemo } from 'react'
import {
  MessageSquare,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  Check,
  Reply,
  MoreVertical,
  Trash2,
  Edit,
  Filter,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Comment, CommentType, Priority } from '../../types'

export interface FeedbackThreadProps {
  /** Array of comments to display */
  comments: Comment[]
  /** Current user's ID for ownership checks */
  currentUserId: number
  /** Callback when replying to a comment */
  onReply?: (commentId: number, text: string) => void
  /** Callback when editing a comment */
  onEdit?: (commentId: number, text: string) => void
  /** Callback when deleting a comment */
  onDelete?: (commentId: number) => void
  /** Callback when resolving a comment */
  onResolve?: (commentId: number) => void
  /** Whether to show resolved comments by default */
  showResolved?: boolean
  /** Optional CSS class name */
  className?: string
  /** Whether to group comments by section */
  groupBySection?: boolean
}

const commentTypeIcons: Record<CommentType, typeof MessageSquare> = {
  Suggestion: Lightbulb,
  Question: HelpCircle,
  Error: AlertTriangle,
  General: MessageSquare,
}

const commentTypeColors: Record<CommentType, string> = {
  Suggestion: 'text-blue-600 dark:text-blue-400',
  Question: 'text-purple-600 dark:text-purple-400',
  Error: 'text-destructive',
  General: 'text-muted-foreground',
}

const priorityColors: Record<Priority, string> = {
  Low: 'border-green-500 text-green-700 dark:text-green-400',
  Medium: 'border-yellow-500 text-yellow-700 dark:text-yellow-400',
  High: 'border-red-500 text-red-700 dark:text-red-400',
}

/**
 * FeedbackThread Component
 * 
 * Displays a threaded list of comments with support for:
 * - Organizing comments by section
 * - Filtering by resolved/active status
 * - Filtering by comment type
 * - Threaded replies
 * - Edit/delete for comment owners
 * - Marking comments as resolved
 */
export function FeedbackThread({
  comments,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onResolve,
  showResolved = false,
  className,
  groupBySection = false,
}: FeedbackThreadProps) {
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [editingComment, setEditingComment] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [editText, setEditText] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'resolved'>(
    showResolved ? 'all' : 'active'
  )
  const [filterTypes, setFilterTypes] = useState<Set<CommentType>>(new Set())

  // Filter comments based on status and type
  const filteredComments = useMemo(() => {
    let filtered = comments

    // Filter by resolved status
    if (filterStatus === 'active') {
      filtered = filtered.filter((c) => !c.isResolved)
    } else if (filterStatus === 'resolved') {
      filtered = filtered.filter((c) => c.isResolved)
    }

    // Filter by comment type
    if (filterTypes.size > 0) {
      filtered = filtered.filter((c) => filterTypes.has(c.type))
    }

    return filtered
  }, [comments, filterStatus, filterTypes])

  // Group comments by section if requested
  const groupedComments = useMemo(() => {
    if (!groupBySection) {
      return { 'All Comments': filteredComments }
    }

    const groups: Record<string, Comment[]> = {}
    filteredComments.forEach((comment) => {
      const section = comment.sectionReference || 'General'
      if (!groups[section]) {
        groups[section] = []
      }
      groups[section].push(comment)
    })

    return groups
  }, [filteredComments, groupBySection])

  const handleReplySubmit = (commentId: number) => {
    if (replyText.trim() && onReply) {
      onReply(commentId, replyText.trim())
      setReplyText('')
      setReplyingTo(null)
    }
  }

  const handleEditSubmit = (commentId: number) => {
    if (editText.trim() && onEdit) {
      onEdit(commentId, editText.trim())
      setEditText('')
      setEditingComment(null)
    }
  }

  const startEditing = (comment: Comment) => {
    setEditingComment(comment.id)
    setEditText(comment.text)
  }

  const toggleTypeFilter = (type: CommentType) => {
    const newFilters = new Set(filterTypes)
    if (newFilters.has(type)) {
      newFilters.delete(type)
    } else {
      newFilters.add(type)
    }
    setFilterTypes(newFilters)
  }

  const activeFilterCount = (filterStatus !== 'all' ? 1 : 0) + filterTypes.size

  if (comments.length === 0) {
    return (
      <div
        className={cn(
          'rounded-lg border border-dashed p-8 text-center',
          className
        )}
      >
        <MessageSquare
          className='mx-auto mb-2 size-8 text-muted-foreground'
          aria-hidden='true'
        />
        <p className='text-sm text-muted-foreground'>
          No comments yet. Be the first to add feedback!
        </p>
      </div>
    )
  }

  if (filteredComments.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Filter Controls */}
        <div className='flex items-center justify-between gap-4'>
          <Tabs
            value={filterStatus}
            onValueChange={(value) =>
              setFilterStatus(value as 'all' | 'active' | 'resolved')
            }
          >
            <TabsList>
              <TabsTrigger value='all'>All</TabsTrigger>
              <TabsTrigger value='active'>Active</TabsTrigger>
              <TabsTrigger value='resolved'>Resolved</TabsTrigger>
            </TabsList>
          </Tabs>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm'>
                <Filter className='mr-2 size-4' />
                Filter
                {activeFilterCount > 0 && (
                  <Badge variant='secondary' className='ml-2'>
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-56'>
              <DropdownMenuLabel>Comment Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={filterTypes.has('Suggestion')}
                onCheckedChange={() => toggleTypeFilter('Suggestion')}
              >
                <Lightbulb className='mr-2 size-4 text-blue-600' />
                Suggestions
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filterTypes.has('Question')}
                onCheckedChange={() => toggleTypeFilter('Question')}
              >
                <HelpCircle className='mr-2 size-4 text-purple-600' />
                Questions
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filterTypes.has('Error')}
                onCheckedChange={() => toggleTypeFilter('Error')}
              >
                <AlertTriangle className='mr-2 size-4 text-destructive' />
                Errors
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filterTypes.has('General')}
                onCheckedChange={() => toggleTypeFilter('General')}
              >
                <MessageSquare className='mr-2 size-4 text-muted-foreground' />
                General
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className='rounded-lg border border-dashed p-8 text-center'>
          <MessageSquare
            className='mx-auto mb-2 size-8 text-muted-foreground'
            aria-hidden='true'
          />
          <p className='text-sm text-muted-foreground'>
            No comments match your filters. Try adjusting your filter criteria.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filter Controls */}
      <div className='flex items-center justify-between gap-4'>
        <Tabs
          value={filterStatus}
          onValueChange={(value) =>
            setFilterStatus(value as 'all' | 'active' | 'resolved')
          }
        >
          <TabsList>
            <TabsTrigger value='all'>
              All ({comments.length})
            </TabsTrigger>
            <TabsTrigger value='active'>
              Active ({comments.filter((c) => !c.isResolved).length})
            </TabsTrigger>
            <TabsTrigger value='resolved'>
              Resolved ({comments.filter((c) => c.isResolved).length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='sm'>
              <Filter className='mr-2 size-4' />
              Filter
              {activeFilterCount > 0 && (
                <Badge variant='secondary' className='ml-2'>
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-56'>
            <DropdownMenuLabel>Comment Type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={filterTypes.has('Suggestion')}
              onCheckedChange={() => toggleTypeFilter('Suggestion')}
            >
              <Lightbulb className='mr-2 size-4 text-blue-600' />
              Suggestions
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filterTypes.has('Question')}
              onCheckedChange={() => toggleTypeFilter('Question')}
            >
              <HelpCircle className='mr-2 size-4 text-purple-600' />
              Questions
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filterTypes.has('Error')}
              onCheckedChange={() => toggleTypeFilter('Error')}
            >
              <AlertTriangle className='mr-2 size-4 text-destructive' />
              Errors
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filterTypes.has('General')}
              onCheckedChange={() => toggleTypeFilter('General')}
            >
              <MessageSquare className='mr-2 size-4 text-muted-foreground' />
              General
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Comments List */}
      {Object.entries(groupedComments).map(([section, sectionComments]) => (
        <div key={section} className='space-y-4'>
          {groupBySection && (
            <h3 className='text-sm font-semibold text-muted-foreground'>
              {section}
            </h3>
          )}

          <div className='space-y-4' role='list'>
            {sectionComments.map((comment) => {
              const Icon = commentTypeIcons[comment.type]
              const isOwner = comment.userId === currentUserId

              return (
                <Card
                  key={comment.id}
                  role='listitem'
                  className={cn(
                    'p-4 transition-opacity',
                    comment.isResolved && 'opacity-60'
                  )}
                >
                  {/* Comment Header */}
                  <div className='mb-3 flex items-start justify-between gap-2'>
                    <div className='flex items-start gap-3'>
                      <Icon
                        className={cn(
                          'mt-0.5 size-5',
                          commentTypeColors[comment.type]
                        )}
                        aria-hidden='true'
                      />
                      <div className='space-y-1'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <span className='font-medium'>{comment.userName}</span>
                          {comment.userRole && (
                            <span className='text-xs text-muted-foreground'>
                              ({comment.userRole})
                            </span>
                          )}
                          <Badge variant='outline' className='text-xs'>
                            {comment.type}
                          </Badge>
                          {comment.priority && comment.type === 'Error' && (
                            <Badge
                              variant='outline'
                              className={cn(
                                'text-xs',
                                priorityColors[comment.priority]
                              )}
                            >
                              {comment.priority} Priority
                            </Badge>
                          )}
                          {comment.isResolved && (
                            <Badge variant='secondary' className='text-xs'>
                              <Check className='mr-1 size-3' aria-hidden='true' />
                              Resolved
                            </Badge>
                          )}
                        </div>
                        <p className='text-xs text-muted-foreground'>
                          {new Date(comment.createdAt).toLocaleString()}
                          {comment.sectionReference && !groupBySection && (
                            <span className='ml-2'>
                              · Section: {comment.sectionReference}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    {isOwner && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-8 w-8 p-0'
                            aria-label='Comment actions'
                          >
                            <MoreVertical className='size-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          {onEdit && (
                            <DropdownMenuItem onClick={() => startEditing(comment)}>
                              <Edit className='mr-2 size-4' />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem
                              onClick={() => onDelete(comment.id)}
                              className='text-destructive'
                            >
                              <Trash2 className='mr-2 size-4' />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {/* Comment Text */}
                  {editingComment === comment.id ? (
                    <div className='mb-3 space-y-2'>
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        placeholder='Edit your comment...'
                        className='min-h-[80px]'
                        aria-label='Edit comment text'
                      />
                      <div className='flex gap-2'>
                        <Button
                          size='sm'
                          onClick={() => handleEditSubmit(comment.id)}
                          disabled={!editText.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => {
                            setEditingComment(null)
                            setEditText('')
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className='mb-3 whitespace-pre-wrap text-sm'>
                      {comment.text}
                    </p>
                  )}

                  {/* Replies */}
                  {comment.replies.length > 0 && (
                    <div className='mb-3 space-y-3 border-l-2 border-muted pl-4'>
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className='space-y-1'>
                          <div className='flex items-center gap-2'>
                            <span className='text-sm font-medium'>
                              {reply.userName}
                            </span>
                            {reply.userRole && (
                              <span className='text-xs text-muted-foreground'>
                                ({reply.userRole})
                              </span>
                            )}
                            <span className='text-xs text-muted-foreground'>
                              {new Date(reply.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className='whitespace-pre-wrap text-sm text-muted-foreground'>
                            {reply.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Form */}
                  {replyingTo === comment.id ? (
                    <div className='space-y-2 border-t pt-3'>
                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder='Write a reply...'
                        className='min-h-[80px]'
                        aria-label='Reply text'
                      />
                      <div className='flex gap-2'>
                        <Button
                          size='sm'
                          onClick={() => handleReplySubmit(comment.id)}
                          disabled={!replyText.trim()}
                        >
                          Reply
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => {
                            setReplyingTo(null)
                            setReplyText('')
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className='flex gap-2 border-t pt-3'>
                      {onReply && (
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => setReplyingTo(comment.id)}
                        >
                          <Reply className='mr-2 size-4' />
                          Reply
                        </Button>
                      )}
                      {onResolve && !comment.isResolved && (
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => onResolve(comment.id)}
                        >
                          <Check className='mr-2 size-4' />
                          Mark as Resolved
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
