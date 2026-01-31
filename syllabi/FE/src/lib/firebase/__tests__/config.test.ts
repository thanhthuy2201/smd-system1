import { describe, it, expect } from 'vitest'
import { app, auth } from '../config'

describe('Firebase Configuration', () => {
  it('should initialize Firebase app with configuration from environment variables', () => {
    expect(app).toBeDefined()
    expect(app.name).toBe('[DEFAULT]')
    expect(app.options).toBeDefined()
    expect(app.options.apiKey).toBeDefined()
    expect(app.options.authDomain).toBeDefined()
    expect(app.options.projectId).toBeDefined()
    expect(typeof app.options.apiKey).toBe('string')
    expect(typeof app.options.authDomain).toBe('string')
    expect(typeof app.options.projectId).toBe('string')
  })

  it('should initialize Firebase Auth instance', () => {
    expect(auth).toBeDefined()
    expect(auth.app).toBeDefined()
    expect(auth.name).toBe('[DEFAULT]')
  })

  it('should export both app and auth instances', () => {
    expect(app).toBeDefined()
    expect(auth).toBeDefined()
  })

  it('should configure auth with correct app instance', () => {
    expect(auth.app.name).toBe(app.name)
    expect(auth.app.options.projectId).toBe(app.options.projectId)
  })

  it('should load configuration from environment variables', () => {
    // Verify that environment variables are being used
    expect(app.options.apiKey).toBe(import.meta.env.VITE_FIREBASE_API_KEY)
    expect(app.options.authDomain).toBe(
      import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
    )
    expect(app.options.projectId).toBe(import.meta.env.VITE_FIREBASE_PROJECT_ID)
    expect(app.options.storageBucket).toBe(
      import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
    )
    expect(app.options.messagingSenderId).toBe(
      import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID
    )
    expect(app.options.appId).toBe(import.meta.env.VITE_FIREBASE_APP_ID)
  })
})
