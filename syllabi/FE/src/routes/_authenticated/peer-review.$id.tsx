import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, FileText } from 'lucide-react';
import { EvaluationForm } from '@/features/lecturer/reviews/components/EvaluationForm';
import { SyllabusViewer } from '@/features/lecturer/reviews/components/SyllabusViewer';
import { usePeerEvaluation } from '@/features/lecturer/hooks/usePeerEvaluation';
import type { EvaluationTemplate, Syllabus } from '@/features/lecturer/types';
import type { PeerEvaluationFormData } from '@/features/lecturer/schemas/review.schema';

export const Route = createFileRoute('/_authenticated/peer-review/$id')({
  component: PeerReviewPage,
});

// Mock data for demonstration
const mockTemplate: EvaluationTemplate = {
  id: 1,
  name: 'Standard Syllabus Evaluation',
  criteria: [
    {
      id: 1,
      name: 'Learning Outcomes Quality',
      description: 'CLOs are clear, measurable, and aligned with program outcomes',
      weight: 25,
      maxScore: 5,
    },
    {
      id: 2,
      name: 'Content Organization',
      description: 'Course content is well-structured and covers appropriate topics',
      weight: 20,
      maxScore: 5,
    },
    {
      id: 3,
      name: 'Assessment Alignment',
      description: 'Assessment methods effectively measure stated learning outcomes',
      weight: 25,
      maxScore: 5,
    },
    {
      id: 4,
      name: 'Resource Adequacy',
      description: 'References and materials are current, relevant, and sufficient',
      weight: 15,
      maxScore: 5,
    },
    {
      id: 5,
      name: 'Overall Completeness',
      description: 'Syllabus is complete with all required sections and information',
      weight: 15,
      maxScore: 5,
    },
  ],
};

const mockSyllabus: Syllabus = {
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
  status: 'Pending Review',
  version: '1.0',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-20T14:30:00Z',
  lecturerId: 1,
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
      description: 'Overview of programming concepts and development environment setup',
      lectureHours: 2,
      labHours: 1,
      relatedClos: ['CLO1'],
      teachingMethods: ['Lecture', 'Demonstration'],
    },
    {
      id: 2,
      weekNumber: 2,
      title: 'Variables and Data Types',
      description: 'Understanding variables, data types, and basic operations',
      lectureHours: 2,
      labHours: 1,
      relatedClos: ['CLO1', 'CLO2'],
      teachingMethods: ['Lecture', 'Lab Exercise'],
    },
  ],
  assessments: [
    {
      id: 1,
      type: 'Quiz',
      name: 'Weekly Quizzes',
      weight: 20,
      relatedClos: ['CLO1', 'CLO2'],
      description: 'Short quizzes to assess understanding of weekly topics',
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
    },
    {
      id: 4,
      type: 'Final',
      name: 'Final Exam',
      weight: 30,
      relatedClos: ['CLO1', 'CLO2', 'CLO3'],
    },
  ],
  references: [
    {
      id: 1,
      type: 'Required',
      title: 'Introduction to Programming with Python',
      authors: 'John Smith',
      publisher: 'Tech Press',
      year: 2023,
      isbn: '9781234567890',
    },
    {
      id: 2,
      type: 'Recommended',
      title: 'Python Programming Guide',
      authors: 'Jane Doe',
      publisher: 'Code Publishers',
      year: 2022,
    },
    {
      id: 3,
      type: 'Online Resource',
      title: 'Python Official Documentation',
      authors: 'Python Software Foundation',
      url: 'https://docs.python.org',
    },
  ],
};

function PeerReviewPage() {
  const { id } = Route.useParams();
  const [showSyllabus, setShowSyllabus] = useState(true);

  // Use the peer evaluation hook for managing evaluation state
  const {
    existingEvaluation,
    isLoadingEvaluation,
    saveDraft,
    isSavingDraft,
    submitEvaluation,
    isSubmitting,
    isAlreadySubmitted,
  } = usePeerEvaluation({
    syllabusId: parseInt(id),
  });

  const handleSaveDraft = (data: PeerEvaluationFormData) => {
    saveDraft(data);
  };

  const handleSubmit = (data: PeerEvaluationFormData) => {
    submitEvaluation(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <h1 className="text-3xl font-bold tracking-tight">Peer Review Evaluation</h1>
          </div>
          <p className="text-muted-foreground">
            Review and evaluate syllabus #{id} - {mockSyllabus.courseCode}
          </p>
        </div>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Queue
        </Button>
      </div>

      <Separator />

      {/* Already Submitted Alert */}
      {isAlreadySubmitted && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="text-yellow-800 dark:text-yellow-200">
              Evaluation Already Submitted
            </CardTitle>
            <CardDescription className="text-yellow-700 dark:text-yellow-300">
              This evaluation has already been submitted and cannot be modified.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Loading State */}
      {isLoadingEvaluation && (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading evaluation...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Toggle View */}
      {!isLoadingEvaluation && (
        <Card>
          <CardHeader>
            <CardTitle>Review Sections</CardTitle>
            <CardDescription>Toggle between syllabus view and evaluation form</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={showSyllabus ? 'default' : 'outline'}
                onClick={() => setShowSyllabus(true)}
              >
                View Syllabus
              </Button>
              <Button
                variant={!showSyllabus ? 'default' : 'outline'}
                onClick={() => setShowSyllabus(false)}
              >
                Evaluation Form
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {!isLoadingEvaluation && (showSyllabus ? (
        <SyllabusViewer
          syllabus={mockSyllabus}
          onBack={() => window.history.back()}
          onPrint={() => window.print()}
          onExport={() => alert('Export functionality would be implemented here')}
        />
      ) : (
        <EvaluationForm
          syllabusId={parseInt(id)}
          template={mockTemplate}
          initialData={
            existingEvaluation
              ? {
                  syllabusId: existingEvaluation.syllabusId,
                  criteriaScores: existingEvaluation.criteriaScores,
                  recommendation: existingEvaluation.recommendation,
                  summaryComments: existingEvaluation.summaryComments,
                }
              : undefined
          }
          onSaveDraft={!isAlreadySubmitted ? handleSaveDraft : undefined}
          onSubmit={handleSubmit}
          isSaving={isSavingDraft}
          isSubmitting={isSubmitting}
          isReadOnly={isAlreadySubmitted}
        />
      ))}
    </div>
  );
}
