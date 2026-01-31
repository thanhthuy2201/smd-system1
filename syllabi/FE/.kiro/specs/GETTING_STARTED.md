# Getting Started with Academic Manager Implementation

## 🎯 Quick Start Guide

This guide will help you begin implementing the Academic Manager features for the SMD system.

## 📋 What's Been Created

You now have **complete specifications** for:

1. ✅ **Syllabus Management** - Core feature for creating and managing course syllabi
2. ✅ **Review Schedule Management** - Tool for Academic Managers to manage review cycles
3. ✅ **Academic Year Management** - Basic year/semester management (mostly implemented)

Each specification includes:
- **Requirements Document** - User stories and acceptance criteria
- **Design Document** - Architecture, data models, and technical details
- **Tasks Document** - Step-by-step implementation plan

## 🚀 How to Start Implementation

### Option 1: Start with Syllabus Management (Recommended)

This is the core feature that everything else depends on.

```bash
# Open the tasks file
open .kiro/specs/syllabus-management/tasks.md
```

**First 5 Tasks to Complete:**
1. Set up feature structure and data models
2. Implement API client and TanStack Query hooks
3. Create shared UI components (status badge)
4. Implement auto-save hook
5. Implement form dirty tracking hook

**Why start here?**
- It's the foundation for the entire system
- Other features depend on syllabi existing
- It has the most complex validation logic
- Good learning experience for the patterns

### Option 2: Start with Review Schedule Management

If you want to build the Academic Manager tools first.

```bash
# Open the tasks file
open .kiro/specs/review-schedule-management/tasks.md
```

**First 5 Tasks to Complete:**
1. Set up feature structure and data models
2. Implement API client and TanStack Query hooks
3. Create shared UI components (status badge, progress indicator)
4. Implement form dirty tracking hook
5. Create review schedule form component

**Why start here?**
- Simpler than syllabus management
- Fewer dependencies
- Good for learning the patterns
- Can be developed in parallel with syllabus

### Option 3: Enhance Academic Year Management

Complete the existing feature with semester and submission period management.

```bash
# Open the existing tasks file
open .kiro/specs/academic-year-management/tasks.md
```

**What needs to be added:**
- Semester configuration within academic years
- Submission period dates for each semester
- Integration with review schedules

## 📁 Project Structure

Your specs are organized like this:

```
.kiro/specs/
├── IMPLEMENTATION_SUMMARY.md          # Overview of all specs
├── GETTING_STARTED.md                 # This file
├── academic-year-management/
│   ├── requirements.md                # ✅ Complete
│   ├── design.md                      # ✅ Complete
│   └── tasks.md                       # ✅ Complete (17/17 done)
├── syllabus-management/
│   ├── requirements.md                # ✅ Complete (15 requirements)
│   ├── design.md                      # ✅ Complete
│   └── tasks.md                       # ✅ Complete (31 tasks)
└── review-schedule-management/
    ├── requirements.md                # ✅ Complete (13 requirements)
    ├── design.md                      # ✅ Complete
    └── tasks.md                       # ✅ Complete (30 tasks)
```

## 🛠️ Development Workflow

### Step 1: Read the Specification

Before coding, read these files in order:

1. **requirements.md** - Understand what needs to be built
2. **design.md** - Understand how it should be built
3. **tasks.md** - Understand the step-by-step plan

### Step 2: Set Up Your Environment

```bash
# Install dependencies (if not already done)
pnpm install

# Start the dev server
pnpm dev

# In another terminal, run type checking
pnpm tsc --watch
```

### Step 3: Follow the Tasks

Each task in `tasks.md` includes:
- Clear description of what to build
- File paths where code should go
- Requirements it satisfies
- Dependencies on other tasks

**Example Task Format:**
```markdown
- [ ] 1. Set up feature structure and data models
  - Create `src/features/syllabus/data/schema.ts`
  - Define types: Syllabus, SyllabusStatus, etc.
  - Implement validation schemas
  - _Requirements: 3.1, 3.2, 4.1_
```

### Step 4: Mark Tasks as Complete

As you complete each task, update the checkbox:

```markdown
- [x] 1. Set up feature structure and data models  ✅ DONE
- [ ] 2. Implement API client                      ⏳ IN PROGRESS
- [ ] 3. Create shared UI components               📋 TODO
```

### Step 5: Test at Checkpoints

The tasks include checkpoint tasks (e.g., Task 10, Task 17, Task 31):

```markdown
- [ ] 10. Checkpoint - Verify all components
  - Verify all components render without errors
  - Check that all Vietnamese labels are correct
  - Ensure all tests pass
```

Stop and test thoroughly at each checkpoint before proceeding.

## 🎨 Code Patterns to Follow

### 1. Feature Structure

```
src/features/[feature-name]/
├── index.tsx              # List screen
├── create.tsx             # Create screen
├── edit.tsx               # Edit screen
├── components/            # Feature-specific components
├── data/
│   ├── schema.ts          # Zod schemas + TypeScript types
│   └── api.ts             # API client functions
└── hooks/                 # Custom hooks
```

### 2. Data Schema Pattern

```typescript
// schema.ts
import { z } from 'zod'

// Define Zod schema
export const syllabusSchema = z.object({
  courseCode: z.string().regex(/^[A-Z]{2,4}[0-9]{3,4}$/),
  courseName: z.string().min(5).max(200),
  // ... more fields
})

// Infer TypeScript type from schema
export type Syllabus = z.infer<typeof syllabusSchema>

// Form input type (subset of full type)
export type SyllabusFormInput = Omit<Syllabus, 'id' | 'createdAt' | 'updatedAt'>
```

### 3. API Client Pattern

```typescript
// api.ts
import { apiClient } from '@/lib/api-client'

export const syllabusApi = {
  list: (params: QueryParams) => 
    apiClient.get<ListResponse>('/api/v1/syllabi', { params }),
  
  getById: (id: string) => 
    apiClient.get<DetailResponse>(`/api/v1/syllabi/${id}`),
  
  create: (data: FormInput) => 
    apiClient.post<DetailResponse>('/api/v1/syllabi', data),
  
  update: (id: string, data: Partial<FormInput>) => 
    apiClient.put<DetailResponse>(`/api/v1/syllabi/${id}`, data),
}
```

### 4. TanStack Query Hook Pattern

```typescript
// hooks/use-syllabi.ts
import { useQuery } from '@tanstack/react-query'
import { syllabusApi } from '../data/api'

export function useSyllabi(params: QueryParams) {
  return useQuery({
    queryKey: ['syllabi', params],
    queryFn: () => syllabusApi.list(params),
    keepPreviousData: true,
  })
}
```

### 5. Form Component Pattern

```typescript
// components/syllabus-form.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { syllabusFormSchema } from '../data/schema'

export function SyllabusForm({ mode, defaultValues, onSubmit }: Props) {
  const form = useForm({
    resolver: zodResolver(syllabusFormSchema),
    defaultValues,
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  )
}
```

## 🌐 Vietnamese Translations

All user-facing text should be in Vietnamese. Common translations:

| English | Vietnamese |
|---------|-----------|
| Create | Tạo mới |
| Edit | Chỉnh sửa |
| Delete | Xóa |
| Save | Lưu |
| Cancel | Hủy |
| Submit | Gửi |
| Search | Tìm kiếm |
| Filter | Lọc |
| Status | Trạng thái |
| Draft | Bản nháp |
| Pending | Chờ phê duyệt |
| Approved | Đã phê duyệt |
| Rejected | Từ chối |
| Loading | Đang tải |
| Error | Lỗi |
| Success | Thành công |

## 🧪 Testing Strategy

### Unit Tests

Test individual components and functions:

```typescript
// Example: Test validation schema
describe('courseCodeSchema', () => {
  it('accepts valid course codes', () => {
    expect(courseCodeSchema.parse('CS101')).toBe('CS101')
    expect(courseCodeSchema.parse('MATH2001')).toBe('MATH2001')
  })

  it('rejects invalid course codes', () => {
    expect(() => courseCodeSchema.parse('cs101')).toThrow()
    expect(() => courseCodeSchema.parse('123')).toThrow()
  })
})
```

### Integration Tests

Test complete user flows:

```typescript
// Example: Test create syllabus flow
describe('Create Syllabus Flow', () => {
  it('creates a syllabus successfully', async () => {
    // 1. Navigate to create page
    // 2. Fill in form
    // 3. Submit
    // 4. Verify API called
    // 5. Verify redirect
    // 6. Verify toast shown
  })
})
```

## 📞 Getting Help

### If you're stuck on a task:

1. **Check the design document** - It has detailed explanations
2. **Look at similar features** - Academic Year Management is a good reference
3. **Review the requirements** - Make sure you understand what's needed
4. **Ask specific questions** - Reference the task number and what's unclear

### Common Questions:

**Q: Do I need to implement all 31 tasks for Syllabus Management?**
A: Yes, for a complete feature. But you can implement in phases and deploy incrementally.

**Q: Can I change the data models?**
A: Yes, the specs are a guide. Adapt them to your needs, but maintain the core requirements.

**Q: What if the API doesn't exist yet?**
A: Start with mock data and implement the frontend. The API can be added later.

**Q: Should I implement tests as I go?**
A: Yes, write tests for validation logic and critical components as you build them.

## 🎯 Success Criteria

You'll know you're done when:

### For Syllabus Management:
- ✅ Lecturers can create and edit syllabi
- ✅ All validation rules work correctly
- ✅ CLO-PLO mapping is functional
- ✅ Assessment weights validate to 100%
- ✅ Auto-save works reliably
- ✅ Submit for review workflow functions
- ✅ Version control works
- ✅ PDF export generates correctly

### For Review Schedule Management:
- ✅ Academic Managers can create review schedules
- ✅ Date validation enforces correct sequence
- ✅ Reviewer assignment works
- ✅ Progress tracking updates in real-time
- ✅ Reminders can be sent
- ✅ Reports can be exported
- ✅ Audit trail is complete

## 📚 Additional Resources

- **TanStack Router Docs**: https://tanstack.com/router
- **TanStack Query Docs**: https://tanstack.com/query
- **React Hook Form Docs**: https://react-hook-form.com
- **Zod Docs**: https://zod.dev
- **Shadcn UI Docs**: https://ui.shadcn.com

## 🚦 Ready to Start?

1. Choose which feature to implement first
2. Open the corresponding `tasks.md` file
3. Read through tasks 1-5 to understand the foundation
4. Start with Task 1
5. Mark tasks complete as you go
6. Test at each checkpoint

**Good luck with your implementation! 🎉**

---

*Last Updated: January 30, 2026*
