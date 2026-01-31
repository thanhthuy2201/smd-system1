/**
 * PreviewStep Component
 *
 * Final step of the syllabus wizard showing a formatted preview.
 * Displays complete syllabus matching university template layout.
 *
 * Features:
 * - Formatted syllabus preview
 * - University template layout
 * - Edit buttons for each section
 * - Print/export functionality
 */
import type { UseFormReturn } from 'react-hook-form'
import { Edit, FileText, Printer } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Syllabus } from '@/features/lecturer/types'

interface PreviewStepProps {
  form: UseFormReturn<Syllabus>
  onEdit: (step: number) => void
}

export function PreviewStep({ form, onEdit }: PreviewStepProps) {
  const formData = form.getValues()

  // Calculate total hours
  const totalLectureHours =
    formData.content?.reduce(
      (sum, topic) => sum + (topic.lectureHours || 0),
      0
    ) || 0
  const totalLabHours =
    formData.content?.reduce((sum, topic) => sum + (topic.labHours || 0), 0) ||
    0

  return (
    <div className='space-y-6'>
      {/* Preview Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <FileText className='h-5 w-5' />
          <h3 className='text-lg font-semibold'>Xem Trước Đề Cương</h3>
        </div>
        <Button variant='outline' size='sm' onClick={() => window.print()}>
          <Printer className='mr-2 h-4 w-4' />
          In
        </Button>
      </div>

      {/* Course Information */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
          <CardTitle className='text-base'>Thông Tin Học Phần</CardTitle>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => onEdit(1)}
            className='h-8 px-2'
          >
            <Edit className='h-4 w-4' />
            <span className='sr-only'>Chỉnh sửa thông tin học phần</span>
          </Button>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                Mã Học Phần
              </p>
              <p className='text-base font-semibold'>
                {formData.courseCode || 'N/A'}
              </p>
            </div>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                Tên Học Phần
              </p>
              <p className='text-base font-semibold'>
                {formData.courseName || 'N/A'}
              </p>
            </div>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                Năm Học
              </p>
              <p className='text-base'>{formData.academicYear || 'N/A'}</p>
            </div>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                Học Kỳ
              </p>
              <p className='text-base'>{formData.semester || 'N/A'}</p>
            </div>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                Số Tín Chỉ
              </p>
              <p className='text-base'>{formData.credits || 0}</p>
            </div>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                Tổng Số Giờ
              </p>
              <p className='text-base'>{formData.totalHours || 0}</p>
            </div>
          </div>
          <Separator />
          <div>
            <p className='mb-2 text-sm font-medium text-muted-foreground'>
              Mô Tả
            </p>
            <p className='text-sm leading-relaxed'>
              {formData.description || 'N/A'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Learning Outcomes */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
          <CardTitle className='text-base'>
            Chuẩn Đầu Ra Học Phần (CLO)
          </CardTitle>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => onEdit(2)}
            className='h-8 px-2'
          >
            <Edit className='h-4 w-4' />
            <span className='sr-only'>Chỉnh sửa chuẩn đầu ra</span>
          </Button>
        </CardHeader>
        <CardContent>
          {formData.clos && formData.clos.length > 0 ? (
            <div className='space-y-4'>
              {formData.clos.map((clo) => (
                <div key={clo.code} className='space-y-2'>
                  <div className='flex items-start gap-3'>
                    <Badge variant='secondary' className='mt-0.5'>
                      {clo.code}
                    </Badge>
                    <div className='flex-1 space-y-1'>
                      <p className='text-sm leading-relaxed'>
                        {clo.description}
                      </p>
                      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                        <span>Cấp độ Bloom: {clo.bloomLevel}</span>
                        <span>•</span>
                        <span>
                          Ánh xạ với: {clo.mappedPlos?.join(', ') || 'Không có'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-sm text-muted-foreground'>Chưa định nghĩa CLO</p>
          )}
        </CardContent>
      </Card>

      {/* CLO-PLO Mapping */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
          <CardTitle className='text-base'>Ánh Xạ CLO-PLO</CardTitle>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => onEdit(3)}
            className='h-8 px-2'
          >
            <Edit className='h-4 w-4' />
            <span className='sr-only'>Chỉnh sửa ánh xạ CLO-PLO</span>
          </Button>
        </CardHeader>
        <CardContent>
          {formData.clos && formData.clos.length > 0 ? (
            <div className='space-y-2'>
              {formData.clos.map((clo) => (
                <div
                  key={clo.code}
                  className='flex items-center justify-between border-b py-2 last:border-0'
                >
                  <span className='text-sm font-medium'>{clo.code}</span>
                  <div className='flex flex-wrap justify-end gap-1'>
                    {clo.mappedPlos && clo.mappedPlos.length > 0 ? (
                      clo.mappedPlos.map((plo) => (
                        <Badge key={plo} variant='outline' className='text-xs'>
                          {plo}
                        </Badge>
                      ))
                    ) : (
                      <span className='text-xs text-muted-foreground'>
                        Chưa ánh xạ
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-sm text-muted-foreground'>Chưa có ánh xạ</p>
          )}
        </CardContent>
      </Card>

      {/* Course Content */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
          <CardTitle className='text-base'>Nội Dung Học Phần</CardTitle>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => onEdit(4)}
            className='h-8 px-2'
          >
            <Edit className='h-4 w-4' />
            <span className='sr-only'>Chỉnh sửa nội dung học phần</span>
          </Button>
        </CardHeader>
        <CardContent>
          {formData.content && formData.content.length > 0 ? (
            <>
              <div className='mb-4 rounded-md bg-muted p-3'>
                <div className='grid grid-cols-3 gap-4 text-sm'>
                  <div>
                    <span className='font-medium'>Tổng Số Tuần:</span>{' '}
                    {formData.content.length}
                  </div>
                  <div>
                    <span className='font-medium'>Giờ Lý Thuyết:</span>{' '}
                    {totalLectureHours}
                  </div>
                  <div>
                    <span className='font-medium'>Giờ Thực Hành:</span>{' '}
                    {totalLabHours}
                  </div>
                </div>
              </div>
              <div className='space-y-4'>
                {formData.content.map((topic) => (
                  <div key={topic.weekNumber} className='space-y-2'>
                    <div className='flex items-start gap-3'>
                      <Badge variant='secondary' className='mt-0.5'>
                        Tuần {topic.weekNumber}
                      </Badge>
                      <div className='flex-1 space-y-1'>
                        <p className='text-sm font-medium'>{topic.title}</p>
                        <p className='text-sm text-muted-foreground'>
                          {topic.description}
                        </p>
                        <div className='flex flex-wrap gap-2 text-xs text-muted-foreground'>
                          <span>
                            Lý thuyết: {topic.lectureHours}h, Thực hành:{' '}
                            {topic.labHours}h
                          </span>
                          <span>•</span>
                          <span>
                            CLO: {topic.relatedClos?.join(', ') || 'Không có'}
                          </span>
                          <span>•</span>
                          <span>
                            Phương pháp:{' '}
                            {topic.teachingMethods?.join(', ') || 'Không có'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className='text-sm text-muted-foreground'>Chưa định nghĩa nội dung</p>
          )}
        </CardContent>
      </Card>

      {/* Assessment Methods */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
          <CardTitle className='text-base'>Phương Pháp Đánh Giá</CardTitle>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => onEdit(5)}
            className='h-8 px-2'
          >
            <Edit className='h-4 w-4' />
            <span className='sr-only'>Chỉnh sửa phương pháp đánh giá</span>
          </Button>
        </CardHeader>
        <CardContent>
          {formData.assessments && formData.assessments.length > 0 ? (
            <div className='space-y-3'>
              {formData.assessments.map((assessment, index) => (
                <div
                  key={index}
                  className='flex items-start justify-between border-b py-2 last:border-0'
                >
                  <div className='flex-1 space-y-1'>
                    <div className='flex items-center gap-2'>
                      <Badge variant='outline'>{assessment.type}</Badge>
                      <p className='text-sm font-medium'>{assessment.name}</p>
                    </div>
                    {assessment.description && (
                      <p className='text-xs text-muted-foreground'>
                        {assessment.description}
                      </p>
                    )}
                    <p className='text-xs text-muted-foreground'>
                      Đánh giá: {assessment.relatedClos?.join(', ') || 'Không có'}
                    </p>
                  </div>
                  <div className='text-right'>
                    <p className='text-lg font-bold'>{assessment.weight}%</p>
                  </div>
                </div>
              ))}
              <div className='flex items-center justify-between pt-2 font-bold'>
                <span>Tổng</span>
                <span>
                  {formData.assessments.reduce(
                    (sum, a) => sum + (a.weight || 0),
                    0
                  )}
                  %
                </span>
              </div>
            </div>
          ) : (
            <p className='text-sm text-muted-foreground'>
              Chưa định nghĩa phương pháp đánh giá
            </p>
          )}
        </CardContent>
      </Card>

      {/* References */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
          <CardTitle className='text-base'>Tài Liệu Tham Khảo</CardTitle>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => onEdit(6)}
            className='h-8 px-2'
          >
            <Edit className='h-4 w-4' />
            <span className='sr-only'>Chỉnh sửa tài liệu tham khảo</span>
          </Button>
        </CardHeader>
        <CardContent>
          {formData.references && formData.references.length > 0 ? (
            <div className='space-y-4'>
              {/* Required Textbooks */}
              {formData.references.some((ref) => ref.type === 'Required') && (
                <div>
                  <h4 className='mb-2 text-sm font-semibold'>
                    Giáo Trình Bắt Buộc
                  </h4>
                  <ul className='list-inside list-disc space-y-2'>
                    {formData.references
                      .filter((ref) => ref.type === 'Required')
                      .map((ref, index) => (
                        <li key={index} className='text-sm'>
                          <span className='font-medium'>{ref.title}</span> bởi{' '}
                          {ref.authors}
                          {ref.publisher && `, ${ref.publisher}`}
                          {ref.year && ` (${ref.year})`}
                          {ref.isbn && (
                            <span className='text-muted-foreground'>
                              {' '}
                              - ISBN: {ref.isbn}
                            </span>
                          )}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Recommended Textbooks */}
              {formData.references.some(
                (ref) => ref.type === 'Recommended'
              ) && (
                <div>
                  <h4 className='mb-2 text-sm font-semibold'>
                    Giáo Trình Tham Khảo
                  </h4>
                  <ul className='list-inside list-disc space-y-2'>
                    {formData.references
                      .filter((ref) => ref.type === 'Recommended')
                      .map((ref, index) => (
                        <li key={index} className='text-sm'>
                          <span className='font-medium'>{ref.title}</span> bởi{' '}
                          {ref.authors}
                          {ref.publisher && `, ${ref.publisher}`}
                          {ref.year && ` (${ref.year})`}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Online Resources */}
              {formData.references.some(
                (ref) => ref.type === 'Online Resource'
              ) && (
                <div>
                  <h4 className='mb-2 text-sm font-semibold'>
                    Tài Nguyên Trực Tuyến
                  </h4>
                  <ul className='list-inside list-disc space-y-2'>
                    {formData.references
                      .filter((ref) => ref.type === 'Online Resource')
                      .map((ref, index) => (
                        <li key={index} className='text-sm'>
                          <span className='font-medium'>{ref.title}</span> bởi{' '}
                          {ref.authors}
                          {ref.url && (
                            <a
                              href={ref.url}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='ml-1 text-primary hover:underline'
                            >
                              {ref.url}
                            </a>
                          )}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className='text-sm text-muted-foreground'>
              Chưa định nghĩa tài liệu tham khảo
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
