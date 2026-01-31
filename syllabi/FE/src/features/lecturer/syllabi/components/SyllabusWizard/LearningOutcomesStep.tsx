/**
 * LearningOutcomesStep Component
 *
 * Second step of the syllabus wizard for defining Course Learning Outcomes (CLOs).
 * Auto-generates sequential CLO codes and validates Bloom's taxonomy levels.
 *
 * Features:
 * - Add/remove CLOs dynamically
 * - Auto-generate sequential CLO codes (CLO1, CLO2, CLO3...)
 * - Bloom's taxonomy level selector
 * - Minimum 3 CLOs validation
 * - Action verb validation for descriptions
 */
import { useFieldArray, type UseFormReturn } from 'react-hook-form'
import { Plus, Trash2, AlertCircle, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Syllabus, BloomLevel } from '@/features/lecturer/types'

interface LearningOutcomesStepProps {
  form: UseFormReturn<Syllabus>
}

const BLOOM_LEVELS: BloomLevel[] = [
  'Remember',
  'Understand',
  'Apply',
  'Analyze',
  'Evaluate',
  'Create',
]

const BLOOM_DESCRIPTIONS: Record<BloomLevel, string> = {
  Remember: 'Recall facts and basic concepts',
  Understand: 'Explain ideas or concepts',
  Apply: 'Use information in new situations',
  Analyze: 'Draw connections among ideas',
  Evaluate: 'Justify a stand or decision',
  Create: 'Produce new or original work',
}

const ACTION_VERBS: Record<BloomLevel, string[]> = {
  Remember: ['Define', 'List', 'Recall', 'Identify', 'Name', 'State'],
  Understand: ['Describe', 'Explain', 'Summarize', 'Interpret', 'Classify'],
  Apply: ['Apply', 'Demonstrate', 'Use', 'Implement', 'Solve', 'Execute'],
  Analyze: ['Analyze', 'Compare', 'Contrast', 'Examine', 'Differentiate'],
  Evaluate: ['Evaluate', 'Assess', 'Justify', 'Critique', 'Defend', 'Judge'],
  Create: ['Create', 'Design', 'Develop', 'Construct', 'Formulate', 'Compose'],
}

export function LearningOutcomesStep({ form }: LearningOutcomesStepProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'clos',
  })

  // Generate next CLO code
  const generateCLOCode = () => {
    const currentCLOs = form.getValues('clos') || []
    return `CLO${currentCLOs.length + 1}`
  }

  // Add new CLO
  const handleAddCLO = () => {
    append({
      code: generateCLOCode(),
      description: '',
      bloomLevel: 'Remember',
      mappedPlos: [],
    })
  }

  // Remove CLO and regenerate codes
  const handleRemoveCLO = (index: number) => {
    remove(index)

    // Regenerate sequential codes for remaining CLOs
    const currentCLOs = form.getValues('clos')
    currentCLOs.forEach((_clo, idx) => {
      form.setValue(`clos.${idx}.code`, `CLO${idx + 1}`)
    })
  }

  return (
    <div className='space-y-6'>
      {/* Info Alert */}
      <Alert>
        <Info className='h-4 w-4' />
        <AlertDescription>
          Định nghĩa ít nhất 3 Chuẩn Đầu Ra Học Phần (CLO). Mỗi CLO nên
          bắt đầu bằng một động từ hành động và chỉ rõ sinh viên sẽ có thể làm gì
          sau khi hoàn thành học phần.
        </AlertDescription>
      </Alert>

      {/* Bloom's Taxonomy Reference */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Các Cấp Độ Phân Loại Bloom</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {BLOOM_LEVELS.map((level) => (
              <div key={level} className='space-y-1'>
                <p className='text-sm font-medium'>{level}</p>
                <p className='text-xs text-muted-foreground'>
                  {BLOOM_DESCRIPTIONS[level]}
                </p>
                <p className='text-xs text-muted-foreground'>
                  <span className='font-medium'>Động từ:</span>{' '}
                  {ACTION_VERBS[level].slice(0, 3).join(', ')}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CLO List */}
      <div className='space-y-4'>
        {fields.length === 0 ? (
          <Alert>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              Chưa có CLO nào. Nhấp "Thêm CLO" để bắt đầu.
            </AlertDescription>
          </Alert>
        ) : (
          fields.map((field, index) => (
            <Card key={field.id}>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-base'>
                    {form.watch(`clos.${index}.code`) || `CLO${index + 1}`}
                  </CardTitle>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => handleRemoveCLO(index)}
                    disabled={fields.length <= 1}
                  >
                    <Trash2 className='h-4 w-4 text-destructive' />
                    <span className='sr-only'>Xóa CLO</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className='space-y-4'>
                {/* CLO Code (Read-only) */}
                <FormField
                  control={form.control}
                  name={`clos.${index}.code`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mã CLO</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly className='bg-muted' />
                      </FormControl>
                      <FormDescription>
                        Mã tuần tự được tạo tự động
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Bloom's Level */}
                <FormField
                  control={form.control}
                  name={`clos.${index}.bloomLevel`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cấp Độ Phân Loại Bloom *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn cấp độ Bloom" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BLOOM_LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level} - {BLOOM_DESCRIPTIONS[level]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Chọn cấp độ nhận thức cho chuẩn đầu ra này
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CLO Description */}
                <FormField
                  control={form.control}
                  name={`clos.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mô Tả *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={`Bắt đầu bằng động từ hành động (VD: ${ACTION_VERBS[
                            form.watch(`clos.${index}.bloomLevel`) || 'Remember'
                          ]
                            .slice(0, 3)
                            .join(', ')})...`}
                          className='min-h-[100px] resize-y'
                        />
                      </FormControl>
                      <FormDescription>
                        Mô tả những gì sinh viên sẽ có thể làm (tối thiểu 20
                        ký tự, phải bắt đầu bằng động từ hành động)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Suggested Action Verbs */}
                {form.watch(`clos.${index}.bloomLevel`) && (
                  <div className='rounded-md bg-muted p-3'>
                    <p className='mb-2 text-sm font-medium'>
                      Động từ hành động gợi ý cho{' '}
                      {form.watch(`clos.${index}.bloomLevel`)}:
                    </p>
                    <div className='flex flex-wrap gap-2'>
                      {ACTION_VERBS[
                        form.watch(`clos.${index}.bloomLevel`) as BloomLevel
                      ].map((verb) => (
                        <span
                          key={verb}
                          className='inline-flex items-center rounded-md bg-background px-2 py-1 text-xs font-medium'
                        >
                          {verb}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add CLO Button */}
      <Button
        type='button'
        variant='outline'
        onClick={handleAddCLO}
        className='w-full'
      >
        <Plus className='mr-2 h-4 w-4' />
        Thêm CLO
      </Button>

      {/* Validation Warning */}
      {fields.length < 3 && fields.length > 0 && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            Cần ít nhất 3 CLO. Hiện tại bạn có {fields.length} CLO
            {fields.length !== 1 ? 's' : ''}.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
