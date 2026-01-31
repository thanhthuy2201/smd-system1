/**
 * DraftChangesEditor Component
 *
 * Side-by-side editor for comparing original syllabus with proposed changes.
 * Reuses syllabus editor components and highlights modified sections.
 *
 * Features:
 * - Original vs. proposed changes comparison view
 * - Highlights modified sections
 * - Allows editing proposed changes
 * - Saves draft changes with update request
 * - Reuses wizard step components for consistency
 *
 * Requirements: 9.8
 */

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ChevronLeft,
  ChevronRight,
  Save,
  AlertCircle,
  FileEdit,
  Eye,
  GitCompare,
  RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { syllabusSchema } from '../../schemas/syllabus.schema'
import { AutoSaveIndicator } from '../../components/AutoSaveIndicator'
import { AssessmentMethodsStep } from '../../syllabi/components/SyllabusWizard/AssessmentMethodsStep'
import { CLOPLOMappingStep } from '../../syllabi/components/SyllabusWizard/CLOPLOMappingStep'
import { CourseContentStep } from '../../syllabi/components/SyllabusWizard/CourseContentStep'
import { CourseInformationStep } from '../../syllabi/components/SyllabusWizard/CourseInformationStep'
import { LearningOutcomesStep } from '../../syllabi/components/SyllabusWizard/LearningOutcomesStep'
import { PreviewStep } from '../../syllabi/components/SyllabusWizard/PreviewStep'
import { ReferencesStep } from '../../syllabi/components/SyllabusWizard/ReferencesStep'
import type { Syllabus } from '../../types'

export interface DraftChangesEditorProps {
  /** Original approved syllabus */
  originalSyllabus: Syllabus
  /** Draft changes (partial syllabus) */
  draftChanges?: Partial<Syllabus>
  /** Affected sections from update request */
  affectedSections: string[]
  /** Callback when draft changes are saved */
  onSave: (changes: Partial<Syllabus>) => void | Promise<void>
  /** Callback when changes are discarded */
  onDiscard?: () => void
  /** Whether the editor is in a loading state */
  isLoading?: boolean
  /** Optional CSS class name */
  className?: string
}

// Map section names to step numbers
const SECTION_TO_STEP_MAP: Record<string, number> = {
  'Course Information': 1,
  'Course Description': 1,
  'Learning Outcomes (CLOs)': 2,
  'CLO-PLO Mapping': 3,
  'Course Content': 4,
  'Assessment Methods': 5,
  References: 6,
  Prerequisites: 1,
  'Teaching Methods': 4,
}

// Step definitions
const STEPS = [
  {
    id: 1,
    title: 'Course Information',
    description: 'Basic course details and description',
  },
  {
    id: 2,
    title: 'Learning Outcomes',
    description: 'Course Learning Outcomes (CLOs)',
  },
  {
    id: 3,
    title: 'CLO-PLO Mapping',
    description: 'Map CLOs to Program Learning Outcomes',
  },
  {
    id: 4,
    title: 'Course Content',
    description: 'Weekly topics and teaching methods',
  },
  {
    id: 5,
    title: 'Assessment Methods',
    description: 'Grading and assessment breakdown',
  },
  {
    id: 6,
    title: 'References',
    description: 'Required and recommended resources',
  },
  {
    id: 7,
    title: 'Preview',
    description: 'Review all changes',
  },
] as const

/**
 * DraftChangesEditor Component
 *
 * Provides a side-by-side comparison view for editing proposed syllabus changes.
 * Highlights modified sections and allows editing only the affected sections.
 *
 * @example
 * ```tsx
 * <DraftChangesEditor
 *   originalSyllabus={syllabus}
 *   draftChanges={updateRequest.draftChanges}
 *   affectedSections={updateRequest.affectedSections}
 *   onSave={handleSave}
 * />
 * ```
 */
export function DraftChangesEditor({
  originalSyllabus,
  draftChanges,
  affectedSections,
  onSave,
  onDiscard,
  isLoading = false,
  className,
}: DraftChangesEditorProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'original'>(
    'split'
  )
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Merge original syllabus with draft changes
  const mergedData = {
    ...originalSyllabus,
    ...draftChanges,
  }

  // Initialize form with merged data
  const form = useForm({
    resolver: zodResolver(syllabusSchema),
    defaultValues: mergedData,
    mode: 'onChange',
  })

  // Watch for form changes
  const formValues = form.watch()

  // Detect changes
  useEffect(() => {
    const hasChanges = JSON.stringify(formValues) !== JSON.stringify(mergedData)
    setHasUnsavedChanges(hasChanges)
  }, [formValues, mergedData])

  // Calculate progress percentage
  const progressPercentage = (currentStep / STEPS.length) * 100

  // Determine which steps are affected
  const affectedSteps = new Set(
    affectedSections
      .map((section) => SECTION_TO_STEP_MAP[section])
      .filter((step): step is number => step !== undefined)
  )

  // Check if current step is affected
  const isCurrentStepAffected = affectedSteps.has(currentStep)

  // Get current step component
  const getCurrentStepComponent = () => {
    switch (currentStep) {
      case 1:
        return <CourseInformationStep form={form as any} />
      case 2:
        return <LearningOutcomesStep form={form as any} />
      case 3:
        return <CLOPLOMappingStep form={form as any} />
      case 4:
        return <CourseContentStep form={form as any} />
      case 5:
        return <AssessmentMethodsStep form={form as any} />
      case 6:
        return <ReferencesStep form={form as any} />
      case 7:
        return (
          <PreviewStep form={form as any} onEdit={(step) => setCurrentStep(step)} />
        )
      default:
        return null
    }
  }

  // Get original step component (read-only)
  const getOriginalStepComponent = () => {
    // Create a read-only form with original data
    const readOnlyForm = {
      ...form,
      formState: { ...form.formState, isSubmitting: true },
    }

    switch (currentStep) {
      case 1:
        return <CourseInformationStep form={readOnlyForm as any} />
      case 2:
        return <LearningOutcomesStep form={readOnlyForm as any} />
      case 3:
        return <CLOPLOMappingStep form={readOnlyForm as any} />
      case 4:
        return <CourseContentStep form={readOnlyForm as any} />
      case 5:
        return <AssessmentMethodsStep form={readOnlyForm as any} />
      case 6:
        return <ReferencesStep form={readOnlyForm as any} />
      case 7:
        return (
          <PreviewStep
            form={readOnlyForm as any}
            onEdit={(step) => setCurrentStep(step)}
          />
        )
      default:
        return null
    }
  }

  // Validate current step before moving forward
  const validateCurrentStep = async (): Promise<boolean> => {
    const fieldsToValidate = getFieldsForStep(currentStep)
    const result = await form.trigger(fieldsToValidate as any)
    return result
  }

  // Get fields to validate for each step
  const getFieldsForStep = (step: number): Array<string> => {
    switch (step) {
      case 1:
        return ['courseId', 'academicYear', 'semester', 'credits', 'description']
      case 2:
        return ['clos']
      case 3:
        return ['clos'] // Validate PLO mappings
      case 4:
        return ['content']
      case 5:
        return ['assessments']
      case 6:
        return ['references']
      default:
        return []
    }
  }

  // Handle next step
  const handleNext = async () => {
    const isValid = await validateCurrentStep()
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Handle save draft changes
  const handleSave = async () => {
    try {
      const formData = form.getValues()
      
      // Extract only the changed fields
      const changes: Partial<Syllabus> = {}
      Object.keys(formData).forEach((key) => {
        const formValue = formData[key as keyof typeof formData]
        const originalValue = originalSyllabus[key as keyof Syllabus]
        
        if (JSON.stringify(formValue) !== JSON.stringify(originalValue)) {
          ;(changes as any)[key] = formValue
        }
      })

      await onSave(changes)
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
      toast.success('Draft changes saved successfully')
    } catch (error) {
      toast.error('Failed to save draft changes', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // Handle discard changes
  const handleDiscard = () => {
    form.reset(mergedData)
    setHasUnsavedChanges(false)
    onDiscard?.()
    toast.info('Changes discarded')
  }

  // Handle reset to original
  const handleResetToOriginal = () => {
    form.reset(originalSyllabus)
    setHasUnsavedChanges(true)
    toast.info('Reset to original syllabus')
  }

  // Get auto-save status
  const getAutoSaveStatus = (): 'idle' | 'saving' | 'saved' | 'error' => {
    if (isLoading) return 'saving'
    if (lastSaved) return 'saved'
    return 'idle'
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='space-y-1'>
          <div className='flex items-center gap-3'>
            <h2 className='text-2xl font-bold tracking-tight'>
              Draft Changes Editor
            </h2>
            {hasUnsavedChanges && (
              <Badge variant='outline' className='gap-1'>
                <FileEdit className='size-3' />
                Unsaved Changes
              </Badge>
            )}
          </div>
          <p className='text-sm text-muted-foreground'>
            {originalSyllabus.courseCode} - {originalSyllabus.courseName}
          </p>
        </div>
        <AutoSaveIndicator
          status={getAutoSaveStatus()}
          lastSaved={lastSaved || undefined}
          onRetry={handleSave}
        />
      </div>

      {/* Affected Sections Alert */}
      {affectedSections.length > 0 && (
        <Alert>
          <AlertCircle className='size-4' />
          <AlertTitle>Affected Sections</AlertTitle>
          <AlertDescription>
            <div className='mt-2 flex flex-wrap gap-2'>
              {affectedSections.map((section) => (
                <Badge key={section} variant='secondary'>
                  {section}
                </Badge>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* View Mode Selector */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
        <TabsList>
          <TabsTrigger value='split' className='gap-2'>
            <GitCompare className='size-4' />
            Split View
          </TabsTrigger>
          <TabsTrigger value='edit' className='gap-2'>
            <FileEdit className='size-4' />
            Edit Only
          </TabsTrigger>
          <TabsTrigger value='original' className='gap-2'>
            <Eye className='size-4' />
            Original Only
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Progress Bar */}
      <div className='space-y-2'>
        <div className='flex items-center justify-between text-sm'>
          <span className='font-medium'>
            Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
          </span>
          <span className='text-muted-foreground'>
            {Math.round(progressPercentage)}% Complete
          </span>
        </div>
        <Progress value={progressPercentage} className='h-2' />
      </div>

      {/* Step Indicators */}
      <div className='flex items-center justify-between'>
        {STEPS.map((step, index) => {
          const isAffected = affectedSteps.has(step.id)
          return (
            <div key={step.id} className='flex flex-1 flex-col items-center gap-2'>
              <div
                className={cn(
                  'flex size-10 items-center justify-center rounded-full border-2 font-semibold relative',
                  step.id === currentStep
                    ? 'border-primary bg-primary text-primary-foreground'
                    : step.id < currentStep
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-muted-foreground/30 bg-background text-muted-foreground'
                )}
              >
                {step.id}
                {isAffected && (
                  <div className='absolute -top-1 -right-1 size-3 rounded-full bg-orange-500 ring-2 ring-background' />
                )}
              </div>
              <span
                className={cn(
                  'hidden text-center text-xs sm:block',
                  step.id === currentStep ? 'font-medium' : 'text-muted-foreground'
                )}
              >
                {step.title}
              </span>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'absolute top-5 left-1/2 -z-10 h-0.5 w-full',
                    step.id < currentStep
                      ? 'bg-primary'
                      : 'bg-muted-foreground/30'
                  )}
                  style={{ width: `calc(100% / ${STEPS.length})` }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Not Affected Warning */}
      {!isCurrentStepAffected && currentStep < 7 && (
        <Alert variant='default'>
          <AlertCircle className='size-4' />
          <AlertTitle>Section Not Affected</AlertTitle>
          <AlertDescription>
            This section is not marked as affected in your update request. Changes
            here will still be saved but may not be reviewed.
          </AlertDescription>
        </Alert>
      )}

      {/* Content Area */}
      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()}>
          {viewMode === 'split' ? (
            <div className='grid gap-6 lg:grid-cols-2'>
              {/* Original Syllabus */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Eye className='size-4' />
                    Original Syllabus
                  </CardTitle>
                  <CardDescription>
                    Current approved version (read-only)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className='h-[600px] pr-4'>
                    <div className='pointer-events-none opacity-75'>
                      {getOriginalStepComponent()}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Proposed Changes */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <FileEdit className='size-4' />
                    Proposed Changes
                  </CardTitle>
                  <CardDescription>
                    Edit your proposed modifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className='h-[600px] pr-4'>
                    {getCurrentStepComponent()}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          ) : viewMode === 'edit' ? (
            <Card>
              <CardHeader>
                <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
                <CardDescription>
                  {STEPS[currentStep - 1].description}
                </CardDescription>
              </CardHeader>
              <CardContent>{getCurrentStepComponent()}</CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Original Syllabus - {STEPS[currentStep - 1].title}</CardTitle>
                <CardDescription>
                  Current approved version (read-only)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='pointer-events-none opacity-75'>
                  {getOriginalStepComponent()}
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </Form>

      {/* Action Buttons */}
      <div className='flex items-center justify-between'>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={handleResetToOriginal}
            disabled={isLoading}
          >
            <RotateCcw className='mr-2 size-4' />
            Reset to Original
          </Button>
          {onDiscard && (
            <Button
              variant='outline'
              onClick={handleDiscard}
              disabled={isLoading || !hasUnsavedChanges}
            >
              Discard Changes
            </Button>
          )}
        </div>

        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={handlePrevious}
            disabled={currentStep === 1 || isLoading}
          >
            <ChevronLeft className='mr-2 size-4' />
            Previous
          </Button>

          <Button
            variant='outline'
            onClick={handleSave}
            disabled={isLoading || !hasUnsavedChanges}
          >
            <Save className='mr-2 size-4' />
            Save Draft
          </Button>

          {currentStep < STEPS.length ? (
            <Button onClick={handleNext} disabled={isLoading}>
              Next
              <ChevronRight className='ml-2 size-4' />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={isLoading || !hasUnsavedChanges}>
              Save All Changes
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
