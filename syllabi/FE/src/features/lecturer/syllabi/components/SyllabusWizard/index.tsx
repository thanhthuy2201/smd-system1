/**
 * SyllabusWizard Component
 *
 * Multi-step wizard for creating and editing syllabi.
 * Implements step navigation, validation, auto-save, and unsaved changes warning.
 *
 * Features:
 * - 7 steps: Course Info, Learning Outcomes, CLO-PLO Mapping, Content, Assessments, References, Preview
 * - Step validation before progression
 * - Auto-save functionality
 * - Unsaved changes warning on navigation
 * - Progress indicator
 */
import { useState, useEffect, SetStateAction } from 'react'
import { useBlocker } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, Save } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { AutoSaveIndicator } from '@/features/lecturer/components/AutoSaveIndicator'
import { useSyllabusForm } from '@/features/lecturer/hooks/useSyllabusForm'
import { useTranslation } from '@/features/lecturer/hooks/useTranslation'
import type { Syllabus } from '@/features/lecturer/types'
import { AssessmentMethodsStep } from './AssessmentMethodsStep'
import { CLOPLOMappingStep } from './CLOPLOMappingStep'
import { CourseContentStep } from './CourseContentStep'
import { CourseInformationStep } from './CourseInformationStep'
import { LearningOutcomesStep } from './LearningOutcomesStep'
import { PreviewStep } from './PreviewStep'
import { ReferencesStep } from './ReferencesStep'

export interface SyllabusWizardProps {
  syllabusId?: number
  initialData?: Partial<Syllabus>
  onComplete?: (syllabus: Syllabus) => void
  onCancel?: () => void
}

// Steps will be translated dynamically using the translation hook

export function SyllabusWizard({
  syllabusId: initialSyllabusId,
  initialData,
  onComplete,
  onCancel,
}: SyllabusWizardProps) {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState(1)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [syllabusId, setSyllabusId] = useState(initialSyllabusId)

  const STEPS = [
    {
      id: 1,
      title: t('wizard.steps.courseInformation.title'),
      description: t('wizard.steps.courseInformation.description'),
    },
    {
      id: 2,
      title: t('wizard.steps.learningOutcomes.title'),
      description: t('wizard.steps.learningOutcomes.description'),
    },
    {
      id: 3,
      title: t('wizard.steps.cloPloMapping.title'),
      description: t('wizard.steps.cloPloMapping.description'),
    },
    {
      id: 4,
      title: t('wizard.steps.courseContent.title'),
      description: t('wizard.steps.courseContent.description'),
    },
    {
      id: 5,
      title: t('wizard.steps.assessmentMethods.title'),
      description: t('wizard.steps.assessmentMethods.description'),
    },
    {
      id: 6,
      title: t('wizard.steps.references.title'),
      description: t('wizard.steps.references.description'),
    },
    {
      id: 7,
      title: t('wizard.steps.preview.title'),
      description: t('wizard.steps.preview.description'),
    },
  ] as const

  // Initialize form with auto-save
  const { form, isAutoSaving, lastSaved, submit, saveDraft, isSubmitting, submitError } =
    useSyllabusForm({
      syllabusId,
      initialData,
      onSuccess: (syllabus) => {
        toast.success('Nộp đề cương thành công')
        onComplete?.(syllabus)
      },
      onError: (error) => {
        toast.error('Không thể nộp đề cương', {
          description: error.message,
        })
      },
      onSyllabusIdChange: (id) => {
        // Save the ID after first draft creation to prevent duplicates
        setSyllabusId(id)
      },
      onDraftSaved: (syllabus) => {
        toast.success('Đã lưu bản nháp', {
          description: `Lần lưu cuối: ${new Date(syllabus.updatedAt).toLocaleTimeString('vi-VN')}`,
        })
      },
      onDraftError: (error) => {
        toast.error('Không thể lưu bản nháp', {
          description: error.message,
        })
      },
    })

  // Block navigation if form is dirty
  const blocker = useBlocker({
    condition: form.formState.isDirty && !isSubmitting,
  })

  // Show unsaved changes dialog when navigation is blocked
  useEffect(() => {
    if (blocker.status === 'blocked') {
      setShowUnsavedDialog(true)
    }
  }, [blocker.status])

  // Calculate progress percentage
  const progressPercentage = (currentStep / STEPS.length) * 100

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
          <PreviewStep form={form as any} onEdit={(step: SetStateAction<number>) => setCurrentStep(step)} />
        )
      default:
        return null
    }
  }

  // Validate current step before moving forward
  const validateCurrentStep = async (): Promise<boolean> => {
    // Special validation for step 2 - check CLOs without PLO mappings
    if (currentStep === 2) {
      const clos = form.getValues('clos') || []
      console.log('[Step 2 Validation] CLOs:', clos)
      
      // Check minimum CLOs
      if (clos.length < 3) {
        console.log('[Step 2 Validation] Failed: Less than 3 CLOs')
        form.setError('clos', {
          type: 'manual',
          message: 'Minimum 3 CLOs required',
        })
        return false
      }
      
      // Validate each CLO individually (without PLO mapping requirement)
      for (let i = 0; i < clos.length; i++) {
        const clo = clos[i]
        console.log(`[Step 2 Validation] CLO ${i}:`, clo)
        
        if (!clo.description || clo.description.length < 20) {
          console.log(`[Step 2 Validation] Failed: CLO ${i} description too short`)
          form.setError(`clos.${i}.description`, {
            type: 'manual',
            message: 'CLO description must be at least 20 characters',
          })
          return false
        }
        
        if (!clo.bloomLevel) {
          console.log(`[Step 2 Validation] Failed: CLO ${i} missing bloom level`)
          form.setError(`clos.${i}.bloomLevel`, {
            type: 'manual',
            message: 'Bloom level is required',
          })
          return false
        }
      }
      
      console.log('[Step 2 Validation] Passed!')
      return true
    }
    
    // Special validation for step 3 - check PLO mappings
    if (currentStep === 3) {
      const clos = form.getValues('clos') || []
      console.log('[Step 3 Validation] CLOs:', clos)
      
      // Check that all CLOs have at least one PLO mapping
      for (let i = 0; i < clos.length; i++) {
        const mappedPlos = clos[i].mappedPlos || []
        if (mappedPlos.length === 0) {
          console.log(`[Step 3 Validation] Failed: CLO ${i} has no PLO mappings`)
          form.setError(`clos.${i}.mappedPlos`, {
            type: 'manual',
            message: 'CLO must be mapped to at least one PLO',
          })
          return false
        }
      }
      
      console.log('[Step 3 Validation] Passed!')
      return true
    }
    
    // Default validation for other steps
    const fieldsToValidate = getFieldsForStep(currentStep)
    console.log(`[Step ${currentStep} Validation] Fields to validate:`, fieldsToValidate)
    const result = await form.trigger(fieldsToValidate as any)
    console.log(`[Step ${currentStep} Validation] Result:`, result)
    return result
  }

  // Get fields to validate for each step
  const getFieldsForStep = (
    step: number
  ): Array<string> => {
    switch (step) {
      case 1:
        return [
          'courseId',
          'academicYear',
          'semester',
          'credits',
          'description',
        ]
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

  // Handle save as draft - manually trigger draft save with validation
  const handleSaveDraft = async () => {
    // Use the same validation logic as validateCurrentStep
    const isValid = await validateCurrentStep()
    
    if (!isValid) {
      // Show validation errors for current step fields only
      return
    }
    
    // This will call the appropriate API endpoint:
    // - POST /api/v1/syllabi (if no syllabusId) to create new draft
    // - PUT /api/v1/syllabi/{id}/draft (if syllabusId exists) to update draft
    saveDraft()
  }

  // Handle final submission
  const handleSubmit = () => {
    form.handleSubmit((data) => {
      submit(data)
    })()
  }

  // Handle cancel with unsaved changes check
  const handleCancel = () => {
    if (form.formState.isDirty) {
      setShowUnsavedDialog(true)
    } else {
      onCancel?.()
    }
  }

  // Determine auto-save status
  const getAutoSaveStatus = (): 'idle' | 'saving' | 'saved' | 'error' => {
    if (isAutoSaving) return 'saving'
    if (submitError) return 'error'
    if (lastSaved) return 'saved'
    return 'idle'
  }

  return (
    <div className='container mx-auto space-y-6 py-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            {syllabusId ? t('wizard.title.edit') : t('wizard.title.create')}
          </h1>
          <p className='text-muted-foreground'>
            {STEPS[currentStep - 1].description}
          </p>
        </div>
        <AutoSaveIndicator
          status={getAutoSaveStatus()}
          lastSaved={lastSaved}
          onRetry={handleSaveDraft}
        />
      </div>

      {/* Progress Bar */}
      <div className='space-y-2'>
        <div className='flex items-center justify-between text-sm'>
          <span className='font-medium'>
            {t('wizard.step')} {currentStep} {t('wizard.of')} {STEPS.length}:{' '}
            {STEPS[currentStep - 1].title}
          </span>
          <span className='text-muted-foreground'>
            {Math.round(progressPercentage)}% {t('wizard.complete')}
          </span>
        </div>
        <Progress value={progressPercentage} className='h-2' />
      </div>

      {/* Step Indicators */}
      <div className='flex items-center justify-between'>
        {STEPS.map((step, index) => (
          <div
            key={step.id}
            className='flex flex-1 flex-col items-center gap-2'
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold ${
                step.id === currentStep
                  ? 'border-primary bg-primary text-primary-foreground'
                  : step.id < currentStep
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-muted-foreground/30 bg-background text-muted-foreground'
              } `}
            >
              {step.id}
            </div>
            <span
              className={`hidden text-center text-xs sm:block ${step.id === currentStep ? 'font-medium' : 'text-muted-foreground'} `}
            >
              {step.title}
            </span>
            {index < STEPS.length - 1 && (
              <div
                className={`absolute top-5 left-1/2 -z-10 h-0.5 w-full ${step.id < currentStep ? 'bg-primary' : 'bg-muted-foreground/30'} `}
                style={{ width: `calc(100% / ${STEPS.length})` }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content - Wrapped in Form */}
      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()}>
          <Card>
            <CardHeader>
              <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
              <CardDescription>
                {STEPS[currentStep - 1].description}
              </CardDescription>
            </CardHeader>
            <CardContent>{getCurrentStepComponent()}</CardContent>
          </Card>
        </form>
      </Form>

      {/* Navigation Buttons */}
      <div className='flex items-center justify-between'>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant='outline'
            onClick={handleSaveDraft}
            disabled={isAutoSaving || isSubmitting}
          >
            <Save className='mr-2 h-4 w-4' />
            {t('common.saveDraft')}
          </Button>
        </div>

        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={handlePrevious}
            disabled={currentStep === 1 || isSubmitting}
          >
            <ChevronLeft className='mr-2 h-4 w-4' />
            {t('common.previous')}
          </Button>

          {currentStep < STEPS.length ? (
            <Button onClick={handleNext} disabled={isSubmitting}>
              {t('common.next')}
              <ChevronRight className='ml-2 h-4 w-4' />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting
                ? t('common.submitting')
                : t('wizard.submitSyllabus')}
            </Button>
          )}
        </div>
      </div>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('wizard.unsavedChanges.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('wizard.unsavedChanges.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowUnsavedDialog(false)
                if (blocker.status === 'blocked') {
                  blocker.reset?.()
                }
              }}
            >
              {t('common.stay')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowUnsavedDialog(false)
                if (blocker.status === 'blocked') {
                  blocker.proceed?.()
                } else {
                  onCancel?.()
                }
              }}
            >
              {t('common.leave')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
