/**
 * CourseInformationStep Component
 *
 * First step of the syllabus wizard for entering basic course information.
 * Pre-populates data from course catalog when a course is selected.
 *
 * Features:
 * - Course selection with pre-population
 * - Academic year and semester selectors
 * - Course description with character count
 * - Integration with course catalog API
 */
import { useEffect } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  getAssignedCourses,
} from '@/features/lecturer/api/syllabus.api'
import { useTranslation } from '@/features/lecturer/hooks/useTranslation'
import type { Syllabus } from '@/features/lecturer/types'

interface CourseInformationStepProps {
  form: UseFormReturn<Syllabus>
}

export function CourseInformationStep({ form }: CourseInformationStepProps) {
  const { t } = useTranslation()
  const selectedCourseId = form.watch('courseId')

  // Fetch assigned courses
  const {
    data: courses,
    isLoading: isLoadingCourses,
    error: coursesError,
  } = useQuery({
    queryKey: ['lecturer', 'courses'],
    queryFn: getAssignedCourses,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  // Pre-populate course data when a course is selected
  useEffect(() => {
    if (selectedCourseId && courses) {
      const selectedCourse = courses.find((c) => c.course_id === selectedCourseId)
      if (selectedCourse) {
        // Pre-populate course code, name, and credits
        form.setValue('courseCode', selectedCourse.code)
        form.setValue('courseName', selectedCourse.name)
        form.setValue('credits', selectedCourse.credits)
        // Calculate total hours (credits × 15)
        form.setValue('totalHours', selectedCourse.credits * 15)
      }
    }
  }, [selectedCourseId, courses, form])

  // Generate academic year options (current year and next 2 years)
  const currentYear = new Date().getFullYear()
  const academicYears = Array.from({ length: 3 }, (_, i) => {
    const startYear = currentYear + i
    const endYear = startYear + 1
    return `${startYear}-${endYear}`
  })

  // Character count for description
  const description = form.watch('description') || ''
  const descriptionLength = description.length
  const descriptionMin = 100
  const descriptionMax = 2000

  return (
    <div className='space-y-6'>
      {/* Course Selection */}
      <FormField
        control={form.control}
        name='courseId'
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('courseInformation.course.label')} *</FormLabel>
            <Select
              onValueChange={(value) => field.onChange(Number(value))}
              value={field.value ? field.value.toString() : undefined}
              defaultValue={field.value ? field.value.toString() : undefined}
              disabled={isLoadingCourses}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t('courseInformation.course.placeholder')}
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="z-[100]">
                {isLoadingCourses && (
                  <div className='p-2'>
                    <Skeleton className='h-8 w-full' />
                  </div>
                )}
                {coursesError && (
                  <div className='p-2 text-sm text-destructive'>
                    {t('courseInformation.course.loadError')}
                  </div>
                )}
                {!isLoadingCourses && !coursesError && (!courses || courses.length === 0) && (
                  <div className='p-2 text-sm text-muted-foreground'>
                    {t('courseInformation.course.noCoursesAssigned')}
                  </div>
                )}
                {!isLoadingCourses && !coursesError && courses && courses.length > 0 && courses.map((course) => (
                  <SelectItem key={course.course_id} value={course.course_id.toString()}>
                    {course.code} - {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              {t('courseInformation.course.description')}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {coursesError && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            {t('courseInformation.course.loadError')}
          </AlertDescription>
        </Alert>
      )}

      {/* Course Code (Read-only, pre-populated) */}
      <FormField
        control={form.control}
        name='courseCode'
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('courseInformation.courseCode.label')}</FormLabel>
            <FormControl>
              <Input {...field} readOnly className='bg-muted' />
            </FormControl>
            <FormDescription>
              {t('courseInformation.courseCode.description')}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Course Name (Read-only, pre-populated) */}
      <FormField
        control={form.control}
        name='courseName'
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('courseInformation.courseName.label')}</FormLabel>
            <FormControl>
              <Input {...field} readOnly className='bg-muted' />
            </FormControl>
            <FormDescription>
              {t('courseInformation.courseName.description')}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Academic Year */}
      <FormField
        control={form.control}
        name='academicYear'
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('courseInformation.academicYear.label')} *</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              value={field.value || undefined}
              defaultValue={field.value || undefined}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      'courseInformation.academicYear.placeholder'
                    )}
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              {t('courseInformation.academicYear.description')}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Semester */}
      <FormField
        control={form.control}
        name='semester'
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('courseInformation.semester.label')} *</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              value={field.value || undefined}
              defaultValue={field.value || undefined}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t('courseInformation.semester.placeholder')}
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value='Fall'>
                  {t('courseInformation.semester.fall')}
                </SelectItem>
                <SelectItem value='Spring'>
                  {t('courseInformation.semester.spring')}
                </SelectItem>
                <SelectItem value='Summer'>
                  {t('courseInformation.semester.summer')}
                </SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              {t('courseInformation.semester.description')}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Credits (Read-only, pre-populated) */}
      <FormField
        control={form.control}
        name='credits'
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('courseInformation.credits.label')}</FormLabel>
            <FormControl>
              <Input
                type='number'
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
                readOnly
                className='bg-muted'
              />
            </FormControl>
            <FormDescription>
              {t('courseInformation.credits.description')}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Total Hours (Read-only, calculated) */}
      <FormField
        control={form.control}
        name='totalHours'
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('courseInformation.totalHours.label')}</FormLabel>
            <FormControl>
              <Input
                type='number'
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
                readOnly
                className='bg-muted'
              />
            </FormControl>
            <FormDescription>
              {t('courseInformation.totalHours.description')}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Course Description */}
      <FormField
        control={form.control}
        name='description'
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('courseInformation.description.label')} *</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder={t('courseInformation.description.placeholder')}
                className='min-h-[150px] resize-y'
                maxLength={descriptionMax}
              />
            </FormControl>
            <div className='flex items-center justify-between'>
              <FormDescription>
                {t('courseInformation.description.description')}
              </FormDescription>
              <span
                className={`text-sm ${
                  descriptionLength < descriptionMin
                    ? 'text-destructive'
                    : descriptionLength > descriptionMax * 0.9
                      ? 'text-warning'
                      : 'text-muted-foreground'
                }`}
              >
                {descriptionLength} / {descriptionMax}{' '}
                {t('courseInformation.description.characters')}
                {descriptionLength < descriptionMin &&
                  ` (${t('courseInformation.description.minimum')} ${descriptionMin})`}
              </span>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
