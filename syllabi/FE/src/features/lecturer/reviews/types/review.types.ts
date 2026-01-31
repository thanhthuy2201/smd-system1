export interface ReviewSchedule {
  id: number
  departmentId: number
  startDate: string
  endDate: string
  reviewType: string
}

export interface PeerEvaluation {
  id?: number
  syllabusId: number
  reviewerId: number
  criteriaScores: CriterionScore[]
  overallScore: number
  recommendation: 'Approve' | 'Needs Revision' | 'Reject'
  summaryComments: string
  status: 'Draft' | 'Submitted'
}

export interface CriterionScore {
  criterionId: number
  criterionName: string
  score: number
  comment?: string
}

export interface ApprovalTimeline {
  id: number
  syllabusId: number
  stage: string
  status: string
  reviewerName?: string
  timestamp: string
  comments?: string
}

export interface SubmissionStatus {
  syllabusId: number
  courseCode: string
  courseName: string
  status: string
  currentStage: string
  submittedDate: string
  lastUpdated: string
  reviewers: {
    hodName?: string
    academicManagerName?: string
  }
}
