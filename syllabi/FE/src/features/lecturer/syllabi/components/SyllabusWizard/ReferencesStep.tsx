/**
 * ReferencesStep Component
 *
 * Sixth step of the syllabus wizard for adding course references.
 * Validates ISBN and URL formats, ensures at least one required textbook.
 *
 * Features:
 * - Add/remove references
 * - Type selector (Required/Recommended/Online)
 * - ISBN and URL format validation
 * - Ensure at least one required textbook
 */
import { useFieldArray, type UseFormReturn } from 'react-hook-form'
import { Plus, Trash2, AlertCircle, Info, Book, Globe } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Syllabus, ReferenceType } from '@/features/lecturer/types'

interface ReferencesStepProps {
  form: UseFormReturn<Syllabus>
}

const REFERENCE_TYPES: ReferenceType[] = [
  'Required',
  'Recommended',
  'Online Resource',
]

export function ReferencesStep({ form }: ReferencesStepProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'references',
  })

  // Check if at least one required textbook exists
  const hasRequiredTextbook = () => {
    const references = form.getValues('references') || []
    return references.some((ref) => ref.type === 'Required')
  }

  const hasRequired = hasRequiredTextbook()

  // Add new reference
  const handleAddReference = () => {
    append({
      type: 'Required',
      title: '',
      authors: '',
      publisher: '',
      year: new Date().getFullYear(),
      isbn: '',
      url: '',
    })
  }

  // Get icon for reference type
  const getTypeIcon = (type: ReferenceType) => {
    switch (type) {
      case 'Online Resource':
        return <Globe className='h-4 w-4' />
      default:
        return <Book className='h-4 w-4' />
    }
  }

  // Get badge variant for reference type
  const getTypeBadgeVariant = (type: ReferenceType) => {
    switch (type) {
      case 'Required':
        return 'default'
      case 'Recommended':
        return 'secondary'
      case 'Online Resource':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <div className='space-y-6'>
      {/* Info Alert */}
      <Alert>
        <Info className='h-4 w-4' />
        <AlertDescription>
          Thêm giáo trình và tài liệu cho học phần. Phải chỉ định ít nhất một
          giáo trình bắt buộc. Đối với giáo trình, cung cấp ISBN. Đối với tài nguyên
          trực tuyến, cung cấp URL.
        </AlertDescription>
      </Alert>

      {/* Reference Type Summary */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Tổng Hợp Tài Liệu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-2'>
            <Badge variant={hasRequired ? 'default' : 'destructive'}>
              Bắt Buộc:{' '}
              {
                fields.filter(
                  (_, i) => form.watch(`references.${i}.type`) === 'Required'
                ).length
              }
            </Badge>
            <Badge variant='secondary'>
              Tham Khảo:{' '}
              {
                fields.filter(
                  (_, i) => form.watch(`references.${i}.type`) === 'Recommended'
                ).length
              }
            </Badge>
            <Badge variant='outline'>
              Trực Tuyến:{' '}
              {
                fields.filter(
                  (_, i) =>
                    form.watch(`references.${i}.type`) === 'Online Resource'
                ).length
              }
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* References List */}
      <div className='space-y-4'>
        {fields.length === 0 ? (
          <Alert>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              Chưa có tài liệu tham khảo. Nhấp "Thêm Tài Liệu" để bắt đầu.
            </AlertDescription>
          </Alert>
        ) : (
          fields.map((field, index) => {
            const referenceType = form.watch(`references.${index}.type`)
            const isOnlineResource = referenceType === 'Online Resource'

            return (
              <Card key={field.id}>
                <CardHeader className='pb-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      {getTypeIcon(referenceType)}
                      <CardTitle className='text-base'>
                        Tài Liệu {index + 1}
                      </CardTitle>
                      <Badge variant={getTypeBadgeVariant(referenceType)}>
                        {referenceType}
                      </Badge>
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => remove(index)}
                    >
                      <Trash2 className='h-4 w-4 text-destructive' />
                      <span className='sr-only'>Xóa tài liệu</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {/* Reference Type */}
                  <FormField
                    control={form.control}
                    name={`references.${index}.type`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loại *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Chọn loại tài liệu' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {REFERENCE_TYPES.map((type) => (
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

                  {/* Title */}
                  <FormField
                    control={form.control}
                    name={`references.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tiêu Đề *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={
                              isOnlineResource
                                ? 'VD: MDN Web Docs'
                                : 'VD: Nhập Môn Thuật Toán'
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Authors */}
                  <FormField
                    control={form.control}
                    name={`references.${index}.authors`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tác Giả *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder='VD: Nguyễn Văn A, Trần Thị B'
                          />
                        </FormControl>
                        <FormDescription>
                          Phân cách nhiều tác giả bằng dấu phẩy
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Publisher (for books) */}
                  {!isOnlineResource && (
                    <FormField
                      control={form.control}
                      name={`references.${index}.publisher`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nhà Xuất Bản</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder='VD: NXB Giáo Dục' />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Year */}
                  <FormField
                    control={form.control}
                    name={`references.${index}.year`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Năm Xuất Bản</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            min='1900'
                            max={new Date().getFullYear()}
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Năm từ 1900 đến {new Date().getFullYear()}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* ISBN (for books) */}
                  {!isOnlineResource && (
                    <FormField
                      control={form.control}
                      name={`references.${index}.isbn`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ISBN</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder='VD: 9780262033848'
                            />
                          </FormControl>
                          <FormDescription>
                            ISBN 10 hoặc 13 chữ số (chỉ số)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* URL (for online resources) */}
                  {isOnlineResource && (
                    <FormField
                      control={form.control}
                      name={`references.${index}.url`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type='url'
                              placeholder='https://example.com'
                            />
                          </FormControl>
                          <FormDescription>
                            URL đầy đủ bao gồm https://
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Add Reference Button */}
      <Button
        type='button'
        variant='outline'
        onClick={handleAddReference}
        className='w-full'
      >
        <Plus className='mr-2 h-4 w-4' />
        Thêm Tài Liệu
      </Button>

      {/* Validation Warning */}
      {!hasRequired && fields.length > 0 && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            Phải chỉ định ít nhất một giáo trình bắt buộc.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
