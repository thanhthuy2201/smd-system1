import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

type AcademicYearDatePickerProps = {
  selected: Date | undefined
  onSelect: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
}

export function AcademicYearDatePicker({
  selected,
  onSelect,
  placeholder = 'Chọn ngày',
  disabled = false,
}: AcademicYearDatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          data-empty={!selected}
          className='w-full justify-start text-start font-normal data-[empty=true]:text-muted-foreground'
          disabled={disabled}
        >
          {selected ? (
            format(selected, 'dd/MM/yyyy', { locale: vi })
          ) : (
            <span>{placeholder}</span>
          )}
          <CalendarIcon className='ms-auto h-4 w-4 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <Calendar
          mode='single'
          captionLayout='dropdown'
          selected={selected}
          onSelect={onSelect}
          disabled={(date: Date) => date < new Date('1900-01-01')}
          fromYear={1900}
          toYear={2100}
        />
      </PopoverContent>
    </Popover>
  )
}
