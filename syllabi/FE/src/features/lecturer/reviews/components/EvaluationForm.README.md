# EvaluationForm Component

## Overview

The `EvaluationForm` component provides a comprehensive interface for peer reviewers to evaluate syllabi using standardized criteria. It implements all requirements from task 10.3 of the lecturer module implementation.

## Features

### 1. Evaluation Criteria Display
- Displays all criteria from the evaluation template
- Shows criterion name, description, and weight percentage
- Organized in a clear, scannable layout

### 2. 1-5 Rating Scale
- Dropdown selector for each criterion
- Score options with descriptive labels:
  - 1 - Không đạt yêu cầu (Does not meet requirements)
  - 2 - Dưới mức mong đợi (Below expectations)
  - 3 - Đạt mức mong đợi (Meets expectations)
  - 4 - Vượt mức mong đợi (Exceeds expectations)
  - 5 - Xuất sắc (Excellent)

### 3. Conditional Comment Fields
- Automatically shows alert when score ≤ 2
- Comment field becomes required for low scores
- Character counter (0-500 characters)
- Visual indicator for required comments

### 4. Overall Weighted Score Calculation
- Real-time calculation based on criterion weights
- Displays prominently in a dedicated card
- Formula: `Σ(score × weight) / Σ(weight)`
- Shows score out of 5.00

### 5. Recommendation Selector
- Three options:
  - Approve (Phê duyệt)
  - Needs Revision (Cần sửa đổi)
  - Reject (Từ chối)
- Required field with validation

### 6. Summary Comments
- Large textarea for overall feedback
- Minimum 50 characters required
- Maximum 2000 characters
- Character counter with minimum indicator

### 7. Form Actions
- **Save Draft**: Optional button for saving work in progress
- **Submit Evaluation**: Primary action to submit the evaluation
- Loading states for both actions
- Disabled states during submission

## Props

```typescript
interface EvaluationFormProps {
  syllabusId: number;                              // ID of syllabus being evaluated
  template: EvaluationTemplate;                    // Evaluation criteria template
  initialData?: Partial<PeerEvaluationFormData>;  // Pre-fill form with existing data
  onSaveDraft?: (data: PeerEvaluationFormData) => void;  // Optional draft save handler
  onSubmit: (data: PeerEvaluationFormData) => void;      // Required submit handler
  isSaving?: boolean;                              // Loading state for draft save
  isSubmitting?: boolean;                          // Loading state for submission
}
```

## Usage Example

```tsx
import { EvaluationForm } from '@/features/lecturer/reviews/components/EvaluationForm';

function PeerReviewPage() {
  const template: EvaluationTemplate = {
    id: 1,
    name: 'Standard Evaluation',
    criteria: [
      {
        id: 1,
        name: 'Learning Outcomes Quality',
        description: 'CLOs are clear and measurable',
        weight: 25,
        maxScore: 5,
      },
      // ... more criteria
    ],
  };

  const handleSaveDraft = (data: PeerEvaluationFormData) => {
    // Save draft to API
    saveDraftMutation.mutate(data);
  };

  const handleSubmit = (data: PeerEvaluationFormData) => {
    // Submit evaluation to API
    submitMutation.mutate(data);
  };

  return (
    <EvaluationForm
      syllabusId={123}
      template={template}
      onSaveDraft={handleSaveDraft}
      onSubmit={handleSubmit}
      isSaving={saveDraftMutation.isPending}
      isSubmitting={submitMutation.isPending}
    />
  );
}
```

## Validation

The component uses Zod schema validation (`peerEvaluationSchema`) which enforces:

1. **Score Validation**:
   - Each criterion must have a score between 1-5
   - Scores ≤ 2 require a comment

2. **Recommendation Validation**:
   - Must select one of: Approve, Needs Revision, or Reject

3. **Summary Comments Validation**:
   - Minimum 50 characters
   - Maximum 2000 characters

## Accessibility

- Full keyboard navigation support
- ARIA labels for all form fields
- Screen reader friendly error messages
- Focus management for form validation
- Proper form semantics

## Internationalization

All text is internationalized using the `vi` translation object from `@/features/lecturer/i18n/vi.ts`. The component supports Vietnamese language by default.

## Requirements Validation

This component validates the following requirements from the spec:

- **Requirement 6.3**: Display evaluation criteria from template ✓
- **Requirement 6.4**: Implement 1-5 rating scale for each criterion ✓
- **Requirement 6.5**: Add conditional comment fields for low scores (≤2) ✓
- **Requirement 6.6**: Calculate overall weighted score ✓
- **Requirement 6.7**: Add recommendation selector (Approve, Needs Revision, Reject) ✓
- **Requirement 6.8**: Add summary comments textarea (min 50 chars) ✓

## Related Components

- **SyllabusViewer**: Display syllabus content in read-only mode
- **PeerReviewQueue**: List of assigned syllabi for review
- **RubricGuide**: Scoring guidelines reference panel (integrated at top of form)

## Demo

A demo page is available at `/peer-review/:id` which showcases the EvaluationForm with mock data.
