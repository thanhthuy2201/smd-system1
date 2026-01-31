/**
 * RequestStatusTracker Component Examples
 */

import { RequestStatusTracker } from './RequestStatusTracker'
import type { ReviewStageInfo } from './RequestStatusTracker'

// Example 1: Pending Request
export function PendingExample() {
  const stages: ReviewStageInfo[] = [
    { stage: 'Submitted', status: 'completed', completedAt: '2026-01-15T10:30:00Z' },
    { stage: 'Under Review', status: 'current', reviewerName: 'Dr. Sarah Johnson', reviewerRole: 'Academic Manager' },
    { stage: 'Decision Made', status: 'pending' },
  ]

  return <RequestStatusTracker status='Pending' stages={stages} />
}

// Example 2: Approved Request
export function ApprovedExample() {
  const stages: ReviewStageInfo[] = [
    { stage: 'Submitted', status: 'completed', completedAt: '2026-01-15T10:30:00Z' },
    { stage: 'Under Review', status: 'completed', completedAt: '2026-01-18T14:20:00Z', reviewerName: 'Dr. Sarah Johnson', reviewerRole: 'Academic Manager' },
    { stage: 'Decision Made', status: 'completed', completedAt: '2026-01-18T14:20:00Z' },
  ]

  return (
    <RequestStatusTracker
      status='Approved'
      stages={stages}
      reviewComments='The proposed changes are well-justified and approved for implementation.'
      reviewedBy='Dr. Sarah Johnson'
      reviewedAt='2026-01-18T14:20:00Z'
    />
  )
}

// Example 3: Rejected Request
export function RejectedExample() {
  const stages: ReviewStageInfo[] = [
    { stage: 'Submitted', status: 'completed', completedAt: '2026-01-15T10:30:00Z' },
    { stage: 'Under Review', status: 'completed', completedAt: '2026-01-17T09:15:00Z', reviewerName: 'Dr. Michael Chen', reviewerRole: 'Academic Manager' },
    { stage: 'Decision Made', status: 'completed', completedAt: '2026-01-17T09:15:00Z' },
  ]

  return (
    <RequestStatusTracker
      status='Rejected'
      stages={stages}
      reviewComments='Please address the following concerns and resubmit.'
      reviewedBy='Dr. Michael Chen'
      reviewedAt='2026-01-17T09:15:00Z'
    />
  )
}

// Example 4: Draft Request
export function DraftExample() {
  const stages: ReviewStageInfo[] = [
    { stage: 'Submitted', status: 'pending' },
    { stage: 'Under Review', status: 'pending' },
    { stage: 'Decision Made', status: 'pending' },
  ]

  return <RequestStatusTracker status='Draft' stages={stages} />
}
