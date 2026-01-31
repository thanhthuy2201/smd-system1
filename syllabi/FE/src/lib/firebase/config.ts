import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  type Auth,
} from 'firebase/auth'

interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

// Firebase configuration from environment variables
const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Initialize Firebase
export const app: FirebaseApp = initializeApp(firebaseConfig)
export const auth: Auth = getAuth(app)

// Configure session persistence to use local storage (Requirement 1.5)
// This allows users to stay signed in across browser sessions
setPersistence(auth, browserLocalPersistence).catch((_error) => {
  // Silently fail - persistence will fall back to default behavior
})
