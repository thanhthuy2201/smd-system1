import { useState } from 'react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  FileEdit,
  UserPlus,
  Trash2,
  Send,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react'
import { cn } from '@/lib/utils'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { type AuditTrailEntry } from '../data/schema'

interface AuditTrailProps {
  /**
   * Array of audit trail entries
   */
  entries: AuditTrailEntry[]

  /**
   * Number of entries to display per page
   * @default 10
   */
  pageSize?: number

  /**
   * Whether to show the filter controls
   * @default true
   */
  showFilter?: boolean
}

/**
 * Audit Trail Component
 *
 * Displays a timeline of all changes made to a review schedule:
 * - Action type (create, update, delete, assign, etc.)
 * - Field changed with old and new values
 * - User who performed the action
 * - Timestamp in Vietnamese locale
 * - Optional reason for the change
 *
 * Features:
 * - Timeline/list layout with visual indicators
 * - Filtering by action type
 * - Pagination for long histories
 * - Color-coded action badges
 * - Responsive design
 *
 * Validates Requirements 6.8, 8.7
 */
export function AuditTrail({
  entries,
  pageSize = 10,
  showFilter = true,
}: AuditTrailProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [actionFilter, setActionFilter] = useState<string>('all')

  // Filter entries by action type
  const filteredEntries =
    actionFilter === 'all'
      ? entries
      : entries.filter((entry) => entry.action === actionFilter)

  // Calculate pagination
  const totalPages = Math.ceil(filteredEntries.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedEntries = filteredEntries.slice(startIndex, endIndex)

  // Reset to page 1 when filter changes
  const handleFilterChange = (value: string) => {
    setActionFilter(value)
    setCurrentPage(1)
  }

  // Get unique action types for filter
  const actionTypes = Array.from(new Set(entries.map((e) => e.action)))

  // Get icon for action type
  const getActionIcon = (action: string) => {
    const actionLower = action.toLowerCase()
    if (actionLower.includes('create') || actionLower.includes('tạo')) {
      return <FileEdit className='h-4 w-4' />
    }
    if (actionLower.includes('update') || actionLower.includes('cập nhật')) {
      return <FileEdit className='h-4 w-4' />
    }
    if (actionLower.includes('delete') || actionLower.includes('xóa')) {
      return <Trash2 className='h-4 w-4' />
    }
    if (actionLower.includes('assign') || actionLower.includes('phân công')) {
      return <UserPlus className='h-4 w-4' />
    }
    if (actionLower.includes('send') || actionLower.includes('gửi')) {
      return <Send className='h-4 w-4' />
    }
    return <Calendar className='h-4 w-4' />
  }

  // Get badge variant for action type
  const getActionVariant = (
    action: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const actionLower = action.toLowerCase()
    if (actionLower.includes('create') || actionLower.includes('tạo')) {
      return 'default'
    }
    if (actionLower.includes('update') || actionLower.includes('cập nhật')) {
      return 'secondary'
    }
    if (actionLower.includes('delete') || actionLower.includes('xóa')) {
      return 'destructive'
    }
    return 'outline'
  }

  // Format date in Vietnamese locale
  const formatDate = (date: Date): string => {
    return format(date, "dd/MM/yyyy 'lúc' HH:mm", { locale: vi })
  }

  // Format field name to Vietnamese
  const formatFieldName = (field?: string): string => {
    if (!field) return ''
    const fieldMap: Record<string, string> = {
      name: 'Tên chu kỳ',
      reviewStartDate: 'Ngày bắt đầu',
      l1Deadline: 'Hạn L1',
      l2Deadline: 'Hạn L2',
      finalApprovalDate: 'Ngày phê duyệt cuối',
      alertConfig: 'Cấu hình nhắc nhở',
      status: 'Trạng thái',
    }
    return fieldMap[field] || field
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <CardTitle>Lịch sử thay đổi</CardTitle>
            <CardDescription>
              Theo dõi tất cả các thay đổi được thực hiện trên lịch phê duyệt
            </CardDescription>
          </div>

          {/* Filter Controls */}
          {showFilter && actionTypes.length > 1 && (
            <div className='flex items-center gap-2'>
              <Filter className='h-4 w-4 text-muted-foreground' />
              <Select value={actionFilter} onValueChange={handleFilterChange}>
                <SelectTrigger className='w-[180px]'>
                  <SelectValue placeholder='Lọc theo hành động' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả hành động</SelectItem>
                  {actionTypes.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Empty State */}
        {filteredEntries.length === 0 && (
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <Calendar className='mb-4 h-12 w-12 text-muted-foreground/50' />
            <p className='text-sm text-muted-foreground'>
              {actionFilter === 'all'
                ? 'Chưa có lịch sử thay đổi nào'
                : 'Không tìm thấy thay đổi nào với bộ lọc này'}
            </p>
          </div>
        )}

        {/* Timeline */}
        {paginatedEntries.length > 0 && (
          <div className='space-y-4'>
            {paginatedEntries.map((entry, index) => (
              <div key={entry.id}>
                <div className='flex gap-4'>
                  {/* Timeline indicator */}
                  <div className='flex flex-col items-center'>
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full',
                        entry.action.toLowerCase().includes('delete') ||
                          entry.action.toLowerCase().includes('xóa')
                          ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                          : entry.action.toLowerCase().includes('create') ||
                              entry.action.toLowerCase().includes('tạo')
                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      )}
                    >
                      {getActionIcon(entry.action)}
                    </div>
                    {index < paginatedEntries.length - 1 && (
                      <div className='h-full w-px bg-border' />
                    )}
                  </div>

                  {/* Entry content */}
                  <div className='flex-1 pb-6'>
                    <div className='mb-2 flex flex-wrap items-center gap-2'>
                      <Badge variant={getActionVariant(entry.action)}>
                        {entry.action}
                      </Badge>
                      <span className='text-sm text-muted-foreground'>
                        {formatDate(entry.performedAt)}
                      </span>
                    </div>

                    <div className='space-y-2'>
                      {/* User */}
                      <p className='text-sm'>
                        <span className='font-medium'>
                          {entry.performedByName}
                        </span>
                        {entry.field && (
                          <>
                            {' đã thay đổi '}
                            <span className='font-medium'>
                              {formatFieldName(entry.field)}
                            </span>
                          </>
                        )}
                      </p>

                      {/* Old and New Values */}
                      {entry.oldValue && entry.newValue && (
                        <div className='rounded-md bg-muted p-3 text-sm'>
                          <div className='flex flex-col gap-1 sm:flex-row sm:gap-4'>
                            <div className='flex-1'>
                              <span className='text-muted-foreground'>
                                Giá trị cũ:
                              </span>
                              <div className='mt-1 font-mono text-xs'>
                                {entry.oldValue}
                              </div>
                            </div>
                            <div className='hidden items-center sm:flex'>
                              <ChevronRight className='h-4 w-4 text-muted-foreground' />
                            </div>
                            <div className='flex-1'>
                              <span className='text-muted-foreground'>
                                Giá trị mới:
                              </span>
                              <div className='mt-1 font-mono text-xs'>
                                {entry.newValue}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Reason */}
                      {entry.reason && (
                        <div className='text-sm text-muted-foreground italic'>
                          Lý do: {entry.reason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Separator between entries */}
                {index < paginatedEntries.length - 1 && (
                  <Separator className='my-4' />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='mt-6 flex items-center justify-between border-t pt-4'>
            <div className='text-sm text-muted-foreground'>
              Hiển thị {startIndex + 1}-
              {Math.min(endIndex, filteredEntries.length)} trong số{' '}
              {filteredEntries.length} thay đổi
            </div>

            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className='h-4 w-4' />
                <span className='sr-only'>Trang trước</span>
              </Button>

              <div className='flex items-center gap-1'>
                <span className='text-sm'>
                  Trang {currentPage} / {totalPages}
                </span>
              </div>

              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight className='h-4 w-4' />
                <span className='sr-only'>Trang sau</span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
