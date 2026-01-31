/**
 * Review Schedule Management Data Layer
 *
 * This module exports all data-related functionality including:
 * - API client functions
 * - TypeScript types and interfaces
 * - Zod validation schemas
 *
 * @example
 * ```tsx
 * import {
 *   type ReviewSchedule,
 *   type ReviewScheduleFormInput,
 *   reviewScheduleFormSchema,
 * } from '@/features/review-schedules/data';
 * ```
 */

// Export all API functions
export * as api from './api'

// Export all types and schemas
export * from './schema'
