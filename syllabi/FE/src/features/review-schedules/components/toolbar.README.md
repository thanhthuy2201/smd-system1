# Toolbar Component

## Overview

The Toolbar component provides search and filtering capabilities for the review schedules list. It follows the same pattern as the academic-years feature toolbar.

## Features

- **Search Input**: Debounced search with 300ms delay, Vietnamese placeholder "Tìm kiếm theo tên chu kỳ..."
- **Status Filter**: Dropdown with options: Tất cả, Sắp diễn ra, Đang diễn ra, Hoàn thành, Quá hạn
- **Semester Filter**: Dropdown to filter by semester
- **Academic Year Filter**: Dropdown to filter by academic year
- **URL Query Parameters**: All filters update URL query parameters for bookmarkable/shareable URLs

## Props

```typescript
interface ToolbarProps {
  // Search
  search: string
  onSearchChange: (search: string) => void

  // Status filter
  statusFilter: ReviewScheduleStatus | 'ALL'
  onStatusFilterChange: (status: ReviewScheduleStatus | 'ALL') => void

  // Semester filter
  semesterFilter: string
  onSemesterFilterChange: (semesterId: string) => void

  // Academic year filter
  academicYearFilter: string
  onAcademicYearFilterChange: (academicYear: string) => void

  // Data for dropdowns (optional)
  semesters?: Array<{ id: string; name: string }>
  academicYears?: Array<{ year: string; label: string }>
}
```

## Usage

See `toolbar.example.tsx` for a complete integration example with TanStack Router.

### Basic Integration Steps

1. **Import the component**:

```typescript
import { Toolbar } from './components/toolbar'
```

2. **Get route API and search params**:

```typescript
const route = getRouteApi('/_authenticated/review-schedules/')
const navigate = route.useNavigate()
const search = route.useSearch()
```

3. **Extract query parameters**:

```typescript
const {
  search: searchQuery = '',
  status = 'ALL',
  semesterId = 'ALL',
  academicYear = 'ALL',
} = search
```

4. **Create change handlers** that update URL query parameters:

```typescript
const handleSearchChange = (newSearch: string) => {
  void navigate({
    search: {
      page: 1, // Reset to first page
      pageSize,
      search: newSearch,
      status,
      semesterId,
      academicYear,
    },
  })
}
// Similar handlers for other filters...
```

5. **Render the toolbar**:

```typescript
<Toolbar
  search={searchQuery}
  onSearchChange={handleSearchChange}
  statusFilter={status}
  onStatusFilterChange={handleStatusFilterChange}
  semesterFilter={semesterId}
  onSemesterFilterChange={handleSemesterFilterChange}
  academicYearFilter={academicYear}
  onAcademicYearFilterChange={handleAcademicYearFilterChange}
  semesters={semestersData}
  academicYears={academicYearsData}
/>
```

## Requirements Validated

- ✅ 10.1: Search input with Vietnamese placeholder
- ✅ 10.2: Status filter with all required options
- ✅ 10.3: Semester filter select
- ✅ 10.4: Academic year filter select
- ✅ 10.7: Debounced search (300ms delay)
- ✅ 10.8: URL query parameters update on filter changes

## Implementation Notes

- The component uses local state for the search input to enable debouncing
- All filter changes reset pagination to page 1
- The component is responsive and follows the same layout as academic-years toolbar
- Uses Shadcn UI components (Input, Select) for consistency
- Follows TypeScript strict mode and project conventions

## Next Steps

When implementing the list screen (Task 15):

1. Fetch semesters and academic years data from API
2. Pass the data to the Toolbar component
3. Wire up the toolbar with the useReviewSchedules hook
4. Ensure query parameters are properly typed in the route definition
