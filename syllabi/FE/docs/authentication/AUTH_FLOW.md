# Authentication Flow with Backend Role Integration

## Overview

The application uses Firebase Authentication for user authentication and integrates with a backend API to fetch user roles and additional profile information.

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        APP STARTUP                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                   Check Firebase auth state
                              │
              ┌───────────────┴───────────────┐
              │                               │
           No token                        Has token
              │                               │
              ▼                               ▼
         Show Login                  Get Firebase ID Token
              │                               │
              │                               ▼
              │                    POST /api/auth/verify
              │                    (with Bearer token)
              │                               │
              │               ┌───────────────┴───────────────┐
              │               │                               │
              │          valid=false                     valid=true
              │               │                               │
              │               ▼                               ▼
              └────────> Show Login              Store user data in Zustand
                                                  (including role & profile)
                                                              │
                                                              ▼
                                                      Show App with
                                                      role-based UI
```

## Implementation Details

### 1. Firebase Authentication (useAuthListener hook)

Located in: `src/hooks/use-auth-listener.ts`

- Listens to Firebase `onAuthStateChanged` events
- When user signs in:
  1. Gets Firebase ID token
  2. Calls `/api/auth/verify` endpoint with the token
  3. Stores user data (including role) in Zustand store
  4. Updates authentication state

### 2. Backend Verification Endpoint

**Endpoint**: `POST /api/auth/verify`

**Headers**:
```
Authorization: Bearer <firebase_id_token>
```

**Response**:
```json
{
  "valid": true,
  "firebase_uid": "uKfgyyphGzfKJwQl4p0HDyKFdE53",
  "email": "user@example.com",
  "user_registered": true,
  "is_new_user": false,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "Admin",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "department": null,
    "departmentId": null,
    "facultyPosition": null,
    "isActive": true
  }
}
```

### 3. Auth Store (Zustand)

Located in: `src/stores/auth-store.ts`

**State Structure**:
```typescript
interface AuthUser {
  uid: string                    // Firebase UID
  email: string | null
  emailVerified: boolean
  displayName: string | null
  role?: UserRole                // Role from backend
  backendUser?: BackendUser      // Full backend user data
}
```

**Available Roles**:
- `ACADEMIC_MANAGER`
- `HEAD_OF_DEPARTMENT`
- `ACADEMIC_AFFAIRS`
- `LECTURER`
- `ADMIN`
- `Admin` (backend format)

### 4. API Client Integration

Located in: `src/lib/api-client.ts`

- Automatically adds Firebase token to all API requests
- Reads token from cookie (`firebase_auth_token`)
- Adds `Authorization: Bearer <token>` header to requests

### 5. Role-Based Access Control

#### Sidebar Navigation

Located in: `src/components/layout/nav-group.tsx`

- Filters menu items based on user role
- Hides items if user doesn't have required role
- Example:
```typescript
{
  title: 'Lịch phê duyệt',
  url: '/review-schedules',
  icon: CalendarCheck,
  roles: ['ACADEMIC_MANAGER', 'Admin'],
}
```

#### Route Guards

Located in: `src/lib/route-guards.ts`

**Functions**:
- `requireAuth()` - Requires user to be authenticated
- `requireRole(roles)` - Requires specific role(s)
- `requireAuthAndRole(roles)` - Combined auth + role check

**Usage in Routes**:
```typescript
export const Route = createFileRoute('/_authenticated/review-schedules/')({
  beforeLoad: () => {
    requireAuthAndRole(['ACADEMIC_MANAGER', 'Admin'])
  },
  component: ReviewSchedules,
})
```

## Token Management

### Storage
- Token is stored in cookie: `firebase_auth_token`
- Cookie is set by auth store when user signs in
- Cookie is cleared when user signs out

### Refresh
- Firebase automatically refreshes tokens
- `onAuthStateChanged` listener detects token refresh
- New token is automatically stored in cookie

### Expiration
- If token expires, API returns 401
- API client automatically redirects to login
- User must sign in again

## Security Considerations

1. **Token Validation**: All API requests validate the Firebase token on the backend
2. **Role Verification**: Backend verifies user role before returning data
3. **Cookie Security**: Tokens are stored in HTTP-only cookies (recommended for production)
4. **HTTPS Only**: Always use HTTPS in production to protect tokens in transit
5. **Token Expiration**: Firebase tokens expire after 1 hour and are automatically refreshed

## Development vs Production

### Development
- API Base URL: `http://localhost:3000` (default)
- Console logging enabled for debugging
- Token visible in browser DevTools

### Production
- API Base URL: Set via `VITE_API_BASE_URL` environment variable
- Console logging disabled
- Use HTTP-only cookies for token storage
- Enable HTTPS

## Troubleshooting

### User role not showing
1. Check if `/api/auth/verify` is returning user data
2. Verify token is being sent in Authorization header
3. Check browser console for errors
4. Ensure backend is running and accessible

### Sidebar items not showing
1. Verify user role matches the required roles in sidebar data
2. Check if role format matches (e.g., 'Admin' vs 'ADMIN')
3. Ensure auth store has user data loaded

### Route access denied
1. Check route guard configuration
2. Verify user has required role
3. Check if auth is still loading (wait for initialization)
4. Ensure token is valid and not expired
