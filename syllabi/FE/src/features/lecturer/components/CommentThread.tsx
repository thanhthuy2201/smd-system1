import { useState } from 'react'
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
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'

export type CommentType = 'Suggestion' | 'Question' | 'Error' | 'General'
export type CommentPriority = 'Low' | 'Medium' | 'High'

export interface CommentReply {
  id: number
  commentId: number
  userId: number
  userName: string
  text: string
  createdAt: string
}

export interface Comment {
  id: number
  syllabusId: number
  userId: number
  userName: string
  type: CommentType
  sectionReference?: string
  text: string
  priority?: CommentPriority
  isResolved: boolean
  createdAt: string
  replies: CommentReply[]
}

export interface CommentThreadProps {
  comments: Comment[]
  currentUserId: number
  onReply?: (commentId: number, text: string) => void
  onEdit?: (commentId: number, text: string) => void
  onDelete?: (commentId: number) => void
  onResolve?: (commentId: number) => void
  showResolved?: boolean
  className?: string
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

const priorityColors: Record<CommentPriority, string> = {
  Low: 'border-green-500 text-green-700 dark:text-green-400',
  Medium: 'border-yellow-500 text-yellow-700 dark:text-yellow-400',
  High: 'border-red-500 text-red-700 dark:text-red-400',
}

export function CommentThread({
  comments,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onResolve,
  showResolved = false,
  className,
}: CommentThreadProps) {
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [editingComment, setEditingComment] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [editText, setEditText] = useState('')

  const filteredComments = showResolved
    ? comments
    : comments.filter((c) => !c.isResolved)

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

  if (filteredComments.length === 0) {
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
          {showResolved
            ? 'No comments yet'
            : 'No active comments. All comments have been resolved.'}
        </p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)} role='list'>
      {filteredComments.map((comment) => {
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
                    {comment.sectionReference && (
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
              <p className='mb-3 text-sm whitespace-pre-wrap'>{comment.text}</p>
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
                      <span className='text-xs text-muted-foreground'>
                        {new Date(reply.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className='text-sm whitespace-pre-wrap text-muted-foreground'>
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
  )
}
