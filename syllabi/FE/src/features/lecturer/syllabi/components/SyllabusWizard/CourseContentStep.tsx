/**
 * CourseContentStep Component
 *
 * Fourth step of the syllabus wizard for defining weekly course content.
 * Manages topics, hours allocation, and validates alignment with credit hours.
 *
 * Features:
 * - Add/remove weekly topics
 * - Hours allocation with validation (0-10 per topic)
 * - Calculate and display total hours
 * - Validate hours alignment with credits
 * - Link topics to CLOs
 */
import { useFieldArray, type UseFormReturn } from 'react-hook-form'
import { Plus, Trash2, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Syllabus } from '@/features/lecturer/types'

interface CourseContentStepProps {
  form: UseFormReturn<Syllabus>
}

const TEACHING_METHODS = [
  'Giảng Dạy',
  'Thảo Luận',
  'Thực Hành',
  'Nghiên Cứu Tình Huống',
  'Làm Việc Nhóm',
  'Thuyết Trình',
  'Giải Quyết Vấn Đề',
  'Dự Án',
]

export function CourseContentStep({ form }: CourseContentStepProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'content',
  })

  const clos = form.watch('clos') || []
  const credits = form.watch('credits') || 3
  const expectedTotalHours = credits * 15

  // Calculate total hours
  const calculateTotalHours = () => {
    const content = form.getValues('content') || []
    return content.reduce(
      (total, topic) =>
        total + (topic.lectureHours || 0) + (topic.labHours || 0),
      0
    )
  }

  const totalHours = calculateTotalHours()
  const hoursAlignment = Math.abs(totalHours - expectedTotalHours)
  const isAligned = hoursAlignment <= 3 // Allow 3 hours tolerance

  // Add new topic
  const handleAddTopic = () => {
    const nextWeek = fields.length + 1
    append({
      weekNumber: nextWeek,
      title: '',
      description: '',
      lectureHours: 0,
      labHours: 0,
      relatedClos: [],
      teachingMethods: [],
    })
  }

  // Remove topic and renumber
  const handleRemoveTopic = (index: number) => {
    remove(index)

    // Renumber remaining topics
    const currentContent = form.getValues('content')
    currentContent.forEach((_, idx) => {
      form.setValue(`content.${idx}.weekNumber`, idx + 1)
    })
  }

  // Toggle CLO selection
  const toggleCLO = (topicIndex: number, cloCode: string) => {
    const currentCLOs =
      form.getValues(`content.${topicIndex}.relatedClos`) || []

    if (currentCLOs.includes(cloCode)) {
      form.setValue(
        `content.${topicIndex}.relatedClos`,
        currentCLOs.filter((code) => code !== cloCode)
      )
    } else {
      form.setValue(`content.${topicIndex}.relatedClos`, [
        ...currentCLOs,
        cloCode,
      ])
    }
  }

  // Toggle teaching method
  const toggleTeachingMethod = (topicIndex: number, method: string) => {
    const currentMethods =
      form.getValues(`content.${topicIndex}.teachingMethods`) || []

    if (currentMethods.includes(method)) {
      form.setValue(
        `content.${topicIndex}.teachingMethods`,
        currentMethods.filter((m) => m !== method)
      )
    } else {
      form.setValue(`content.${topicIndex}.teachingMethods`, [
        ...currentMethods,
        method,
      ])
    }
  }

  if (clos.length === 0) {
    return (
      <Alert variant='destructive'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>
          Vui lòng định nghĩa CLO ở bước 2 trước khi tạo nội dung học phần.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Info Alert */}
      <Alert>
        <Info className='h-4 w-4' />
        <AlertDescription>
          Định nghĩa các chủ đề theo tuần với phân bổ giờ học. Tổng số giờ nên phù hợp
          với số tín chỉ ({credits} tín chỉ × 15 = {expectedTotalHours}{' '}
          giờ).
        </AlertDescription>
      </Alert>

      {/* Hours Summary */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Tổng Hợp Giờ Học</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div className='space-y-1'>
              <p className='text-sm text-muted-foreground'>Tổng Dự Kiến</p>
              <p className='text-2xl font-bold'>{expectedTotalHours}h</p>
            </div>
            <div className='space-y-1'>
              <p className='text-sm text-muted-foreground'>Tổng Hiện Tại</p>
              <p
                className={`text-2xl font-bold ${isAligned ? 'text-green-600' : 'text-destructive'}`}
              >
                {totalHours}h
              </p>
            </div>
            <div className='space-y-1'>
              <p className='text-sm text-muted-foreground'>Chênh Lệch</p>
              <p
                className={`text-2xl font-bold ${isAligned ? 'text-green-600' : 'text-destructive'}`}
              >
                {totalHours > expectedTotalHours ? '+' : ''}
                {totalHours - expectedTotalHours}h
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topics List */}
      <div className='space-y-4'>
        {fields.length === 0 ? (
          <Alert>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              Chưa có chủ đề nào. Nhấp "Thêm Chủ Đề" để bắt đầu.
            </AlertDescription>
          </Alert>
        ) : (
          fields.map((field, index) => (
            <Card key={field.id}>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-base'>
                    Tuần{' '}
                    {form.watch(`content.${index}.weekNumber`) || index + 1}
                  </CardTitle>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => handleRemoveTopic(index)}
                  >
                    <Trash2 className='h-4 w-4 text-destructive' />
                    <span className='sr-only'>Xóa chủ đề</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className='space-y-4'>
                {/* Topic Title */}
                <FormField
                  control={form.control}
                  name={`content.${index}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tiêu Đề Chủ Đề *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder='VD: Giới Thiệu Lập Trình'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Topic Description */}
                <FormField
                  control={form.control}
                  name={`content.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mô Tả *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder='Mô tả nội dung sẽ được giảng dạy trong tuần này...'
                          className='min-h-[80px] resize-y'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Hours Allocation */}
                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name={`content.${index}.lectureHours`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Giờ Lý Thuyết *</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            min='0'
                            max='10'
                            step='0.5'
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>0-10 giờ</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`content.${index}.labHours`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Giờ Thực Hành *</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            min='0'
                            max='10'
                            step='0.5'
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>0-10 giờ</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Related CLOs */}
                <FormField
                  control={form.control}
                  name={`content.${index}.relatedClos`}
                  render={() => (
                    <FormItem>
                      <FormLabel>CLO Liên Quan *</FormLabel>
                      <FormDescription>
                        Chọn ít nhất một CLO mà chủ đề này đề cập
                      </FormDescription>
                      <div className='mt-2 flex flex-wrap gap-2'>
                        {clos.map((clo) => {
                          const isSelected = form
                            .watch(`content.${index}.relatedClos`)
                            ?.includes(clo.code)
                          return (
                            <Badge
                              key={clo.code}
                              variant={isSelected ? 'default' : 'outline'}
                              className='cursor-pointer'
                              onClick={() => toggleCLO(index, clo.code)}
                            >
                              {clo.code}
                            </Badge>
                          )
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Teaching Methods */}
                <FormField
                  control={form.control}
                  name={`content.${index}.teachingMethods`}
                  render={() => (
                    <FormItem>
                      <FormLabel>Phương Pháp Giảng Dạy *</FormLabel>
                      <FormDescription>
                        Chọn ít nhất một phương pháp giảng dạy
                      </FormDescription>
                      <div className='mt-2 grid grid-cols-2 gap-3 md:grid-cols-4'>
                        {TEACHING_METHODS.map((method) => {
                          const isSelected = form
                            .watch(`content.${index}.teachingMethods`)
                            ?.includes(method)
                          return (
                            <div
                              key={method}
                              className='flex items-center space-x-2'
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() =>
                                  toggleTeachingMethod(index, method)
                                }
                                id={`method-${index}-${method}`}
                              />
                              <label
                                htmlFor={`method-${index}-${method}`}
                                className='cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                              >
                                {method}
                              </label>
                            </div>
                          )
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Topic Button */}
      <Button
        type='button'
        variant='outline'
        onClick={handleAddTopic}
        className='w-full'
      >
        <Plus className='mr-2 h-4 w-4' />
        Thêm Chủ Đề
      </Button>

      {/* Hours Alignment Warning */}
      {!isAligned && fields.length > 0 && (
        <Alert variant='destructive'>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>
            Tổng số giờ ({totalHours}h) nên phù hợp với số giờ dự kiến (
            {expectedTotalHours}h). Chênh lệch hiện tại:{' '}
            {Math.abs(totalHours - expectedTotalHours)}h.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
