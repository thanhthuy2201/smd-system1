import { useEffect } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { useAuthStore, type AuthUser, type UserRole } from '@/stores/auth-store'
import { auth } from '@/lib/firebase/config'

/**
 * Custom hook that sets up Firebase authentication state listener
 * and synchronizes authentication state with the Zustand store.
 *
 * This hook:
 * - Listens for Firebase authentication state changes (sign-in, sign-out, token refresh)
 * - Updates the Zustand auth store when state changes occur
 * - Automatically refreshes authentication tokens
 * - Cleans up the listener when the component unmounts
 * - Restores session on page reload
 *
 * Requirements: 4.1, 4.2, 4.4, 4.5
 */
export function useAuthListener() {
  const { setUser, setAccessToken, reset, setIsLoading } = useAuthStore(
    (state) => state.auth
  )

  useEffect(() => {
    /**
     * Firebase auth state change handler
     * Called whenever the user's authentication state changes:
     * - User signs in
     * - User signs out
     * - Token is refreshed
     * - Page is reloaded with existing session
     *
     * Requirements: 4.2, 4.5
     */
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: User | null) => {
        if (firebaseUser) {
          // User is signed in - update store with user info and token
          const authUser: AuthUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified,
            displayName: firebaseUser.displayName,
          }

          try {
            // Get fresh authentication token (handles automatic refresh)
            // Requirements: 4.4
            const token = await firebaseUser.getIdToken()

            // Verify token with backend and get user data including role
            try {
              const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/verify`,
                {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                }
              )

              if (response.ok) {
                const data = await response.json()

                if (data.valid && data.user) {
                  // Store backend user data and role
                  authUser.backendUser = data.user
                  authUser.role = data.user.role as UserRole

                  console.log('[Auth] User verified with backend:', {
                    email: data.user.email,
                    role: data.user.role,
                    fullName: data.user.fullName,
                  })
                } else {
                  console.warn('[Auth] Backend verification failed:', data)
                }
              } else {
                console.error(
                  '[Auth] Backend verification request failed:',
                  response.status
                )
              }
            } catch (verifyError) {
              // If backend verification fails, continue with Firebase auth only
              console.error(
                '[Auth] Failed to verify with backend:',
                verifyError
              )
            }

            // Update Zustand store with user and token
            // Requirements: 4.2
            setUser(authUser)
            setAccessToken(token)

            console.log('[Auth] Session restored:', authUser.email)
          } catch (error) {
            // If token retrieval fails, reset auth state
            console.error('[Auth] Failed to get token:', error)
            reset()
          }
        } else {
          // User is signed out - clear all authentication state
          // Requirements: 4.2
          console.log('[Auth] No session found')
          reset()
        }

        // Mark auth as initialized (loading complete)
        setIsLoading(false)
      },
      (error) => {
        // Handle auth state change errors
        console.error('[Auth] Auth state change error:', error)
        reset()
        setIsLoading(false)
      }
    )

    // Cleanup: unsubscribe from auth state changes when component unmounts
    // Requirements: 4.5
    return () => unsubscribe()
  }, [setUser, setAccessToken, reset, setIsLoading])
}
