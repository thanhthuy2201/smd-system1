# Design Document: Syllabus Management

## Overview

The Syllabus Management feature is a comprehensive CRUD interface for managing course syllabi in the SMD system. The feature follows a feature-based architecture pattern, integrating with TanStack Router for navigation, TanStack Query for server state management, React Hook Form with Zod for form validation, and Shadcn UI components for the user interface.

The feature consists of five main screens:
1. **List Screen** - Displays all syllabi in a data table with search, filter, sort, and pagination
2. **Create Screen** - Multi-step form for creating new syllabi
3. **Edit Screen** - Form for updating draft syllabi with auto-save
4. **Detail/View Screen** - Read-only view of complete syllabus information
5. **Version Comparison Screen** - Side-by-side comparison of syllabus versions

The system implements a workflow-based status management (DRAFT → PENDING → APPROVED/REJECTED) with version control and audit trails.

## Architecture

### High-Level Structure

```
src/features/syllabus/
├── index.tsx                      # List screen component
├── create.tsx                     # Create screen component
├── edit.tsx                       # Edit screen component
├── view.tsx                       # Detail/view screen component
├── compare.tsx                    # Version comparison screen
├── components/
│   ├── syllabus-form.tsx          # Main form component
│   ├── syllabus-table.tsx         # Data table component
│   ├── syllabus-columns.tsx       # Table column definitions
│   ├── row-actions.tsx            # Table row action menu
│   ├── toolbar.tsx                # Search and filter toolbar
│   ├── status-badge.tsx           # Status display component
│   ├── course-info-section.tsx    # Course information form section
│   ├── learning-outcomes-section.tsx  # CLO/PLO mapping section
│   ├── content-section.tsx        # Course content form section
│   ├── assessment-section.tsx     # Assessment methods section
│   ├── resources-section.tsx      # Resources and references section
│   ├── clo-plo-matrix.tsx         # CLO-PLO mapping matrix
│   ├── version-history.tsx        # Version history component
│   └── review-feedback.tsx        # Display review comments
├── data/
│   ├── schema.ts                  # Zod schemas and TypeScript types
│   └── api.ts                     # API client functions
└── hooks/
    ├── use-syllabi.ts             # TanStack Query hooks for list
    ├── use-syllabus.ts            # TanStack Query hook for single item
    ├── use-syllabus-mutations.ts  # Mutation hooks
    ├── use-auto-save.ts           # Auto-save hook
    └── use-form-dirty.ts          # Hook for tracking unsaved changes

src/routes/_authenticated/syllabus/
├── index.tsx                      # List route
├── create.tsx                     # Create route
├── edit.$id.tsx                   # Edit route (with ID param)
├── view.$id.tsx                   # View route (with ID param)
└── compare.$id.tsx                # Compare versions route
```

### Routing Strategy

The feature uses TanStack Router with file-based routing under the `_authenticated` layout:
- `/syllabus` - List screen
- `/syllabus/create` - Create screen
- `/syllabus/edit/$id` - Edit screen with dynamic ID parameter
- `/syllabus/view/$id` - View screen with dynamic ID parameter
- `/syllabus/compare/$id` - Version comparison screen

All routes are protected by the authenticated layout, ensuring only logged-in users can access them.

### State Management Strategy

**Server State (TanStack Query)**:
- Syllabi list with pagination, search, and filter parameters
- Individual syllabus details for edit/view screens
- Mutations for create, update, submit, delete operations
- Automatic cache invalidation after mutations
- Optimistic updates for status changes

**Form State (React Hook Form)**:
- Form field values and validation state
- Dirty field tracking for unsaved changes detection
- Field-level and form-level error messages
- Multi-step form navigation state

**Local UI State (React useState)**:
- Confirmation dialog visibility
- Toast notification state
- Loading indicators for async operations
- Auto-save status indicators

## Components and Interfaces

### Data Models

```typescript
// Core Syllabus type
interface Syllabus {
  id: string;
  courseCode: string;
  courseName: string;
  version: string;
  status: SyllabusStatus;
  semester: string;
  academicYear: string;
  creditHours: number;
  contactHours: number;
  authorId: string;
  authorName: string;
  
  // Course Information
  courseDescription: string;
  prerequisites: string[];
  corequisites: string[];
  
  // Learning Outcomes
  clos: CourseLearningOutcome[];
  ploMappings: CLOPLOMapping[];
  
  // Course Content
  weeklySchedule: WeeklyContent[];
  
  // Assessment
  assessmentMethods: AssessmentMethod[];
  
  // Resources
  textbooks: Resource[];
  references: Resource[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  approvedAt?: Date;
  isCurrent: boolean;
}

enum SyllabusStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REVISION_REQUIRED = 'REVISION_REQUIRED'
}

interface CourseLearningOutcome {
  id: string;
  code: string;  // CLO1, CLO2, etc.
  description: string;
  bloomLevel: string;  // Remember, Understand, Apply, Analyze, Evaluate, Create
}

interface CLOPLOMapping {
  cloId: string;
  ploId: string;
  strength: 'STRONG' | 'MODERATE' | 'WEAK';
}

interface WeeklyContent {
  week: number;
  topics: string[];
  closCovered: string[];  // CLO IDs
  teachingMethods: string[];
  readings: string[];
}

interface AssessmentMethod {
  id: string;
  type: string;  // Exam, Quiz, Assignment, Project, etc.
  description: string;
  weight: number;  // Percentage
  cloIds: string[];  // CLOs being assessed
  dueWeek?: number;
}

interface Resource {
  id: string;
  type: 'TEXTBOOK' | 'REFERENCE' | 'ONLINE';
  title: string;
  authors: string[];
  publisher?: string;
  year?: number;
  isbn?: string;
  url?: string;
  isRequired: boolean;
}

// Form input type (for create/update)
interface SyllabusFormInput {
  courseCode: string;
  courseName: string;
  semester: string;
  academicYear: string;
  creditHours: number;
  contactHours: number;
  courseDescription: string;
  prerequisites: string[];
  corequisites: string[];
  clos: CourseLearningOutcome[];
  ploMappings: CLOPLOMapping[];
  weeklySchedule: WeeklyContent[];
  assessmentMethods: AssessmentMethod[];
  textbooks: Resource[];
  references: Resource[];
}

// API response types
interface SyllabiListResponse {
  data: Syllabus[];
  total: number;
  page: number;
  pageSize: number;
}

interface SyllabusDetailResponse {
  data: Syllabus;
}

// Query parameters for list
interface SyllabiQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: SyllabusStatus | 'ALL';
  semester?: string;
  academicYear?: string;
  authorId?: string;
  sortBy?: 'courseCode' | 'courseName' | 'updatedAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}
```

### Zod Validation Schemas

```typescript
// Course Code validation
const courseCodeSchema = z.string()
  .regex(/^[A-Z]{2,4}[0-9]{3,4}$/, 'Mã môn học phải có định dạng chữ hoa + số (VD: CS101, MATH2001)')
  .min(5, 'Mã môn học phải có ít nhất 5 ký tự')
  .max(8, 'Mã môn học không được quá 8 ký tự');

// Credit hours validation
const creditHoursSchema = z.number()
  .int('Số tín chỉ phải là số nguyên')
  .min(1, 'Số tín chỉ phải từ 1 đến 10')
  .max(10, 'Số tín chỉ phải từ 1 đến 10');

// CLO validation
const cloSchema = z.object({
  id: z.string().optional(),
  code: z.string().regex(/^CLO[0-9]+$/, 'Mã CLO phải có định dạng CLO1, CLO2, ...'),
  description: z.string().min(10, 'Mô tả CLO phải có ít nhất 10 ký tự'),
  bloomLevel: z.enum(['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'])
});

// Assessment validation
const assessmentSchema = z.object({
  id: z.string().optional(),
  type: z.string().min(1, 'Loại đánh giá là bắt buộc'),
  description: z.string().min(10, 'Mô tả phải có ít nhất 10 ký tự'),
  weight: z.number().min(0).max(100, 'Trọng số phải từ 0-100%'),
  cloIds: z.array(z.string()).min(1, 'Phải chọn ít nhất một CLO'),
  dueWeek: z.number().int().min(1).max(16).optional()
});

// Complete form schema
const syllabusFormSchema = z.object({
  courseCode: courseCodeSchema,
  courseName: z.string().min(5, 'Tên môn học phải có ít nhất 5 ký tự').max(200),
  semester: z.string().min(1, 'Học kỳ là bắt buộc'),
  academicYear: z.string().min(1, 'Năm học là bắt buộc'),
  creditHours: creditHoursSchema,
  contactHours: z.number().int().min(1),
  courseDescription: z.string().min(50, 'Mô tả môn học phải có ít nhất 50 ký tự'),
  prerequisites: z.array(z.string()),
  corequisites: z.array(z.string()),
  clos: z.array(cloSchema).min(3, 'Phải có ít nhất 3 CLO'),
  ploMappings: z.array(z.object({
    cloId: z.string(),
    ploId: z.string(),
    strength: z.enum(['STRONG', 'MODERATE', 'WEAK'])
  })),
  weeklySchedule: z.array(z.object({
    week: z.number().int().min(1).max(16),
    topics: z.array(z.string()).min(1),
    closCovered: z.array(z.string()),
    teachingMethods: z.array(z.string()),
    readings: z.array(z.string())
  })).min(12, 'Phải có ít nhất 12 tuần học'),
  assessmentMethods: z.array(assessmentSchema).min(3, 'Phải có ít nhất 3 phương pháp đánh giá'),
  textbooks: z.array(z.object({
    title: z.string().min(1),
    authors: z.array(z.string()).min(1),
    publisher: z.string().optional(),
    year: z.number().int().optional(),
    isbn: z.string().optional(),
    isRequired: z.boolean()
  })),
  references: z.array(z.object({
    title: z.string().min(1),
    authors: z.array(z.string()).min(1),
    url: z.string().url().optional()
  }))
}).refine((data) => data.contactHours >= data.creditHours, {
  message: 'Số giờ tiếp xúc phải lớn hơn hoặc bằng số tín chỉ',
  path: ['contactHours']
}).refine((data) => {
  const totalWeight = data.assessmentMethods.reduce((sum, a) => sum + a.weight, 0);
  return Math.abs(totalWeight - 100) < 0.01;
}, {
  message: 'Tổng trọng số đánh giá phải bằng 100%',
  path: ['assessmentMethods']
});
```

### API Client Interface

```typescript
// API client functions
interface SyllabiAPI {
  // List with query parameters
  list(params: SyllabiQueryParams): Promise<SyllabiListResponse>;
  
  // Get single syllabus by ID
  getById(id: string): Promise<SyllabusDetailResponse>;
  
  // Create new syllabus
  create(data: SyllabusFormInput): Promise<SyllabusDetailResponse>;
  
  // Update existing syllabus
  update(id: string, data: Partial<SyllabusFormInput>): Promise<SyllabusDetailResponse>;
  
  // Delete syllabus (soft delete)
  delete(id: string): Promise<void>;
  
  // Submit for review
  submit(id: string): Promise<SyllabusDetailResponse>;
  
  // Create new version
  createVersion(id: string): Promise<SyllabusDetailResponse>;
  
  // Get version history
  getVersionHistory(courseCode: string): Promise<Syllabus[]>;
  
  // Compare versions
  compareVersions(id1: string, id2: string): Promise<VersionDiff>;
  
  // Export to PDF
  exportPDF(id: string): Promise<Blob>;
  
  // Check course code uniqueness
  checkCourseCodeUniqueness(code: string, semester: string, academicYear: string, excludeId?: string): Promise<{ isUnique: boolean }>;
}
```

## Data Flow

**List Screen Data Flow**:
1. Component mounts → useSyllabi hook triggers query
2. TanStack Query fetches data from API with current params (page, search, filter)
3. Data returned → Table component renders rows
4. User changes page/search/filter → Query params update → Refetch
5. Cache stores results for each unique param combination

**Create Screen Data Flow**:
1. User fills multi-step form → React Hook Form tracks values per step
2. User navigates between steps → Validation runs for current step
3. User submits final step → Form validates entire schema
4. If valid → useCreateSyllabus mutation executes
5. API creates record → Returns new syllabus with DRAFT status
6. Mutation success → Invalidate list cache → Show toast → Navigate to edit page

**Edit Screen Data Flow**:
1. Component mounts with ID param → useSyllabus hook fetches detail
2. Data loaded → Form populated with defaultValues
3. User modifies fields → isDirty flag set to true
4. Auto-save timer triggers every 30s → useAutoSave hook executes
5. User clicks Save → Form validates → useUpdateSyllabus mutation executes
6. API updates record → Returns updated syllabus
7. Mutation success → Invalidate caches → Show toast → Clear dirty flag

**Submit for Review Data Flow**:
1. User clicks Submit button → Validation runs on complete syllabus
2. If valid → Confirmation modal appears
3. User confirms → useSubmitSyllabus mutation executes
4. API changes status to PENDING → Creates review request → Sends notifications
5. Success → Invalidate caches → Show toast → Navigate to list

## Testing Strategy

### Unit Testing

**Component Tests**:
- Syllabus form renders with correct sections
- Table renders with correct columns for sample data
- Status badge displays correct color and text for each status
- Row actions menu shows correct options based on status and user role
- Toolbar renders search and filter controls
- Empty state displays when data array is empty
- Error state displays when error prop is provided
- Loading state displays when loading prop is true

**Validation Tests**:
- Course code format validation rejects invalid patterns
- Credit hours validation enforces 1-10 range
- Assessment weights validation ensures total equals 100%
- CLO-PLO mapping validation requires at least one mapping per CLO
- Weekly schedule validation requires minimum 12 weeks

**Hook Tests**:
- useAutoSave triggers save every 30 seconds when dirty
- useFormDirty sets isDirty when field changes
- useFormDirty shows confirmation dialog on navigation attempt
- TanStack Query hooks return correct data structure
- Mutation hooks invalidate cache on success

### Integration Testing

**Create Flow**:
1. Navigate to create page
2. Fill in course information step
3. Add CLOs and map to PLOs
4. Define weekly schedule
5. Add assessment methods
6. Add resources
7. Submit form
8. Verify API called with correct data
9. Verify redirect to edit page
10. Verify success toast displayed

**Submit Flow**:
1. Create draft syllabus
2. Complete all required sections
3. Click Submit for Review
4. Verify validation passes
5. Confirm submission
6. Verify status changes to PENDING
7. Verify notifications sent
8. Verify editing is locked

## Error Handling

### Validation Errors

**Client-Side Validation**:
- Course code format validation
- Credit hours range validation
- Assessment weight total validation
- CLO-PLO mapping completeness
- All validation uses Zod schemas with Vietnamese error messages

**Server-Side Validation**:
- Course code uniqueness check
- Submission period validation
- User permission validation
- Database constraint violations

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
- 404 Not Found → Display "Không tìm thấy đề cương"
- 409 Conflict → Display "Mã môn học đã tồn tại cho học kỳ này"
- 500 Server Error → Display generic error message with retry option

## Security Considerations

- All API requests require valid JWT authentication
- Role-based access control for edit/delete operations
- Lecturers can only edit their own DRAFT syllabi
- HoD and Academic Managers have read access to all syllabi
- Audit trail for all modifications
- Input sanitization to prevent XSS attacks
