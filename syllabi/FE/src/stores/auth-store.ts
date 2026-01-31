import { create } from 'zustand'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

const ACCESS_TOKEN = 'firebase_auth_token'

/**
 * User roles in the system
 */
export type UserRole =
  | 'ACADEMIC_MANAGER'
  | 'HEAD_OF_DEPARTMENT'
  | 'ACADEMIC_AFFAIRS'
  | 'LECTURER'
  | 'ADMIN'

/**
 * Backend user data from /api/auth/verify
 */
export interface BackendUser {
  id: number
  email: string
  role: string
  firstName: string | null
  lastName: string | null
  fullName: string | null
  department: string | null
  departmentId: number | null
  facultyPosition: string | null
  isActive: boolean
}

/**
 * Interface representing an authenticated user in the application
 * Combines Firebase user data with backend user data
 *
 * Requirements: 3.1
 */
export interface AuthUser {
  uid: string
  email: string | null
  emailVerified: boolean
  displayName: string | null
  role?: UserRole
  // Backend user data
  backendUser?: BackendUser
}

/**
 * Zustand store state interface for authentication
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */
interface AuthState {
  auth: {
    user: AuthUser | null
    setUser: (user: AuthUser | null) => void
    accessToken: string
    setAccessToken: (accessToken: string) => void
    resetAccessToken: () => void
    reset: () => void
    isAuthenticated: () => boolean
    isLoading: boolean
    setIsLoading: (loading: boolean) => void
  }
}

/**
 * Zustand store for managing authentication state
 * Handles user information, authentication tokens, and cookie persistence
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */
export const useAuthStore = create<AuthState>()((set, get) => {
  const cookieState = getCookie(ACCESS_TOKEN)
  const initToken = cookieState ? JSON.parse(cookieState) : ''

  return {
    auth: {
      user: null,
      isLoading: true, // Start as loading to wait for Firebase auth initialization

      /**
       * Updates the loading state
       * @param loading - Whether auth is currently loading
       */
      setIsLoading: (loading) =>
        set((state) => ({
          ...state,
          auth: { ...state.auth, isLoading: loading },
        })),

      /**
       * Updates the current user in the store
       * @param user - AuthUser object or null to clear
       *
       * Requirements: 3.3
       */
      setUser: (user) =>
        set((state) => ({ ...state, auth: { ...state.auth, user } })),

      accessToken: initToken,

      /**
       * Updates the authentication token and persists it to cookies
       * @param accessToken - JWT token from Firebase
       *
       * Requirements: 3.4, 3.6
       */
      setAccessToken: (accessToken) =>
        set((state) => {
          setCookie(ACCESS_TOKEN, JSON.stringify(accessToken))
          return { ...state, auth: { ...state.auth, accessToken } }
        }),

      /**
       * Clears the authentication token from store and cookies
       *
       * Requirements: 3.7
       */
      resetAccessToken: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN)
          return { ...state, auth: { ...state.auth, accessToken: '' } }
        }),

      /**
       * Resets all authentication state and removes token from cookies
       *
       * Requirements: 3.5, 3.7
       */
      reset: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN)
          return {
            ...state,
            auth: { ...state.auth, user: null, accessToken: '' },
          }
        }),

      /**
       * Checks if the user is currently authenticated
       * @returns true if user is authenticated with a valid token
       *
       * Requirements: 3.1
       */
      isAuthenticated: () => {
        const state = get()
        return state.auth.user !== null && state.auth.accessToken !== ''
      },
    },
  }
})
