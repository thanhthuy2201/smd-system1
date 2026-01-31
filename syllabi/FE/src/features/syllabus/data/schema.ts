import { z } from 'zod'

export const syllabusSchema = z.object({
  id: z.string(),
  courseCode: z.string(),
  version: z.string(),
  status: z.enum(['published', 'draft', 'pending']),
  lastUpdated: z.string(),
})

export type Syllabus = z.infer<typeof syllabusSchema>

export const statusConfig = {
  published: {
    label: 'Đã xuất bản',
    color: 'bg-green-500',
  },
  draft: {
    label: 'Bản nháp',
    color: 'bg-yellow-500',
  },
  pending: {
    label: 'Chờ phê duyệt',
    color: 'bg-blue-500',
  },
} as const
