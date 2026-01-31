/**
 * ComposeMessage Demo Page
 *
 * Demonstrates the ComposeMessage component with mock data
 */
import { ComposeMessage } from './components/ComposeMessage'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import type { Syllabus } from '../types'

// Mock syllabi data for testing
const mockSyllabi: Syllabus[] = [
  {
    id: 1,
    courseId: 101,
    courseCode: 'CS101',
    courseName: 'Introduction to Programming',
    academicYear: '2024-2025',
    semester: 'Fall',
    credits: 3,
    totalHours: 45,
    description: 'Basic programming concepts',
    status: 'Draft',
    version: '1.0',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    lecturerId: 1,
    clos: [],
    content: [],
    assessments: [],
    references: [],
  },
  {
    id: 2,
    courseId: 102,
    courseCode: 'CS201',
    courseName: 'Data Structures',
    academicYear: '2024-2025',
    semester: 'Spring',
    credits: 4,
    totalHours: 60,
    description: 'Advanced data structures',
    status: 'Approved',
    version: '2.0',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
    lecturerId: 1,
    clos: [],
    content: [],
    assessments: [],
    references: [],
  },
]

export function ComposeMessageDemo() {
  const handleSuccess = () => {
    console.log('Message sent successfully!')
    // In a real app, navigate to inbox
    // navigate('/lecturer/messages')
  }

  const handleCancel = () => {
    console.log('Compose cancelled')
    // In a real app, navigate back
    // navigate('/lecturer/messages')
  }

  return (
    <>
      <Header>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold'>Compose Message</h1>
            <p className='text-sm text-muted-foreground'>
              Send a message to authorized recipients
            </p>
          </div>
        </div>

        <div className='mx-auto max-w-3xl rounded-lg border bg-card p-6 shadow-sm'>
          <ComposeMessage
            syllabi={mockSyllabi}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </Main>
    </>
  )
}
