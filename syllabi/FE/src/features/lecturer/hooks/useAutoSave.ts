/**
 * useAutoSave Hook
 *
 * Generic hook for implementing auto-save functionality with debouncing.
 * Watches data changes and automatically triggers save after a specified interval.
 *
 * Features:
 * - Debounced data watching
 * - Dirty state detection
 * - Configurable save interval
 * - Enable/disable control
 * - Prevents unnecessary saves
 */
import { useEffect, useRef, useCallback } from 'react'

export interface UseAutoSaveOptions<T> {
  /** Data to watch for changes */
  data: T
  /** Callback function to save data */
  onSave: (data: T) => void
  /** Debounce interval in milliseconds (default: 30000 = 30 seconds) */
  interval?: number
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean
}

/**
 * Hook for automatic saving of data after a debounce interval
 *
 * @example
 * ```tsx
 * useAutoSave({
 *   data: formData,
 *   onSave: (data) => saveMutation.mutate(data),
 *   interval: 30000, // 30 seconds
 *   enabled: isDirty
 * });
 * ```
 */
export function useAutoSave<T>({
  data,
  onSave,
  interval = 30000,
  enabled = true,
}: UseAutoSaveOptions<T>): void {
  // Store previous data to detect changes
  const previousDataRef = useRef<T | undefined>(undefined)

  // Store timeout ID for cleanup
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Memoize the save callback to prevent unnecessary effect triggers
  const handleSave = useCallback(() => {
    if (enabled && previousDataRef.current !== undefined) {
      // Check if data has actually changed
      const hasChanged =
        JSON.stringify(previousDataRef.current) !== JSON.stringify(data)

      if (hasChanged) {
        onSave(data)
        previousDataRef.current = data
      }
    }
  }, [data, enabled, onSave])

  useEffect(() => {
    // Skip if auto-save is disabled
    if (!enabled) {
      return
    }

    // Initialize previous data on first run
    if (previousDataRef.current === undefined) {
      previousDataRef.current = data
      return
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      handleSave()
    }, interval)

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, enabled, interval, handleSave])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
}
