import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AcademicYearStatus } from '../data/schema'

interface ToolbarProps {
  search: string
  onSearchChange: (search: string) => void
  statusFilter: AcademicYearStatus | 'ALL'
  onStatusFilterChange: (status: AcademicYearStatus | 'ALL') => void
}

export function Toolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
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
          placeholder='Tìm kiếm...'
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className='h-8 w-[150px] lg:w-[250px]'
        />
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            onStatusFilterChange(value as AcademicYearStatus | 'ALL')
          }
        >
          <SelectTrigger size='sm' className='h-8 w-[150px]'>
            <SelectValue placeholder='Trạng thái' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='ALL'>Tất cả</SelectItem>
            <SelectItem value={AcademicYearStatus.ACTIVE}>Hoạt động</SelectItem>
            <SelectItem value={AcademicYearStatus.DISABLED}>
              Vô hiệu hóa
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
