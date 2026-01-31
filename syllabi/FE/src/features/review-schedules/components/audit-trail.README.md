# AuditTrail Component

## Overview

The `AuditTrail` component displays a timeline of all changes made to a review schedule. It provides a visual history of actions, modifications, and events with detailed information about who made the changes and when.

## Features

- **Timeline Layout**: Visual timeline with icons and color-coded indicators
- **Detailed Information**: Shows action type, field changed, old/new values, user, and timestamp
- **Vietnamese Locale**: All dates formatted in Vietnamese locale (dd/MM/yyyy 'lúc' HH:mm)
- **Filtering**: Filter entries by action type
- **Pagination**: Paginate through long histories with configurable page size
- **Responsive Design**: Works on mobile and desktop
- **Empty State**: Friendly message when no entries exist
- **Color Coding**: Different colors for different action types (create, update, delete)

## Usage

### Basic Usage

```tsx
import { AuditTrail } from '@/features/review-schedules/components'
import { type AuditTrailEntry } from '@/features/review-schedules/data/schema'

const entries: AuditTrailEntry[] = [
  {
    id: '1',
    scheduleId: 'schedule-1',
    action: 'Tạo lịch phê duyệt',
    performedBy: 'user-1',
    performedByName: 'Nguyễn Văn A',
    performedAt: new Date('2024-01-15T09:00:00'),
  },
  // ... more entries
]

function MyComponent() {
  return <AuditTrail entries={entries} />
}
```

### With Custom Page Size

```tsx
<AuditTrail entries={entries} pageSize={5} />
```

### Without Filter Controls

```tsx
<AuditTrail entries={entries} showFilter={false} />
```

## Props

| Prop         | Type                | Default  | Description                                     |
| ------------ | ------------------- | -------- | ----------------------------------------------- |
| `entries`    | `AuditTrailEntry[]` | Required | Array of audit trail entries to display         |
| `pageSize`   | `number`            | `10`     | Number of entries to display per page           |
| `showFilter` | `boolean`           | `true`   | Whether to show the action type filter controls |

## AuditTrailEntry Type

```typescript
interface AuditTrailEntry {
  id: string // Unique identifier
  scheduleId: string // ID of the review schedule
  action: string // Action performed (e.g., "Tạo lịch phê duyệt")
  field?: string // Field that was changed (optional)
  oldValue?: string // Previous value (optional)
  newValue?: string // New value (optional)
  performedBy: string // User ID who performed the action
  performedByName: string // Display name of the user
  performedAt: Date // Timestamp of the action
  reason?: string // Reason for the change (optional)
}
```

## Action Types and Icons

The component automatically assigns icons and colors based on the action type:

- **Create/Tạo**: Blue background, FileEdit icon
- **Update/Cập nhật**: Gray background, FileEdit icon
- **Delete/Xóa**: Red background, Trash2 icon
- **Assign/Phân công**: Gray background, UserPlus icon
- **Send/Gửi**: Gray background, Send icon
- **Default**: Gray background, Calendar icon

## Field Name Mapping

The component automatically translates field names to Vietnamese:

- `name` → "Tên chu kỳ"
- `reviewStartDate` → "Ngày bắt đầu"
- `l1Deadline` → "Hạn L1"
- `l2Deadline` → "Hạn L2"
- `finalApprovalDate` → "Ngày phê duyệt cuối"
- `alertConfig` → "Cấu hình nhắc nhở"
- `status` → "Trạng thái"

## Date Formatting

All dates are formatted using `date-fns` with Vietnamese locale:

```
Format: dd/MM/yyyy 'lúc' HH:mm
Example: 15/01/2024 lúc 09:00
```

## Filtering

When multiple action types exist in the entries, a filter dropdown appears allowing users to:

- View all entries
- Filter by specific action type

The filter automatically resets pagination to page 1 when changed.

## Pagination

- Shows current page and total pages
- Displays range of entries being shown
- Previous/Next buttons for navigation
- Automatically hides when only one page exists

## Empty States

The component shows appropriate messages for:

- No entries at all: "Chưa có lịch sử thay đổi nào"
- No entries matching filter: "Không tìm thấy thay đổi nào với bộ lọc này"

## Styling

The component uses:

- Shadcn UI components (Card, Badge, Select, Button, Separator)
- Tailwind CSS for styling
- Lucide React icons
- Dark mode support via Tailwind's dark: variants

## Requirements Validated

- **Requirement 6.8**: Maintain an audit trail of all deadline changes
- **Requirement 8.7**: Show audit trail of changes in detail view

## Examples

See `audit-trail.example.tsx` for complete usage examples including:

- Basic usage
- Custom page size
- Without filter controls
- Empty state handling
