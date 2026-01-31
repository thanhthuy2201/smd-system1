import { useState } from 'react'
import { format, isSameDay, isWithinInterval } from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { vi } from '@/features/lecturer/i18n/vi'
import type { ReviewSchedule } from '../types/review.types'

interface ReviewCalendarProps {
  schedules: ReviewSchedule[]
  onDateSelect?: (date: Date) => void
}

export function ReviewCalendar({
  schedules,
  onDateSelect,
}: ReviewCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date && onDateSelect) {
      onDateSelect(date)
    }
  }

  const getSchedulesForDate = (date: Date) => {
    return schedules.filter((schedule) => {
      const start = new Date(schedule.startDate)
      const end = new Date(schedule.endDate)
      return isWithinInterval(date, { start, end })
    })
  }

  const modifiers = {
    reviewPeriod: (date: Date) => getSchedulesForDate(date).length > 0,
    deadline: (date: Date) => {
      return schedules.some((schedule) => {
        const end = new Date(schedule.endDate)
        return isSameDay(date, end)
      })
    },
  }

  const modifiersClassNames = {
    reviewPeriod:
      'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100',
    deadline:
      'bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100 font-bold',
  }

  const schedulesForSelectedDate = selectedDate
    ? getSchedulesForDate(selectedDate)
    : []

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                <CalendarDays className='h-5 w-5' />
                {vi.reviewSchedules.calendar.title}
              </CardTitle>
              <CardDescription>
                {vi.reviewSchedules.calendar.description}
              </CardDescription>
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setViewMode('month')}
              >
                {vi.reviewSchedules.calendar.month}
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setViewMode('week')}
              >
                {vi.reviewSchedules.calendar.week}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='mb-4 flex items-center justify-between'>
            <Button
              variant='outline'
              size='icon'
              onClick={() => {
                const newMonth = new Date(currentMonth)
                newMonth.setMonth(newMonth.getMonth() - 1)
                setCurrentMonth(newMonth)
              }}
              aria-label={vi.reviewSchedules.calendar.previousMonth}
            >
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <h3 className='text-lg font-semibold'>
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <Button
              variant='outline'
              size='icon'
              onClick={() => {
                const newMonth = new Date(currentMonth)
                newMonth.setMonth(newMonth.getMonth() + 1)
                setCurrentMonth(newMonth)
              }}
              aria-label={vi.reviewSchedules.calendar.nextMonth}
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>

          <Calendar
            mode='single'
            selected={selectedDate}
            onSelect={handleDateSelect}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            className='rounded-md border'
          />

          <div className='mt-4 space-y-2'>
            <div className='flex items-center gap-2'>
              <div className='h-4 w-4 rounded border bg-blue-100 dark:bg-blue-900' />
              <span className='text-sm'>
                {vi.reviewSchedules.calendar.reviewPeriod}
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='h-4 w-4 rounded border bg-red-100 dark:bg-red-900' />
              <span className='text-sm'>
                {vi.reviewSchedules.calendar.deadline}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedDate && schedulesForSelectedDate.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {vi.reviewSchedules.calendar.schedulesFor}{' '}
              {format(selectedDate, 'MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {schedulesForSelectedDate.map((schedule) => (
                <div
                  key={schedule.id}
                  className='flex items-start justify-between rounded-lg border p-3'
                >
                  <div className='space-y-1'>
                    <div className='font-medium'>{schedule.reviewType}</div>
                    <div className='text-sm text-muted-foreground'>
                      {format(new Date(schedule.startDate), 'MMM d')} -{' '}
                      {format(new Date(schedule.endDate), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <Badge variant='outline'>
                    {vi.reviewSchedules.calendar.active}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
