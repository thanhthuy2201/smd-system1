/**
 * AssessmentMethodsStep Component
 *
 * Fifth step of the syllabus wizard for defining assessment methods.
 * Manages assessment types, weights, and validates total equals 100%.
 *
 * Features:
 * - Add/remove assessments
 * - Weight percentage inputs
 * - Calculate and display total weight
 * - Validate total equals 100%
 * - Show CLO coverage for each assessment
 */
import { useFieldArray, type UseFormReturn } from 'react-hook-form'
import { Plus, Trash2, AlertCircle, Info, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Syllabus, AssessmentType } from '@/features/lecturer/types'

interface AssessmentMethodsStepProps {
  form: UseFormReturn<Syllabus>
}

const ASSESSMENT_TYPES: AssessmentType[] = [
  'Quiz',
  'Assignment',
  'Midterm',
  'Final',
  'Project',
  'Presentation',
]

export function AssessmentMethodsStep({ form }: AssessmentMethodsStepProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'assessments',
  })

  const clos = form.watch('clos') || []

  // Calculate total weight
  const calculateTotalWeight = () => {
    const assessments = form.getValues('assessments') || []
    return assessments.reduce(
      (total, assessment) => total + (assessment.weight || 0),
      0
    )
  }

  const totalWeight = calculateTotalWeight()
  const isValidWeight = Math.abs(totalWeight - 100) < 0.01

  // Add new assessment
  const handleAddAssessment = () => {
    append({
      type: 'Quiz',
      name: '',
      weight: 0,
      relatedClos: [],
      description: '',
    })
  }

  // Toggle CLO selection
  const toggleCLO = (assessmentIndex: number, cloCode: string) => {
    const currentCLOs =
      form.getValues(`assessments.${assessmentIndex}.relatedClos`) || []

    if (currentCLOs.includes(cloCode)) {
      form.setValue(
        `assessments.${assessmentIndex}.relatedClos`,
        currentCLOs.filter((code) => code !== cloCode)
      )
    } else {
      form.setValue(`assessments.${assessmentIndex}.relatedClos`, [
        ...currentCLOs,
        cloCode,
      ])
    }
  }

  // Check which CLOs are covered by assessments
  const getCLOCoverage = () => {
    const assessments = form.getValues('assessments') || []
    const coveredCLOs = new Set<string>()

    assessments.forEach((assessment) => {
      assessment.relatedClos?.forEach((clo) => coveredCLOs.add(clo))
    })

    return clos.map((clo) => ({
      code: clo.code,
      isCovered: coveredCLOs.has(clo.code),
    }))
  }

  const closCoverage = getCLOCoverage()
  const allCLOsCovered = closCoverage.every((clo) => clo.isCovered)

  if (clos.length === 0) {
    return (
      <Alert variant='destructive'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>
          Vui lòng định nghĩa CLO ở bước 2 trước khi tạo phương pháp đánh giá.
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
          Định nghĩa các phương pháp đánh giá và trọng số của chúng. Tổng trọng số phải bằng
          100%. Mỗi phương pháp đánh giá nên liên quan đến ít nhất một CLO.
        </AlertDescription>
      </Alert>

      {/* Weight Summary */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Tổng Hợp Trọng Số</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <div className='flex items-center justify-between text-sm'>
              <span className='font-medium'>Tổng Trọng Số</span>
              <span
                className={`font-bold ${
                  isValidWeight ? 'text-green-600' : 'text-destructive'
                }`}
              >
                {totalWeight.toFixed(1)}%
              </span>
            </div>
            <Progress
              value={totalWeight}
              className={`h-3 ${totalWeight > 100 ? '[&>div]:bg-destructive' : ''}`}
            />
            <p className='text-xs text-muted-foreground'>
              {isValidWeight ? (
                <span className='flex items-center gap-1 text-green-600'>
                  <CheckCircle2 className='h-3 w-3' />
                  Phân bổ trọng số hợp lệ
                </span>
              ) : (
                <span className='flex items-center gap-1 text-destructive'>
                  <AlertCircle className='h-3 w-3' />
                  {totalWeight < 100
                    ? `Cần thêm ${(100 - totalWeight).toFixed(1)}%`
                    : `Vượt quá ${(totalWeight - 100).toFixed(1)}%`}
                </span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CLO Coverage */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Phủ Sóng CLO</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-2'>
            {closCoverage.map((clo) => (
              <Badge
                key={clo.code}
                variant={clo.isCovered ? 'default' : 'destructive'}
              >
                {clo.code}
                {clo.isCovered ? (
                  <CheckCircle2 className='ml-1 h-3 w-3' />
                ) : (
                  <AlertCircle className='ml-1 h-3 w-3' />
                )}
              </Badge>
            ))}
          </div>
          {!allCLOsCovered && (
            <p className='mt-2 text-xs text-destructive'>
              Tất cả CLO phải được đánh giá bởi ít nhất một phương pháp đánh giá
            </p>
          )}
        </CardContent>
      </Card>

      {/* Assessments List */}
      <div className='space-y-4'>
        {fields.length === 0 ? (
          <Alert>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              Chưa có phương pháp đánh giá nào. Nhấp "Thêm Đánh Giá" để bắt đầu.
            </AlertDescription>
          </Alert>
        ) : (
          fields.map((field, index) => (
            <Card key={field.id}>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-base'>
                    Đánh Giá {index + 1}
                  </CardTitle>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => remove(index)}
                  >
                    <Trash2 className='h-4 w-4 text-destructive' />
                    <span className='sr-only'>Xóa đánh giá</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className='space-y-4'>
                {/* Assessment Type */}
                <FormField
                  control={form.control}
                  name={`assessments.${index}.type`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loại *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Chọn loại đánh giá' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ASSESSMENT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Assessment Name */}
                <FormField
                  control={form.control}
                  name={`assessments.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder='VD: Thi Giữa Kỳ, Đồ Án Cuối Kỳ'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Weight */}
                <FormField
                  control={form.control}
                  name={`assessments.${index}.weight`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trọng Số (%) *</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min='0'
                          max='100'
                          step='0.1'
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Phần trăm điểm cuối kỳ (0-100%)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Related CLOs */}
                <FormField
                  control={form.control}
                  name={`assessments.${index}.relatedClos`}
                  render={() => (
                    <FormItem>
                      <FormLabel>CLO Liên Quan *</FormLabel>
                      <FormDescription>
                        Chọn ít nhất một CLO mà đánh giá này kiểm tra
                      </FormDescription>
                      <div className='mt-2 flex flex-wrap gap-2'>
                        {clos.map((clo) => {
                          const isSelected = form
                            .watch(`assessments.${index}.relatedClos`)
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

                {/* Description (Optional) */}
                <FormField
                  control={form.control}
                  name={`assessments.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mô Tả (Tùy Chọn)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder='Chi tiết bổ sung về đánh giá này...'
                          className='min-h-[80px] resize-y'
                        />
                      </FormControl>
                      <FormDescription>
                        Cung cấp thêm ngữ cảnh hoặc yêu cầu
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Assessment Button */}
      <Button
        type='button'
        variant='outline'
        onClick={handleAddAssessment}
        className='w-full'
      >
        <Plus className='mr-2 h-4 w-4' />
        Thêm Đánh Giá
      </Button>

      {/* Validation Warnings */}
      {!isValidWeight && fields.length > 0 && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            Tổng trọng số phải bằng 100%. Tổng hiện tại:{' '}
            {totalWeight.toFixed(1)}%
          </AlertDescription>
        </Alert>
      )}

      {!allCLOsCovered && fields.length > 0 && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            Tất cả CLO phải được đánh giá bởi ít nhất một phương pháp đánh giá.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
