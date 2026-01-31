/**
 * CommentForm Component
 * 
 * Form for adding new comments to syllabi with support for:
 * - Comment type selection (Suggestion, Question, Error, General)
 * - Optional section reference
 * - Priority selection for error comments
 * - Text validation (10-1000 characters)
 * - Full keyboard navigation and ARIA labels
 * 
 * Requirements: 7.2-7.5, 11.3, 11.4
 */

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  MessageSquare,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { commentSchema, type CommentFormData } from '../../schemas/feedback.schema'
import type { CommentType, Priority } from '../../types'

export interface CommentFormProps {
  /** Callback when form is submitted */
  onSubmit: (data: CommentFormData) => void | Promise<void>
  /** Callback when form is cancelled */
  onCancel?: () => void
  /** Whether the form is in a loading state */
  isLoading?: boolean
  /** Available section references for the syllabus */
  sectionReferences?: string[]
  /** Default values for the form */
  defaultValues?: Partial<CommentFormData>
  /** Optional CSS class name */
  className?: string
}

const commentTypeOptions: Array<{
  value: CommentType
  label: string
  description: string
  icon: typeof MessageSquare
  color: string
}> = [
  {
    value: 'Suggestion',
    label: 'Suggestion',
    description: 'Propose an improvement or alternative approach',
    icon: Lightbulb,
    color: 'text-blue-600 dark:text-blue-400',
  },
  {
    value: 'Question',
    label: 'Question',
    description: 'Ask for clarification or additional information',
    icon: HelpCircle,
    color: 'text-purple-600 dark:text-purple-400',
  },
  {
    value: 'Error',
    label: 'Error',
    description: 'Report an issue that needs to be fixed',
    icon: AlertTriangle,
    color: 'text-destructive',
  },
  {
    value: 'General',
    label: 'General',
    description: 'General feedback or observation',
    icon: MessageSquare,
    color: 'text-muted-foreground',
  },
]

const priorityOptions: Array<{
  value: Priority
  label: string
  description: string
}> = [
  {
    value: 'Low',
    label: 'Low',
    description: 'Minor issue, can be addressed later',
  },
  {
    value: 'Medium',
    label: 'Medium',
    description: 'Should be addressed before approval',
  },
  {
    value: 'High',
    label: 'High',
    description: 'Critical issue, must be fixed immediately',
  },
]

/**
 * CommentForm Component
 * 
 * Provides a form for adding comments with validation and conditional fields.
 * Priority field is only shown when comment type is "Error".
 */
export function CommentForm({
  onSubmit,
  onCancel,
  isLoading = false,
  sectionReferences = [],
  defaultValues,
  className,
}: CommentFormProps) {
  const [characterCount, setCharacterCount] = useState(0)

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      type: defaultValues?.type || 'General',
      sectionReference: defaultValues?.sectionReference || '',
      text: defaultValues?.text || '',
      priority: defaultValues?.priority,
    },
  })

  const selectedType = form.watch('type')
  const commentText = form.watch('text')

  // Update character count when text changes
  useEffect(() => {
    setCharacterCount(commentText?.length || 0)
  }, [commentText])

  // Clear priority when type changes from Error to something else
  useEffect(() => {
    if (selectedType !== 'Error') {
      form.setValue('priority', undefined)
    }
  }, [selectedType, form])

  const handleSubmit = async (data: CommentFormData) => {
    await onSubmit(data)
    form.reset()
  }

  const selectedTypeOption = commentTypeOptions.find(
    (option) => option.value === selectedType
  )
  const Icon = selectedTypeOption?.icon || MessageSquare

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn('space-y-4', className)}
      >
        {/* Comment Type Selector */}
        <FormField
          control={form.control}
          name='type'
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor='comment-type'>Comment Type *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger 
                    id='comment-type'
                    aria-label='Select comment type'
                    aria-describedby='comment-type-description'
                  >
                    <SelectValue placeholder='Select a comment type' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {commentTypeOptions.map((option) => {
                    const OptionIcon = option.icon
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className='flex items-center gap-2'>
                          <OptionIcon
                            className={cn('size-4', option.color)}
                            aria-hidden='true'
                          />
                          <div>
                            <div className='font-medium'>{option.label}</div>
                            <div className='text-xs text-muted-foreground'>
                              {option.description}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <FormDescription id='comment-type-description'>
                Choose the type that best describes your comment
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Section Reference Selector */}
        {sectionReferences.length > 0 && (
          <FormField
            control={form.control}
            name='sectionReference'
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor='section-reference'>
                  Section Reference (Optional)
                </FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === '__none__' ? '' : value)}
                  defaultValue={field.value || '__none__'}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger 
                      id='section-reference'
                      aria-label='Select section reference'
                      aria-describedby='section-reference-description'
                    >
                      <SelectValue placeholder='Select a section (optional)' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='__none__'>None</SelectItem>
                    {sectionReferences.map((section) => (
                      <SelectItem key={section} value={section}>
                        {section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription id='section-reference-description'>
                  Indicate which section of the syllabus this comment addresses
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Priority Selector (only for Error comments) */}
        {selectedType === 'Error' && (
          <FormField
            control={form.control}
            name='priority'
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor='priority-level'>Priority *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger 
                      id='priority-level'
                      aria-label='Select priority level'
                      aria-describedby='priority-description'
                    >
                      <SelectValue placeholder='Select priority level' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <div className='font-medium'>{option.label}</div>
                          <div className='text-xs text-muted-foreground'>
                            {option.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription id='priority-description'>
                  Indicate the urgency of this error
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Comment Text */}
        <FormField
          control={form.control}
          name='text'
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor='comment-text'>Comment *</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  id='comment-text'
                  placeholder='Write your comment here...'
                  className='min-h-[120px] resize-y'
                  disabled={isLoading}
                  aria-label='Comment text'
                  aria-describedby='comment-text-description character-count'
                  aria-invalid={characterCount < 10 || characterCount > 1000}
                />
              </FormControl>
              <div className='flex items-center justify-between'>
                <FormDescription id='comment-text-description'>
                  Provide detailed feedback (10-1000 characters)
                </FormDescription>
                <span
                  id='character-count'
                  className={cn(
                    'text-xs',
                    characterCount < 10
                      ? 'text-muted-foreground'
                      : characterCount > 1000
                        ? 'text-destructive'
                        : 'text-green-600 dark:text-green-400'
                  )}
                  aria-live='polite'
                  role='status'
                >
                  {characterCount} / 1000
                </span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className='flex items-center justify-end gap-2 pt-2'>
          {onCancel && (
            <Button
              type='button'
              variant='outline'
              onClick={onCancel}
              disabled={isLoading}
              aria-label='Cancel comment'
            >
              Cancel
            </Button>
          )}
          <Button 
            type='submit' 
            disabled={isLoading}
            aria-label={isLoading ? 'Submitting comment' : 'Add comment'}
          >
            {isLoading ? (
              <>
                <span 
                  className='mr-2 inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent'
                  aria-hidden='true'
                />
                Submitting...
              </>
            ) : (
              <>
                <Icon className='mr-2 size-4' aria-hidden='true' />
                Add Comment
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
