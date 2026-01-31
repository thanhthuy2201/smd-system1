/**
 * SyllabusEditor Component
 *
 * Component for editing existing syllabi with status-based access control.
 * Reuses wizard step components and displays revision feedback when applicable.
 *
 * Features:
 * - Status-based access control (editable only in Draft or Revision Required status)
 * - Reuses wizard step components for consistent editing experience
 * - Displays revision feedback panel for Revision Required status
 * - Shows change tracking indicators
 * - Auto-save functionality
 * - Version history access
 *
 * Requirements: 3.1-3.8
 */
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  Save,
  AlertCircle,
  Lock,
  MessageSquare,
  History,
  FileEdit,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getComments } from '@/features/lecturer/api/feedback.api'
import { getSyllabus } from '@/features/lecturer/api/syllabus.api'
import { AutoSaveIndicator } from '@/features/lecturer/components/AutoSaveIndicator'
import { CommentThread } from '@/features/lecturer/components/CommentThread'
import { useSyllabusForm } from '@/features/lecturer/hooks/useSyllabusForm'
import { useTranslation } from '@/features/lecturer/hooks/useTranslation'
import type {
  Syllabus,
  SyllabusStatus,
} from '@/features/lecturer/types'
import { AssessmentMethodsStep } from './SyllabusWizard/AssessmentMethodsStep'
import { CLOPLOMappingStep } from './SyllabusWizard/CLOPLOMappingStep'
import { CourseContentStep } from './SyllabusWizard/CourseContentStep'
import { CourseInformationStep } from './SyllabusWizard/CourseInformationStep'
import { LearningOutcomesStep } from './SyllabusWizard/LearningOutcomesStep'
import { PreviewStep } from './SyllabusWizard/PreviewStep'
import { ReferencesStep } from './SyllabusWizard/ReferencesStep'
import { VersionHistory } from './VersionHistory'

export interface SyllabusEditorProps {
  syllabusId: number
  onComplete?: (syllabus: Syllabus) => void
  onCancel?: () => void
}

// Define which statuses allow editing
const EDITABLE_STATUSES: SyllabusStatus[] = ['Draft', 'Revision Required']

// Define which statuses show revision feedback
const REVISION_STATUSES: SyllabusStatus[] = ['Revision Required']

export function SyllabusEditor({
  syllabusId,
  onComplete,
  onCancel,
}: SyllabusEditorProps) {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState(1)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [showAccessDeniedDialog, setShowAccessDeniedDialog] = useState(false)

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

  // Fetch syllabus data
  const {
    data: syllabus,
    isLoading: isSyllabusLoading,
    error: syllabusError,
  } = useQuery({
    queryKey: ['lecturer', 'syllabi', syllabusId],
    queryFn: () => getSyllabus(syllabusId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch comments/feedback for revision required status
  const { data: comments, isLoading: isCommentsLoading } = useQuery({
    queryKey: ['lecturer', 'syllabi', syllabusId, 'comments'],
    queryFn: () => getComments(syllabusId),
    enabled: syllabus?.status === 'Revision Required',
    staleTime: 1 * 60 * 1000, // 1 minute
  })

  // Check if syllabus is editable based on status
  const isEditable = syllabus
    ? EDITABLE_STATUSES.includes(syllabus.status)
    : false
  const showRevisionFeedback = syllabus
    ? REVISION_STATUSES.includes(syllabus.status)
    : false

  // Show access denied dialog if trying to edit non-editable syllabus
  useEffect(() => {
    if (syllabus && !isEditable) {
      setShowAccessDeniedDialog(true)
    }
  }, [syllabus, isEditable])

  // Initialize form with syllabus data
  const { form, isAutoSaving, lastSaved, submit, isSubmitting, submitError } =
    useSyllabusForm({
      syllabusId,
      initialData: syllabus,
      onSuccess: (updatedSyllabus) => {
        onComplete?.(updatedSyllabus)
      },
      onError: (error) => {
        console.error('[SyllabusEditor] Submit error:', error)
      },
    })

  // Calculate progress percentage
  const progressPercentage = (currentStep / STEPS.length) * 100

  // Get status badge variant
  const getStatusVariant = (
    status: SyllabusStatus
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'Draft':
        return 'secondary'
      case 'Pending Review':
        return 'default'
      case 'Revision Required':
        return 'destructive'
      case 'Approved':
        return 'default'
      case 'Archived':
        return 'outline'
      default:
        return 'default'
    }
  }

  // Get current step component
  const getCurrentStepComponent = () => {
    if (!isEditable) {
      return (
        <Alert variant='destructive'>
          <Lock className='h-4 w-4' />
          <AlertTitle>{t('editor.accessDenied.title')}</AlertTitle>
          <AlertDescription>
            {t('editor.accessDenied.description', { status: syllabus?.status || 'Unknown' })}
          </AlertDescription>
        </Alert>
      )
    }

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

  // Validate current step before moving forward
  const validateCurrentStep = async (): Promise<boolean> => {
    const fieldsToValidate = getFieldsForStep(currentStep)
    const result = await form.trigger(fieldsToValidate as any)
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
    if (!isEditable) return
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

  // Handle save as draft
  const handleSaveDraft = () => {
    if (!isEditable) return
    form.handleSubmit((data) => {
      console.log('[SyllabusEditor] Saving draft:', data)
    })()
  }

  // Handle final submission
  const handleSubmit = () => {
    if (!isEditable) return
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

  // Handle access denied dialog
  const handleAccessDenied = () => {
    setShowAccessDeniedDialog(false)
    onCancel?.()
  }

  // Determine auto-save status
  const getAutoSaveStatus = (): 'idle' | 'saving' | 'saved' | 'error' => {
    if (isAutoSaving) return 'saving'
    if (submitError) return 'error'
    if (lastSaved) return 'saved'
    return 'idle'
  }

  // Loading state
  if (isSyllabusLoading) {
    return (
      <div className='container mx-auto py-6'>
        <Card>
          <CardContent className='py-10'>
            <div className='flex items-center justify-center'>
              <div className='space-y-2 text-center'>
                <div className='mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary' />
                <p className='text-sm text-muted-foreground'>
                  {t('common.loading')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (syllabusError || !syllabus) {
    return (
      <div className='container mx-auto py-6'>
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>{t('editor.loadError')}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className='container mx-auto space-y-6 py-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='space-y-1'>
          <div className='flex items-center gap-3'>
            <h1 className='text-3xl font-bold tracking-tight'>
              {t('editor.title')}
            </h1>
            <Badge variant={getStatusVariant(syllabus.status)}>
              {syllabus.status}
            </Badge>
            {form.formState.isDirty && (
              <Badge variant='outline' className='gap-1'>
                <FileEdit className='h-3 w-3' />
                {t('editor.unsavedChanges')}
              </Badge>
            )}
          </div>
          <p className='text-muted-foreground'>
            {syllabus.courseCode} - {syllabus.courseName}
          </p>
          <p className='text-sm text-muted-foreground'>
            {t('editor.version')}: {syllabus.version} |{' '}
            {t('editor.lastUpdated')}:{' '}
            {new Date(syllabus.updatedAt).toLocaleString()}
          </p>
        </div>
        <AutoSaveIndicator
          status={getAutoSaveStatus()}
          lastSaved={lastSaved}
          onRetry={handleSaveDraft}
        />
      </div>

      {/* Revision Required Alert */}
      {showRevisionFeedback && (
        <Alert>
          <MessageSquare className='h-4 w-4' />
          <AlertTitle>{t('editor.revisionRequired.title')}</AlertTitle>
          <AlertDescription>
            {t('editor.revisionRequired.description')}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content with Tabs for Revision Feedback */}
      {showRevisionFeedback ? (
        <Tabs defaultValue='editor' className='space-y-6'>
          <TabsList>
            <TabsTrigger value='editor' className='gap-2'>
              <FileEdit className='h-4 w-4' />
              {t('editor.tabs.editor')}
            </TabsTrigger>
            <TabsTrigger value='feedback' className='gap-2'>
              <MessageSquare className='h-4 w-4' />
              {t('editor.tabs.feedback')}
              {comments && comments.filter((c) => !c.isResolved).length > 0 && (
                <Badge variant='destructive' className='ml-1 h-5 px-1.5'>
                  {comments.filter((c) => !c.isResolved).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value='history' className='gap-2'>
              <History className='h-4 w-4' />
              {t('editor.tabs.history')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value='editor' className='space-y-6'>
            {renderEditorContent()}
          </TabsContent>

          <TabsContent value='feedback'>
            <Card>
              <CardHeader>
                <CardTitle>{t('editor.feedback.title')}</CardTitle>
                <CardDescription>
                  {t('editor.feedback.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isCommentsLoading ? (
                  <div className='flex items-center justify-center py-8'>
                    <div className='h-6 w-6 animate-spin rounded-full border-b-2 border-primary' />
                  </div>
                ) : comments && comments.length > 0 ? (
                  <CommentThread 
                    comments={comments} 
                    currentUserId={syllabus.lecturerId || 0}
                  />
                ) : (
                  <p className='py-8 text-center text-sm text-muted-foreground'>
                    {t('editor.feedback.noComments')}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='history'>
            <Card>
              <CardHeader>
                <CardTitle>{t('editor.history.title')}</CardTitle>
                <CardDescription>
                  {t('editor.history.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VersionHistory
                  syllabusId={syllabusId}
                  currentVersion={syllabus.version}
                  onRevert={async (versionId) => {
                    // TODO: Implement revert functionality
                    console.log(
                      '[SyllabusEditor] Reverting to version:',
                      versionId
                    )
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        renderEditorContent()
      )}

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
            <AlertDialogCancel onClick={() => setShowUnsavedDialog(false)}>
              {t('common.stay')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowUnsavedDialog(false)
                onCancel?.()
              }}
            >
              {t('common.leave')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Access Denied Dialog */}
      <AlertDialog
        open={showAccessDeniedDialog}
        onOpenChange={setShowAccessDeniedDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('editor.accessDenied.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('editor.accessDenied.dialogDescription', {
                status: syllabus.status,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleAccessDenied}>
              {t('common.ok')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )

  // Render editor content (extracted for reuse)
  function renderEditorContent() {
    return (
      <>
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
              disabled={isSubmitting || !isEditable}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant='outline'
              onClick={handleSaveDraft}
              disabled={isAutoSaving || isSubmitting || !isEditable}
            >
              <Save className='mr-2 h-4 w-4' />
              {t('common.saveDraft')}
            </Button>
          </div>

          <div className='flex gap-2'>
            <Button
              variant='outline'
              onClick={handlePrevious}
              disabled={currentStep === 1 || isSubmitting || !isEditable}
            >
              <ChevronLeft className='mr-2 h-4 w-4' />
              {t('common.previous')}
            </Button>

            {currentStep < STEPS.length ? (
              <Button
                onClick={handleNext}
                disabled={isSubmitting || !isEditable}
              >
                {t('common.next')}
                <ChevronRight className='ml-2 h-4 w-4' />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !isEditable}
              >
                {isSubmitting
                  ? t('common.submitting')
                  : t('editor.saveChanges')}
              </Button>
            )}
          </div>
        </div>
      </>
    )
  }
}
