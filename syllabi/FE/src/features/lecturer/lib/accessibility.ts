/**
 * Accessibility Utilities
 *
 * Provides utilities for keyboard navigation, focus management,
 * and accessibility features following WCAG 2.1 AA standards.
 *
 * Requirements: 11.3, 11.8, 11.9
 */

import React from 'react'

/**
 * Keyboard key constants for consistent key handling
 */
export const Keys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const

/**
 * Check if a keyboard event is an activation key (Enter or Space)
 */
export function isActivationKey(event: React.KeyboardEvent): boolean {
  return event.key === Keys.ENTER || event.key === Keys.SPACE
}

/**
 * Check if a keyboard event is an arrow key
 */
export function isArrowKey(event: React.KeyboardEvent): boolean {
  return [
    Keys.ARROW_UP,
    Keys.ARROW_DOWN,
    Keys.ARROW_LEFT,
    Keys.ARROW_RIGHT,
  ].includes(event.key as any)
}

/**
 * Handle keyboard navigation for a list of items
 * Returns the new focused index
 */
export function handleListNavigation(
  event: React.KeyboardEvent,
  currentIndex: number,
  itemCount: number,
  options: {
    loop?: boolean
    horizontal?: boolean
  } = {}
): number {
  const { loop = true, horizontal = false } = options

  const upKey = horizontal ? Keys.ARROW_LEFT : Keys.ARROW_UP
  const downKey = horizontal ? Keys.ARROW_RIGHT : Keys.ARROW_DOWN

  if (event.key === upKey) {
    event.preventDefault()
    if (currentIndex > 0) {
      return currentIndex - 1
    }
    return loop ? itemCount - 1 : currentIndex
  }

  if (event.key === downKey) {
    event.preventDefault()
    if (currentIndex < itemCount - 1) {
      return currentIndex + 1
    }
    return loop ? 0 : currentIndex
  }

  if (event.key === Keys.HOME) {
    event.preventDefault()
    return 0
  }

  if (event.key === Keys.END) {
    event.preventDefault()
    return itemCount - 1
  }

  return currentIndex
}

/**
 * Trap focus within a container (useful for modals)
 */
export function trapFocus(
  container: HTMLElement,
  event: KeyboardEvent
): void {
  if (event.key !== Keys.TAB) return

  const focusableElements = getFocusableElements(container)
  if (focusableElements.length === 0) return

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]
  const activeElement = document.activeElement

  // Shift + Tab on first element -> focus last element
  if (event.shiftKey && activeElement === firstElement) {
    event.preventDefault()
    lastElement.focus()
    return
  }

  // Tab on last element -> focus first element
  if (!event.shiftKey && activeElement === lastElement) {
    event.preventDefault()
    firstElement.focus()
    return
  }
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(
  container: HTMLElement
): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')

  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (element) => {
      // Filter out hidden elements
      return (
        element.offsetWidth > 0 &&
        element.offsetHeight > 0 &&
        window.getComputedStyle(element).visibility !== 'hidden'
      )
    }
  )
}

/**
 * Focus the first focusable element in a container
 */
export function focusFirstElement(container: HTMLElement): void {
  const focusableElements = getFocusableElements(container)
  if (focusableElements.length > 0) {
    focusableElements[0].focus()
  }
}

/**
 * Restore focus to a previously focused element
 */
export function restoreFocus(element: HTMLElement | null): void {
  if (element && document.body.contains(element)) {
    element.focus()
  }
}

/**
 * Create a focus trap hook for React components
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  isActive: boolean
) {
  React.useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const previouslyFocused = document.activeElement as HTMLElement

    // Focus first element when trap activates
    focusFirstElement(container)

    // Handle Tab key to trap focus
    const handleKeyDown = (event: KeyboardEvent) => {
      trapFocus(container, event)
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      // Restore focus when trap deactivates
      restoreFocus(previouslyFocused)
    }
  }, [containerRef, isActive])
}

/**
 * Handle Escape key to close modals/dialogs
 */
export function useEscapeKey(
  callback: () => void,
  isActive: boolean = true
): void {
  React.useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === Keys.ESCAPE) {
        event.preventDefault()
        callback()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [callback, isActive])
}

/**
 * Announce message to screen readers using aria-live region
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Generate a unique ID for accessibility attributes
 */
let idCounter = 0
export function generateId(prefix: string = 'a11y'): string {
  idCounter += 1
  return `${prefix}-${idCounter}-${Date.now()}`
}

/**
 * Keyboard shortcut handler
 */
export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  callback: () => void
  description: string
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  isActive: boolean = true
): void {
  React.useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatches = shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey
        const shiftMatches = shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey
        const altMatches = shortcut.altKey === undefined || event.altKey === shortcut.altKey
        const metaMatches = shortcut.metaKey === undefined || event.metaKey === shortcut.metaKey

        if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
          event.preventDefault()
          shortcut.callback()
          break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcuts, isActive])
}

/**
 * Skip to main content link (for keyboard navigation)
 * Note: This component is exported from a separate .tsx file
 * See: src/features/lecturer/components/SkipToMainContent.tsx
 */
