import { useState } from 'react'
import { format } from 'date-fns'
import { FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { vi } from '@/features/lecturer/i18n/vi'

interface AssignedSyllabus {
  id: number
  syllabusId: number
  courseCode: string
  courseName: string
  lecturerName: string
  assignedDate: string
  dueDate: string
  reviewStatus: 'Pending' | 'In Progress' | 'Completed'
  priority: 'Normal' | 'High'
}

interface PeerReviewQueueProps {
  assignedSyllabi: AssignedSyllabus[]
  onStartReview?: (syllabusId: number) => void
}

const statusConfig = {
  Pending: {
    icon: Clock,
    color: 'text-yellow-600 dark:text-yellow-400',
    variant: 'secondary' as const,
  },
  'In Progress': {
    icon: AlertCircle,
    color: 'text-blue-600 dark:text-blue-400',
    variant: 'default' as const,
  },
  Completed: {
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    variant: 'outline' as const,
  },
}

export function PeerReviewQueue({
  assignedSyllabi,
  onStartReview,
}: PeerReviewQueueProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filteredSyllabi = assignedSyllabi.filter((syllabus) => {
    if (filterStatus === 'all') return true
    return syllabus.reviewStatus === filterStatus
  })

  const pendingCount = assignedSyllabi.filter(
    (s) => s.reviewStatus === 'Pending'
  ).length
  const inProgressCount = assignedSyllabi.filter(
    (s) => s.reviewStatus === 'In Progress'
  ).length

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <FileText className='h-5 w-5' />
              {vi.peerReview.queue.title}
            </CardTitle>
            <CardDescription>{vi.peerReview.queue.description}</CardDescription>
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant='secondary'>
              {vi.peerReview.queue.counts.pending.replace(
                '{count}',
                pendingCount.toString()
              )}
            </Badge>
            <Badge variant='default'>
              {vi.peerReview.queue.counts.inProgress.replace(
                '{count}',
                inProgressCount.toString()
              )}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium'>
              {vi.peerReview.queue.filterByStatus}:
            </span>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder={vi.peerReview.queue.allStatuses} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>
                  {vi.peerReview.queue.allStatuses}
                </SelectItem>
                <SelectItem value='Pending'>
                  {vi.peerReview.queue.status.pending}
                </SelectItem>
                <SelectItem value='In Progress'>
                  {vi.peerReview.queue.status.inProgress}
                </SelectItem>
                <SelectItem value='Completed'>
                  {vi.peerReview.queue.status.completed}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredSyllabi.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <FileText className='mb-4 h-12 w-12 text-muted-foreground' />
              <p className='text-muted-foreground'>
                {filterStatus === 'all'
                  ? vi.peerReview.queue.noSyllabiAssigned
                  : `${vi.peerReview.queue.noReviews}: ${filterStatus}`}
              </p>
            </div>
          ) : (
            <div className='space-y-3'>
              {filteredSyllabi.map((syllabus) => {
                const config = statusConfig[syllabus.reviewStatus]
                const Icon = config.icon

                return (
                  <div
                    key={syllabus.id}
                    className='space-y-3 rounded-lg border p-4'
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex-1 space-y-1'>
                        <div className='flex items-center gap-2'>
                          <h3 className='font-semibold'>
                            {syllabus.courseCode} - {syllabus.courseName}
                          </h3>
                          <Badge
                            variant={config.variant}
                            className='flex items-center gap-1'
                          >
                            <Icon className='h-3 w-3' />
                            {
                              vi.peerReview.queue.status[
                                syllabus.reviewStatus
                                  .toLowerCase()
                                  .replace(
                                    ' ',
                                    ''
                                  ) as keyof typeof vi.peerReview.queue.status
                              ]
                            }
                          </Badge>
                          {syllabus.priority === 'High' && (
                            <Badge variant='destructive'>
                              {vi.peerReview.queue.priority.highPriority}
                            </Badge>
                          )}
                        </div>
                        <div className='space-y-1 text-sm text-muted-foreground'>
                          <div>
                            {vi.peerReview.queue.lecturer}:{' '}
                            {syllabus.lecturerName}
                          </div>
                          <div>
                            {vi.peerReview.queue.assigned}:{' '}
                            {format(
                              new Date(syllabus.assignedDate),
                              'MMM d, yyyy'
                            )}
                          </div>
                          <div>
                            {vi.peerReview.queue.due}:{' '}
                            {format(new Date(syllabus.dueDate), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                      <div className='flex gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => {
                            window.location.href = `/lecturer/syllabi/${syllabus.syllabusId}/view`
                          }}
                        >
                          {vi.peerReview.queue.actions.viewSyllabus}
                        </Button>
                        {syllabus.reviewStatus !== 'Completed' && (
                          <Button
                            size='sm'
                            onClick={() => onStartReview?.(syllabus.syllabusId)}
                          >
                            {syllabus.reviewStatus === 'Pending'
                              ? vi.peerReview.queue.actions.startReview
                              : vi.peerReview.queue.actions.continueReview}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
