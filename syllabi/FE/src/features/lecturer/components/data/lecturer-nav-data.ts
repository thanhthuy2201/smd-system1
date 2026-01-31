import {
  BookOpen,
  CalendarCheck,
  MessageSquare,
  FileEdit,
  LayoutDashboard,
  Bell,
} from 'lucide-react'
import { type NavGroup } from '@/components/layout/types'

/**
 * Lecturer Module Navigation Data
 * 
 * Defines the navigation structure for the lecturer module.
 * This data is used by the sidebar to display lecturer-specific menu items.
 * 
 * Requirements: All (provides navigation for all lecturer features)
 */
export const lecturerNavData: NavGroup[] = [
  {
    title: 'Giảng viên',
    items: [
      {
        title: 'Tổng quan',
        url: '/lecturer',
        icon: LayoutDashboard,
      },
      {
        title: 'Đề cương',
        icon: BookOpen,
        items: [
          {
            title: 'Danh sách đề cương',
            url: '/lecturer/syllabi',
          },
          {
            title: 'Tạo đề cương mới',
            url: '/lecturer/syllabi/create',
          },
        ],
      },
      {
        title: 'Phê duyệt',
        icon: CalendarCheck,
        items: [
          {
            title: 'Lịch phê duyệt',
            url: '/lecturer/reviews',
          },
          {
            title: 'Phê duyệt đồng nghiệp',
            url: '/lecturer/reviews/peer-reviews',
          },
        ],
      },
      {
        title: 'Tin nhắn',
        url: '/lecturer/messages',
        icon: MessageSquare,
        badge: '3', // This would be dynamic in real implementation
      },
      {
        title: 'Thông báo',
        url: '/lecturer/notifications',
        icon: Bell,
      },
      {
        title: 'Yêu cầu cập nhật',
        url: '/lecturer/update-requests',
        icon: FileEdit,
      },
    ],
  },
]
