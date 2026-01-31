import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  type User,
  type UserCredential,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { auth } from './config'
import { handleAuthError } from './error-handler'

/**
 * Interface representing an authenticated user in the application
 * Simplified from Firebase User to only include necessary fields
 */
export interface AuthUser {
  uid: string
  email: string | null
  emailVerified: boolean
  displayName: string | null
}

/**
 * Result returned from authentication operations (sign-in, sign-up)
 */
export interface SignInResult {
  user: AuthUser
  token: string
}

/**
 * Authentication service that encapsulates all Firebase Authentication operations
 * Provides methods for sign-in, sign-up, sign-out, password reset, and social authentication
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8
 */
class AuthService {
  /**
   * Converts Firebase User to AuthUser interface
   * @param user - Firebase User object
   * @returns AuthUser with only necessary fields
   *
   * Requirements: 6.1
   */
  private toAuthUser(user: User): AuthUser {
    return {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      displayName: user.displayName,
    }
  }

  /**
   * Gets the ID token from a Firebase user
   * @param user - Firebase User object
   * @returns Promise resolving to the ID token (JWT)
   *
   * Requirements: 2.6
   */
  private async getToken(user: User): Promise<string> {
    return await user.getIdToken()
  }

  /**
   * Logs authentication errors to the console in development mode
   * Includes error code, message, and stack trace for debugging
   * @param method - The auth service method where the error occurred
   * @param error - The error object to log
   *
   * Requirements: 10.6
   */
  private logError(method: string, error: unknown): void {
    // Only log in development mode
    if (import.meta.env.DEV) {
      const errorInfo: Record<string, unknown> = {
        method,
        timestamp: new Date().toISOString(),
      }

      if (error instanceof Error) {
        errorInfo.message = error.message
        errorInfo.name = error.name
        errorInfo.stack = error.stack

        // Include Firebase error code if available
        if ('code' in error) {
          errorInfo.code = error.code
        }
      } else {
        errorInfo.error = error
      }

      console.error('[AuthService Error]', errorInfo)
    }
  }

  /**
   * Signs in a user with email and password
   * @param email - User's email address
   * @param password - User's password
   * @param rememberMe - Whether to persist the session across browser restarts
   * @returns Promise resolving to SignInResult with user and token
   * @throws AuthError if authentication fails
   *
   * Requirements: 2.1, 5.1
   */
  async signIn(
    email: string,
    password: string,
    rememberMe = false
  ): Promise<SignInResult> {
    try {
      // Set persistence based on Remember Me option
      const persistence = rememberMe
        ? browserLocalPersistence
        : browserSessionPersistence
      await setPersistence(auth, persistence)

      const credential: UserCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )
      const token = await this.getToken(credential.user)
      return {
        user: this.toAuthUser(credential.user),
        token,
      }
    } catch (error) {
      this.logError('signIn', error)
      throw handleAuthError(error)
    }
  }

  /**
   * Creates a new user account with email and password
   * Automatically sends email verification after account creation
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise resolving to SignInResult with user and token
   * @throws AuthError if account creation fails
   *
   * Requirements: 2.2, 2.5, 6.1, 6.2
   */
  async signUp(email: string, password: string): Promise<SignInResult> {
    try {
      const credential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )
      // Send verification email (Requirement 2.5)
      await sendEmailVerification(credential.user)
      const token = await this.getToken(credential.user)
      return {
        user: this.toAuthUser(credential.user),
        token,
      }
    } catch (error) {
      this.logError('signUp', error)
      throw handleAuthError(error)
    }
  }

  /**
   * Signs out the current user
   * @throws AuthError if sign-out fails
   *
   * Requirements: 2.3
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth)
    } catch (error) {
      this.logError('signOut', error)
      throw handleAuthError(error)
    }
  }

  /**
   * Sends a password reset email to the specified email address
   * @param email - User's email address
   * @throws AuthError if sending email fails
   *
   * Requirements: 2.4
   */
  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      this.logError('sendPasswordReset', error)
      throw handleAuthError(error)
    }
  }

  /**
   * Resends email verification to the currently signed-in user
   * @throws AuthError if no user is signed in or sending fails
   *
   * Requirements: 2.5
   */
  async resendVerificationEmail(): Promise<void> {
    try {
      const user = auth.currentUser
      if (!user) {
        throw new Error('No user is currently signed in')
      }
      await sendEmailVerification(user)
    } catch (error) {
      this.logError('resendVerificationEmail', error)
      throw handleAuthError(error)
    }
  }

  /**
   * Updates the password for the currently signed-in user
   * @param newPassword - New password
   * @throws AuthError if no user is signed in or update fails
   *
   * Requirements: 2.4
   */
  async updatePassword(newPassword: string): Promise<void> {
    try {
      const user = auth.currentUser
      if (!user) {
        throw new Error('No user is currently signed in')
      }
      await updatePassword(user, newPassword)
    } catch (error) {
      this.logError('updatePassword', error)
      throw handleAuthError(error)
    }
  }

  /**
   * Signs in a user with Google OAuth
   * @returns Promise resolving to SignInResult with user and token
   * @throws AuthError if authentication fails
   *
   * Requirements: 12.2, 12.3
   */
  async signInWithGoogle(): Promise<SignInResult> {
    try {
      const provider = new GoogleAuthProvider()
      const credential = await signInWithPopup(auth, provider)
      const token = await this.getToken(credential.user)
      return {
        user: this.toAuthUser(credential.user),
        token,
      }
    } catch (error) {
      this.logError('signInWithGoogle', error)
      throw handleAuthError(error)
    }
  }

  /**
   * Gets the currently signed-in user
   * @returns Firebase User object or null if no user is signed in
   *
   * Requirements: 2.6
   */
  getCurrentUser(): User | null {
    return auth.currentUser
  }

  /**
   * Gets the current authentication token for the signed-in user
   * @returns Promise resolving to the token or null if no user is signed in
   *
   * Requirements: 2.6, 2.7
   */
  async getCurrentToken(): Promise<string | null> {
    const user = auth.currentUser
    if (!user) return null
    return await this.getToken(user)
  }
}

// Export singleton instance
export const authService = new AuthService()
