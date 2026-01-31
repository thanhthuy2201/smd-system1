import { createFileRoute } from '@tanstack/react-router'
import { LecturerLayout } from '@/features/lecturer/components/LecturerLayout'

/**
 * Review Schedules Page
 *
 * Displays review schedules, submission timeline, and deadline alerts.
 * Shows progress through approval stages.
 */
function ReviewSchedulesPage() {
  return (
    <LecturerLayout
      title='Review Schedules'
      description='Track your syllabus submissions and review deadlines'
    >
      {/* TODO: Implement ReviewCalendar, SubmissionsTimeline, and DeadlineAlerts components */}
      <div className='grid gap-4 lg:grid-cols-2'>
        <div className='rounded-lg border p-8 text-center'>
          <p className='text-muted-foreground'>
            Review calendar will be displayed here
          </p>
        </div>
        <div className='rounded-lg border p-8 text-center'>
          <p className='text-muted-foreground'>
            Deadline alerts will be displayed here
          </p>
        </div>
      </div>

      <div className='rounded-lg border p-8 text-center'>
        <p className='text-muted-foreground'>
          Submissions timeline will be displayed here
        </p>
      </div>
    </LecturerLayout>
  )
}

export const Route = createFileRoute('/_authenticated/lecturer/reviews/')({
  component: ReviewSchedulesPage,
})
