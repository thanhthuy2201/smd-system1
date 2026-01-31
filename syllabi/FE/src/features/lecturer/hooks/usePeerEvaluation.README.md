# usePeerEvaluation Hook

## Overview

The `usePeerEvaluation` hook provides comprehensive functionality for managing peer evaluation operations in the lecturer module. It handles creating, updating, and submitting peer evaluations with support for both draft and final submission modes.

## Features

- **Draft Management**: Save evaluation progress as drafts
- **Final Submission**: Submit completed evaluations with validation
- **Existing Evaluation Loading**: Automatically loads existing evaluations for a syllabus
- **Cache Management**: Integrates with TanStack Query for optimal caching
- **Error Handling**: Comprehensive error handling with user-friendly toast notifications
- **Queue Updates**: Automatically invalidates peer review queue after submission
- **Navigation**: Auto-navigates back to queue after successful submission

## Usage

```typescript
import { usePeerEvaluation } from '@/features/lecturer/hooks/usePeerEvaluation'

function PeerReviewPage() {
  const syllabusId = 123

  const {
    existingEvaluation,
    isLoadingEvaluation,
    saveDraft,
    isSavingDraft,
    submitEvaluation,
    isSubmitting,
    isAlreadySubmitted,
  } = usePeerEvaluation({
    syllabusId,
    onSuccess: () => {
      console.log('Operation completed successfully')
    },
  })

  const handleSaveDraft = (data: PeerEvaluationFormData) => {
    saveDraft(data)
  }

  const handleSubmit = (data: PeerEvaluationFormData) => {
    submitEvaluation(data)
  }

  return (
    <EvaluationForm
      syllabusId={syllabusId}
      onSaveDraft={!isAlreadySubmitted ? handleSaveDraft : undefined}
      onSubmit={handleSubmit}
      isSaving={isSavingDraft}
      isSubmitting={isSubmitting}
      isReadOnly={isAlreadySubmitted}
      initialData={existingEvaluation}
    />
  )
}
```

## API

### Parameters

```typescript
interface UsePeerEvaluationOptions {
  syllabusId: number // Required: The syllabus being evaluated
  onSuccess?: () => void // Optional: Callback after successful operations
}
```

### Return Values

```typescript
{
  // Existing evaluation data
  existingEvaluation: PeerEvaluation | null | undefined
  isLoadingEvaluation: boolean
  loadError: Error | null

  // Draft operations
  saveDraft: (data: PeerEvaluationFormData) => void
  isSavingDraft: boolean
  saveDraftError: Error | null

  // Submit operations
  submitEvaluation: (data: PeerEvaluationFormData) => void
  isSubmitting: boolean
  submitError: Error | null

  // Helper flags
  isAlreadySubmitted: boolean
}
```

## Behavior

### Draft Saving

When `saveDraft` is called:

1. Calculates overall weighted score from criteria scores
2. Creates evaluation data with status 'Draft'
3. If existing draft exists, updates it; otherwise creates new evaluation
4. Updates TanStack Query cache with new data
5. Shows success toast notification
6. Calls `onSuccess` callback if provided

### Final Submission

When `submitEvaluation` is called:

1. Validates that evaluation hasn't already been submitted
2. Calculates overall weighted score
3. Creates or updates evaluation with status 'Submitted'
4. Calls `submitPeerEvaluation` API to finalize
5. Invalidates peer review queue cache (triggers refresh)
6. Updates evaluation cache
7. Shows success toast notification
8. Navigates back to peer review queue after 1.5 seconds
9. Calls `onSuccess` callback if provided

### Error Handling

All operations include comprehensive error handling:

- Network errors are caught and displayed via toast notifications
- Validation errors from the server are shown to the user
- Prevents duplicate submissions of already-submitted evaluations
- Provides specific error messages for different failure scenarios

## Integration with TanStack Query

The hook uses the following query keys:

- `['lecturer', 'peer-evaluations', 'syllabus', syllabusId]` - For existing evaluation
- `['lecturer', 'peer-reviews']` - For peer review queue (invalidated on submit)

## Requirements Validation

This implementation satisfies the following requirements from the spec:

- **Requirement 6.9**: Support for draft and final submission
- **Property 16**: Evaluation completeness validation (enforced by schema)
- **Property 15**: Low score comment requirement (enforced by schema)
- **Property 14**: Evaluation score calculation

## Related Components

- `EvaluationForm` - The form component that uses this hook
- `peerEvaluationSchema` - Zod schema for validation
- Review API functions in `src/features/lecturer/api/review.api.ts`

## Notes

- The hook automatically handles the difference between creating new evaluations and updating existing drafts
- Once an evaluation is submitted, it cannot be modified (enforced by `isAlreadySubmitted` flag)
- The overall score calculation uses weighted averages based on criterion weights
- Navigation after submission includes a 1.5-second delay to allow users to see the success message
