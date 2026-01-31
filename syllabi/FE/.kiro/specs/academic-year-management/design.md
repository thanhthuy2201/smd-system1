# Design Document: Academic Year Management

## Overview

The Academic Year Management feature is a CRUD (Create, Read, Update, Disable/Enable) interface for managing academic year records in a React-based admin dashboard. The feature follows a feature-based architecture pattern, integrating with TanStack Router for navigation, TanStack Query for server state management, React Hook Form with Zod for form validation, and Shadcn UI components for the user interface.

The feature consists of three main screens:
1. **List Screen** - Displays all academic years in a data table with search, filter, sort, and pagination
2. **Add Screen** - Form for creating new academic years with validation
3. **Edit Screen** - Form for updating existing academic years with unsaved changes detection

The system implements soft-delete through status management (ACTIVE/DISABLED) rather than hard deletion, preserving data integrity and audit trails.

## Architecture

### High-Level Structure

```
src/features/academic-years/
├── index.tsx                    # List screen component
├── add.tsx                      # Add screen component
├── edit.tsx                     # Edit screen component
├── components/
│   ├── academic-year-form.tsx   # Shared form component
│   ├── academic-year-table.tsx  # Data table component
│   ├── columns.tsx              # Table column definitions
│   ├── row-actions.tsx          # Table row action menu
│   ├── toolbar.tsx              # Search and filter toolbar
│   └── status-badge.tsx         # Status display component
├── data/
│   ├── schema.ts                # Zod schemas and TypeScript types
│   └── api.ts                   # API client functions
└── hooks/
    ├── use-academic-years.ts    # TanStack Query hooks for list
    ├── use-academic-year.ts     # TanStack Query hook for single item
    └── use-form-dirty.ts        # Hook for tracking unsaved changes

src/routes/_authenticated/
├── academic-years.index.tsx     # List route
├── academic-years.add.tsx       # Add route
└── academic-years.edit.$id.tsx  # Edit route (with ID param)
```

### Routing Strategy

The feature uses TanStack Router with file-based routing under the `_authenticated` layout:
- `/academic-years` - List screen
- `/academic-years/add` - Add screen
- `/academic-years/edit/$id` - Edit screen with dynamic ID parameter

All routes are protected by the authenticated layout, ensuring only logged-in administrators can access them.

### State Management Strategy

**Server State (TanStack Query)**:
- Academic years list with pagination, search, and filter parameters
- Individual academic year details for edit screen
- Mutations for create, update, and status change operations
- Automatic cache invalidation after mutations
- Optimistic updates for status changes

**Form State (React Hook Form)**:
- Form field values and validation state
- Dirty field tracking for unsaved changes detection
- Field-level and form-level error messages

**Local UI State (React useState)**:
- Confirmation dialog visibility
- Toast notification state
- Loading indicators for async operations

## Components and Interfaces

### Data Models

```typescript
// Core Academic Year type
interface AcademicYear {
  id: string;
  code: string;              // Format: YYYY-YYYY
  name: string | null;       // Optional label
  startDate: Date;
  endDate: Date;
  status: AcademicYearStatus;
  createdAt: Date;
  updatedAt: Date;
}

enum AcademicYearStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED'
}

// Form input type (for create/update)
interface AcademicYearFormInput {
  code: string;
  name?: string;
  startDate: Date;
  endDate: Date;
  status?: AcademicYearStatus;
}

// API response types
interface AcademicYearsListResponse {
  data: AcademicYear[];
  total: number;
  page: number;
  pageSize: number;
}

interface AcademicYearDetailResponse {
  data: AcademicYear;
}

// Query parameters for list
interface AcademicYearsQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: AcademicYearStatus | 'ALL';
  sortBy?: 'startDate' | 'code' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
```

### Zod Validation Schemas

```typescript
// Academic Year Code validation
const academicYearCodeSchema = z.string()
  .regex(/^\d{4}-\d{4}$/, 'Mã năm học phải có định dạng YYYY-YYYY')
  .refine((code) => {
    const [startYear, endYear] = code.split('-').map(Number);
    return endYear === startYear + 1;
  }, 'Năm kết thúc phải bằng năm bắt đầu cộng 1');

// Date range validation
const dateRangeSchema = z.object({
  startDate: z.date({ required_error: 'Ngày bắt đầu là bắt buộc' }),
  endDate: z.date({ required_error: 'Ngày kết thúc là bắt buộc' })
}).refine((data) => data.endDate > data.startDate, {
  message: 'Ngày kết thúc phải sau ngày bắt đầu',
  path: ['endDate']
});

// Complete form schema
const academicYearFormSchema = z.object({
  code: academicYearCodeSchema,
  name: z.string().optional(),
  startDate: z.date({ required_error: 'Ngày bắt đầu là bắt buộc' }),
  endDate: z.date({ required_error: 'Ngày kết thúc là bắt buộc' }),
  status: z.nativeEnum(AcademicYearStatus).optional().default(AcademicYearStatus.ACTIVE)
}).refine((data) => data.endDate > data.startDate, {
  message: 'Ngày kết thúc phải sau ngày bắt đầu',
  path: ['endDate']
});
```

### API Client Interface

```typescript
// API client functions
interface AcademicYearsAPI {
  // List with query parameters
  list(params: AcademicYearsQueryParams): Promise<AcademicYearsListResponse>;
  
  // Get single academic year by ID
  getById(id: string): Promise<AcademicYearDetailResponse>;
  
  // Create new academic year
  create(data: AcademicYearFormInput): Promise<AcademicYearDetailResponse>;
  
  // Update existing academic year
  update(id: string, data: Partial<AcademicYearFormInput>): Promise<AcademicYearDetailResponse>;
  
  // Change status (disable/enable)
  updateStatus(id: string, status: AcademicYearStatus): Promise<AcademicYearDetailResponse>;
  
  // Check if code is unique (for validation)
  checkCodeUniqueness(code: string, excludeId?: string): Promise<{ isUnique: boolean }>;
}
```

### Component Interfaces

```typescript
// Academic Year Form Component
interface AcademicYearFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<AcademicYearFormInput>;
  onSubmit: (data: AcademicYearFormInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

// Academic Year Table Component
interface AcademicYearTableProps {
  data: AcademicYear[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (id: string) => void;
  onStatusChange: (id: string, newStatus: AcademicYearStatus) => void;
}

// Toolbar Component
interface ToolbarProps {
  search: string;
  onSearchChange: (search: string) => void;
  statusFilter: AcademicYearStatus | 'ALL';
  onStatusFilterChange: (status: AcademicYearStatus | 'ALL') => void;
}

// Row Actions Component
interface RowActionsProps {
  academicYear: AcademicYear;
  onEdit: (id: string) => void;
  onStatusChange: (id: string, newStatus: AcademicYearStatus) => void;
}
```

### TanStack Query Hooks

```typescript
// Hook for fetching academic years list
function useAcademicYears(params: AcademicYearsQueryParams) {
  return useQuery({
    queryKey: ['academic-years', params],
    queryFn: () => api.list(params),
    keepPreviousData: true, // For smooth pagination
  });
}

// Hook for fetching single academic year
function useAcademicYear(id: string) {
  return useQuery({
    queryKey: ['academic-year', id],
    queryFn: () => api.getById(id),
    enabled: !!id,
  });
}

// Hook for creating academic year
function useCreateAcademicYear() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: AcademicYearFormInput) => api.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['academic-years']);
    },
  });
}

// Hook for updating academic year
function useUpdateAcademicYear(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<AcademicYearFormInput>) => api.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['academic-years']);
      queryClient.invalidateQueries(['academic-year', id]);
    },
  });
}

// Hook for updating status
function useUpdateAcademicYearStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AcademicYearStatus }) => 
      api.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['academic-years']);
    },
    // Optimistic update for better UX
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries(['academic-years']);
      const previousData = queryClient.getQueryData(['academic-years']);
      
      queryClient.setQueryData(['academic-years'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((item: AcademicYear) =>
            item.id === id ? { ...item, status } : item
          ),
        };
      });
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['academic-years'], context.previousData);
      }
    },
  });
}
```

### Form Dirty Tracking Hook

```typescript
// Hook for tracking unsaved changes
function useFormDirty(isDirty: boolean) {
  const navigate = useNavigate();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Intercept navigation when form is dirty
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const confirmNavigation = () => {
    if (pendingNavigation) {
      navigate({ to: pendingNavigation });
    }
    setShowConfirmDialog(false);
  };

  const cancelNavigation = () => {
    setPendingNavigation(null);
    setShowConfirmDialog(false);
  };

  return {
    showConfirmDialog,
    confirmNavigation,
    cancelNavigation,
    checkNavigation: (path: string) => {
      if (isDirty) {
        setPendingNavigation(path);
        setShowConfirmDialog(true);
        return false;
      }
      return true;
    },
  };
}
```

## Data Models

### Database Schema

```sql
CREATE TABLE academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(9) NOT NULL UNIQUE,  -- Format: YYYY-YYYY
  name VARCHAR(255),                 -- Optional label
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT check_code_format CHECK (code ~ '^\d{4}-\d{4}$'),
  CONSTRAINT check_date_range CHECK (end_date > start_date),
  CONSTRAINT check_status CHECK (status IN ('ACTIVE', 'DISABLED'))
);

CREATE INDEX idx_academic_years_status ON academic_years(status);
CREATE INDEX idx_academic_years_start_date ON academic_years(start_date DESC);
CREATE INDEX idx_academic_years_code ON academic_years(code);
```

### Data Flow

**List Screen Data Flow**:
1. Component mounts → useAcademicYears hook triggers query
2. TanStack Query fetches data from API with current params (page, search, filter)
3. Data returned → Table component renders rows
4. User changes page/search/filter → Query params update → Refetch
5. Cache stores results for each unique param combination

**Add Screen Data Flow**:
1. User fills form → React Hook Form tracks values and validation
2. User submits → Form validates with Zod schema
3. If valid → useCreateAcademicYear mutation executes
4. API creates record → Returns new academic year
5. Mutation success → Invalidate list cache → Show toast → Navigate to list

**Edit Screen Data Flow**:
1. Component mounts with ID param → useAcademicYear hook fetches detail
2. Data loaded → Form populated with defaultValues
3. User modifies fields → isDirty flag set to true
4. User submits → Form validates → useUpdateAcademicYear mutation executes
5. API updates record → Returns updated academic year
6. Mutation success → Invalidate caches → Show toast → Navigate to list

**Status Change Data Flow**:
1. User clicks Disable/Enable → Confirmation dialog appears
2. User confirms → useUpdateAcademicYearStatus mutation executes
3. Optimistic update → UI immediately reflects new status
4. API processes request → Returns updated record
5. Success → Cache invalidated → Toast shown
6. Error → Optimistic update rolled back → Error toast shown


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Table displays all required columns

*For any* non-empty list of academic years, the rendered table should contain all required columns: No., Mã năm học, Tên/Nhãn, Ngày bắt đầu, Ngày kết thúc, Trạng thái, Ngày tạo, Ngày cập nhật, and Hành động.

**Validates: Requirements 1.4**

### Property 2: Row numbering is sequential

*For any* list of academic years displayed in the table, the row numbers should be sequential starting from 1 and incrementing by 1 for each row.

**Validates: Requirements 1.5**

### Property 3: Loading state displays indicator

*For any* query in loading state, the UI should display a loading indicator and not display the data table.

**Validates: Requirements 1.2**

### Property 4: Error state displays message

*For any* failed API request, the UI should display an error state with an appropriate error message and not display the data table.

**Validates: Requirements 1.6, 9.5**

### Property 5: Pagination appears when needed

*For any* academic years list where total count exceeds page size, the UI should display pagination controls.

**Validates: Requirements 1.7**

### Property 6: Dates formatted in Vietnamese locale

*For any* date value displayed in the UI, the formatted string should follow Vietnamese locale conventions (dd/MM/yyyy format).

**Validates: Requirements 1.8**

### Property 7: Valid form submission creates record

*For any* valid academic year form data submitted in create mode, the system should successfully create a new academic year record and return the created data.

**Validates: Requirements 2.3**

### Property 8: Successful operations redirect to list

*For any* successful create or update operation, the system should navigate to the academic years list page.

**Validates: Requirements 2.4, 5.6**

### Property 9: Required fields validated

*For any* form submission with missing required fields (code, startDate, or endDate), the system should prevent submission and display field-level error messages.

**Validates: Requirements 2.6, 4.3**

### Property 10: Status defaults to ACTIVE

*For any* academic year creation where status is not explicitly provided, the system should set the status to ACTIVE.

**Validates: Requirements 2.7**

### Property 11: Code format validation

*For any* academic year code input, the validation should reject codes that don't match the pattern YYYY-YYYY where both parts are 4-digit numbers.

**Validates: Requirements 3.1**

### Property 12: Year increment validation

*For any* academic year code in format YYYY-YYYY, the validation should reject codes where the second year does not equal the first year plus one.

**Validates: Requirements 3.2**

### Property 13: Code uniqueness enforced

*For any* academic year code, the system should reject creation or update if another academic year already exists with the same code.

**Validates: Requirements 3.3, 3.5**

### Property 14: Invalid code shows error

*For any* invalid academic year code (failing format or year increment validation), the form should display a field-level error message in Vietnamese.

**Validates: Requirements 3.4**

### Property 15: End date after start date validation

*For any* pair of start date and end date, the validation should reject cases where end date is not after start date.

**Validates: Requirements 4.1, 4.2**

### Property 16: Edit form populates with data

*For any* academic year loaded in edit mode, all form fields should be populated with the current values from that academic year record.

**Validates: Requirements 5.2**

### Property 17: Valid update saves changes

*For any* valid academic year form data submitted in edit mode, the system should successfully update the academic year record with the new values.

**Validates: Requirements 5.5**

### Property 18: Unsaved changes trigger confirmation

*For any* form with unsaved changes (isDirty = true), attempting to navigate away should display a confirmation dialog before allowing navigation.

**Validates: Requirements 5.7, 11.2**

### Property 19: Field modification sets dirty flag

*For any* form field modification, the form's isDirty flag should be set to true.

**Validates: Requirements 11.1**

### Property 20: Successful save clears dirty flag

*For any* successful form submission, the form's isDirty flag should be reset to false.

**Validates: Requirements 11.5**

### Property 21: Status determines available actions

*For any* academic year with status ACTIVE, the row actions should include "Disable"; for any academic year with status DISABLED, the row actions should include "Enable".

**Validates: Requirements 6.1, 6.2**

### Property 22: Status change updates record

*For any* academic year, confirming a status change (Disable or Enable) should update the academic year's status to the new value (DISABLED or ACTIVE respectively).

**Validates: Requirements 6.4, 6.6**

### Property 23: In-use academic year cannot be disabled

*For any* academic year that is currently in use by other entities, attempting to disable it should fail with a specific error message explaining the academic year is in use.

**Validates: Requirements 6.7**

### Property 24: Search filters by code or name

*For any* search query string, the filtered results should only include academic years where the code or name contains the search query (case-insensitive).

**Validates: Requirements 7.1**

### Property 25: Status filter matches records

*For any* status filter value (ACTIVE or DISABLED), the filtered results should only include academic years with that status; when filter is "ALL", all academic years should be included.

**Validates: Requirements 7.3**

### Property 26: Filter changes update results

*For any* change to search or filter criteria, the table results should update to reflect the new criteria without requiring manual refresh.

**Validates: Requirements 7.4**

### Property 27: Default sort by start date descending

*For any* academic years list without explicit sort parameters, the results should be sorted by start date in descending order (most recent first).

**Validates: Requirements 8.1**

### Property 28: Sort indicator reflects state

*For any* active sort configuration, the UI should display a visual indicator showing which column is sorted and in which direction (ascending or descending).

**Validates: Requirements 8.3**

### Property 29: Error messages in Vietnamese

*For any* error condition (validation error, API error, or business rule violation), the displayed error message should be in Vietnamese language.

**Validates: Requirements 3.4, 4.4, 9.1**

### Property 30: Validation errors show at field level

*For any* form validation failure, the error messages should appear adjacent to the specific fields that failed validation, not just as a general form error.

**Validates: Requirements 9.2**

### Property 31: Server errors show toast

*For any* API request that fails with a server error (non-validation error), the system should display a toast notification with the error message.

**Validates: Requirements 9.3**

### Property 32: Label auto-generation from code

*For any* valid academic year code entered, the system should suggest a label that matches or is derived from the code value.

**Validates: Requirements 10.1**

### Property 33: Label suggestion updates with code

*For any* change to the academic year code field, the suggested label should update to reflect the new code value.

**Validates: Requirements 10.3**

### Property 34: Success operations show toast

*For any* successful create, update, or status change operation, the system should display a success toast message in Vietnamese.

**Validates: Requirements 12.1, 12.2, 12.3**

### Property 35: Toast auto-dismisses

*For any* toast notification displayed, the toast should automatically dismiss after a reasonable duration (typically 3-5 seconds).

**Validates: Requirements 12.4**

## Error Handling

### Validation Errors

**Client-Side Validation**:
- Academic Year Code format and year increment validation
- Date range validation (end date after start date)
- Required field validation
- All validation uses Zod schemas with Vietnamese error messages

**Server-Side Validation**:
- Code uniqueness check (may require async validation)
- Business rule validation (e.g., cannot disable in-use academic year)
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
- 404 Not Found → Display "Academic year not found" message
- 409 Conflict → Display "Code already exists" for duplicate codes
- 500 Server Error → Display generic error message with retry option

**Error Recovery**:
- TanStack Query automatic retry for transient failures (3 retries with exponential backoff)
- Optimistic updates rolled back on error
- Cache invalidation on error to ensure fresh data on retry

### Business Rule Violations

**Cannot Disable In-Use Academic Year**:
- Server returns 400 with specific error code
- Client displays Vietnamese message: "Không thể vô hiệu hóa năm học đang được sử dụng"
- User can view which entities are using the academic year (if API provides this info)

**Concurrent Modification**:
- Use optimistic locking with version field or updatedAt timestamp
- If update fails due to concurrent modification, display error and reload fresh data
- User can review changes and resubmit

### Form State Errors

**Unsaved Changes**:
- Browser beforeunload event prevents accidental tab close
- Custom navigation guard for in-app navigation
- Confirmation dialog with options: "Discard changes" or "Stay on page"

**Invalid State Recovery**:
- If form gets into invalid state, provide "Reset form" button
- Clear button to reset individual fields
- Cancel button always available to abandon changes

## Testing Strategy

### Unit Testing

Unit tests will focus on specific examples, edge cases, and component integration:

**Component Tests**:
- Academic year form renders with correct fields
- Table renders with correct columns for sample data
- Status badge displays correct color and text for each status
- Row actions menu shows correct options based on status
- Toolbar renders search and filter controls
- Empty state displays when data array is empty
- Error state displays when error prop is provided
- Loading state displays when loading prop is true

**Validation Tests**:
- Code format validation rejects invalid patterns (e.g., "2025", "25-26", "2025-2027")
- Code format validation accepts valid patterns (e.g., "2025-2026")
- Year increment validation rejects incorrect increments (e.g., "2025-2025", "2025-2027")
- Date range validation rejects end date before start date
- Required field validation prevents submission with missing fields

**Hook Tests**:
- useFormDirty sets isDirty when field changes
- useFormDirty shows confirmation dialog on navigation attempt
- useFormDirty clears isDirty after successful save
- TanStack Query hooks return correct data structure
- Mutation hooks invalidate cache on success

**Edge Cases**:
- Empty academic years list displays empty state
- Single academic year in list displays correctly
- Very long academic year names truncate properly
- Date edge cases (leap years, year boundaries)
- Search with no results displays empty state

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using a property-based testing library (e.g., fast-check for TypeScript):

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with: **Feature: academic-year-management, Property {N}: {property text}**

**Test Generators**:
```typescript
// Generator for valid academic year codes
const validCodeArbitrary = fc.integer({ min: 2000, max: 2100 })
  .map(year => `${year}-${year + 1}`);

// Generator for invalid academic year codes
const invalidCodeArbitrary = fc.oneof(
  fc.string(), // Random strings
  fc.integer().map(String), // Single numbers
  fc.tuple(fc.integer(), fc.integer()).map(([y1, y2]) => `${y1}-${y2}`) // Wrong increment
);

// Generator for valid date ranges
const validDateRangeArbitrary = fc.date()
  .chain(startDate => fc.date({ min: new Date(startDate.getTime() + 86400000) })
    .map(endDate => ({ startDate, endDate }))
  );

// Generator for academic years
const academicYearArbitrary = fc.record({
  id: fc.uuid(),
  code: validCodeArbitrary,
  name: fc.option(fc.string(), { nil: null }),
  startDate: fc.date(),
  endDate: fc.date(),
  status: fc.constantFrom(AcademicYearStatus.ACTIVE, AcademicYearStatus.DISABLED),
  createdAt: fc.date(),
  updatedAt: fc.date(),
}).filter(ay => ay.endDate > ay.startDate);
```

**Property Test Examples**:

```typescript
// Property 2: Row numbering is sequential
test('Feature: academic-year-management, Property 2: Row numbering is sequential', () => {
  fc.assert(
    fc.property(
      fc.array(academicYearArbitrary, { minLength: 1, maxLength: 50 }),
      (academicYears) => {
        const { container } = render(<AcademicYearTable data={academicYears} />);
        const rows = container.querySelectorAll('tbody tr');
        
        rows.forEach((row, index) => {
          const numberCell = row.querySelector('td:first-child');
          expect(numberCell?.textContent).toBe(String(index + 1));
        });
      }
    ),
    { numRuns: 100 }
  );
});

// Property 11: Code format validation
test('Feature: academic-year-management, Property 11: Code format validation', () => {
  fc.assert(
    fc.property(
      invalidCodeArbitrary,
      (invalidCode) => {
        const result = academicYearCodeSchema.safeParse(invalidCode);
        expect(result.success).toBe(false);
      }
    ),
    { numRuns: 100 }
  );
});

// Property 15: End date after start date validation
test('Feature: academic-year-management, Property 15: End date after start date validation', () => {
  fc.assert(
    fc.property(
      fc.date(),
      fc.date(),
      (date1, date2) => {
        const startDate = date1 < date2 ? date2 : date1; // Ensure start is after end
        const endDate = date1 < date2 ? date1 : date2;
        
        const result = dateRangeSchema.safeParse({ startDate, endDate });
        expect(result.success).toBe(false);
      }
    ),
    { numRuns: 100 }
  );
});

// Property 24: Search filters by code or name
test('Feature: academic-year-management, Property 24: Search filters by code or name', () => {
  fc.assert(
    fc.property(
      fc.array(academicYearArbitrary, { minLength: 10, maxLength: 50 }),
      fc.string({ minLength: 1, maxLength: 10 }),
      (academicYears, searchQuery) => {
        const filtered = filterAcademicYears(academicYears, searchQuery);
        
        filtered.forEach(ay => {
          const matchesCode = ay.code.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesName = ay.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
          expect(matchesCode || matchesName).toBe(true);
        });
      }
    ),
    { numRuns: 100 }
  );
});

// Property 27: Default sort by start date descending
test('Feature: academic-year-management, Property 27: Default sort by start date descending', () => {
  fc.assert(
    fc.property(
      fc.array(academicYearArbitrary, { minLength: 2, maxLength: 50 }),
      (academicYears) => {
        const sorted = sortAcademicYears(academicYears); // Default sort
        
        for (let i = 0; i < sorted.length - 1; i++) {
          expect(sorted[i].startDate.getTime()).toBeGreaterThanOrEqual(
            sorted[i + 1].startDate.getTime()
          );
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

Integration tests will verify the complete user flows:

**Create Flow**:
1. Navigate to add page
2. Fill form with valid data
3. Submit form
4. Verify API called with correct data
5. Verify redirect to list page
6. Verify success toast displayed
7. Verify new academic year appears in list

**Edit Flow**:
1. Navigate to edit page with ID
2. Verify form populated with existing data
3. Modify fields
4. Verify isDirty flag set
5. Submit form
6. Verify API called with updated data
7. Verify redirect to list page
8. Verify success toast displayed

**Status Change Flow**:
1. Render list with academic years
2. Click Disable action
3. Verify confirmation dialog appears
4. Confirm action
5. Verify optimistic update in UI
6. Verify API called
7. Verify success toast displayed
8. Verify list refreshed

**Unsaved Changes Flow**:
1. Navigate to add/edit page
2. Modify form fields
3. Attempt to navigate away
4. Verify confirmation dialog appears
5. Test both "Stay" and "Leave" options
6. Verify browser beforeunload event

### Testing Tools

- **Unit Tests**: Vitest + React Testing Library
- **Property-Based Tests**: fast-check
- **Integration Tests**: Vitest + React Testing Library + MSW (Mock Service Worker)
- **E2E Tests** (optional): Playwright for critical user flows

### Test Coverage Goals

- Unit test coverage: 80%+ for components and utilities
- Property tests: All 35 correctness properties implemented
- Integration tests: All major user flows covered
- Edge cases: Empty states, error states, loading states, validation failures
