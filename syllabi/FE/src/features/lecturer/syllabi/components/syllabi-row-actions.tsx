/**
 * Syllabi Row Actions Component
 *
 * Provides action buttons for each syllabus row based on status:
 * - Draft: Edit, Delete, Submit
 * - Pending Review: View, Withdraw
 * - Revision Required: Edit, View Feedback
 * - Approved: View, Request Update
 * - Archived: View
 *
 * Requirements: 3.1-3.5
 */
import { useNavigate } from '@tanstack/react-router'
import { type Row } from '@tanstack/react-table'
import {
  Edit,
  Eye,
  MoreHorizontal,
  Send,
  Trash2,
  XCircle,
  MessageSquare,
  FileEdit,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Syllabus } from '../../types'

interface SyllabiRowActionsProps {
  row: Row<Syllabus>
}

/**
 * Row actions dropdown menu with status-based actions
 */
export function SyllabiRowActions({ row }: SyllabiRowActionsProps) {
  const navigate = useNavigate()
  const syllabus = row.original

  const handleView = () => {
    navigate({
      to: '/syllabus/view/$id',
      params: { id: syllabus.id.toString() },
    })
  }

  const handleEdit = () => {
    navigate({
      to: '/syllabus/edit/$id',
      params: { id: syllabus.id.toString() },
    })
  }

  const handleSubmit = () => {
    // TODO: Navigate to submission page
    navigate({
      to: '/syllabus/edit/$id',
      params: { id: syllabus.id.toString() },
      search: { action: 'submit' },
    })
  }

  const handleDelete = () => {
    // TODO: Implement delete confirmation dialog
    // Placeholder for delete functionality
  }

  const handleWithdraw = () => {
    // TODO: Implement withdraw confirmation dialog
    // Placeholder for withdraw functionality
  }

  const handleViewFeedback = () => {
    // TODO: Navigate to feedback view
    navigate({
      to: '/syllabus/view/$id',
      params: { id: syllabus.id.toString() },
      search: { tab: 'feedback' },
    })
  }

  const handleRequestUpdate = () => {
    // TODO: Navigate to update request form
    // Placeholder for update request functionality
  }

  // Determine available actions based on status
  const isDraft = syllabus.status === 'Draft'
  const isPendingReview = syllabus.status === 'Pending Review'
  const isRevisionRequired = syllabus.status === 'Revision Required'
  const isApproved = syllabus.status === 'Approved'

  // Can edit if Draft or Revision Required
  const canEdit = isDraft || isRevisionRequired

  // Can delete only if Draft
  const canDelete = isDraft

  // Can submit if Draft
  const canSubmit = isDraft

  // Can withdraw if Pending Review
  const canWithdraw = isPendingReview

  // Can view feedback if Revision Required
  const canViewFeedback = isRevisionRequired

  // Can request update if Approved
  const canRequestUpdate = isApproved

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
        >
          <MoreHorizontal className='h-4 w-4' />
          <span className='sr-only'>Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[180px]'>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* View - Always available */}
        <DropdownMenuItem onClick={handleView}>
          <Eye className='mr-2 h-4 w-4' />
          View
        </DropdownMenuItem>

        {/* Edit - Available for Draft and Revision Required */}
        {canEdit && (
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className='mr-2 h-4 w-4' />
            Edit
          </DropdownMenuItem>
        )}

        {/* Submit - Available for Draft */}
        {canSubmit && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSubmit}>
              <Send className='mr-2 h-4 w-4' />
              Submit for Review
            </DropdownMenuItem>
          </>
        )}

        {/* Withdraw - Available for Pending Review */}
        {canWithdraw && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleWithdraw}>
              <XCircle className='mr-2 h-4 w-4' />
              Withdraw Submission
            </DropdownMenuItem>
          </>
        )}

        {/* View Feedback - Available for Revision Required */}
        {canViewFeedback && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleViewFeedback}>
              <MessageSquare className='mr-2 h-4 w-4' />
              View Feedback
            </DropdownMenuItem>
          </>
        )}

        {/* Request Update - Available for Approved */}
        {canRequestUpdate && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleRequestUpdate}>
              <FileEdit className='mr-2 h-4 w-4' />
              Request Update
            </DropdownMenuItem>
          </>
        )}

        {/* Delete - Available for Draft only */}
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className='text-destructive focus:text-destructive'
            >
              <Trash2 className='mr-2 h-4 w-4' />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
