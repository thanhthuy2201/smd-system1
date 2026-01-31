import { useState } from 'react'
import { BookOpen, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { vi } from '@/features/lecturer/i18n/vi'
import type { EvaluationTemplate } from '@/features/lecturer/types'

interface RubricGuideProps {
  template: EvaluationTemplate
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface ScoreLevel {
  score: number
  label: string
  description: string
  examples: string[]
}

// Default scoring guidelines for each level (1-5)
const DEFAULT_SCORE_LEVELS: ScoreLevel[] = [
  {
    score: 1,
    label: vi.peerReview.rubric.scores[1],
    description:
      'Tiêu chí không được đáp ứng hoặc có nhiều vấn đề nghiêm trọng cần khắc phục.',
    examples: [
      'Thiếu thông tin quan trọng',
      'Không tuân thủ các tiêu chuẩn bắt buộc',
      'Có lỗi nghiêm trọng về nội dung hoặc cấu trúc',
    ],
  },
  {
    score: 2,
    label: vi.peerReview.rubric.scores[2],
    description:
      'Tiêu chí được đáp ứng một phần nhưng cần cải thiện đáng kể.',
    examples: [
      'Thông tin không đầy đủ hoặc không rõ ràng',
      'Một số yêu cầu quan trọng chưa được đáp ứng',
      'Cần bổ sung hoặc làm rõ nhiều phần',
    ],
  },
  {
    score: 3,
    label: vi.peerReview.rubric.scores[3],
    description:
      'Tiêu chí được đáp ứng ở mức chấp nhận được, đáp ứng các yêu cầu cơ bản.',
    examples: [
      'Tất cả thông tin bắt buộc đều có mặt',
      'Tuân thủ các tiêu chuẩn tối thiểu',
      'Có thể cải thiện nhưng không bắt buộc',
    ],
  },
  {
    score: 4,
    label: vi.peerReview.rubric.scores[4],
    description:
      'Tiêu chí được đáp ứng tốt, vượt quá các yêu cầu cơ bản.',
    examples: [
      'Thông tin đầy đủ, rõ ràng và có tổ chức tốt',
      'Vượt quá các tiêu chuẩn tối thiểu',
      'Chỉ cần cải thiện nhỏ (nếu có)',
    ],
  },
  {
    score: 5,
    label: vi.peerReview.rubric.scores[5],
    description:
      'Tiêu chí được đáp ứng xuất sắc, là mẫu mực cho các đề cương khác.',
    examples: [
      'Thông tin toàn diện, chi tiết và được trình bày xuất sắc',
      'Vượt xa các yêu cầu và mong đợi',
      'Có thể dùng làm mẫu tham khảo',
    ],
  },
]

function ScoreLevelCard({ level }: { level: ScoreLevel }) {
  const getScoreColor = (score: number) => {
    if (score <= 2) return 'destructive'
    if (score === 3) return 'secondary'
    if (score === 4) return 'default'
    return 'default'
  }

  const getScoreBgColor = (score: number) => {
    if (score <= 2) return 'bg-destructive/10'
    if (score === 3) return 'bg-secondary'
    if (score === 4) return 'bg-primary/10'
    return 'bg-green-500/10'
  }

  return (
    <div
      className={`rounded-lg border p-4 ${getScoreBgColor(level.score)}`}
    >
      <div className='mb-3 flex items-center gap-2'>
        <Badge variant={getScoreColor(level.score)} className='text-base'>
          {level.score}
        </Badge>
        <span className='font-semibold'>{level.label}</span>
      </div>
      <p className='mb-3 text-sm text-muted-foreground'>{level.description}</p>
      <div className='space-y-2'>
        <p className='text-sm font-medium'>
          {vi.peerReview.rubric.examples}:
        </p>
        <ul className='space-y-1 text-sm text-muted-foreground'>
          {level.examples.map((example, idx) => (
            <li key={idx} className='flex items-start gap-2'>
              <span className='mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current' />
              <span>{example}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function CriterionGuide({
  criterion,
  index,
}: {
  criterion: EvaluationTemplate['criteria'][0]
  index: number
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className='rounded-lg border bg-card'>
        <CollapsibleTrigger asChild>
          <button
            className='flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-accent'
            type='button'
          >
            <div className='flex-1'>
              <div className='flex items-center gap-3'>
                <Badge variant='outline'>
                  {vi.peerReview.evaluation.criterion} {index + 1}
                </Badge>
                <h3 className='font-semibold'>{criterion.name}</h3>
              </div>
              <p className='mt-2 text-sm text-muted-foreground'>
                {criterion.description}
              </p>
              <div className='mt-2 flex items-center gap-2 text-xs text-muted-foreground'>
                <Info className='h-3 w-3' />
                <span>
                  {vi.peerReview.evaluation.criterion} • {criterion.weight}%
                </span>
              </div>
            </div>
            <div className='ml-4'>
              {isOpen ? (
                <ChevronUp className='h-5 w-5 text-muted-foreground' />
              ) : (
                <ChevronDown className='h-5 w-5 text-muted-foreground' />
              )}
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className='space-y-3 border-t p-4'>
            <div className='mb-4'>
              <h4 className='mb-2 text-sm font-semibold'>
                {vi.peerReview.rubric.guidelines}
              </h4>
              <p className='text-sm text-muted-foreground'>
                Sử dụng các mức điểm dưới đây để đánh giá tiêu chí này. Điểm
                thấp (≤2) yêu cầu nhận xét giải thích.
              </p>
            </div>
            {DEFAULT_SCORE_LEVELS.map((level) => (
              <ScoreLevelCard key={level.score} level={level} />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

export function RubricGuide({
  template,
  trigger,
  open,
  onOpenChange,
}: RubricGuideProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined && onOpenChange !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant='outline' size='sm'>
            <BookOpen className='mr-2 h-4 w-4' />
            {vi.peerReview.evaluation.rubricGuide}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className='w-full overflow-y-auto sm:max-w-2xl'>
        <SheetHeader>
          <SheetTitle>{vi.peerReview.rubric.title}</SheetTitle>
          <SheetDescription>
            {vi.peerReview.rubric.description}
          </SheetDescription>
        </SheetHeader>

        <div className='mt-6 space-y-4'>
          {/* General Scoring Guidelines */}
          <div className='rounded-lg border bg-muted/50 p-4'>
            <h3 className='mb-3 flex items-center gap-2 font-semibold'>
              <Info className='h-4 w-4' />
              Hướng dẫn chung
            </h3>
            <ul className='space-y-2 text-sm text-muted-foreground'>
              <li className='flex items-start gap-2'>
                <span className='mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current' />
                <span>
                  Đánh giá mỗi tiêu chí độc lập dựa trên các mức điểm được mô
                  tả
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current' />
                <span>
                  Điểm 1-2 yêu cầu nhận xét giải thích cụ thể về vấn đề cần
                  khắc phục
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current' />
                <span>
                  Điểm 3 là mức chấp nhận được, đáp ứng các yêu cầu tối thiểu
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current' />
                <span>
                  Điểm 4-5 dành cho các đề cương vượt quá mong đợi và có chất
                  lượng cao
                </span>
              </li>
            </ul>
          </div>

          {/* Criterion-specific Guidelines */}
          <div className='space-y-3'>
            <h3 className='font-semibold'>
              Hướng dẫn theo từng tiêu chí ({template.criteria.length})
            </h3>
            {template.criteria.map((criterion, index) => (
              <CriterionGuide
                key={criterion.id}
                criterion={criterion}
                index={index}
              />
            ))}
          </div>

          {/* Score Level Reference */}
          <div className='rounded-lg border bg-card p-4'>
            <h3 className='mb-3 font-semibold'>
              {vi.peerReview.rubric.scoreLevel}
            </h3>
            <div className='space-y-2'>
              {DEFAULT_SCORE_LEVELS.map((level) => (
                <div
                  key={level.score}
                  className='flex items-center gap-3 text-sm'
                >
                  <Badge
                    variant={
                      level.score <= 2
                        ? 'destructive'
                        : level.score === 3
                          ? 'secondary'
                          : 'default'
                    }
                  >
                    {level.score}
                  </Badge>
                  <span className='font-medium'>{level.label}</span>
                  <span className='text-muted-foreground'>-</span>
                  <span className='text-muted-foreground'>
                    {level.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
