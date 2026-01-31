# API Configuration Guide

## Overview

This guide explains how to configure and use the centralized API client for making HTTP requests to your backend.

## 📁 Files Created

1. **`src/lib/api-client.ts`** - Centralized Axios instance with interceptors
2. **`src/features/academic-years/data/api.real.ts`** - Example real API implementation
3. **`.env`** - Updated with `VITE_API_BASE_URL`
4. **`.env.example`** - Updated with API URL documentation

## 🔧 Configuration

### Step 1: Set Backend URL

Update your `.env` file with your backend API URL:

```env
# Development
VITE_API_BASE_URL=http://localhost:3000

# Or for production
VITE_API_BASE_URL=https://api.yourdomain.com
```

**Important**: The environment variable must start with `VITE_` to be accessible in the frontend.

### Step 2: Configure Authentication

The API client automatically adds authentication tokens to requests. Update the token retrieval logic in `src/lib/api-client.ts` if needed:

```typescript
// Current implementation (line 32-36)
const token = localStorage.getItem('auth_token')

if (token) {
  config.headers.Authorization = `Bearer ${token}`
}
```

**Options for token storage**:
- **localStorage** (current) - Persists across sessions
- **sessionStorage** - Clears when browser closes
- **Zustand store** - If you're using Zustand for auth state
- **Firebase Auth** - If using Firebase, get token from `currentUser.getIdToken()`

**Example with Firebase**:
```typescript
import { auth } from '@/lib/firebase/config'

const user = auth.currentUser
if (user) {
  const token = await user.getIdToken()
  config.headers.Authorization = `Bearer ${token}`
}
```

### Step 3: Update Error Handling (Optional)

The API client includes default error handling. Customize it in `src/lib/api-client.ts`:

```typescript
// Line 73-115: Response interceptor error handling
case 401:
  // Customize unauthorized handling
  localStorage.removeItem('auth_token')
  window.location.href = '/sign-in'
  break
```

## 📝 Usage Examples

### Basic Usage

```typescript
import { apiClient } from '@/lib/api-client'

// GET request
const response = await apiClient.get('/api/v1/users')
const users = response.data

// POST request
const newUser = await apiClient.post('/api/v1/users', {
  name: 'John Doe',
  email: 'john@example.com'
})

// PUT request
const updated = await apiClient.put('/api/v1/users/123', {
  name: 'Jane Doe'
})

// DELETE request
await apiClient.delete('/api/v1/users/123')
```

### With TypeScript Types

```typescript
import { apiClient } from '@/lib/api-client'

interface User {
  id: string
  name: string
  email: string
}

interface UsersResponse {
  data: User[]
  total: number
  page: number
}

// Type-safe GET request
const response = await apiClient.get<UsersResponse>('/api/v1/users')
const users: User[] = response.data.data

// Type-safe POST request
const response = await apiClient.post<{ data: User }>(
  '/api/v1/users',
  { name: 'John', email: 'john@example.com' }
)
const newUser: User = response.data.data
```

### With Query Parameters

```typescript
import { apiClient } from '@/lib/api-client'

const response = await apiClient.get('/api/v1/users', {
  params: {
    page: 1,
    pageSize: 10,
    search: 'john',
    status: 'active'
  }
})
// Generates: /api/v1/users?page=1&pageSize=10&search=john&status=active
```

### File Upload

```typescript
import { apiClient } from '@/lib/api-client'

const formData = new FormData()
formData.append('file', file)
formData.append('name', 'Document Name')

const response = await apiClient.upload('/api/v1/documents', formData)
```

### File Download

```typescript
import { apiClient } from '@/lib/api-client'

await apiClient.download(
  '/api/v1/reports/123/export',
  'report.pdf'
)
// Automatically triggers browser download
```

## 🏗️ Feature API Implementation Pattern

### Step 1: Define Types in schema.ts

```typescript
// src/features/syllabi/data/schema.ts
import { z } from 'zod'

export const syllabusSchema = z.object({
  id: z.string(),
  courseCode: z.string(),
  courseName: z.string(),
  // ... more fields
})

export type Syllabus = z.infer<typeof syllabusSchema>

export interface SyllabiListResponse {
  data: Syllabus[]
  total: number
  page: number
  pageSize: number
}

export interface SyllabusDetailResponse {
  data: Syllabus
}
```

### Step 2: Create API Client in api.ts

```typescript
// src/features/syllabi/data/api.ts
import { apiClient } from '@/lib/api-client'
import type {
  Syllabus,
  SyllabiListResponse,
  SyllabusDetailResponse,
  SyllabusFormInput,
  SyllabiQueryParams,
} from './schema'

export const syllabiApi = {
  list: async (params: SyllabiQueryParams): Promise<SyllabiListResponse> => {
    const response = await apiClient.get<SyllabiListResponse>(
      '/api/v1/syllabi',
      { params }
    )
    return response.data
  },

  getById: async (id: string): Promise<SyllabusDetailResponse> => {
    const response = await apiClient.get<SyllabusDetailResponse>(
      `/api/v1/syllabi/${id}`
    )
    return response.data
  },

  create: async (data: SyllabusFormInput): Promise<SyllabusDetailResponse> => {
    const response = await apiClient.post<SyllabusDetailResponse>(
      '/api/v1/syllabi',
      data
    )
    return response.data
  },

  update: async (
    id: string,
    data: Partial<SyllabusFormInput>
  ): Promise<SyllabusDetailResponse> => {
    const response = await apiClient.put<SyllabusDetailResponse>(
      `/api/v1/syllabi/${id}`,
      data
    )
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/syllabi/${id}`)
  },

  submit: async (id: string): Promise<SyllabusDetailResponse> => {
    const response = await apiClient.post<SyllabusDetailResponse>(
      `/api/v1/syllabi/${id}/submit`
    )
    return response.data
  },

  exportPDF: async (id: string): Promise<void> => {
    await apiClient.download(
      `/api/v1/syllabi/${id}/export`,
      `syllabus-${id}.pdf`
    )
  },
}
```

### Step 3: Use in TanStack Query Hooks

```typescript
// src/features/syllabi/hooks/use-syllabi.ts
import { useQuery } from '@tanstack/react-query'
import { syllabiApi } from '../data/api'
import type { SyllabiQueryParams } from '../data/schema'

export function useSyllabi(params: SyllabiQueryParams) {
  return useQuery({
    queryKey: ['syllabi', params],
    queryFn: () => syllabiApi.list(params),
    keepPreviousData: true,
  })
}

// src/features/syllabi/hooks/use-syllabus-mutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { syllabiApi } from '../data/api'

export function useCreateSyllabus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: syllabiApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['syllabi'])
      toast.success('Tạo đề cương thành công')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
    },
  })
}
```

## 🔄 Switching from Mock to Real API

### Current State
- Academic Years feature uses **mock data** (in-memory)
- Located in `src/features/academic-years/data/api.ts`

### To Switch to Real Backend

**Option 1: Replace the file**
```bash
# Backup mock implementation
mv src/features/academic-years/data/api.ts src/features/academic-years/data/api.mock.ts

# Use real implementation
mv src/features/academic-years/data/api.real.ts src/features/academic-years/data/api.ts
```

**Option 2: Use environment variable**

Update `api.ts` to conditionally use mock or real:

```typescript
// src/features/academic-years/data/api.ts
import { mockApi } from './api.mock'
import { realApi } from './api.real'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true'

export const academicYearsApi = USE_MOCK ? mockApi : realApi
```

Then in `.env`:
```env
VITE_USE_MOCK_API=false  # Use real API
# VITE_USE_MOCK_API=true  # Use mock API
```

## 🛡️ Error Handling

### Handling Errors in Components

```typescript
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AxiosError } from 'axios'

function MyComponent() {
  const mutation = useMutation({
    mutationFn: syllabiApi.create,
    onError: (error: AxiosError<any>) => {
      if (error.response) {
        // Server responded with error
        const { status, data } = error.response

        switch (status) {
          case 400:
            // Validation error
            toast.error(data.message || 'Dữ liệu không hợp lệ')
            break
          case 409:
            // Conflict (duplicate)
            toast.error('Mã môn học đã tồn tại')
            break
          case 422:
            // Validation errors with details
            if (data.details) {
              data.details.forEach((err: any) => {
                toast.error(`${err.field}: ${err.message}`)
              })
            }
            break
          default:
            toast.error('Có lỗi xảy ra. Vui lòng thử lại.')
        }
      } else if (error.request) {
        // Network error
        toast.error('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối.')
      } else {
        toast.error('Có lỗi xảy ra')
      }
    },
  })

  return (
    <button onClick={() => mutation.mutate(data)}>
      Submit
    </button>
  )
}
```

### Global Error Handler

The API client already includes global error handling in the response interceptor. You can customize it further:

```typescript
// src/lib/api-client.ts (line 73-115)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Add custom global error handling here
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/sign-in'
    }
    
    return Promise.reject(error)
  }
)
```

## 🧪 Testing with Mock API

For development and testing, you can use the mock API:

```typescript
// src/features/academic-years/data/api.test.ts
import { describe, it, expect } from 'vitest'
import { academicYearsApi } from './api'

describe('Academic Years API', () => {
  it('should list academic years', async () => {
    const result = await academicYearsApi.list({ page: 1, pageSize: 10 })
    
    expect(result.data).toBeDefined()
    expect(result.total).toBeGreaterThan(0)
    expect(result.page).toBe(1)
  })

  it('should create academic year', async () => {
    const input = {
      code: '2025-2026',
      name: 'Năm học 2025-2026',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-06-30'),
    }

    const result = await academicYearsApi.create(input)
    
    expect(result.data.code).toBe(input.code)
    expect(result.data.name).toBe(input.name)
  })
})
```

## 📚 Backend API Requirements

Your backend should implement these endpoints following the design documents:

### Academic Years
- `GET /api/v1/academic-years` - List with pagination
- `GET /api/v1/academic-years/:id` - Get by ID
- `POST /api/v1/academic-years` - Create
- `PUT /api/v1/academic-years/:id` - Update
- `PATCH /api/v1/academic-years/:id/status` - Update status
- `DELETE /api/v1/academic-years/:id` - Soft delete
- `GET /api/v1/academic-years/check-code` - Check uniqueness

### Syllabi
- `GET /api/v1/syllabi` - List with pagination
- `GET /api/v1/syllabi/:id` - Get by ID
- `POST /api/v1/syllabi` - Create
- `PUT /api/v1/syllabi/:id` - Update
- `DELETE /api/v1/syllabi/:id` - Soft delete
- `POST /api/v1/syllabi/:id/submit` - Submit for review
- `POST /api/v1/syllabi/:id/version` - Create new version
- `GET /api/v1/syllabi/:id/versions` - Get version history
- `GET /api/v1/syllabi/:id/export` - Export to PDF

### Review Schedules
- `GET /api/v1/review-schedules` - List with pagination
- `GET /api/v1/review-schedules/:id` - Get by ID
- `POST /api/v1/review-schedules` - Create
- `PUT /api/v1/review-schedules/:id` - Update
- `DELETE /api/v1/review-schedules/:id` - Soft delete
- `POST /api/v1/review-schedules/:id/assign` - Assign reviewer
- `GET /api/v1/review-schedules/:id/progress` - Get progress
- `POST /api/v1/review-schedules/:id/remind` - Send reminders
- `GET /api/v1/review-schedules/:id/export` - Export report

## 🔐 Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use HTTPS in production** - Set `VITE_API_BASE_URL=https://...`
3. **Implement token refresh** - Add refresh token logic if needed
4. **Validate on backend** - Don't rely only on frontend validation
5. **Use CORS properly** - Configure backend to allow your frontend domain
6. **Rate limiting** - Implement on backend to prevent abuse

## 🚀 Next Steps

1. **Set up backend API** - Implement endpoints according to specs
2. **Configure CORS** - Allow requests from your frontend domain
3. **Test endpoints** - Use Postman or similar tool
4. **Update `.env`** - Set correct `VITE_API_BASE_URL`
5. **Switch to real API** - Replace mock implementations
6. **Test integration** - Verify frontend-backend communication

## 📞 Troubleshooting

### CORS Errors
```
Access to XMLHttpRequest at 'http://localhost:3000/api/v1/...' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solution**: Configure CORS on your backend:
```javascript
// Express.js example
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))
```

### 401 Unauthorized
```
Request failed with status code 401
```

**Solution**: Check token is being sent correctly:
1. Verify token exists in localStorage
2. Check Authorization header in Network tab
3. Verify token format: `Bearer <token>`
4. Check token hasn't expired

### Network Error
```
Network Error
```

**Solution**:
1. Verify backend is running
2. Check `VITE_API_BASE_URL` is correct
3. Verify no firewall blocking requests
4. Check backend logs for errors

---

**Last Updated**: January 30, 2026
