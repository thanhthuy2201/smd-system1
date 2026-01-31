import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ReviewScheduleStatus } from '../data/schema'

interface ToolbarProps {
  search: string
  onSearchChange: (search: string) => void
  statusFilter: ReviewScheduleStatus | 'ALL'
  onStatusFilterChange: (status: ReviewScheduleStatus | 'ALL') => void
  semesterFilter: string
  onSemesterFilterChange: (semesterId: string) => void
  academicYearFilter: string
  onAcademicYearFilterChange: (academicYear: string) => void
  semesters?: Array<{ id: string; name: string }>
  academicYears?: Array<{ year: string; label: string }>
}

export function Toolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  semesterFilter,
  onSemesterFilterChange,
  academicYearFilter,
  onAcademicYearFilterChange,
  semesters = [],
  academicYears = [],
}: ToolbarProps) {
  const [localSearch, setLocalSearch] = useState(search)

  // Debounced search with 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch)
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearch, onSearchChange])

  // Sync local search with prop when it changes externally
  useEffect(() => {
    setLocalSearch(search)
  }, [search])

  return (
    <div className='flex items-center justify-between gap-2'>
      <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>
        <Input
          placeholder='Tìm kiếm theo tên chu kỳ...'
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className='h-8 w-[150px] lg:w-[250px]'
        />
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            onStatusFilterChange(value as ReviewScheduleStatus | 'ALL')
          }
        >
          <SelectTrigger size='sm' className='h-8 w-[150px]'>
            <SelectValue placeholder='Trạng thái' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='ALL'>Tất cả</SelectItem>
            <SelectItem value={ReviewScheduleStatus.UPCOMING}>
              Sắp diễn ra
            </SelectItem>
            <SelectItem value={ReviewScheduleStatus.ACTIVE}>
              Đang diễn ra
            </SelectItem>
            <SelectItem value={ReviewScheduleStatus.COMPLETED}>
              Hoàn thành
            </SelectItem>
            <SelectItem value={ReviewScheduleStatus.OVERDUE}>
              Quá hạn
            </SelectItem>
          </SelectContent>
        </Select>
        <Select value={semesterFilter} onValueChange={onSemesterFilterChange}>
          <SelectTrigger size='sm' className='h-8 w-[150px]'>
            <SelectValue placeholder='Học kỳ' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='ALL'>Tất cả học kỳ</SelectItem>
            {semesters.map((semester) => (
              <SelectItem key={semester.id} value={semester.id}>
                {semester.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={academicYearFilter}
          onValueChange={onAcademicYearFilterChange}
        >
          <SelectTrigger size='sm' className='h-8 w-[150px]'>
            <SelectValue placeholder='Năm học' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='ALL'>Tất cả năm học</SelectItem>
            {academicYears.map((year) => (
              <SelectItem key={year.year} value={year.year}>
                {year.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
