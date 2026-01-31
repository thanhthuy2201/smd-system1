/**
 * ComposeMessage Component
 *
 * Provides a form to compose and send new messages with:
 * - Recipient autocomplete with authorization filter
 * - Subject and body inputs with validation
 * - File attachment with size/count limits
 * - Optional syllabus reference selector
 * - Character counts
 * - Full keyboard navigation and ARIA labels
 *
 * Requirements: 8.2-8.6, 8.11, 11.3, 11.4
 */
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ChevronsUpDown, X, Paperclip, FileText } from 'lucide-react'
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { messageSchema, type MessageFormData } from '../../schemas/message.schema'
import { useMessaging } from '../../hooks/useMessaging'
import { searchRecipients } from '../../api/message.api'
import type { Recipient, Syllabus } from '../../types'

export interface ComposeMessageProps {
  /** Optional class name for styling */
  className?: string
  /** Pre-selected recipient ID */
  defaultRecipientId?: number
  /** Pre-selected syllabus ID */
  defaultSyllabusId?: number
  /** List of syllabi for reference selector */
  syllabi?: Syllabus[]
  /** Callback when message is sent successfully */
  onSuccess?: () => void
  /** Callback when cancel is clicked */
  onCancel?: () => void
}

/**
 * ComposeMessage provides a form to compose and send new messages
 *
 * @example
 * ```tsx
 * <ComposeMessage
 *   defaultRecipientId={123}
 *   syllabi={syllabi}
 *   onSuccess={() => navigate('/lecturer/messages')}
 *   onCancel={() => navigate('/lecturer/messages')}
 * />
 * ```
 */
export function ComposeMessage({
  className,
  defaultRecipientId,
  defaultSyllabusId,
  syllabi = [],
  onSuccess,
  onCancel,
}: ComposeMessageProps) {
  const { send, isSending } = useMessaging()

  // Recipient search state
  const [recipientSearch, setRecipientSearch] = useState('')
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [recipientOpen, setRecipientOpen] = useState(false)

  // Selected recipient for display
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(
    null
  )

  // File attachments state
  const [attachments, setAttachments] = useState<File[]>([])

  // Initialize form
  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      recipientId: defaultRecipientId || 0,
      subject: '',
      body: '',
      syllabusId: defaultSyllabusId,
      attachments: [],
    },
  })

  // Watch form values for character counts
  const subject = form.watch('subject')
  const body = form.watch('body')

  // Search recipients when search term changes
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (recipientSearch.trim().length >= 2) {
        setIsSearching(true)
        try {
          const results = await searchRecipients(recipientSearch)
          setRecipients(results)
        } catch (error) {
          console.error('Failed to search recipients:', error)
          setRecipients([])
        } finally {
          setIsSearching(false)
        }
      } else {
        setRecipients([])
      }
    }, 300) // Debounce search

    return () => clearTimeout(searchTimeout)
  }, [recipientSearch])

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    // Validate file count
    if (attachments.length + files.length > 5) {
      toast.error('Maximum 5 attachments allowed')
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
    form.setValue('attachments', newAttachments)

    // Clear input
    e.target.value = ''
  }

  // Remove attachment
  const removeAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index)
    setAttachments(newAttachments)
    form.setValue('attachments', newAttachments)
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Handle form submission
  const onSubmit = (data: MessageFormData) => {
    send(data)
    toast.success('Message sent successfully')
    form.reset()
    setAttachments([])
    setSelectedRecipient(null)
    onSuccess?.()
  }

  return (
    <div className={cn('space-y-6', className)}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          {/* Recipient Field */}
          <FormField
            control={form.control}
            name='recipientId'
            render={({ field }) => (
              <FormItem className='flex flex-col'>
                <FormLabel htmlFor='recipient-select'>Recipient *</FormLabel>
                <Popover open={recipientOpen} onOpenChange={setRecipientOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        id='recipient-select'
                        variant='outline'
                        role='combobox'
                        aria-expanded={recipientOpen}
                        aria-haspopup='listbox'
                        aria-controls='recipient-list'
                        aria-describedby='recipient-description'
                        className={cn(
                          'w-full justify-between',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {selectedRecipient ? (
                          <div className='flex items-center gap-2'>
                            <span className='font-medium'>
                              {selectedRecipient.name}
                            </span>
                            <span className='text-xs text-muted-foreground'>
                              ({selectedRecipient.email})
                            </span>
                          </div>
                        ) : (
                          'Select recipient...'
                        )}
                        <ChevronsUpDown className='ml-2 size-4 shrink-0 opacity-50' aria-hidden='true' />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className='w-[400px] p-0' align='start'>
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder='Search by name or email...'
                        value={recipientSearch}
                        onValueChange={setRecipientSearch}
                        aria-label='Search recipients'
                      />
                      <CommandList id='recipient-list' role='listbox'>
                        <CommandEmpty>
                          {isSearching
                            ? 'Searching...'
                            : recipientSearch.length < 2
                              ? 'Type at least 2 characters to search'
                              : 'No recipients found'}
                        </CommandEmpty>
                        {recipients.length > 0 && (
                          <CommandGroup>
                            {recipients.map((recipient) => (
                              <CommandItem
                                key={recipient.id}
                                value={recipient.id.toString()}
                                onSelect={() => {
                                  field.onChange(recipient.id)
                                  setSelectedRecipient(recipient)
                                  setRecipientOpen(false)
                                }}
                                role='option'
                                aria-selected={field.value === recipient.id}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 size-4',
                                    field.value === recipient.id
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                  aria-hidden='true'
                                />
                                <div className='flex flex-col'>
                                  <span className='font-medium'>
                                    {recipient.name}
                                  </span>
                                  <span className='text-xs text-muted-foreground'>
                                    {recipient.email} • {recipient.role}
                                    {recipient.departmentName &&
                                      ` • ${recipient.departmentName}`}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormDescription id='recipient-description'>
                  Search for authorized recipients within your department or
                  assigned reviewers
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Subject Field */}
          <FormField
            control={form.control}
            name='subject'
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor='message-subject'>Subject *</FormLabel>
                <FormControl>
                  <Input
                    id='message-subject'
                    placeholder='Enter message subject'
                    {...field}
                    maxLength={200}
                    aria-describedby='subject-description subject-count'
                  />
                </FormControl>
                <FormDescription className='flex justify-between'>
                  <span id='subject-description'>Brief description of your message</span>
                  <span id='subject-count' className='text-xs' aria-live='polite'>
                    {subject.length}/200 characters
                  </span>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Syllabus Reference Field (Optional) */}
          {syllabi.length > 0 && (
            <FormField
              control={form.control}
              name='syllabusId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor='syllabus-reference'>
                    Syllabus Reference (Optional)
                  </FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value ? parseInt(value) : undefined)
                    }
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger 
                        id='syllabus-reference'
                        aria-describedby='syllabus-reference-description'
                      >
                        <SelectValue placeholder='Select a syllabus to reference' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='0'>None</SelectItem>
                      {syllabi.map((syllabus) => (
                        <SelectItem
                          key={syllabus.id}
                          value={syllabus.id.toString()}
                        >
                          {syllabus.courseCode} - {syllabus.courseName} (
                          {syllabus.academicYear} {syllabus.semester})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription id='syllabus-reference-description'>
                    Link this message to a specific syllabus for context
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Body Field */}
          <FormField
            control={form.control}
            name='body'
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor='message-body'>Message *</FormLabel>
                <FormControl>
                  <Textarea
                    id='message-body'
                    placeholder='Enter your message here...'
                    className='min-h-[200px] resize-y'
                    {...field}
                    maxLength={5000}
                    aria-describedby='body-description body-count'
                  />
                </FormControl>
                <FormDescription className='flex justify-between'>
                  <span id='body-description'>Your message content</span>
                  <span id='body-count' className='text-xs' aria-live='polite'>
                    {body.length}/5000 characters
                  </span>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* File Attachments */}
          <FormField
            control={form.control}
            name='attachments'
            render={() => (
              <FormItem>
                <FormLabel htmlFor='file-attachments'>
                  Attachments (Optional)
                </FormLabel>
                <FormControl>
                  <div className='space-y-3'>
                    {/* File Input */}
                    <div className='flex items-center gap-2'>
                      <Input
                        id='file-attachments'
                        type='file'
                        multiple
                        onChange={handleFileChange}
                        disabled={attachments.length >= 5}
                        className='cursor-pointer'
                        accept='*/*'
                        aria-describedby='attachments-description'
                      />
                      <Button
                        type='button'
                        variant='outline'
                        size='icon'
                        disabled={attachments.length >= 5}
                        onClick={() => {
                          const input = document.querySelector(
                            'input[type="file"]'
                          ) as HTMLInputElement
                          input?.click()
                        }}
                        aria-label='Add attachment'
                      >
                        <Paperclip className='size-4' aria-hidden='true' />
                      </Button>
                    </div>

                    {/* Attachment List */}
                    {attachments.length > 0 && (
                      <div className='space-y-2' role='list' aria-label='Attached files'>
                        {attachments.map((file, index) => (
                          <div
                            key={index}
                            className='flex items-center justify-between rounded-md border bg-muted/50 p-3'
                            role='listitem'
                          >
                            <div className='flex items-center gap-2'>
                              <FileText className='size-4 text-muted-foreground' aria-hidden='true' />
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
                              aria-label={`Remove ${file.name}`}
                            >
                              <X className='size-4' aria-hidden='true' />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription id='attachments-description'>
                  Maximum 5 files, 10MB each. {attachments.length}/5 files
                  attached
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Action Buttons */}
          <div className='flex items-center justify-end gap-3'>
            {onCancel && (
              <Button
                type='button'
                variant='outline'
                onClick={onCancel}
                disabled={isSending}
                aria-label='Cancel message'
              >
                Cancel
              </Button>
            )}
            <Button 
              type='submit' 
              disabled={isSending}
              aria-label={isSending ? 'Sending message' : 'Send message'}
            >
              {isSending ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
