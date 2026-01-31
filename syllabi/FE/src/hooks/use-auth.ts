import { useAuthStore } from '@/stores/auth-store'
import { authService } from '@/lib/firebase/auth-service'

/**
 * Custom hook that provides convenient access to authentication state and operations
 *
 * This hook:
 * - Exposes the current user from the auth store
 * - Exposes the isAuthenticated state
 * - Provides bound methods from the auth service for authentication operations
 *
 * Usage:
 * ```tsx
 * const { user, isAuthenticated, signIn, signOut } = useAuth()
 *
 * // Check if user is authenticated
 * if (isAuthenticated) {
 *   console.log('User:', user)
 * }
 *
 * // Sign in
 * await signIn('user@example.com', 'password')
 *
 * // Sign out
 * await signOut()
 * ```
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
export function useAuth() {
  const { user, isAuthenticated } = useAuthStore((state) => state.auth)

  return {
    // Authentication state
    user,
    isAuthenticated: isAuthenticated(),

    // Authentication operations
    signIn: authService.signIn.bind(authService),
    signUp: authService.signUp.bind(authService),
    signOut: authService.signOut.bind(authService),
    sendPasswordReset: authService.sendPasswordReset.bind(authService),
    resendVerificationEmail:
      authService.resendVerificationEmail.bind(authService),
    signInWithGoogle: authService.signInWithGoogle.bind(authService),
  }
}
