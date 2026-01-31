import { redirect } from '@tanstack/react-router'
import { useAuthStore, type UserRole } from '@/stores/auth-store'

/**
 * Route guard that requires authentication to access a route
 * Redirects unauthenticated users to the sign-in page with the original URL stored
 * Waits for Firebase auth to initialize before checking authentication status
 *
 * Usage: Add to route's beforeLoad hook
 * ```typescript
 * export const Route = createFileRoute('/dashboard')({
 *   beforeLoad: () => {
 *     requireAuth()
 *   },
 *   component: Dashboard,
 * })
 * ```
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */
export function requireAuth() {
  const { isAuthenticated, isLoading } = useAuthStore.getState().auth

  // Don't redirect while auth is still loading (Firebase initializing)
  if (isLoading) {
    return
  }

  if (!isAuthenticated()) {
    // Store the current path to redirect back after authentication
    const currentPath = window.location.pathname + window.location.search

    throw redirect({
      to: '/sign-in',
      search: {
        redirect: currentPath,
      },
    })
  }
}

/**
 * Route guard that redirects authenticated users away from auth pages
 * Prevents authenticated users from accessing sign-in, sign-up, etc.
 *
 * Usage: Add to auth route's beforeLoad hook
 * ```typescript
 * export const Route = createFileRoute('/sign-in')({
 *   beforeLoad: () => {
 *     redirectIfAuthenticated()
 *   },
 *   component: SignIn,
 * })
 * ```
 *
 * Requirements: 9.6
 */
export function redirectIfAuthenticated() {
  const { isAuthenticated } = useAuthStore.getState().auth

  if (isAuthenticated()) {
    throw redirect({
      to: '/',
    })
  }
}

/**
 * Gets the redirect URL from the current location search params
 * Used after successful authentication to redirect back to the originally requested page
 *
 * @param search - The search params object from TanStack Router
 * @returns The redirect URL or '/' as default
 *
 * Requirements: 9.2, 9.3
 */
export function getRedirectUrl(search: Record<string, unknown>): string {
  const redirectUrl = search.redirect

  // Validate that redirect is a string and starts with '/' to prevent open redirects
  if (typeof redirectUrl === 'string' && redirectUrl.startsWith('/')) {
    return redirectUrl
  }

  return '/'
}

/**
 * Route guard that requires specific role(s) to access a route
 * Redirects users without required role to 403 forbidden page
 *
 * Usage: Add to route's beforeLoad hook
 * ```typescript
 * export const Route = createFileRoute('/_authenticated/admin')({
 *   beforeLoad: () => {
 *     requireRole(['ADMIN', 'ACADEMIC_MANAGER'])
 *   },
 *   component: AdminPanel,
 * })
 * ```
 *
 * @param allowedRoles - Array of roles that are allowed to access the route
 */
export function requireRole(allowedRoles: UserRole[]) {
  const { user, isLoading } = useAuthStore.getState().auth

  // Don't check role while auth is still loading
  if (isLoading) {
    return
  }

  // Check if user has one of the allowed roles
  if (!user?.role || !allowedRoles.includes(user.role)) {
    throw redirect({
      to: '/403',
    })
  }
}

/**
 * Combined route guard that requires both authentication and specific role(s)
 * This is a convenience function that combines requireAuth and requireRole
 *
 * Usage: Add to route's beforeLoad hook
 * ```typescript
 * export const Route = createFileRoute('/_authenticated/review-schedules')({
 *   beforeLoad: () => {
 *     requireAuthAndRole(['ACADEMIC_MANAGER'])
 *   },
 *   component: ReviewSchedules,
 * })
 * ```
 *
 * @param allowedRoles - Array of roles that are allowed to access the route
 */
export function requireAuthAndRole(allowedRoles: UserRole[]) {
  // First check authentication
  requireAuth()

  // Then check role
  requireRole(allowedRoles)
}
