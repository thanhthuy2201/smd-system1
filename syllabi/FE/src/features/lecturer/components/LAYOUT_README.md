# Lecturer Layout Components

This directory contains the layout components for the lecturer module, providing a consistent structure and navigation experience across all lecturer pages.

## Components

### LecturerAuthenticatedLayout

The top-level layout wrapper that provides:
- Sidebar with lecturer-specific navigation
- Layout context (fixed/default)
- Search context
- Accessibility features (skip to main)

**Usage:**
```tsx
// In route file: src/routes/lecturer/_layout.tsx
import { LecturerAuthenticatedLayout } from '@/features/lecturer/components'

export const Route = createFileRoute('/lecturer')({
  component: LecturerAuthenticatedLayout,
})
```

### LecturerLayout

The content layout that provides:
- Breadcrumb navigation based on current route
- Notification badge in header
- Main content area

**Usage:**
```tsx
// Automatically used via Outlet in LecturerAuthenticatedLayout
// Or can be used directly in route components
import { LecturerLayout } from '@/features/lecturer/components'

export function MyLecturerPage() {
  return <LecturerLayout />
}
```

### LecturerSidebar

Custom sidebar with lecturer-specific navigation items:
- Tổng quan (Dashboard)
- Đề cương (Syllabi)
  - Danh sách đề cương
  - Tạo đề cương mới
- Phê duyệt (Reviews)
  - Lịch phê duyệt
  - Phê duyệt đồng nghiệp
- Tin nhắn (Messages) - with badge
- Yêu cầu cập nhật (Update Requests)

**Features:**
- Integrates with existing sidebar system
- Supports collapsible/expandable states
- Shows notification badges
- Includes user profile and team switcher

## Navigation Data

Navigation structure is defined in `data/lecturer-nav-data.ts`:

```typescript
export const lecturerNavData: NavGroup[] = [
  {
    title: 'Giảng viên',
    items: [
      // Navigation items...
    ],
  },
]
```

## Breadcrumb Navigation

Breadcrumbs are automatically generated from the current route path. The mapping is defined in `LecturerLayout.tsx`:

```typescript
const titleMap: Record<string, string> = {
  lecturer: 'Giảng viên',
  syllabi: 'Đề cương',
  create: 'Tạo mới',
  edit: 'Chỉnh sửa',
  // ... more mappings
}
```

To add a new breadcrumb title, update the `titleMap` object.

## Notification Badge

The notification badge in the header displays the unread notification count. It:
- Fetches data using the `useNotifications` hook
- Updates every 30 seconds
- Shows "99+" for counts over 99
- Includes ARIA label for accessibility

## Integration with Existing Layout System

The lecturer layout components integrate seamlessly with the existing layout system:

1. **Layout Context**: Uses `useLayout()` to respect fixed/default layout preferences
2. **Sidebar System**: Extends the existing `Sidebar` component with lecturer-specific navigation
3. **Header Component**: Reuses the existing `Header` component with custom content
4. **Main Component**: Uses the existing `Main` component for content area

## Responsive Design

All layout components are fully responsive:
- Mobile: Collapsible sidebar, compact header
- Tablet: Adaptive sidebar, full breadcrumbs
- Desktop: Full sidebar, all features visible

## Accessibility

The layout components follow accessibility best practices:
- Proper ARIA labels for interactive elements
- Keyboard navigation support
- Skip to main content link
- Screen reader friendly breadcrumbs
- Focus management for modals and dropdowns

## Requirements Satisfied

This implementation satisfies the following requirements:
- **Requirement 11.1**: Responsive layouts for mobile, tablet, and desktop
- **Requirement 11.3**: Keyboard navigation support
- **Requirement 11.4**: ARIA labels for screen readers
- **Requirement 14.7**: Notification badge with unread count
- **Requirement 15**: All navigation and routing requirements

## Future Enhancements

Potential improvements:
1. Add notification dropdown panel
2. Add quick actions menu in header
3. Add user preferences for sidebar state
4. Add search integration in header
5. Add role-based navigation filtering
