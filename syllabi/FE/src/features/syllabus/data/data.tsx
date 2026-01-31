import { CheckCircle, FileEdit, Clock } from 'lucide-react'

export const statuses = [
  {
    label: 'Đã xuất bản',
    value: 'published' as const,
    icon: CheckCircle,
  },
  {
    label: 'Bản nháp',
    value: 'draft' as const,
    icon: FileEdit,
  },
  {
    label: 'Chờ phê duyệt',
    value: 'pending' as const,
    icon: Clock,
  },
]
