/**
 * InlineCommentTool Component
 * 
 * Enables inline commenting on text content by:
 * - Allowing users to select text to comment on
 * - Showing comment indicators on highlighted text
 * - Opening a comment form at the selection point
 * - Linking comments to specific text ranges
 * 
 * Requirements: 7.4
 */

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import { MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { CommentForm } from './CommentForm'
import type { Comment } from '../../types'

export interface TextRange {
  /** Unique identifier for the text range */
  id: string
  /** Start offset in the text content */
  startOffset: number
  /** End offset in the text content */
  endOffset: number
  /** The selected text content */
  text: string
  /** Section reference for the comment */
  sectionReference?: string
}

export interface InlineComment extends Comment {
  /** Text range this comment is linked to */
  textRange: TextRange
}

export interface InlineCommentToolProps {
  /** Content to enable inline commenting on */
  children: ReactNode
  /** Existing inline comments */
  comments?: InlineComment[]
  /** Section reference for new comments */
  sectionReference?: string
  /** Available section references for the comment form */
  sectionReferences?: string[]
  /** Callback when a new comment is added */
  onAddComment?: (textRange: TextRange, commentData: any) => void | Promise<void>
  /** Whether commenting is enabled */
  enabled?: boolean
  /** Optional CSS class name */
  className?: string
  /** Whether to show comment indicators */
  showIndicators?: boolean
}

/**
 * InlineCommentTool Component
 * 
 * Wraps content to enable inline commenting functionality.
 * Users can select text to add comments, and existing comments
 * are highlighted with indicators.
 */
export function InlineCommentTool({
  children,
  comments = [],
  sectionReference,
  sectionReferences = [],
  onAddComment,
  enabled = true,
  className,
  showIndicators = true,
}: InlineCommentToolProps) {
  const [selectedRange, setSelectedRange] = useState<TextRange | null>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const selectionTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  /**
   * Get text content and calculate offsets for a selection
   */
  const getTextRange = useCallback((selection: Selection): TextRange | null => {
    if (!contentRef.current || selection.rangeCount === 0) return null

    const range = selection.getRangeAt(0)
    const selectedText = range.toString().trim()

    if (!selectedText) return null

    // Calculate offsets relative to the container
    const preSelectionRange = range.cloneRange()
    preSelectionRange.selectNodeContents(contentRef.current)
    preSelectionRange.setEnd(range.startContainer, range.startOffset)
    const startOffset = preSelectionRange.toString().length

    const endOffset = startOffset + selectedText.length

    return {
      id: `range-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startOffset,
      endOffset,
      text: selectedText,
      sectionReference,
    }
  }, [sectionReference])

  /**
   * Handle text selection
   */
  const handleSelection = useCallback(() => {
    if (!enabled) return

    // Clear any pending timeout
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current)
    }

    // Debounce selection handling
    selectionTimeoutRef.current = setTimeout(() => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) {
        setSelectedRange(null)
        setPopoverOpen(false)
        return
      }

      const textRange = getTextRange(selection)
      if (!textRange) {
        setSelectedRange(null)
        setPopoverOpen(false)
        return
      }

      // Get selection position for popover
      const rect = selection.getRangeAt(0).getBoundingClientRect()
      setPopoverPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom + window.scrollY,
      })

      setSelectedRange(textRange)
      setPopoverOpen(true)
    }, 300)
  }, [enabled, getTextRange])

  /**
   * Handle comment submission
   */
  const handleCommentSubmit = async (commentData: any) => {
    if (!selectedRange || !onAddComment) return

    setIsSubmitting(true)
    try {
      await onAddComment(selectedRange, commentData)
      
      // Clear selection
      window.getSelection()?.removeAllRanges()
      setSelectedRange(null)
      setPopoverOpen(false)
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Handle popover close
   */
  const handlePopoverClose = () => {
    setPopoverOpen(false)
    setSelectedRange(null)
    window.getSelection()?.removeAllRanges()
  }

  /**
   * Render content with comment highlights
   */
  const renderContentWithHighlights = () => {
    if (!showIndicators || comments.length === 0) {
      return children
    }

    // For now, return children as-is
    // In a full implementation, we would parse the text content
    // and wrap highlighted ranges with styled spans
    return children
  }

  // Set up selection listener
  useEffect(() => {
    if (!enabled) return

    const handleMouseUp = () => {
      handleSelection()
    }

    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('selectionchange', handleSelection)

    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('selectionchange', handleSelection)
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current)
      }
    }
  }, [enabled, handleSelection])

  return (
    <div className={cn('relative', className)}>
      {/* Content with inline commenting enabled */}
      <div
        ref={contentRef}
        className={cn(
          'relative',
          enabled && 'select-text cursor-text'
        )}
      >
        {renderContentWithHighlights()}
      </div>

      {/* Comment indicators for existing comments */}
      {showIndicators && comments.length > 0 && (
        <div className='mt-4 space-y-2'>
          <h4 className='text-sm font-semibold text-muted-foreground'>
            Inline Comments
          </h4>
          <div className='space-y-2'>
            {comments.map((comment) => (
              <div
                key={comment.id}
                className='flex items-start gap-2 rounded-md border bg-muted/50 p-2 text-sm'
              >
                <MessageSquare className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
                <div className='flex-1 space-y-1'>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium'>{comment.userName}</span>
                    <Badge variant='outline' className='text-xs'>
                      {comment.type}
                    </Badge>
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    "{comment.textRange.text}"
                  </p>
                  <p className='text-sm'>{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Popover for adding comments on selected text */}
      {enabled && selectedRange && (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverAnchor
            style={{
              position: 'absolute',
              left: `${popoverPosition.x}px`,
              top: `${popoverPosition.y}px`,
              width: 0,
              height: 0,
            }}
          />
          <PopoverContent
            className='w-[400px] p-4'
            align='center'
            side='bottom'
            onInteractOutside={handlePopoverClose}
            onEscapeKeyDown={handlePopoverClose}
          >
            <div className='space-y-4'>
              {/* Selected text preview */}
              <div className='space-y-2'>
                <h4 className='text-sm font-semibold'>Add Comment</h4>
                <div className='rounded-md bg-muted p-2'>
                  <p className='text-xs text-muted-foreground'>
                    Selected text:
                  </p>
                  <p className='text-sm italic'>
                    "{selectedRange.text.length > 100
                      ? `${selectedRange.text.substring(0, 100)}...`
                      : selectedRange.text}"
                  </p>
                </div>
              </div>

              {/* Comment form */}
              <CommentForm
                onSubmit={handleCommentSubmit}
                onCancel={handlePopoverClose}
                isLoading={isSubmitting}
                sectionReferences={sectionReferences}
                defaultValues={{
                  sectionReference: selectedRange.sectionReference,
                }}
              />
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Floating button to indicate selection is active */}
      {enabled && selectedRange && !popoverOpen && (
        <Button
          size='sm'
          className='fixed bottom-4 right-4 shadow-lg'
          onClick={() => setPopoverOpen(true)}
        >
          <MessageSquare className='mr-2 size-4' />
          Add Comment
        </Button>
      )}
    </div>
  )
}
