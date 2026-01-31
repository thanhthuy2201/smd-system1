import { FirebaseError } from 'firebase/app'

/**
 * Custom error class for authentication errors
 * Extends the base Error class to include Firebase error codes
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * Handles Firebase authentication errors and converts them to user-friendly messages
 * @param error - The error to handle (typically a FirebaseError)
 * @returns AuthError with user-friendly message
 *
 * Requirements: 2.8, 10.1
 */
export function handleAuthError(error: unknown): AuthError {
  if (error instanceof FirebaseError) {
    const message = getErrorMessage(error.code)
    return new AuthError(message, error.code)
  }

  if (error instanceof Error) {
    return new AuthError(error.message)
  }

  return new AuthError('An unexpected error occurred. Please try again.')
}

/**
 * Maps Firebase error codes to user-friendly error messages
 * @param code - Firebase error code
 * @returns User-friendly error message
 *
 * Requirements: 10.1
 */
function getErrorMessage(code: string): string {
  const errorMessages: Record<string, string> = {
    // Sign in errors
    'auth/invalid-email': 'Invalid email address format.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'Invalid email or password.',
    'auth/wrong-password': 'Invalid email or password.',
    'auth/invalid-credential': 'Invalid email or password.',

    // Sign up errors
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/weak-password': 'Password must be at least 8 characters long.',
    'auth/operation-not-allowed': 'Email/password accounts are not enabled.',

    // Password reset errors
    'auth/missing-email': 'Please enter your email address.',
    'auth/invalid-action-code':
      'This password reset link is invalid or has expired.',
    'auth/expired-action-code': 'This password reset link has expired.',

    // Network errors
    'auth/network-request-failed':
      'Network error. Please check your connection and try again.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',

    // Token errors
    'auth/id-token-expired': 'Your session has expired. Please sign in again.',
    'auth/id-token-revoked':
      'Your session has been revoked. Please sign in again.',

    // Email verification errors
    'auth/invalid-verification-code': 'Invalid verification code.',
    'auth/invalid-verification-id': 'Invalid verification ID.',

    // Social auth errors
    'auth/account-exists-with-different-credential':
      'An account already exists with this email using a different sign-in method.',
    'auth/popup-blocked':
      'Sign-in popup was blocked. Please allow popups for this site.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed before completing.',
    'auth/cancelled-popup-request':
      'Only one popup request is allowed at a time.',
  }

  return (
    errorMessages[code] || 'An unexpected error occurred. Please try again.'
  )
}
