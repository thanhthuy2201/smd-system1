import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Form,
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
import {
  academicYearFormSchema,
  AcademicYearStatus,
  type AcademicYearFormInput,
} from '../data/schema'
import { AcademicYearDatePicker } from './academic-year-date-picker'

interface AcademicYearFormProps {
  mode: 'create' | 'edit'
  defaultValues?: Partial<AcademicYearFormInput>
  onSubmit: (data: AcademicYearFormInput) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
  onDirtyChange?: (isDirty: boolean) => void
}

export function AcademicYearForm({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  onDirtyChange,
}: AcademicYearFormProps) {
  const form = useForm<AcademicYearFormInput>({
    resolver: zodResolver(academicYearFormSchema),
    defaultValues: {
      code: defaultValues?.code || '',
      name: defaultValues?.name || '',
      startDate: defaultValues?.startDate,
      endDate: defaultValues?.endDate,
      status: defaultValues?.status || AcademicYearStatus.ACTIVE,
    },
    mode: 'onChange',
  })

  // Watch code field for auto-generating label
  const codeValue = form.watch('code')

  // Track form dirty state and notify parent (Requirement 11.1)
  useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(form.formState.isDirty)
    }
  }, [form.formState.isDirty, onDirtyChange])

  // Auto-generate label from code (optional feature - Requirement 10.1, 10.3)
  useEffect(() => {
    if (mode === 'create' && codeValue && !form.formState.dirtyFields.name) {
      // Only auto-generate if name hasn't been manually edited
      const codePattern = /^\d{4}-\d{4}$/
      if (codePattern.test(codeValue)) {
        form.setValue('name', codeValue, { shouldDirty: false })
      }
    }
  }, [codeValue, mode, form])

  const handleSubmit = async (data: AcademicYearFormInput) => {
    await onSubmit(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
        {/* Academic Year Code Field */}
        <FormField
          control={form.control}
          name='code'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mã năm học</FormLabel>
              <FormControl>
                <Input
                  placeholder='2025-2026'
                  {...field}
                  disabled={mode === 'edit' || isSubmitting}
                  readOnly={mode === 'edit'}
                />
              </FormControl>
              <FormDescription>
                Định dạng: YYYY-YYYY (ví dụ: 2025-2026)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Academic Year Name/Label Field */}
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên/Nhãn</FormLabel>
              <FormControl>
                <Input
                  placeholder='Năm học 2025-2026'
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Tên hiển thị của năm học (tùy chọn)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Start Date Field */}
        <FormField
          control={form.control}
          name='startDate'
          render={({ field }) => (
            <FormItem className='flex flex-col'>
              <FormLabel>Ngày bắt đầu</FormLabel>
              <FormControl>
                <AcademicYearDatePicker
                  selected={field.value}
                  onSelect={field.onChange}
                  placeholder='Chọn ngày bắt đầu'
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>Ngày bắt đầu của năm học</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* End Date Field */}
        <FormField
          control={form.control}
          name='endDate'
          render={({ field }) => (
            <FormItem className='flex flex-col'>
              <FormLabel>Ngày kết thúc</FormLabel>
              <FormControl>
                <AcademicYearDatePicker
                  selected={field.value}
                  onSelect={field.onChange}
                  placeholder='Chọn ngày kết thúc'
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>Ngày kết thúc của năm học</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status Field */}
        <FormField
          control={form.control}
          name='status'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trạng thái</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Chọn trạng thái' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={AcademicYearStatus.ACTIVE}>
                    Hoạt động
                  </SelectItem>
                  <SelectItem value={AcademicYearStatus.DISABLED}>
                    Vô hiệu hóa
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Trạng thái hoạt động của năm học
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className='flex gap-4'>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu...' : 'Lưu'}
          </Button>
          <Button
            type='button'
            variant='outline'
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
        </div>
      </form>
    </Form>
  )
}
