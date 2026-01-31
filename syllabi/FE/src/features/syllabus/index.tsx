import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { SyllabusTable } from './components/syllabus-table'
import { syllabusData } from './data/syllabus-data'

export default function SyllabusPage() {
  const handleCreateNew = () => {
    // TODO: Implement create new syllabus functionality
    console.log('Create new syllabus')
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
            <h2 className='text-2xl font-bold tracking-tight'>
              Danh sách Đề cương
            </h2>
            <p className='text-muted-foreground'>
              Quản lý đề cương khóa học của bạn
            </p>
          </div>
          <Button onClick={handleCreateNew} size='lg'>
            <Plus className='h-4 w-4' />
            Tạo đề cương mới
          </Button>
        </div>
        <SyllabusTable data={syllabusData} />
      </Main>
    </>
  )
}
