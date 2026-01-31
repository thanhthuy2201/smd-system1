import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Save, Send } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { vi } from '@/features/lecturer/i18n/vi'
import {
  peerEvaluationSchema,
  type PeerEvaluationFormData,
} from '@/features/lecturer/schemas/review.schema'
import type { EvaluationTemplate } from '@/features/lecturer/types'
import { RubricGuide } from './RubricGuide'

interface EvaluationFormProps {
  syllabusId: number
  template: EvaluationTemplate
  initialData?: Partial<PeerEvaluationFormData>
  onSaveDraft?: (data: PeerEvaluationFormData) => void
  onSubmit: (data: PeerEvaluationFormData) => void
  isSaving?: boolean
  isSubmitting?: boolean
  isReadOnly?: boolean
}

const SCORE_OPTIONS = [
  { value: 1, label: '1 - ' + vi.peerReview.rubric.scores[1] },
  { value: 2, label: '2 - ' + vi.peerReview.rubric.scores[2] },
  { value: 3, label: '3 - ' + vi.peerReview.rubric.scores[3] },
  { value: 4, label: '4 - ' + vi.peerReview.rubric.scores[4] },
  { value: 5, label: '5 - ' + vi.peerReview.rubric.scores[5] },
]

export function EvaluationForm({
  syllabusId,
  template,
  initialData,
  onSaveDraft,
  onSubmit,
  isSaving = false,
  isSubmitting = false,
  isReadOnly = false,
}: EvaluationFormProps) {
  const form = useForm<PeerEvaluationFormData>({
    resolver: zodResolver(peerEvaluationSchema),
    defaultValues: {
      syllabusId,
      criteriaScores: template.criteria.map((criterion) => ({
        criterionId: criterion.id,
        criterionName: criterion.name,
        score: 3, // Default to "Meets Expectations"
        comment: '',
      })),
      recommendation: undefined,
      summaryComments: '',
      ...initialData,
    },
    mode: 'onChange',
  })

  const { fields } = useFieldArray({
    control: form.control,
    name: 'criteriaScores',
  })

  // Calculate overall weighted score
  const calculateOverallScore = (): number => {
    const scores = form.watch('criteriaScores')
    if (!scores || scores.length === 0) return 0

    let totalWeightedScore = 0
    let totalWeight = 0

    scores.forEach((score, index) => {
      const criterion = template.criteria[index]
      if (criterion && score.score) {
        totalWeightedScore += score.score * criterion.weight
        totalWeight += criterion.weight
      }
    })

    return totalWeight > 0 ? totalWeightedScore / totalWeight : 0
  }

  const overallScore = calculateOverallScore()

  // Watch for score changes to show/hide comment fields
  const criteriaScores = form.watch('criteriaScores')

  const handleSaveDraft = () => {
    const data = form.getValues()
    onSaveDraft?.(data)
  }

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data)
  })

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Rubric Guide Button */}
        <div className='flex items-center justify-end'>
          <RubricGuide template={template} />
        </div>

        {/* Evaluation Criteria */}
        <Card>
          <CardHeader>
            <CardTitle>{vi.peerReview.evaluation.title}</CardTitle>
            <CardDescription>
              {vi.peerReview.evaluation.description}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            {fields.map((field, index) => {
              const criterion = template.criteria[index]
              const currentScore = criteriaScores?.[index]?.score
              const requiresComment =
                currentScore !== undefined && currentScore <= 2

              return (
                <div
                  key={field.id}
                  className='space-y-4 border-b pb-6 last:border-b-0 last:pb-0'
                >
                  {/* Criterion Header */}
                  <div className='space-y-2'>
                    <div className='flex items-start justify-between gap-4'>
                      <div className='flex-1'>
                        <h4 className='text-base font-semibold'>
                          {criterion.name}
                        </h4>
                        <p className='mt-1 text-sm text-muted-foreground'>
                          {criterion.description}
                        </p>
                      </div>
                      <Badge variant='secondary'>
                        {vi.peerReview.evaluation.criterion} {index + 1} •{' '}
                        {criterion.weight}%
                      </Badge>
                    </div>
                  </div>

                  {/* Score Selection */}
                  <FormField
                    control={form.control}
                    name={`criteriaScores.${index}.score`}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FormLabel>{vi.peerReview.evaluation.score}</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            formField.onChange(parseInt(value, 10))
                          }
                          value={formField.value?.toString()}
                          disabled={isReadOnly}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={vi.common.select} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SCORE_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value.toString()}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Conditional Comment Field for Low Scores */}
                  {requiresComment && (
                    <Alert variant='destructive'>
                      <AlertCircle className='h-4 w-4' />
                      <AlertDescription>
                        {vi.peerReview.evaluation.commentRequired}
                      </AlertDescription>
                    </Alert>
                  )}

                  <FormField
                    control={form.control}
                    name={`criteriaScores.${index}.comment`}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FormLabel>
                          {vi.peerReview.evaluation.comment}
                          {requiresComment && (
                            <span className='ml-1 text-destructive'>*</span>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={
                              vi.peerReview.evaluation.commentPlaceholder
                            }
                            className='min-h-[100px] resize-none'
                            disabled={isReadOnly}
                            {...formField}
                          />
                        </FormControl>
                        <FormDescription>
                          {formField.value?.length || 0} / 500{' '}
                          {vi.common.characters}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Overall Score Display */}
        <Card>
          <CardHeader>
            <CardTitle>{vi.peerReview.evaluation.overallScore}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-center'>
              <div className='text-center'>
                <div className='text-5xl font-bold text-primary'>
                  {overallScore.toFixed(2)}
                </div>
                <div className='mt-2 text-sm text-muted-foreground'>
                  {vi.common.outOf} 5.00
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendation */}
        <Card>
          <CardHeader>
            <CardTitle>
              {vi.peerReview.evaluation.recommendation.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name='recommendation'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {vi.peerReview.evaluation.recommendation.label}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isReadOnly}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            vi.peerReview.evaluation.recommendation.placeholder
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='Approve'>
                        {vi.peerReview.evaluation.recommendation.approve}
                      </SelectItem>
                      <SelectItem value='Needs Revision'>
                        {vi.peerReview.evaluation.recommendation.needsRevision}
                      </SelectItem>
                      <SelectItem value='Reject'>
                        {vi.peerReview.evaluation.recommendation.reject}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Summary Comments */}
        <Card>
          <CardHeader>
            <CardTitle>
              {vi.peerReview.evaluation.summaryComments.label}
            </CardTitle>
            <CardDescription>
              {vi.peerReview.evaluation.summaryComments.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name='summaryComments'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {vi.peerReview.evaluation.summaryComments.label}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        vi.peerReview.evaluation.summaryComments.placeholder
                      }
                      className='min-h-[150px] resize-none'
                      disabled={isReadOnly}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0} / 2000 {vi.common.characters} (
                    {vi.common.minimum} 50)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className='flex items-center justify-end gap-3'>
          {onSaveDraft && !isReadOnly && (
            <Button
              type='button'
              variant='outline'
              onClick={handleSaveDraft}
              disabled={isSaving || isSubmitting}
            >
              <Save className='mr-2 h-4 w-4' />
              {isSaving ? vi.common.saving : vi.peerReview.evaluation.saveDraft}
            </Button>
          )}
          {!isReadOnly && (
            <Button type='submit' disabled={isSaving || isSubmitting}>
              <Send className='mr-2 h-4 w-4' />
              {isSubmitting
                ? vi.common.submitting
                : vi.peerReview.evaluation.submitEvaluation}
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
