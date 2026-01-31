# Review Schedule Management Hooks

This directory contains TanStack Query hooks for managing review schedules in the application.

## Overview

The hooks follow a consistent pattern:

- **Query hooks** for fetching data (read operations)
- **Mutation hooks** for modifying data (create, update, delete operations)
- **Automatic cache management** with intelligent invalidation strategies
- **TypeScript type safety** throughout

## Query Hooks

### `useReviewSchedules(params)`

Fetches a paginated, filtered, and sorted list of review schedules.

**Features:**

- Automatic caching with 30-second stale time
- Keeps previous data during pagination (smooth UX)
- Supports filtering by status, semester, academic year
- Supports search by name
- Supports sorting

**Parameters:**

```typescript
interface ReviewSchedulesQueryParams {
  page?: number
  pageSize?: number
  search?: string
  status?: ReviewScheduleStatus | 'ALL'
  semesterId?: string
  academicYear?: string
  sortBy?: 'name' | 'reviewStartDate' | 'progressPercentage'
  sortOrder?: 'asc' | 'desc'
}
```

**Example:**

```tsx
const { data, isLoading, error } = useReviewSchedules({
  page: 1,
  pageSize: 20,
  status: 'ACTIVE',
  search: 'HK1'
});

if (isLoading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;

return (
  <div>
    {data.items.map(schedule => (
      <div key={schedule.id}>{schedule.name}</div>
    ))}
  </div>
);
```

### `useReviewSchedule(id)`

Fetches a single review schedule with full details including assignments, progress, and audit trail.

**Features:**

- Only fetches when ID is provided
- Automatic caching with 30-second stale time
- Returns complete schedule details

**Example:**

```tsx
const { data, isLoading, error } = useReviewSchedule(scheduleId);

if (isLoading) return <div>Loading...</div>;
if (error) return <div>Error loading schedule</div>;
if (!data) return null;

const { data: schedule, assignments, progress, auditTrail } = data;

return (
  <div>
    <h1>{schedule.name}</h1>
    <p>Progress: {schedule.progressPercentage}%</p>
  </div>
);
```

### `useProgressStatistics(scheduleId, options)`

Fetches progress statistics with automatic refresh every 60 seconds.

**Features:**

- Auto-refresh every 60 seconds (configurable)
- Can be disabled or customized
- Only fetches when schedule ID is provided

**Parameters:**

```typescript
options?: {
  refetchInterval?: number | false;  // Default: 60000 (60 seconds)
  enabled?: boolean;                 // Default: true
}
```

**Example:**

```tsx
// Default: auto-refresh every 60 seconds
const { data, isRefetching } = useProgressStatistics(scheduleId);

// Custom refresh interval (30 seconds)
const { data } = useProgressStatistics(scheduleId, { refetchInterval: 30000 });

// Disable auto-refresh
const { data } = useProgressStatistics(scheduleId, { refetchInterval: false });

return (
  <div>
    <p>Overall: {data?.overall.percentage}%</p>
    {isRefetching && <span>Refreshing...</span>}
  </div>
);
```

## Mutation Hooks

### `useCreateReviewSchedule()`

Creates a new review schedule.

**Cache Invalidation:**

- Invalidates all review schedules list queries

**Example:**

```tsx
const createMutation = useCreateReviewSchedule();

const handleSubmit = async (data: ReviewScheduleFormInput) => {
  try {
    const result = await createMutation.mutateAsync(data);
    toast.success('Tạo lịch phê duyệt thành công');
    navigate(`/review-schedules/detail/${result.data.id}`);
  } catch (error) {
    toast.error('Có lỗi xảy ra khi tạo lịch phê duyệt');
  }
};

return (
  <button
    onClick={() => handleSubmit(formData)}
    disabled={createMutation.isPending}
  >
    {createMutation.isPending ? 'Creating...' : 'Create'}
  </button>
);
```

### `useUpdateReviewSchedule(id)`

Updates an existing review schedule.

**Cache Invalidation:**

- Invalidates all review schedules list queries
- Invalidates the specific schedule detail query

**Example:**

```tsx
const updateMutation = useUpdateReviewSchedule(scheduleId)

const handleSubmit = async (data: Partial<ReviewScheduleFormInput>) => {
  try {
    await updateMutation.mutateAsync(data)
    toast.success('Cập nhật lịch phê duyệt thành công')
    navigate(`/review-schedules/detail/${scheduleId}`)
  } catch (error) {
    toast.error('Có lỗi xảy ra khi cập nhật lịch phê duyệt')
  }
}
```

### `useDeleteReviewSchedule()`

Deletes a review schedule (soft delete).

**Cache Invalidation:**

- Invalidates all review schedules list queries

**Example:**

```tsx
const deleteMutation = useDeleteReviewSchedule()

const handleDelete = async (id: string) => {
  if (!confirm('Bạn có chắc chắn muốn xóa lịch phê duyệt này?')) return

  try {
    await deleteMutation.mutateAsync(id)
    toast.success('Đã xóa lịch phê duyệt')
  } catch (error) {
    toast.error('Không thể xóa lịch phê duyệt đang hoạt động')
  }
}
```

### `useAssignReviewer(scheduleId)`

Assigns a reviewer to a department for a specific schedule.

**Cache Invalidation:**

- Invalidates the specific schedule detail query

**Example:**

```tsx
const assignMutation = useAssignReviewer(scheduleId)

const handleAssign = async (assignment: ReviewerAssignment) => {
  try {
    await assignMutation.mutateAsync(assignment)
    toast.success('Phân công người phê duyệt thành công')
  } catch (error) {
    toast.error('Có lỗi xảy ra khi phân công người phê duyệt')
  }
}
```

### `useUpdateAssignment(scheduleId)`

Updates an existing reviewer assignment.

**Cache Invalidation:**

- Invalidates the specific schedule detail query

**Example:**

```tsx
const updateAssignmentMutation = useUpdateAssignment(scheduleId)

const handleUpdate = async (
  assignmentId: string,
  data: Partial<ReviewerAssignment>
) => {
  try {
    await updateAssignmentMutation.mutateAsync({ assignmentId, data })
    toast.success('Cập nhật phân công thành công')
  } catch (error) {
    toast.error('Có lỗi xảy ra khi cập nhật phân công')
  }
}
```

### `useRemoveAssignment(scheduleId)`

Removes a reviewer assignment.

**Cache Invalidation:**

- Invalidates the specific schedule detail query

**Example:**

```tsx
const removeAssignmentMutation = useRemoveAssignment(scheduleId)

const handleRemove = async (assignmentId: string) => {
  if (!confirm('Bạn có chắc chắn muốn xóa phân công này?')) return

  try {
    await removeAssignmentMutation.mutateAsync(assignmentId)
    toast.success('Đã xóa phân công')
  } catch (error) {
    toast.error('Có lỗi xảy ra khi xóa phân công')
  }
}
```

### `useSendReminders()`

Sends reminder notifications to reviewers.

**Cache Invalidation:**

- None (reminders don't change data)

**Example:**

```tsx
const sendRemindersMutation = useSendReminders()

const handleSendReminders = async (
  scheduleId: string,
  reviewerIds?: string[]
) => {
  try {
    await sendRemindersMutation.mutateAsync({ scheduleId, reviewerIds })
    toast.success('Đã gửi nhắc nhở đến người phê duyệt')
  } catch (error) {
    toast.error('Có lỗi xảy ra khi gửi nhắc nhở')
  }
}
```

### `useExportReport()`

Exports a progress report in PDF or Excel format.

**Cache Invalidation:**

- None (export doesn't change data)

**Example:**

```tsx
const exportMutation = useExportReport()

const handleExport = async (scheduleId: string, format: 'PDF' | 'EXCEL') => {
  try {
    const blob = await exportMutation.mutateAsync({ scheduleId, format })

    // Download the file
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `review-schedule-report.${format.toLowerCase()}`
    link.click()
    window.URL.revokeObjectURL(url)

    toast.success('Đã xuất báo cáo thành công')
  } catch (error) {
    toast.error('Có lỗi xảy ra khi xuất báo cáo')
  }
}
```

## Cache Invalidation Strategy

The hooks implement intelligent cache invalidation:

1. **List queries** are invalidated when:
   - A schedule is created
   - A schedule is updated
   - A schedule is deleted

2. **Detail queries** are invalidated when:
   - The specific schedule is updated
   - Reviewer assignments are added/updated/removed

3. **Progress queries** are NOT invalidated by mutations (they auto-refresh)

4. **No invalidation** for:
   - Sending reminders (doesn't change data)
   - Exporting reports (doesn't change data)

## Query Keys

All hooks use consistent query key factories:

```typescript
// Review schedules list
;['review-schedules', 'list', params][
  // Single review schedule
  ('review-schedule', 'detail', id)
][
  // Progress statistics
  ('review-schedule-progress', scheduleId)
]
```

This ensures proper cache management and prevents conflicts.

## Error Handling

All hooks return standard TanStack Query error states. Handle errors in your components:

```tsx
const { data, isLoading, error } = useReviewSchedules();

if (error) {
  // Error is an AxiosError with response data
  const message = error.response?.data?.message || 'An error occurred';
  return <div>Error: {message}</div>;
}
```

For mutations, use try-catch:

```tsx
try {
  await mutation.mutateAsync(data)
} catch (error) {
  // Handle error
  console.error(error)
}
```

## Best Practices

1. **Always handle loading and error states** in your components
2. **Use `mutateAsync` for mutations** when you need to handle success/error in the same function
3. **Use `mutate` for fire-and-forget** operations
4. **Leverage the `isPending` state** to disable buttons during mutations
5. **Use the `isRefetching` state** to show refresh indicators
6. **Customize refetch intervals** based on your needs (progress statistics)
7. **Always show user feedback** (toasts) after mutations

## Related Files

- `../data/api.ts` - API client functions
- `../data/schema.ts` - TypeScript types and Zod schemas
- `index.ts` - Barrel export for all hooks
