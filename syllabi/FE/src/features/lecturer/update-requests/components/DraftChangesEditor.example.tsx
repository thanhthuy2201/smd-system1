/**
 * DraftChangesEditor Example Usage
 *
 * This file demonstrates how to use the DraftChangesEditor component
 * in the context of an update request workflow.
 */

import { useState } from 'react'
import { DraftChangesEditor } from './DraftChangesEditor'
import type { Syllabus } from '../../types'

// Mock original syllabus data
const mockOriginalSyllabus: Syllabus = {
  id: 1,
  courseId: 101,
  courseCode: 'CS101',
  courseName: 'Introduction to Programming',
  academicYear: '2024-2025',
  semester: 'Fall',
  credits: 3,
  totalHours: 45,
  description:
    'This course introduces fundamental programming concepts including variables, control structures, functions, and basic data structures. Students will learn problem-solving techniques and develop programming skills using a modern programming language.',
  status: 'Approved',
  version: '1.0',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-20T14:30:00Z',
  lecturerId: 1,
  lecturerName: 'Dr. John Smith',
  clos: [
    {
      id: 1,
      code: 'CLO1',
      description: 'Understand basic programming concepts and syntax',
      bloomLevel: 'Understand',
      mappedPlos: ['PLO1', 'PLO2'],
    },
    {
      id: 2,
      code: 'CLO2',
      description: 'Apply problem-solving techniques to write simple programs',
      bloomLevel: 'Apply',
      mappedPlos: ['PLO2', 'PLO3'],
    },
    {
      id: 3,
      code: 'CLO3',
      description: 'Analyze and debug code to identify and fix errors',
      bloomLevel: 'Analyze',
      mappedPlos: ['PLO3', 'PLO4'],
    },
  ],
  content: [
    {
      id: 1,
      weekNumber: 1,
      title: 'Introduction to Programming',
      description: 'Overview of programming concepts and course structure',
      lectureHours: 3,
      labHours: 0,
      relatedClos: ['CLO1'],
      teachingMethods: ['Lecture', 'Discussion'],
    },
    {
      id: 2,
      weekNumber: 2,
      title: 'Variables and Data Types',
      description: 'Understanding variables, data types, and basic operations',
      lectureHours: 2,
      labHours: 1,
      relatedClos: ['CLO1', 'CLO2'],
      teachingMethods: ['Lecture', 'Lab'],
    },
  ],
  assessments: [
    {
      id: 1,
      type: 'Quiz',
      name: 'Weekly Quizzes',
      weight: 20,
      relatedClos: ['CLO1', 'CLO2', 'CLO3'],
      description: 'Short quizzes covering weekly topics',
    },
    {
      id: 2,
      type: 'Assignment',
      name: 'Programming Assignments',
      weight: 30,
      relatedClos: ['CLO2', 'CLO3'],
      description: 'Hands-on programming exercises',
    },
    {
      id: 3,
      type: 'Midterm',
      name: 'Midterm Exam',
      weight: 20,
      relatedClos: ['CLO1', 'CLO2'],
      description: 'Comprehensive midterm examination',
    },
    {
      id: 4,
      type: 'Final',
      name: 'Final Exam',
      weight: 30,
      relatedClos: ['CLO1', 'CLO2', 'CLO3'],
      description: 'Comprehensive final examination',
    },
  ],
  references: [
    {
      id: 1,
      type: 'Required',
      title: 'Introduction to Programming with Python',
      authors: 'John Doe',
      publisher: 'Tech Press',
      year: 2023,
      isbn: '9781234567890',
    },
    {
      id: 2,
      type: 'Recommended',
      title: 'Python Programming Best Practices',
      authors: 'Jane Smith',
      publisher: 'Code Publishers',
      year: 2024,
      isbn: '9780987654321',
    },
  ],
}

// Mock draft changes (partial syllabus with proposed modifications)
const mockDraftChanges: Partial<Syllabus> = {
  description:
    'This course introduces fundamental programming concepts including variables, control structures, functions, and basic data structures. Students will learn problem-solving techniques and develop programming skills using Python. NEW: Includes hands-on projects and collaborative learning activities.',
  clos: [
    {
      id: 1,
      code: 'CLO1',
      description: 'Understand basic programming concepts and Python syntax',
      bloomLevel: 'Understand',
      mappedPlos: ['PLO1', 'PLO2'],
    },
    {
      id: 2,
      code: 'CLO2',
      description: 'Apply problem-solving techniques to write simple programs',
      bloomLevel: 'Apply',
      mappedPlos: ['PLO2', 'PLO3'],
    },
    {
      id: 3,
      code: 'CLO3',
      description: 'Analyze and debug code to identify and fix errors',
      bloomLevel: 'Analyze',
      mappedPlos: ['PLO3', 'PLO4'],
    },
    {
      id: 4,
      code: 'CLO4',
      description: 'Create small-scale software projects using best practices',
      bloomLevel: 'Create',
      mappedPlos: ['PLO4', 'PLO5'],
    },
  ],
  assessments: [
    {
      id: 1,
      type: 'Quiz',
      name: 'Weekly Quizzes',
      weight: 15,
      relatedClos: ['CLO1', 'CLO2', 'CLO3'],
      description: 'Short quizzes covering weekly topics',
    },
    {
      id: 2,
      type: 'Assignment',
      name: 'Programming Assignments',
      weight: 25,
      relatedClos: ['CLO2', 'CLO3'],
      description: 'Hands-on programming exercises',
    },
    {
      id: 3,
      type: 'Project',
      name: 'Final Project',
      weight: 20,
      relatedClos: ['CLO2', 'CLO3', 'CLO4'],
      description: 'Comprehensive programming project',
    },
    {
      id: 4,
      type: 'Midterm',
      name: 'Midterm Exam',
      weight: 15,
      relatedClos: ['CLO1', 'CLO2'],
      description: 'Comprehensive midterm examination',
    },
    {
      id: 5,
      type: 'Final',
      name: 'Final Exam',
      weight: 25,
      relatedClos: ['CLO1', 'CLO2', 'CLO3', 'CLO4'],
      description: 'Comprehensive final examination',
    },
  ],
}

/**
 * Example: Basic Usage
 */
export function DraftChangesEditorBasicExample() {
  const [draftChanges, setDraftChanges] = useState<Partial<Syllabus>>(
    mockDraftChanges
  )

  const handleSave = async (changes: Partial<Syllabus>) => {
    console.log('Saving draft changes:', changes)
    setDraftChanges(changes)
    // In a real app, this would call an API to save the changes
    // await updateUpdateRequest(requestId, { draftChanges: changes })
  }

  const handleDiscard = () => {
    console.log('Discarding changes')
    setDraftChanges(mockDraftChanges)
  }

  return (
    <div className='container mx-auto py-6'>
      <DraftChangesEditor
        originalSyllabus={mockOriginalSyllabus}
        draftChanges={draftChanges}
        affectedSections={[
          'Course Description',
          'Learning Outcomes (CLOs)',
          'Assessment Methods',
        ]}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
    </div>
  )
}

/**
 * Example: With Loading State
 */
export function DraftChangesEditorLoadingExample() {
  const [isLoading, setIsLoading] = useState(false)
  const [draftChanges, setDraftChanges] = useState<Partial<Syllabus>>(
    mockDraftChanges
  )

  const handleSave = async (changes: Partial<Syllabus>) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))
      console.log('Saving draft changes:', changes)
      setDraftChanges(changes)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='container mx-auto py-6'>
      <DraftChangesEditor
        originalSyllabus={mockOriginalSyllabus}
        draftChanges={draftChanges}
        affectedSections={['Course Description', 'Learning Outcomes (CLOs)']}
        onSave={handleSave}
        isLoading={isLoading}
      />
    </div>
  )
}

/**
 * Example: Minimal Affected Sections
 */
export function DraftChangesEditorMinimalExample() {
  const handleSave = async (changes: Partial<Syllabus>) => {
    console.log('Saving draft changes:', changes)
  }

  return (
    <div className='container mx-auto py-6'>
      <DraftChangesEditor
        originalSyllabus={mockOriginalSyllabus}
        draftChanges={{
          description: mockOriginalSyllabus.description + ' (Updated)',
        }}
        affectedSections={['Course Description']}
        onSave={handleSave}
      />
    </div>
  )
}

/**
 * Example: Integration with Update Request Form
 */
export function DraftChangesEditorIntegrationExample() {
  const [showEditor, setShowEditor] = useState(false)
  const [draftChanges, setDraftChanges] = useState<Partial<Syllabus>>({})
  const [affectedSections, setAffectedSections] = useState<string[]>([])

  const handleFormSubmit = (sections: string[]) => {
    setAffectedSections(sections)
    setShowEditor(true)
  }

  const handleSave = async (changes: Partial<Syllabus>) => {
    console.log('Saving draft changes:', changes)
    setDraftChanges(changes)
  }

  if (!showEditor) {
    return (
      <div className='container mx-auto py-6'>
        <div className='space-y-4'>
          <h2 className='text-2xl font-bold'>Select Affected Sections</h2>
          <button
            onClick={() =>
              handleFormSubmit([
                'Course Description',
                'Learning Outcomes (CLOs)',
              ])
            }
            className='rounded bg-primary px-4 py-2 text-primary-foreground'
          >
            Continue to Editor
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='container mx-auto py-6'>
      <DraftChangesEditor
        originalSyllabus={mockOriginalSyllabus}
        draftChanges={draftChanges}
        affectedSections={affectedSections}
        onSave={handleSave}
        onDiscard={() => setShowEditor(false)}
      />
    </div>
  )
}
