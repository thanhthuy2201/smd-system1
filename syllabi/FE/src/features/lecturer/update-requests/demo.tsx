/**
 * UpdateRequestForm Demo
 *
 * Example usage of the UpdateRequestForm component
 */

import { UpdateRequestForm } from './components'
import {
  useApprovedSyllabi,
  useUpdateRequests,
} from '../hooks/useUpdateRequests'
import type { UpdateRequestFormData } from '../schemas/update-request.schema'

export function UpdateRequestFormDemo() {
  // Fetch approved syllabi
  const { data: syllabi = [], isLoading: isLoadingSyllabi } =
    useApprovedSyllabi()

  // Get update request operations
  const { create, isCreating } = useUpdateRequests()

  // Handle form submission
  const handleSubmit = async (data: UpdateRequestFormData) => {
    try {
      await create({
        syllabusId: data.syllabusId,
        changeType: data.changeType,
        affectedSections: data.affectedSections,
        justification: data.justification,
        effectiveSemester: data.effectiveSemester,
        urgency: data.urgency,
        supportingDocuments: data.supportingDocuments,
      })
      console.log('Update request created successfully')
      // Navigate to update requests list or show success message
    } catch (error) {
      console.error('Failed to create update request:', error)
    }
  }

  // Handle cancel
  const handleCancel = () => {
    console.log('Form cancelled')
    // Navigate back or close modal
  }

  if (isLoadingSyllabi) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='text-center'>
          <div className='mb-2 inline-block size-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
          <p className='text-sm text-muted-foreground'>
            Loading approved syllabi...
          </p>
        </div>
      </div>
    )
  }

  if (syllabi.length === 0) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='text-center'>
          <p className='text-lg font-semibold'>No Approved Syllabi</p>
          <p className='text-sm text-muted-foreground'>
            You don't have any approved syllabi to update.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='container mx-auto max-w-4xl py-8'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold'>Create Update Request</h1>
        <p className='text-muted-foreground'>
          Request changes to an approved syllabus
        </p>
      </div>

      <UpdateRequestForm
        approvedSyllabi={syllabi}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isCreating}
      />
    </div>
  )
}

/**
 * Example with pre-selected syllabus
 */
export function UpdateRequestFormWithPreselection() {
  const syllabusId = 123 // From route params or props

  const { data: syllabi = [] } = useApprovedSyllabi()
  const { create, isCreating } = useUpdateRequests()

  const handleSubmit = async (data: UpdateRequestFormData) => {
    await create({
      syllabusId: data.syllabusId,
      changeType: data.changeType,
      affectedSections: data.affectedSections,
      justification: data.justification,
      effectiveSemester: data.effectiveSemester,
      urgency: data.urgency,
      supportingDocuments: data.supportingDocuments,
    })
  }

  return (
    <div className='container mx-auto max-w-4xl py-8'>
      <UpdateRequestForm
        approvedSyllabi={syllabi}
        defaultSyllabusId={syllabusId}
        onSubmit={handleSubmit}
        isLoading={isCreating}
      />
    </div>
  )
}
