/**
 * UpdateRequestForm Component
 *
 * Form for creating post-approval update requests with:
 * - Approved syllabi list selector
 * - Change type selector (Minor Update, Content Revision, Major Restructure)
 * - Affected sections multi-select
 * - Justification textarea with validation (50-2000 characters)
 * - Effective semester selector
 * - Urgency selector (Normal, High)
 * - Supporting documents upload (max 10 files, 10MB each)
 *
 * Requirements: 9.1-9.7
 */

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  FileText,
  X,
  Upload,
  AlertCircle,
  CheckCircle2,
  FileWarning,
  type Wrench,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  updateRequestSchema,
  type UpdateRequestFormData,
} from '../../schemas/update-request.schema'
import type { Syllabus, ChangeType } from '../../types'

export interface UpdateRequestFormProps {
  /** List of approved syllabi eligible for update requests */
  approvedSyllabi: Syllabus[]
  /** Pre-selected syllabus ID */
  defaultSyllabusId?: number
  /** Callback when form is submitted successfully */
  onSubmit: (data: UpdateRequestFormData) => void | Promise<void>
  /** Callback when form is cancelled */
  onCancel?: () => void
  /** Whether the form is in a loading state */
  isLoading?: boolean
  /** Optional CSS class name */
  className?: string
}

// Available sections that can be affected by updates
const AVAILABLE_SECTIONS = [
  'Course Information',
  'Course Description',
  'Learning Outcomes (CLOs)',
  'CLO-PLO Mapping',
  'Course Content',
  'Assessment Methods',
  'References',
  'Prerequisites',
  'Teaching Methods',
] as const

// Change type options with descriptions and icons
const changeTypeOptions: Array<{
  value: ChangeType
  label: string
  description: string
  icon: typeof Wrench
  color: string
}> = [
  {
    value: 'Minor Update',
    label: 'Minor Update',
    description: 'Small corrections or clarifications (typos, formatting, minor wording)',
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
  },
  {
    value: 'Content Revision',
    label: 'Content Revision',
    description: 'Moderate changes to content, assessments, or references',
    icon: FileText,
    color: 'text-blue-600 dark:text-blue-400',
  },
  {
    value: 'Major Restructure',
    label: 'Major Restructure',
    description: 'Significant changes to learning outcomes, structure, or methodology',
    icon: FileWarning,
    color: 'text-orange-600 dark:text-orange-400',
  },
]

/**
 * UpdateRequestForm Component
 *
 * Provides a comprehensive form for creating update requests for approved syllabi.
 * Includes validation, file upload, and multi-select for affected sections.
 *
 * @example
 * ```tsx
 * <UpdateRequestForm
 *   approvedSyllabi={syllabi}
 *   defaultSyllabusId={123}
 *   onSubmit={handleSubmit}
 *   onCancel={() => navigate('/lecturer/update-requests')}
 * />
 * ```
 */
export function UpdateRequestForm({
  approvedSyllabi,
  defaultSyllabusId,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: UpdateRequestFormProps) {
  // File attachments state
  const [attachments, setAttachments] = useState<File[]>([])

  // Character count for justification
  const [justificationCount, setJustificationCount] = useState(0)

  // Initialize form
  const form = useForm<UpdateRequestFormData>({
    resolver: zodResolver(updateRequestSchema),
    defaultValues: {
      syllabusId: defaultSyllabusId || 0,
      changeType: 'Minor Update',
      affectedSections: [],
      justification: '',
      effectiveSemester: '',
      urgency: 'Normal',
      supportingDocuments: [],
    },
  })

  // Watch form values
  const selectedSyllabusId = form.watch('syllabusId')
  const selectedChangeType = form.watch('changeType')
  const justification = form.watch('justification')
  const affectedSections = form.watch('affectedSections')

  // Update character count when justification changes
  useEffect(() => {
    setJustificationCount(justification?.length || 0)
  }, [justification])

  // Find selected syllabus
  const selectedSyllabus = approvedSyllabi.find(
    (s) => s.id === selectedSyllabusId
  )

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    // Validate file count
    if (attachments.length + files.length > 10) {
      toast.error('Maximum 10 supporting documents allowed')
      return
    }

    // Validate file sizes
    const invalidFiles = files.filter((f) => f.size > 10 * 1024 * 1024)
    if (invalidFiles.length > 0) {
      toast.error('Each file must be 10MB or less')
      return
    }

    // Add files
    const newAttachments = [...attachments, ...files]
    setAttachments(newAttachments)
    form.setValue('supportingDocuments', newAttachments)

    // Clear input
    e.target.value = ''
  }

  // Remove attachment
  const removeAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index)
    setAttachments(newAttachments)
    form.setValue('supportingDocuments', newAttachments)
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Handle section toggle
  const handleSectionToggle = (section: string, checked: boolean) => {
    const currentSections = form.getValues('affectedSections')
    if (checked) {
      form.setValue('affectedSections', [...currentSections, section])
    } else {
      form.setValue(
        'affectedSections',
        currentSections.filter((s) => s !== section)
      )
    }
  }

  // Handle form submission
  const handleSubmit = async (data: UpdateRequestFormData) => {
    await onSubmit(data)
    form.reset()
    setAttachments([])
  }

  // Get change type option details
  const selectedChangeTypeOption = changeTypeOptions.find(
    (option) => option.value === selectedChangeType
  )
  const ChangeTypeIcon = selectedChangeTypeOption?.icon || FileText

  return (
    <div className={cn('space-y-6', className)}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
          {/* Syllabus Selection */}
          <FormField
            control={form.control}
            name='syllabusId'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Approved Syllabus *</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString()}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger aria-label='Select approved syllabus'>
                      <SelectValue placeholder='Select an approved syllabus' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {approvedSyllabi.length === 0 ? (
                      <div className='p-4 text-center text-sm text-muted-foreground'>
                        No approved syllabi available
                      </div>
                    ) : (
                      approvedSyllabi.map((syllabus) => (
                        <SelectItem
                          key={syllabus.id}
                          value={syllabus.id.toString()}
                        >
                          <div className='flex flex-col'>
                            <span className='font-medium'>
                              {syllabus.courseCode} - {syllabus.courseName}
                            </span>
                            <span className='text-xs text-muted-foreground'>
                              {syllabus.academicYear} {syllabus.semester} •
                              Version {syllabus.version}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the approved syllabus you want to update
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Selected Syllabus Info Card */}
          {selectedSyllabus && (
            <Card>
              <CardContent className='pt-6'>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <h4 className='font-semibold'>
                      {selectedSyllabus.courseCode} -{' '}
                      {selectedSyllabus.courseName}
                    </h4>
                    <Badge variant='secondary'>
                      {selectedSyllabus.status}
                    </Badge>
                  </div>
                  <div className='grid grid-cols-2 gap-2 text-sm text-muted-foreground'>
                    <div>
                      <span className='font-medium'>Academic Year:</span>{' '}
                      {selectedSyllabus.academicYear}
                    </div>
                    <div>
                      <span className='font-medium'>Semester:</span>{' '}
                      {selectedSyllabus.semester}
                    </div>
                    <div>
                      <span className='font-medium'>Credits:</span>{' '}
                      {selectedSyllabus.credits}
                    </div>
                    <div>
                      <span className='font-medium'>Version:</span>{' '}
                      {selectedSyllabus.version}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Change Type Selection */}
          <FormField
            control={form.control}
            name='changeType'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Change Type *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger aria-label='Select change type'>
                      <SelectValue placeholder='Select the type of change' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {changeTypeOptions.map((option) => {
                      const OptionIcon = option.icon
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className='flex items-start gap-2 py-1'>
                            <OptionIcon
                              className={cn('mt-0.5 size-4', option.color)}
                              aria-hidden='true'
                            />
                            <div className='flex-1'>
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
                <FormDescription>
                  Choose the type that best describes the scope of your changes
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Affected Sections Multi-Select */}
          <FormField
            control={form.control}
            name='affectedSections'
            render={() => (
              <FormItem>
                <div className='mb-4'>
                  <FormLabel>Affected Sections *</FormLabel>
                  <FormDescription>
                    Select all sections that will be modified by this update
                  </FormDescription>
                </div>
                <div className='space-y-2'>
                  {AVAILABLE_SECTIONS.map((section) => (
                    <FormField
                      key={section}
                      control={form.control}
                      name='affectedSections'
                      render={() => {
                        const isChecked = affectedSections.includes(section)
                        return (
                          <FormItem
                            key={section}
                            className='flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 hover:bg-muted/50'
                          >
                            <FormControl>
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={(checked) =>
                                  handleSectionToggle(
                                    section,
                                    checked as boolean
                                  )
                                }
                                disabled={isLoading}
                                aria-label={`Select ${section}`}
                              />
                            </FormControl>
                            <div className='space-y-1 leading-none'>
                              <FormLabel className='cursor-pointer font-normal'>
                                {section}
                              </FormLabel>
                            </div>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Justification */}
          <FormField
            control={form.control}
            name='justification'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Justification *</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder='Explain why this update is necessary and what changes you plan to make...'
                    className='min-h-[150px] resize-y'
                    disabled={isLoading}
                    aria-label='Update justification'
                    aria-describedby='justification-count'
                    maxLength={2000}
                  />
                </FormControl>
                <div className='flex items-center justify-between'>
                  <FormDescription>
                    Provide a detailed explanation for the requested changes
                    (minimum 50 characters)
                  </FormDescription>
                  <span
                    id='justification-count'
                    className={cn(
                      'text-xs',
                      justificationCount < 50
                        ? 'text-muted-foreground'
                        : justificationCount > 2000
                          ? 'text-destructive'
                          : 'text-green-600 dark:text-green-400'
                    )}
                    aria-live='polite'
                  >
                    {justificationCount} / 2000
                  </span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Effective Semester */}
          <FormField
            control={form.control}
            name='effectiveSemester'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Effective Semester *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder='e.g., 2025-Fall'
                    disabled={isLoading}
                    aria-label='Effective semester'
                  />
                </FormControl>
                <FormDescription>
                  When should these changes take effect? Format: YYYY-Semester
                  (e.g., 2025-Fall, 2025-Spring, 2025-Summer)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Urgency Level */}
          <FormField
            control={form.control}
            name='urgency'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Urgency Level *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger aria-label='Select urgency level'>
                      <SelectValue placeholder='Select urgency level' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='Normal'>
                      <div className='flex items-center gap-2'>
                        <CheckCircle2 className='size-4 text-blue-600 dark:text-blue-400' />
                        <div>
                          <div className='font-medium'>Normal</div>
                          <div className='text-xs text-muted-foreground'>
                            Standard review timeline
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value='High'>
                      <div className='flex items-center gap-2'>
                        <AlertCircle className='size-4 text-orange-600 dark:text-orange-400' />
                        <div>
                          <div className='font-medium'>High</div>
                          <div className='text-xs text-muted-foreground'>
                            Requires expedited review
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Indicate if this update requires expedited review
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Supporting Documents */}
          <FormField
            control={form.control}
            name='supportingDocuments'
            render={() => (
              <FormItem>
                <FormLabel>Supporting Documents (Optional)</FormLabel>
                <FormControl>
                  <div className='space-y-3'>
                    {/* File Input */}
                    <div className='flex items-center gap-2'>
                      <Input
                        type='file'
                        multiple
                        onChange={handleFileChange}
                        disabled={attachments.length >= 10 || isLoading}
                        className='cursor-pointer'
                        accept='*/*'
                        aria-label='Upload supporting documents'
                      />
                      <Button
                        type='button'
                        variant='outline'
                        size='icon'
                        disabled={attachments.length >= 10 || isLoading}
                        onClick={() => {
                          const input = document.querySelector(
                            'input[type="file"]'
                          ) as HTMLInputElement
                          input?.click()
                        }}
                        aria-label='Browse files'
                      >
                        <Upload className='size-4' />
                      </Button>
                    </div>

                    {/* Attachment List */}
                    {attachments.length > 0 && (
                      <div className='space-y-2'>
                        {attachments.map((file, index) => (
                          <div
                            key={index}
                            className='flex items-center justify-between rounded-md border bg-muted/50 p-3'
                          >
                            <div className='flex items-center gap-2'>
                              <FileText className='size-4 text-muted-foreground' />
                              <div className='flex flex-col'>
                                <span className='text-sm font-medium'>
                                  {file.name}
                                </span>
                                <span className='text-xs text-muted-foreground'>
                                  {formatFileSize(file.size)}
                                </span>
                              </div>
                            </div>
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon'
                              onClick={() => removeAttachment(index)}
                              disabled={isLoading}
                              aria-label={`Remove ${file.name}`}
                            >
                              <X className='size-4' />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  Upload documents that support your update request (max 10
                  files, 10MB each). {attachments.length}/10 files attached
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Action Buttons */}
          <div className='flex items-center justify-end gap-3 pt-4'>
            {onCancel && (
              <Button
                type='button'
                variant='outline'
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            <Button type='submit' disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className='mr-2 inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                  Submitting...
                </>
              ) : (
                <>
                  <ChangeTypeIcon className='mr-2 size-4' aria-hidden='true' />
                  Submit Update Request
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
