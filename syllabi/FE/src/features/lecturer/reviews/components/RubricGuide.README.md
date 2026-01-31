# RubricGuide Component

## Overview

The `RubricGuide` component provides a comprehensive reference panel for peer reviewers to understand the scoring guidelines for each evaluation criterion. It displays detailed descriptions and examples for each rating level (1-5) in an accessible side panel format.

## Features

### 1. Side Panel Display
- Opens as a Sheet (side panel) overlay
- Responsive width (full width on mobile, max 2xl on desktop)
- Scrollable content for long guidelines
- Can be triggered by custom button or default trigger

### 2. Scoring Guidelines
- Displays all 5 score levels (1-5) with:
  - Score number badge with color coding
  - Descriptive label (e.g., "Không đạt yêu cầu", "Xuất sắc")
  - Detailed description of what the score means
  - Concrete examples for each level

### 3. Collapsible Sections
- Each evaluation criterion has its own collapsible section
- Shows criterion name, description, and weight
- Expands to reveal detailed scoring guidelines
- Visual indicators (chevron icons) for expand/collapse state

### 4. General Guidelines
- Highlighted section with general scoring instructions
- Explains when comments are required (scores ≤ 2)
- Clarifies what each score level represents
- Provides context for consistent evaluation

### 5. Score Level Reference
- Quick reference table at the bottom
- Shows all score levels with brief descriptions
- Color-coded badges for easy identification

### 6. Accessibility
- Full keyboard navigation support
- Proper ARIA labels and semantics
- Focus management for collapsible sections
- Screen reader friendly

## Props

```typescript
interface RubricGuideProps {
  template: EvaluationTemplate;           // Evaluation criteria template
  trigger?: React.ReactNode;              // Optional custom trigger button
  open?: boolean;                         // Controlled open state
  onOpenChange?: (open: boolean) => void; // Controlled state change handler
}
```

## Usage Examples

### Basic Usage (Uncontrolled)

```tsx
import { RubricGuide } from '@/features/lecturer/reviews/components/RubricGuide';

function EvaluationPage() {
  const template: EvaluationTemplate = {
    id: 1,
    name: 'Standard Evaluation',
    criteria: [
      {
        id: 1,
        name: 'Learning Outcomes Quality',
        description: 'CLOs are clear, measurable, and aligned with program outcomes',
        weight: 25,
        maxScore: 5,
      },
      // ... more criteria
    ],
  };

  return (
    <div>
      <RubricGuide template={template} />
    </div>
  );
}
```

### Controlled Usage

```tsx
import { useState } from 'react';
import { RubricGuide } from '@/features/lecturer/reviews/components/RubricGuide';

function EvaluationPage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <RubricGuide
        template={template}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </div>
  );
}
```

### Custom Trigger

```tsx
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { RubricGuide } from '@/features/lecturer/reviews/components/RubricGuide';

function EvaluationPage() {
  return (
    <div>
      <RubricGuide
        template={template}
        trigger={
          <Button variant="ghost" size="sm">
            <HelpCircle className="mr-2 h-4 w-4" />
            Need Help?
          </Button>
        }
      />
    </div>
  );
}
```

## Score Level Definitions

The component uses the following default score levels:

| Score | Label | Description |
|-------|-------|-------------|
| 1 | Không đạt yêu cầu | Criterion not met or has serious issues requiring correction |
| 2 | Dưới mức mong đợi | Criterion partially met but needs significant improvement |
| 3 | Đạt mức mong đợi | Criterion met at acceptable level, meets basic requirements |
| 4 | Vượt mức mong đợi | Criterion met well, exceeds basic requirements |
| 5 | Xuất sắc | Criterion met excellently, exemplary for other syllabi |

Each score level includes:
- **Description**: What the score means in context
- **Examples**: 3 concrete examples of what qualifies for that score

## Integration with EvaluationForm

The RubricGuide is automatically integrated into the EvaluationForm component:

```tsx
import { EvaluationForm } from '@/features/lecturer/reviews/components/EvaluationForm';

// The RubricGuide button appears at the top of the evaluation form
<EvaluationForm
  syllabusId={123}
  template={template}
  onSubmit={handleSubmit}
/>
```

## Component Structure

```
RubricGuide
├── Sheet (Side Panel)
│   ├── SheetTrigger (Button)
│   └── SheetContent
│       ├── SheetHeader (Title & Description)
│       ├── General Guidelines (Info Card)
│       ├── Criterion-specific Guidelines
│       │   └── Collapsible Sections
│       │       ├── Criterion Header
│       │       └── Score Level Cards (1-5)
│       └── Score Level Reference (Quick Table)
```

## Styling

### Color Coding
- **Score 1-2**: Destructive variant (red) - indicates issues
- **Score 3**: Secondary variant (gray) - acceptable
- **Score 4**: Default variant (blue) - good
- **Score 5**: Green accent - excellent

### Responsive Design
- Mobile: Full width sheet
- Desktop: Max width 2xl (672px)
- Scrollable content area
- Touch-friendly collapsible triggers

## Accessibility Features

1. **Keyboard Navigation**
   - Tab through collapsible sections
   - Enter/Space to expand/collapse
   - Escape to close the sheet

2. **Screen Reader Support**
   - Proper ARIA labels for all interactive elements
   - Semantic HTML structure
   - Descriptive button labels

3. **Visual Indicators**
   - Clear expand/collapse icons
   - Color-coded score badges
   - Sufficient contrast ratios

## Internationalization

All text is internationalized using the `vi` translation object from `@/features/lecturer/i18n/vi.ts`. The component supports Vietnamese language by default.

### Translation Keys Used
- `vi.peerReview.rubric.title`
- `vi.peerReview.rubric.description`
- `vi.peerReview.rubric.scores[1-5]`
- `vi.peerReview.rubric.guidelines`
- `vi.peerReview.rubric.examples`
- `vi.peerReview.rubric.scoreLevel`
- `vi.peerReview.evaluation.rubricGuide`
- `vi.peerReview.evaluation.criterion`

## Requirements Validation

This component validates the following requirement from the spec:

- **Requirement 6.10**: Display a rubric guide panel providing reference information for scoring criteria ✓
  - ✓ Display scoring guidelines for each criterion
  - ✓ Show examples of each rating level (1-5)
  - ✓ Add collapsible sections for better organization
  - ✓ Make accessible as side panel during evaluation

## Related Components

- **EvaluationForm**: Main evaluation form that includes the RubricGuide
- **PeerReviewQueue**: List of assigned syllabi for review
- **SyllabusViewer**: Display syllabus content in read-only mode

## Future Enhancements

Potential improvements for future iterations:

1. **Customizable Score Levels**: Allow passing custom score level definitions per criterion
2. **Search/Filter**: Add ability to search within guidelines
3. **Print Support**: Add print-friendly version of guidelines
4. **Bookmarks**: Allow reviewers to bookmark specific guidelines
5. **Examples from Real Syllabi**: Show actual examples from approved syllabi

## Demo

The RubricGuide is available in the peer review evaluation page at `/lecturer/reviews/peer-reviews/:id` and can be accessed by clicking the "Hướng dẫn chấm điểm" button at the top of the evaluation form.
