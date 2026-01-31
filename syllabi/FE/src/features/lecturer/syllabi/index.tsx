/**
 * Lecturer Syllabi Page
 *
 * Main page for lecturers to view and manage their syllabi.
 * Displays a data table with search, filter, and action capabilities.
 */
import { useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { SyllabiList } from './components/SyllabiList'

export default function LecturerSyllabiPage() {
  const navigate = useNavigate()

  const handleCreateNew = () => {
    navigate({ to: '/syllabus/create' })
  }

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>My Syllabi</h2>
            <p className='text-muted-foreground'>
              Manage your course syllabi and track their approval status
            </p>
          </div>
          <Button onClick={handleCreateNew} size='lg'>
            <Plus className='h-4 w-4' />
            Create New Syllabus
          </Button>
        </div>

        <SyllabiList />
      </Main>
    </>
  )
}
