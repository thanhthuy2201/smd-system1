import { FileText, Download, Printer, ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { vi } from '@/features/lecturer/i18n/vi'
import type { Syllabus } from '@/features/lecturer/types'

interface SyllabusViewerProps {
  syllabus: Syllabus
  onBack?: () => void
  onPrint?: () => void
  onExport?: () => void
}

export function SyllabusViewer({
  syllabus,
  onBack,
  onPrint,
  onExport,
}: SyllabusViewerProps) {
  return (
    <div className='space-y-6'>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className='flex items-start justify-between'>
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <FileText className='h-5 w-5' />
                <CardTitle>{vi.peerReview.viewer.title}</CardTitle>
                <Badge variant='outline'>{vi.peerReview.viewer.readOnly}</Badge>
              </div>
              <CardDescription>
                {syllabus.courseCode} - {syllabus.courseName}
              </CardDescription>
            </div>
            <div className='flex items-center gap-2'>
              {onBack && (
                <Button variant='outline' size='sm' onClick={onBack}>
                  <ArrowLeft className='mr-2 h-4 w-4' />
                  {vi.peerReview.viewer.backToQueue}
                </Button>
              )}
              {onPrint && (
                <Button variant='outline' size='sm' onClick={onPrint}>
                  <Printer className='mr-2 h-4 w-4' />
                  {vi.peerReview.viewer.print}
                </Button>
              )}
              {onExport && (
                <Button variant='outline' size='sm' onClick={onExport}>
                  <Download className='mr-2 h-4 w-4' />
                  {vi.peerReview.viewer.export}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Course Information */}
      <Card>
        <CardHeader>
          <CardTitle>{vi.preview.sections.courseInformation}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <div className='text-sm font-medium text-muted-foreground'>
                {vi.courseInformation.courseCode.label}
              </div>
              <div className='text-base'>{syllabus.courseCode}</div>
            </div>
            <div>
              <div className='text-sm font-medium text-muted-foreground'>
                {vi.courseInformation.courseName.label}
              </div>
              <div className='text-base'>{syllabus.courseName}</div>
            </div>
            <div>
              <div className='text-sm font-medium text-muted-foreground'>
                {vi.courseInformation.academicYear.label}
              </div>
              <div className='text-base'>{syllabus.academicYear}</div>
            </div>
            <div>
              <div className='text-sm font-medium text-muted-foreground'>
                {vi.courseInformation.semester.label}
              </div>
              <div className='text-base'>{syllabus.semester}</div>
            </div>
            <div>
              <div className='text-sm font-medium text-muted-foreground'>
                {vi.courseInformation.credits.label}
              </div>
              <div className='text-base'>{syllabus.credits}</div>
            </div>
            <div>
              <div className='text-sm font-medium text-muted-foreground'>
                {vi.courseInformation.totalHours.label}
              </div>
              <div className='text-base'>{syllabus.totalHours}</div>
            </div>
          </div>
          <Separator />
          <div>
            <div className='mb-2 text-sm font-medium text-muted-foreground'>
              {vi.courseInformation.description.label}
            </div>
            <div className='text-base whitespace-pre-wrap'>
              {syllabus.description}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Outcomes */}
      <Card>
        <CardHeader>
          <CardTitle>{vi.preview.sections.learningOutcomes}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {syllabus.clos.map((clo, index) => (
              <div key={index} className='rounded-lg border p-4'>
                <div className='flex items-start gap-4'>
                  <Badge variant='outline'>{clo.code}</Badge>
                  <div className='flex-1 space-y-2'>
                    <div className='text-base'>{clo.description}</div>
                    <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                      <div>
                        <span className='font-medium'>
                          {vi.learningOutcomes.clo.bloomLevel.label}:
                        </span>{' '}
                        {clo.bloomLevel}
                      </div>
                      <div>
                        <span className='font-medium'>
                          {vi.cloPloMapping.plo}:
                        </span>{' '}
                        {clo.mappedPlos.join(', ')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Course Content */}
      <Card>
        <CardHeader>
          <CardTitle>{vi.preview.sections.courseContent}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {syllabus.content.map((topic, index) => (
              <div key={index} className='rounded-lg border p-4'>
                <div className='space-y-2'>
                  <div className='flex items-center gap-2'>
                    <Badge>
                      {vi.courseContent.week} {topic.weekNumber}
                    </Badge>
                    <h4 className='font-semibold'>{topic.title}</h4>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    {topic.description}
                  </p>
                  <div className='flex items-center gap-4 text-sm'>
                    <div>
                      <span className='font-medium'>
                        {vi.courseContent.lectureHours.label}:
                      </span>{' '}
                      {topic.lectureHours}
                    </div>
                    <div>
                      <span className='font-medium'>
                        {vi.courseContent.labHours.label}:
                      </span>{' '}
                      {topic.labHours}
                    </div>
                    <div>
                      <span className='font-medium'>
                        {vi.courseContent.relatedCLOs.label}:
                      </span>{' '}
                      {topic.relatedClos.join(', ')}
                    </div>
                  </div>
                  <div className='text-sm'>
                    <span className='font-medium'>
                      {vi.courseContent.teachingMethods.label}:
                    </span>{' '}
                    {topic.teachingMethods.join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assessment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>{vi.preview.sections.assessmentMethods}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {syllabus.assessments.map((assessment, index) => (
              <div key={index} className='rounded-lg border p-4'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1 space-y-2'>
                    <div className='flex items-center gap-2'>
                      <Badge variant='secondary'>{assessment.type}</Badge>
                      <h4 className='font-semibold'>{assessment.name}</h4>
                    </div>
                    {assessment.description && (
                      <p className='text-sm text-muted-foreground'>
                        {assessment.description}
                      </p>
                    )}
                    <div className='text-sm'>
                      <span className='font-medium'>
                        {vi.assessmentMethods.relatedCLOs.label}:
                      </span>{' '}
                      {assessment.relatedClos.join(', ')}
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-2xl font-bold'>
                      {assessment.weight}%
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      {vi.assessmentMethods.weight.label}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <Separator />
            <div className='flex justify-end'>
              <div className='text-right'>
                <div className='text-sm text-muted-foreground'>
                  {vi.assessmentMethods.totalWeight.label}
                </div>
                <div className='text-xl font-bold'>
                  {syllabus.assessments.reduce((sum, a) => sum + a.weight, 0)}%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* References */}
      <Card>
        <CardHeader>
          <CardTitle>{vi.preview.sections.references}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {syllabus.references.map((reference, index) => (
              <div key={index} className='rounded-lg border p-4'>
                <div className='space-y-2'>
                  <div className='flex items-start gap-2'>
                    <Badge
                      variant={
                        reference.type === 'Required' ? 'default' : 'outline'
                      }
                    >
                      {reference.type}
                    </Badge>
                    <div className='flex-1'>
                      <h4 className='font-semibold'>{reference.title}</h4>
                      <p className='text-sm text-muted-foreground'>
                        {reference.authors}
                      </p>
                      <div className='mt-1 flex items-center gap-4 text-sm text-muted-foreground'>
                        {reference.publisher && (
                          <div>{reference.publisher}</div>
                        )}
                        {reference.year && <div>{reference.year}</div>}
                        {reference.isbn && <div>ISBN: {reference.isbn}</div>}
                      </div>
                      {reference.url && (
                        <a
                          href={reference.url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-sm text-blue-600 hover:underline'
                        >
                          {reference.url}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
