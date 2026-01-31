/**
 * CLOPLOMappingStep Component
 *
 * Third step of the syllabus wizard for mapping CLOs to Program Learning Outcomes (PLOs).
 * Displays a matrix interface for selecting PLO mappings.
 *
 * Features:
 * - Matrix interface for CLO-PLO mapping
 * - Fetch PLOs from program API
 * - Validate at least one PLO per CLO
 * - Show mapping summary
 */
import type { UseFormReturn } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, Info, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Skeleton } from '@/components/ui/skeleton'
import { getProgramPLOs, getAssignedCourses } from '@/features/lecturer/api/syllabus.api'
import type { Syllabus } from '@/features/lecturer/types'

interface CLOPLOMappingStepProps {
  form: UseFormReturn<Syllabus>
}

export function CLOPLOMappingStep({ form }: CLOPLOMappingStepProps) {
  const clos = form.watch('clos') || []
  const courseId = form.watch('courseId')

  console.log('[CLOPLOMappingStep] courseId:', courseId)

  // Fetch the selected course to get program_id
  const { data: courses } = useQuery({
    queryKey: ['lecturer', 'courses'],
    queryFn: getAssignedCourses,
  })

  console.log('[CLOPLOMappingStep] courses:', courses)

  // Get the selected course
  const selectedCourse = courses?.find((c) => c.course_id === courseId)
  // Handle both camelCase and snake_case from backend
  const programId = selectedCourse?.programId || (selectedCourse as any)?.program_id

  console.log('[CLOPLOMappingStep] selectedCourse:', selectedCourse)
  console.log('[CLOPLOMappingStep] programId:', programId)

  // Fetch PLOs for the course's program
  const {
    data: plos,
    isLoading: isLoadingPLOs,
    error: plosError,
  } = useQuery({
    queryKey: ['program', 'plos', programId],
    queryFn: async () => {
      if (!programId) return []
      console.log('[CLOPLOMappingStep] Fetching PLOs for programId:', programId)
      return await getProgramPLOs(programId)
    },
    enabled: !!programId,
  })

  console.log('[CLOPLOMappingStep] plos:', plos)
  console.log('[CLOPLOMappingStep] isLoadingPLOs:', isLoadingPLOs)
  console.log('[CLOPLOMappingStep] plosError:', plosError)

  // Check if a CLO is mapped to a PLO
  const isMapped = (cloIndex: number, ploCode: string): boolean => {
    const clo = clos[cloIndex]
    return clo?.mappedPlos?.includes(ploCode) || false
  }

  // Toggle PLO mapping for a CLO
  const toggleMapping = (cloIndex: number, ploCode: string) => {
    const currentMappings = form.getValues(`clos.${cloIndex}.mappedPlos`) || []

    if (currentMappings.includes(ploCode)) {
      // Remove mapping
      form.setValue(
        `clos.${cloIndex}.mappedPlos`,
        currentMappings.filter((code) => code !== ploCode)
      )
    } else {
      // Add mapping
      form.setValue(`clos.${cloIndex}.mappedPlos`, [
        ...currentMappings,
        ploCode,
      ])
    }
  }

  // Get mapping count for a CLO
  const getMappingCount = (cloIndex: number): number => {
    return form.watch(`clos.${cloIndex}.mappedPlos`)?.length || 0
  }

  // Check if all CLOs have at least one mapping
  const allCLOsMapped = clos.every((_, index) => getMappingCount(index) > 0)

  if (clos.length === 0) {
    return (
      <Alert variant='destructive'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>
          Vui lòng định nghĩa CLO ở bước trước trước khi ánh xạ chúng với PLO.
        </AlertDescription>
      </Alert>
    )
  }

  if (!courseId) {
    return (
      <Alert variant='destructive'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>
          Vui lòng chọn học phần ở bước đầu tiên để tải PLO.
        </AlertDescription>
      </Alert>
    )
  }

  if (!programId) {
    return (
      <Alert variant='destructive'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>
          Không thể xác định chương trình cho học phần đã chọn. Vui lòng liên hệ quản trị viên.
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
          Ánh xạ mỗi Chuẩn Đầu Ra Học Phần (CLO) với ít nhất một Chuẩn Đầu Ra Chương Trình (PLO). 
          Điều này đảm bảo sự liên kết giữa mục tiêu học phần và mục tiêu chương trình.
        </AlertDescription>
      </Alert>

      {/* Loading State */}
      {isLoadingPLOs && (
        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-48' />
          </CardHeader>
          <CardContent className='space-y-4'>
            <Skeleton className='h-20 w-full' />
            <Skeleton className='h-20 w-full' />
            <Skeleton className='h-20 w-full' />
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {plosError && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            Không thể tải PLO. Vui lòng thử lại sau.
          </AlertDescription>
        </Alert>
      )}

      {/* Mapping Matrix */}
      {plos && plos.length > 0 && (
        <>
          {/* Desktop View - Matrix */}
          <div className='hidden overflow-x-auto lg:block'>
            <table className='w-full border-collapse'>
              <thead>
                <tr>
                  <th className='border bg-muted p-3 text-left font-medium'>
                    CLO
                  </th>
                  {plos.map((plo) => (
                    <th
                      key={plo.code}
                      className='min-w-[100px] border bg-muted p-3 text-center font-medium'
                    >
                      <div className='space-y-1'>
                        <div className='font-semibold'>{plo.code}</div>
                        <div className='line-clamp-2 text-xs font-normal text-muted-foreground'>
                          {plo.description}
                        </div>
                      </div>
                    </th>
                  ))}
                  <th className='border bg-muted p-3 text-center font-medium'>
                    Đã Ánh Xạ
                  </th>
                </tr>
              </thead>
              <tbody>
                {clos.map((clo, cloIndex) => (
                  <tr key={clo.code}>
                    <td className='border p-3 font-medium'>
                      <div className='space-y-1'>
                        <div>{clo.code}</div>
                        <div className='line-clamp-2 text-xs text-muted-foreground'>
                          {clo.description}
                        </div>
                      </div>
                    </td>
                    {plos.map((plo) => (
                      <td key={plo.code} className='border p-3 text-center'>
                        <div className='flex items-center justify-center'>
                          <Checkbox
                            checked={isMapped(cloIndex, plo.code)}
                            onCheckedChange={() =>
                              toggleMapping(cloIndex, plo.code)
                            }
                            aria-label={`Map ${clo.code} to ${plo.code}`}
                          />
                        </div>
                      </td>
                    ))}
                    <td className='border p-3 text-center'>
                      <div className='flex items-center justify-center gap-2'>
                        {getMappingCount(cloIndex) > 0 ? (
                          <>
                            <CheckCircle2 className='h-4 w-4 text-green-600' />
                            <span className='text-sm'>
                              {getMappingCount(cloIndex)}
                            </span>
                          </>
                        ) : (
                          <span className='text-sm text-destructive'>0</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet View - Cards */}
          <div className='space-y-4 lg:hidden'>
            {clos.map((clo, cloIndex) => (
              <Card key={clo.code}>
                <CardHeader>
                  <CardTitle className='flex items-center justify-between text-base'>
                    <span>{clo.code}</span>
                    <span className='text-sm font-normal'>
                      {getMappingCount(cloIndex) > 0 ? (
                        <span className='flex items-center gap-1 text-green-600'>
                          <CheckCircle2 className='h-4 w-4' />
                          {getMappingCount(cloIndex)} mapped
                        </span>
                      ) : (
                        <span className='text-destructive'>Not mapped</span>
                      )}
                    </span>
                  </CardTitle>
                  <p className='text-sm text-muted-foreground'>
                    {clo.description}
                  </p>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {plos.map((plo) => (
                    <FormField
                      key={plo.code}
                      control={form.control}
                      name={`clos.${cloIndex}.mappedPlos`}
                      render={() => (
                        <FormItem className='flex flex-row items-start space-y-0 space-x-3'>
                          <FormControl>
                            <Checkbox
                              checked={isMapped(cloIndex, plo.code)}
                              onCheckedChange={() =>
                                toggleMapping(cloIndex, plo.code)
                              }
                            />
                          </FormControl>
                          <div className='space-y-1 leading-none'>
                            <FormLabel className='font-medium'>
                              {plo.code}
                            </FormLabel>
                            <FormDescription className='text-xs'>
                              {plo.description}
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Mapping Summary */}
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Tổng Hợp Ánh Xạ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                {clos.map((clo, index) => {
                  const count = getMappingCount(index)
                  return (
                    <div
                      key={clo.code}
                      className='flex items-center justify-between border-b py-2 last:border-0'
                    >
                      <span className='font-medium'>{clo.code}</span>
                      <span
                        className={`text-sm ${
                          count > 0 ? 'text-green-600' : 'text-destructive'
                        }`}
                      >
                        {count > 0 ? (
                          <>
                            <CheckCircle2 className='mr-1 inline h-4 w-4' />
                            Đã ánh xạ với {count} PLO{count !== 1 ? 's' : ''}
                          </>
                        ) : (
                          <>
                            <AlertCircle className='mr-1 inline h-4 w-4' />
                            Chưa ánh xạ
                          </>
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Validation Warning */}
          {!allCLOsMapped && (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                Tất cả CLO phải được ánh xạ với ít nhất một PLO trước khi tiếp tục.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* No PLOs Available */}
      {plos && plos.length === 0 && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            Không tìm thấy PLO cho chương trình này. Vui lòng liên hệ quản trị viên.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
