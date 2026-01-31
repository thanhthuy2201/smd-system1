# Design Document: Review Schedule Management

## Overview

The Review Schedule Management feature enables Academic Managers to configure and manage the syllabus review process. The feature follows a feature-based architecture pattern, integrating with TanStack Router for navigation, TanStack Query for server state management, React Hook Form with Zod for form validation, and Shadcn UI components for the user interface.

The feature consists of four main screens:
1. **List Screen** - Displays all review schedules with progress indicators
2. **Create Screen** - Form for creating new review schedules
3. **Edit Screen** - Form for updating review schedules with validation
4. **Detail Screen** - Comprehensive view of schedule details, assignments, and progress

The system implements a workflow-based review process with L1 (HoD) and L2 (AA) review stages, deadline management, and automated notifications.

## Architecture

### High-Level Structure

```
src/features/review-schedules/
├── index.tsx                      # List screen component
├── create.tsx                     # Create screen component
├── edit.tsx                       # Edit screen component
├── detail.tsx                     # Detail screen component
├── components/
│   ├── review-schedule-form.tsx   # Main form component
│   ├── review-schedule-table.tsx  # Data table component
│   ├── columns.tsx                # Table column definitions
│   ├── row-actions.tsx            # Table row action menu
│   ├── toolbar.tsx                # Search and filter toolbar
│   ├── status-badge.tsx           # Status display component
│   ├── progress-indicator.tsx     # Progress visualization
│   ├── reviewer-assignment.tsx    # Reviewer assignment interface
│   ├── deadline-alerts-config.tsx # Alert configuration component
│   ├── progress-dashboard.tsx     # Progress statistics dashboard
│   └── audit-trail.tsx            # Change history display
├── data/
│   ├── schema.ts                  # Zod schemas and TypeScript types
│   └── api.ts                     # API client functions
└── hooks/
    ├── use-review-schedules.ts    # TanStack Query hooks for list
    ├── use-review-schedule.ts     # TanStack Query hook for single item
    ├── use-review-mutations.ts    # Mutation hooks
    └── use-form-dirty.ts          # Hook for tracking unsaved changes

src/routes/_authenticated/review-schedules/
├── index.tsx                      # List route
├── create.tsx                     # Create route
├── edit.$id.tsx                   # Edit route (with ID param)
└── detail.$id.tsx                 # Detail route (with ID param)
```

### Routing Strategy

The feature uses TanStack Router with file-based routing under the `_authenticated` layout:
- `/review-schedules` - List screen
- `/review-schedules/create` - Create screen
- `/review-schedules/edit/$id` - Edit screen with dynamic ID parameter
- `/review-schedules/detail/$id` - Detail screen with dynamic ID parameter

All routes are protected by the authenticated layout and require Academic Manager role.

### State Management Strategy

**Server State (TanStack Query)**:
- Review schedules list with pagination, search, and filter parameters
- Individual review schedule details for edit/detail screens
- Reviewer assignments and progress statistics
- Mutations for create, update, delete, assign reviewers operations
- Automatic cache invalidation after mutations

**Form State (React Hook Form)**:
- Form field values and validation state
- Dirty field tracking for unsaved changes detection
- Field-level and form-level error messages

**Local UI State (React useState)**:
- Confirmation dialog visibility
- Toast notification state
- Loading indicators for async operations
- Assignment modal state

## Components and Interfaces

### Data Models

```typescript
// Core Review Schedule type
interface ReviewSchedule {
  id: string;
  name: string;
  semesterId: string;
  semesterName: string;
  academicYear: string;
  reviewStartDate: Date;
  l1Deadline: Date;
  l2Deadline: Date;
  finalApprovalDate: Date;
  status: ReviewScheduleStatus;
  
  // Progress tracking
  totalSyllabi: number;
  reviewedCount: number;
  pendingCount: number;
  overdueCount: number;
  progressPercentage: number;
  
  // Alert configuration
  alertConfig: DeadlineAlertConfig;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

enum ReviewScheduleStatus {
  UPCOMING = 'UPCOMING',    // Before review start date
  ACTIVE = 'ACTIVE',        // Between start and final approval
  COMPLETED = 'COMPLETED',  // After final approval, all reviews done
  OVERDUE = 'OVERDUE'       // Past final approval, reviews pending
}

interface DeadlineAlertConfig {
  enabled: boolean;
  thresholds: number[];  // Days before deadline [7, 3, 1]
  channels: ('EMAIL' | 'IN_APP')[];
  sendOverdueAlerts: boolean;
}

interface ReviewerAssignment {
  id: string;
  scheduleId: string;
  departmentId: string;
  departmentName: string;
  primaryReviewerId: string;
  primaryReviewerName: string;
  primaryReviewerRole: 'HOD' | 'AA';
  backupReviewerId?: string;
  backupReviewerName?: string;
  assignedAt: Date;
  assignedBy: string;
}

interface ProgressStatistics {
  scheduleId: string;
  overall: {
    total: number;
    reviewed: number;
    pending: number;
    overdue: number;
    percentage: number;
  };
  byDepartment: DepartmentProgress[];
  byReviewer: ReviewerProgress[];
  averageReviewTime: number;  // in hours
}

interface DepartmentProgress {
  departmentId: string;
  departmentName: string;
  total: number;
  reviewed: number;
  pending: number;
  overdue: number;
  percentage: number;
}

interface ReviewerProgress {
  reviewerId: string;
  reviewerName: string;
  role: 'HOD' | 'AA';
  assigned: number;
  completed: number;
  pending: number;
  overdue: number;
  averageTime: number;  // in hours
}

interface AuditTrailEntry {
  id: string;
  scheduleId: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  performedBy: string;
  performedByName: string;
  performedAt: Date;
  reason?: string;
}

// Form input type (for create/update)
interface ReviewScheduleFormInput {
  name: string;
  semesterId: string;
  reviewStartDate: Date;
  l1Deadline: Date;
  l2Deadline: Date;
  finalApprovalDate: Date;
  alertConfig: DeadlineAlertConfig;
}

// API response types
interface ReviewSchedulesListResponse {
  data: ReviewSchedule[];
  total: number;
  page: number;
  pageSize: number;
}

interface ReviewScheduleDetailResponse {
  data: ReviewSchedule;
  assignments: ReviewerAssignment[];
  progress: ProgressStatistics;
  auditTrail: AuditTrailEntry[];
}

// Query parameters for list
interface ReviewSchedulesQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ReviewScheduleStatus | 'ALL';
  semesterId?: string;
  academicYear?: string;
  sortBy?: 'name' | 'reviewStartDate' | 'progressPercentage';
  sortOrder?: 'asc' | 'desc';
}

interface AvailableReviewer {
  id: string;
  name: string;
  email: string;
  role: 'HOD' | 'AA';
  departmentId?: string;
  departmentName?: string;
  currentAssignments: number;
}
```

### Zod Validation Schemas

```typescript
// Review schedule name validation
const scheduleNameSchema = z.string()
  .min(5, 'Tên chu kỳ phải có ít nhất 5 ký tự')
  .max(100, 'Tên chu kỳ không được quá 100 ký tự')
  .regex(/^[a-zA-Z0-9\s\-_àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+$/, 
    'Tên chu kỳ chỉ được chứa chữ cái, số, khoảng trắng và dấu gạch ngang');

// Date sequence validation
const dateSequenceSchema = z.object({
  reviewStartDate: z.date({ required_error: 'Ngày bắt đầu là bắt buộc' }),
  l1Deadline: z.date({ required_error: 'Hạn L1 là bắt buộc' }),
  l2Deadline: z.date({ required_error: 'Hạn L2 là bắt buộc' }),
  finalApprovalDate: z.date({ required_error: 'Ngày phê duyệt cuối là bắt buộc' })
}).refine((data) => data.l1Deadline > data.reviewStartDate, {
  message: 'Hạn L1 phải sau ngày bắt đầu phê duyệt',
  path: ['l1Deadline']
}).refine((data) => data.l2Deadline > data.l1Deadline, {
  message: 'Hạn L2 phải sau hạn L1',
  path: ['l2Deadline']
}).refine((data) => data.finalApprovalDate > data.l2Deadline, {
  message: 'Ngày phê duyệt cuối phải sau hạn L2',
  path: ['finalApprovalDate']
}).refine((data) => {
  const daysBetweenStartAndL1 = Math.floor((data.l1Deadline.getTime() - data.reviewStartDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysBetweenStartAndL1 >= 7;
}, {
  message: 'Phải có ít nhất 7 ngày giữa ngày bắt đầu và hạn L1',
  path: ['l1Deadline']
}).refine((data) => {
  const daysBetweenL1AndL2 = Math.floor((data.l2Deadline.getTime() - data.l1Deadline.getTime()) / (1000 * 60 * 60 * 24));
  return daysBetweenL1AndL2 >= 7;
}, {
  message: 'Phải có ít nhất 7 ngày giữa hạn L1 và hạn L2',
  path: ['l2Deadline']
});

// Alert configuration validation
const alertConfigSchema = z.object({
  enabled: z.boolean(),
  thresholds: z.array(z.number().int().min(1).max(30)).min(1, 'Phải có ít nhất một ngưỡng nhắc nhở'),
  channels: z.array(z.enum(['EMAIL', 'IN_APP'])).min(1, 'Phải chọn ít nhất một kênh thông báo'),
  sendOverdueAlerts: z.boolean()
});

// Complete form schema
const reviewScheduleFormSchema = z.object({
  name: scheduleNameSchema,
  semesterId: z.string().min(1, 'Học kỳ là bắt buộc'),
  reviewStartDate: z.date({ required_error: 'Ngày bắt đầu là bắt buộc' }),
  l1Deadline: z.date({ required_error: 'Hạn L1 là bắt buộc' }),
  l2Deadline: z.date({ required_error: 'Hạn L2 là bắt buộc' }),
  finalApprovalDate: z.date({ required_error: 'Ngày phê duyệt cuối là bắt buộc' }),
  alertConfig: alertConfigSchema
}).and(dateSequenceSchema);

// Reviewer assignment validation
const reviewerAssignmentSchema = z.object({
  departmentId: z.string().min(1, 'Khoa/Bộ môn là bắt buộc'),
  primaryReviewerId: z.string().min(1, 'Người phê duyệt chính là bắt buộc'),
  backupReviewerId: z.string().optional()
}).refine((data) => data.primaryReviewerId !== data.backupReviewerId, {
  message: 'Người phê duyệt dự phòng phải khác người phê duyệt chính',
  path: ['backupReviewerId']
});
```

### API Client Interface

```typescript
// API client functions
interface ReviewSchedulesAPI {
  // List with query parameters
  list(params: ReviewSchedulesQueryParams): Promise<ReviewSchedulesListResponse>;
  
  // Get single review schedule by ID
  getById(id: string): Promise<ReviewScheduleDetailResponse>;
  
  // Create new review schedule
  create(data: ReviewScheduleFormInput): Promise<ReviewScheduleDetailResponse>;
  
  // Update existing review schedule
  update(id: string, data: Partial<ReviewScheduleFormInput>): Promise<ReviewScheduleDetailResponse>;
  
  // Delete review schedule (soft delete)
  delete(id: string): Promise<void>;
  
  // Get available reviewers
  getAvailableReviewers(departmentId?: string): Promise<AvailableReviewer[]>;
  
  // Assign reviewer to department
  assignReviewer(scheduleId: string, assignment: ReviewerAssignment): Promise<void>;
  
  // Update reviewer assignment
  updateAssignment(assignmentId: string, data: Partial<ReviewerAssignment>): Promise<void>;
  
  // Remove reviewer assignment
  removeAssignment(assignmentId: string): Promise<void>;
  
  // Get progress statistics
  getProgress(scheduleId: string): Promise<ProgressStatistics>;
  
  // Send reminder notifications
  sendReminders(scheduleId: string, reviewerIds?: string[]): Promise<void>;
  
  // Export progress report
  exportReport(scheduleId: string, format: 'PDF' | 'EXCEL'): Promise<Blob>;
  
  // Get audit trail
  getAuditTrail(scheduleId: string): Promise<AuditTrailEntry[]>;
}
```

### Component Interfaces

```typescript
// Review Schedule Form Component
interface ReviewScheduleFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<ReviewScheduleFormInput>;
  onSubmit: (data: ReviewScheduleFormInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  existingSchedule?: ReviewSchedule;
}

// Review Schedule Table Component
interface ReviewScheduleTableProps {
  data: ReviewSchedule[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}

// Progress Dashboard Component
interface ProgressDashboardProps {
  statistics: ProgressStatistics;
  onFilterBySyllabus: (filter: string) => void;
}

// Reviewer Assignment Component
interface ReviewerAssignmentProps {
  scheduleId: string;
  assignments: ReviewerAssignment[];
  availableReviewers: AvailableReviewer[];
  onAssign: (assignment: ReviewerAssignment) => Promise<void>;
  onUpdate: (assignmentId: string, data: Partial<ReviewerAssignment>) => Promise<void>;
  onRemove: (assignmentId: string) => Promise<void>;
}
```

### TanStack Query Hooks

```typescript
// Hook for fetching review schedules list
function useReviewSchedules(params: ReviewSchedulesQueryParams) {
  return useQuery({
    queryKey: ['review-schedules', params],
    queryFn: () => api.list(params),
    keepPreviousData: true,
  });
}

// Hook for fetching single review schedule
function useReviewSchedule(id: string) {
  return useQuery({
    queryKey: ['review-schedule', id],
    queryFn: () => api.getById(id),
    enabled: !!id,
  });
}

// Hook for creating review schedule
function useCreateReviewSchedule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ReviewScheduleFormInput) => api.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['review-schedules']);
    },
  });
}

// Hook for updating review schedule
function useUpdateReviewSchedule(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<ReviewScheduleFormInput>) => api.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['review-schedules']);
      queryClient.invalidateQueries(['review-schedule', id]);
    },
  });
}

// Hook for deleting review schedule
function useDeleteReviewSchedule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['review-schedules']);
    },
  });
}

// Hook for assigning reviewers
function useAssignReviewer(scheduleId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (assignment: ReviewerAssignment) => api.assignReviewer(scheduleId, assignment),
    onSuccess: () => {
      queryClient.invalidateQueries(['review-schedule', scheduleId]);
    },
  });
}

// Hook for getting progress statistics
function useProgressStatistics(scheduleId: string) {
  return useQuery({
    queryKey: ['review-schedule-progress', scheduleId],
    queryFn: () => api.getProgress(scheduleId),
    enabled: !!scheduleId,
    refetchInterval: 60000, // Refresh every minute
  });
}
```

## Data Flow

**List Screen Data Flow**:
1. Component mounts → useReviewSchedules hook triggers query
2. TanStack Query fetches data from API with current params (page, search, filter)
3. Data returned → Table component renders rows with progress indicators
4. User changes page/search/filter → Query params update → Refetch
5. Cache stores results for each unique param combination

**Create Screen Data Flow**:
1. User fills form → React Hook Form tracks values and validation
2. User submits → Form validates with Zod schema including date sequence
3. If valid → useCreateReviewSchedule mutation executes
4. API creates record → Returns new review schedule
5. Mutation success → Invalidate list cache → Show toast → Navigate to detail page

**Detail Screen Data Flow**:
1. Component mounts with ID param → useReviewSchedule hook fetches detail
2. Data loaded → Display schedule info, assignments, and progress
3. useProgressStatistics hook fetches and auto-refreshes progress data
4. User assigns reviewer → useAssignReviewer mutation executes
5. Assignment success → Invalidate schedule cache → Show toast → Refresh assignments

**Edit Screen Data Flow**:
1. Component mounts with ID param → useReviewSchedule hook fetches detail
2. Data loaded → Form populated with defaultValues
3. User modifies fields → isDirty flag set to true
4. User submits → Form validates → useUpdateReviewSchedule mutation executes
5. API updates record → Returns updated schedule
6. Mutation success → Invalidate caches → Show toast → Navigate to detail page

## Status Calculation Logic

```typescript
function calculateScheduleStatus(schedule: ReviewSchedule): ReviewScheduleStatus {
  const now = new Date();
  
  if (now < schedule.reviewStartDate) {
    return ReviewScheduleStatus.UPCOMING;
  }
  
  if (now > schedule.finalApprovalDate) {
    if (schedule.pendingCount > 0) {
      return ReviewScheduleStatus.OVERDUE;
    }
    return ReviewScheduleStatus.COMPLETED;
  }
  
  return ReviewScheduleStatus.ACTIVE;
}
```

## Error Handling

### Validation Errors

**Client-Side Validation**:
- Schedule name format validation
- Date sequence validation (start < L1 < L2 < final)
- Minimum time between stages (7 days)
- Alert configuration validation
- All validation uses Zod schemas with Vietnamese error messages

**Server-Side Validation**:
- Semester availability check
- Date overlap with existing schedules
- Reviewer availability validation
- Permission checks

**Error Display Strategy**:
- Field-level errors appear below the specific field with red text
- Form-level errors appear at the top of the form
- Toast notifications for server errors and operation results

### API Errors

**Network Errors**:
- Display error state in list view with retry button
- Display toast notification in forms with error message
- Maintain form data so user doesn't lose work

**HTTP Error Codes**:
- 400 Bad Request → Display validation errors from server
- 401 Unauthorized → Redirect to login
- 403 Forbidden → Display "Bạn không có quyền thực hiện thao tác này"
- 404 Not Found → Display "Không tìm thấy lịch phê duyệt"
- 409 Conflict → Display "Lịch phê duyệt đã tồn tại cho học kỳ này"
- 500 Server Error → Display generic error message with retry option

### Business Rule Violations

**Cannot Delete Active Schedule**:
- Server returns 400 with specific error code
- Client displays Vietnamese message: "Không thể xóa lịch phê duyệt đang hoạt động"

**Cannot Shorten Deadlines**:
- Validation prevents shortening deadlines in edit mode
- Only extension is allowed for active schedules

## Testing Strategy

### Unit Testing

**Component Tests**:
- Review schedule form renders with correct fields
- Table renders with correct columns and progress indicators
- Status badge displays correct color and text for each status
- Row actions menu shows correct options based on status
- Progress dashboard displays statistics correctly
- Reviewer assignment interface works properly

**Validation Tests**:
- Date sequence validation enforces correct order
- Minimum time between stages validation (7 days)
- Alert configuration validation
- Reviewer assignment validation

**Hook Tests**:
- useReviewSchedules returns correct data structure
- Mutation hooks invalidate cache on success
- useProgressStatistics auto-refreshes every minute

### Integration Testing

**Create Flow**:
1. Navigate to create page
2. Fill in schedule details
3. Configure alert settings
4. Submit form
5. Verify API called with correct data
6. Verify redirect to detail page
7. Verify success toast displayed

**Assign Reviewer Flow**:
1. Navigate to schedule detail
2. Click Assign Reviewers
3. Select department and reviewers
4. Submit assignment
5. Verify notification sent to reviewer
6. Verify assignment appears in list

## Security Considerations

- All API requests require valid JWT authentication
- Academic Manager role required for all operations
- Audit trail for all modifications
- Input sanitization to prevent XSS attacks
- Rate limiting on notification sending
