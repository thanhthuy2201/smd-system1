import { createFileRoute } from '@tanstack/react-router'
import { LecturerLayout } from '@/features/lecturer/components/LecturerLayout'

/**
 * Lecturer Dashboard
 * 
 * Overview page for lecturers showing:
 * - Quick stats (syllabi counts by status)
 * - Recent activity
 * - Upcoming deadlines
 * - Pending reviews
 */
function LecturerDashboard() {
  return (
    <LecturerLayout
      title='Lecturer Dashboard'
      description='Welcome to your lecturer dashboard'
      showBreadcrumb={false}
    >
      {/* TODO: Implement dashboard widgets */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <div className='rounded-lg border p-4'>
          <h3 className='text-sm font-medium text-muted-foreground'>
            Total Syllabi
          </h3>
          <p className='mt-2 text-3xl font-bold'>0</p>
        </div>
        <div className='rounded-lg border p-4'>
          <h3 className='text-sm font-medium text-muted-foreground'>
            Pending Review
          </h3>
          <p className='mt-2 text-3xl font-bold'>0</p>
        </div>
        <div className='rounded-lg border p-4'>
          <h3 className='text-sm font-medium text-muted-foreground'>
            Approved
          </h3>
          <p className='mt-2 text-3xl font-bold'>0</p>
        </div>
        <div className='rounded-lg border p-4'>
          <h3 className='text-sm font-medium text-muted-foreground'>
            Drafts
          </h3>
          <p className='mt-2 text-3xl font-bold'>0</p>
        </div>
      </div>
    </LecturerLayout>
  )
}

export const Route = createFileRoute('/_authenticated/lecturer/')({
  component: LecturerDashboard,
})
