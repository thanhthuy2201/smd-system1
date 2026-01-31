/**
 * SubmissionConfirmation Modal Component
 *
 * Modal dialog for confirming syllabus submission with:
 * - Final review summary of syllabus details
 * - Optional notes textarea for submission comments
 * - Explicit confirmation checkbox requirement
 * - Submission progress indicator
 * - Keyboard navigation support (Escape to close)
 * - Focus management and ARIA labels
 *
 * Requirements: 4.10, 4.11, 11.3, 11.8
 */
import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, FileText, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from '../hooks/useTranslation'
import {
  submissionNotesSchema,
  type SubmissionNotesFormData,
} from '../schemas/syllabus.schema'
import type { Syllabus } from '../types'

export interface SubmissionConfirmationProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void
  /** Syllabus data for review summary */
  syllabus: Syllabus
  /** Whether submission is in progress */
  isSubmitting?: boolean
  /** Submission progress percentage (0-100) */
  progress?: number
  /** Callback when submission is confirmed */
  onConfirm: (notes?: string) => void
  /** Optional error message */
  error?: string | null
}

/**
 * Modal for confirming syllabus submission
 *
 * Displays a final review summary and requires explicit confirmation
 * before submitting the syllabus for review.
 *
 * @example
 * ```tsx
 * <SubmissionConfirmation
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   syllabus={syllabusData}
 *   isSubmitting={mutation.isPending}
 *   progress={uploadProgress}
 *   onConfirm={(notes) => submitMutation.mutate({ id: syllabusId, notes })}
 * />
 * ```
 */
export function SubmissionConfirmation({
  open,
  onOpenChange,
  syllabus,
  isSubmitting = false,
  progress = 0,
  onConfirm,
  error,
}: SubmissionConfirmationProps) {
  const [showProgress, setShowProgress] = useState(false)
  const { t } = useTranslation()

  const form = useForm<SubmissionNotesFormData>({
    resolver: zodResolver(submissionNotesSchema),
    defaultValues: {
      notes: '',
      confirm: false,
    },
  })

  // Watch the confirm field value
  const confirmValue = form.watch('confirm')

  const handleSubmit = (values: SubmissionNotesFormData) => {
    setShowProgress(true)
    onConfirm(values.notes)
  }

  const dialogRef = useRef<HTMLDivElement>(null)

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open && !isSubmitting) {
        event.preventDefault()
        handleOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, isSubmitting])

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      form.reset()
      setShowProgress(false)
      onOpenChange(newOpen)
    }
  }

  // Calculate summary statistics
  const stats = {
    clos: syllabus.clos?.length || 0,
    topics: syllabus.content?.length || 0,
    assessments: syllabus.assessments?.length || 0,
    references: syllabus.references?.length || 0,
    totalHours: syllabus.totalHours || 0,
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className='sm:max-w-2xl'
        ref={dialogRef}
        aria-describedby='submission-description'
      >
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <FileText className='size-5' aria-hidden='true' />
            {t('submission.title')}
          </DialogTitle>
          <DialogDescription id='submission-description'>
            {t('submission.reviewSummary')}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Review Summary */}
          <div className='rounded-lg border bg-muted/50 p-4'>
            <h3 className='mb-3 text-sm font-semibold'>
              {t('submission.summary')}
            </h3>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>
                  {t('submission.course')}:
                </span>
                <span className='font-medium'>
                  {syllabus.courseCode} - {syllabus.courseName}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>
                  {t('submission.academicPeriod')}:
                </span>
                <span className='font-medium'>
                  {syllabus.semester} {syllabus.academicYear}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>
                  {t('submission.credits')}:
                </span>
                <span className='font-medium'>{syllabus.credits}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>
                  {t('submission.totalHours')}:
                </span>
                <span className='font-medium'>{stats.totalHours}</span>
              </div>
            </div>

            <div className='mt-4 grid grid-cols-2 gap-3 border-t pt-3 sm:grid-cols-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-primary'>
                  {stats.clos}
                </div>
                <div className='text-xs text-muted-foreground'>
                  {t('submission.statistics.clos')}
                </div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-primary'>
                  {stats.topics}
                </div>
                <div className='text-xs text-muted-foreground'>
                  {t('submission.statistics.topics')}
                </div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-primary'>
                  {stats.assessments}
                </div>
                <div className='text-xs text-muted-foreground'>
                  {t('submission.statistics.assessments')}
                </div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-primary'>
                  {stats.references}
                </div>
                <div className='text-xs text-muted-foreground'>
                  {t('submission.statistics.references')}
                </div>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant='destructive' role='alert' aria-live='assertive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submission Progress */}
          {showProgress && isSubmitting && (
            <div className='space-y-2' role='status' aria-live='polite'>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>
                  {t('submission.submitting')}
                </span>
                <span className='font-medium' aria-label={`Progress: ${Math.round(progress)} percent`}>
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className='h-2' aria-label='Submission progress' />
            </div>
          )}

          {/* Form */}
          <Form {...form}>
            <form
              id='submission-form'
              onSubmit={form.handleSubmit(handleSubmit)}
              className='space-y-4'
            >
              {/* Optional Notes */}
              <FormField
                control={form.control}
                name='notes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor='submission-notes'>
                      {t('submission.notes.label')}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        id='submission-notes'
                        placeholder={t('submission.notes.placeholder')}
                        className='min-h-[100px] resize-none'
                        disabled={isSubmitting}
                        aria-describedby='notes-description'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription id='notes-description'>
                      {t('submission.notes.description')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirmation Checkbox */}
              <FormField
                control={form.control}
                name='confirm'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-start space-y-0 space-x-3 rounded-lg border p-4'>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                        aria-required='true'
                      />
                    </FormControl>
                    <div className='space-y-1 leading-none'>
                      <FormLabel
                        className={cn(
                          'cursor-pointer',
                          isSubmitting && 'cursor-not-allowed opacity-50'
                        )}
                      >
                        {t('submission.confirmation.label')}
                      </FormLabel>
                      <FormDescription>
                        {t('submission.confirmation.description')}
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </form>
          </Form>

          {/* Success Message */}
          {showProgress && !isSubmitting && !error && (
            <Alert 
              className='border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/20'
              role='status'
              aria-live='polite'
            >
              <CheckCircle2 className='size-4 text-green-600 dark:text-green-500' aria-hidden='true' />
              <AlertDescription className='text-green-900 dark:text-green-100'>
                {t('submission.success')}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className='gap-2 sm:gap-0'>
          <Button
            type='button'
            variant='outline'
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
            aria-label='Cancel submission'
          >
            {t('common.cancel')}
          </Button>
          <Button
            type='submit'
            form='submission-form'
            disabled={isSubmitting || !confirmValue}
            aria-label={isSubmitting ? 'Submitting syllabus' : 'Submit syllabus for review'}
          >
            {isSubmitting ? (
              <>
                <Loader2
                  className='mr-2 size-4 animate-spin'
                  aria-hidden='true'
                />
                {t('common.submitting')}
              </>
            ) : (
              t('submission.submitForReview')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
