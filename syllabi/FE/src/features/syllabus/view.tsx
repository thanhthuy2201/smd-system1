import { useParams } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { statusConfig } from './data/schema'
import { syllabusData } from './data/syllabus-data'

export default function SyllabusViewPage() {
  const { id } = useParams({ from: '/_authenticated/syllabus/view/$id' })
  const navigate = useNavigate()

  // Find the syllabus by ID
  const syllabus = syllabusData.find((s) => s.id === id)

  if (!syllabus) {
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
        <Main>
          <div className='py-12 text-center'>
            <h2 className='text-2xl font-bold'>Không tìm thấy đề cương</h2>
            <p className='mt-2 text-muted-foreground'>
              Đề cương với ID "{id}" không tồn tại.
            </p>
            <Button
              onClick={() => navigate({ to: '/syllabus' })}
              className='mt-4'
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              Quay lại danh sách
            </Button>
          </div>
        </Main>
      </>
    )
  }

  const config = statusConfig[syllabus.status]

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
        <div className='flex items-center justify-between'>
          <Button variant='ghost' onClick={() => navigate({ to: '/syllabus' })}>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Quay lại
          </Button>
          <Button
            onClick={() =>
              navigate({ to: '/syllabus/edit/$id', params: { id } })
            }
          >
            <Pencil className='mr-2 h-4 w-4' />
            Chỉnh sửa
          </Button>
        </div>

        <div>
          <h1 className='text-3xl font-bold'>Chi tiết đề cương</h1>
          <p className='text-muted-foreground'>
            Xem thông tin chi tiết của đề cương khóa học
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin chung</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Mã khóa học
                </p>
                <p className='text-lg font-semibold'>{syllabus.courseCode}</p>
              </div>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Phiên bản
                </p>
                <p className='text-lg font-semibold'>{syllabus.version}</p>
              </div>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Trạng thái
                </p>
                <Badge variant='outline' className='mt-1 gap-1'>
                  <div className={`h-2 w-2 rounded-full ${config.color}`} />
                  {config.label}
                </Badge>
              </div>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Ngày cập nhật
                </p>
                <p className='text-lg font-semibold'>
                  {new Date(syllabus.lastUpdated).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nội dung đề cương</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground'>
              Nội dung chi tiết của đề cương sẽ được hiển thị ở đây.
            </p>
          </CardContent>
        </Card>
      </Main>
    </>
  )
}
