"""Schemas for Lecturer Module"""
from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime, date
from enum import Enum


# ==================== Enums ====================

class BloomLevelEnum(str, Enum):
    REMEMBER = "Remember"
    UNDERSTAND = "Understand"
    APPLY = "Apply"
    ANALYZE = "Analyze"
    EVALUATE = "Evaluate"
    CREATE = "Create"


class AssessmentTypeEnum(str, Enum):
    QUIZ = "Quiz"
    ASSIGNMENT = "Assignment"
    MIDTERM = "Midterm"
    FINAL = "Final"
    PROJECT = "Project"
    PRESENTATION = "Presentation"
    LAB_REPORT = "Lab Report"
    PARTICIPATION = "Participation"
    OTHER = "Other"


class ReferenceTypeEnum(str, Enum):
    REQUIRED = "Required"
    RECOMMENDED = "Recommended"
    ONLINE = "Online Resource"
    JOURNAL = "Journal Article"
    OTHER = "Other"


class CommentTypeEnum(str, Enum):
    SUGGESTION = "Suggestion"
    QUESTION = "Question"
    ERROR = "Error"
    GENERAL = "General"


class CommentPriorityEnum(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class PeerRecommendationEnum(str, Enum):
    APPROVE = "Approve"
    NEEDS_REVISION = "Needs Revision"
    REJECT = "Reject"


# ==================== CLO Schemas ====================

class CLOBase(BaseModel):
    code: str = Field(..., max_length=10, description="e.g., CLO1, CLO2")
    description: str = Field(..., min_length=20)
    bloom_level: BloomLevelEnum
    mapped_plos: list[str] = Field(default=[], description="List of PLO codes")


class CLOCreate(CLOBase):
    pass


class CLOUpdate(BaseModel):
    description: Optional[str] = None
    bloom_level: Optional[BloomLevelEnum] = None
    mapped_plos: Optional[list[str]] = None


class CLOResponse(CLOBase):
    clo_id: int
    syllabus_id: int
    display_order: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== Content Schemas ====================

class ContentBase(BaseModel):
    week_number: int = Field(..., ge=1, le=18)
    title: str = Field(..., max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    lecture_hours: int = Field(0, ge=0, le=10)
    lab_hours: int = Field(0, ge=0, le=10)
    teaching_methods: list[str] = Field(default=[])
    related_clos: list[str] = Field(..., min_length=1, description="CLO codes")


class ContentCreate(ContentBase):
    pass


class ContentUpdate(BaseModel):
    week_number: Optional[int] = Field(None, ge=1, le=18)
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    lecture_hours: Optional[int] = Field(None, ge=0, le=10)
    lab_hours: Optional[int] = Field(None, ge=0, le=10)
    teaching_methods: Optional[list[str]] = None
    related_clos: Optional[list[str]] = None


class ContentResponse(BaseModel):
    content_id: int
    syllabus_id: int
    week_number: int
    title: str
    description: Optional[str]
    lecture_hours: int
    lab_hours: int
    teaching_methods: list[str]
    related_clos: list[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== Assessment Schemas ====================

class AssessmentBase(BaseModel):
    assessment_type: AssessmentTypeEnum
    name: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    weight: float = Field(..., ge=0, le=100)
    related_clos: list[str] = Field(..., min_length=1)


class AssessmentCreate(AssessmentBase):
    pass


class AssessmentUpdate(BaseModel):
    assessment_type: Optional[AssessmentTypeEnum] = None
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    weight: Optional[float] = Field(None, ge=0, le=100)
    related_clos: Optional[list[str]] = None


class AssessmentResponse(BaseModel):
    assessment_id: int
    syllabus_id: int
    assessment_type: AssessmentTypeEnum
    name: str
    description: Optional[str]
    weight: float
    related_clos: list[str]
    display_order: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== Reference Schemas ====================

class ReferenceBase(BaseModel):
    reference_type: ReferenceTypeEnum
    title: str = Field(..., max_length=300)
    authors: Optional[str] = Field(None, max_length=200)
    publisher: Optional[str] = Field(None, max_length=100)
    year: Optional[int] = Field(None, ge=1900, le=2100)
    isbn: Optional[str] = Field(None, max_length=20)
    url: Optional[str] = Field(None, max_length=500)


class ReferenceCreate(ReferenceBase):
    pass


class ReferenceUpdate(BaseModel):
    reference_type: Optional[ReferenceTypeEnum] = None
    title: Optional[str] = Field(None, max_length=300)
    authors: Optional[str] = None
    publisher: Optional[str] = None
    year: Optional[int] = None
    isbn: Optional[str] = None
    url: Optional[str] = None


class ReferenceResponse(ReferenceBase):
    reference_id: int
    syllabus_id: int
    display_order: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== Full Syllabus Schemas ====================

class SyllabusFullCreate(BaseModel):
    """Create syllabus with all components"""
    course_id: int
    academic_year: str = Field(..., pattern=r"^\d{4}-\d{4}$")
    semester: str = Field(..., description="Fall, Spring, Summer")
    credits: int = Field(..., ge=1, le=10)
    total_hours: int = Field(..., ge=15)
    description: str = Field(..., min_length=100, max_length=2000)
    prerequisites: Optional[str] = None
    clos: list[CLOCreate] = Field(..., min_length=3)
    contents: list[ContentCreate] = Field(default=[])
    assessments: list[AssessmentCreate] = Field(default=[])
    references: list[ReferenceCreate] = Field(default=[])


class SyllabusFullResponse(BaseModel):
    """Full syllabus response with all components"""
    syllabus_id: int
    course_id: int
    course_code: Optional[str] = None
    course_name: Optional[str] = None
    academic_year: str
    semester: str
    credits: Optional[int] = None
    total_hours: Optional[int] = None
    description: Optional[str] = None
    prerequisites: Optional[str] = None
    status: str
    created_by: int
    created_date: datetime
    updated_at: Optional[datetime] = None
    clos: list[CLOResponse] = []
    contents: list[ContentResponse] = []
    assessments: list[AssessmentResponse] = []
    references: list[ReferenceResponse] = []

    class Config:
        from_attributes = True


class SyllabusDraftSave(BaseModel):
    """Auto-save draft data"""
    course_id: Optional[int] = None
    academic_year: Optional[str] = None
    semester: Optional[str] = None
    credits: Optional[int] = None
    total_hours: Optional[int] = None
    description: Optional[str] = None
    prerequisites: Optional[str] = None
    clos: Optional[list[CLOCreate]] = None
    contents: Optional[list[ContentCreate]] = None
    assessments: Optional[list[AssessmentCreate]] = None
    references: Optional[list[ReferenceCreate]] = None


# ==================== Validation Schemas ====================

class ValidationError(BaseModel):
    field: str
    message: str


class SyllabusValidationResult(BaseModel):
    is_valid: bool
    errors: list[ValidationError]
    warnings: list[ValidationError]


class SubmitForReviewRequest(BaseModel):
    notes: Optional[str] = Field(None, max_length=1000)
    confirm: bool = Field(..., description="Must confirm syllabus is ready")


# ==================== Comment Schemas ====================

class CommentBase(BaseModel):
    comment_type: CommentTypeEnum = CommentTypeEnum.GENERAL
    section_reference: Optional[str] = Field(None, max_length=100)
    content: str = Field(..., min_length=10, max_length=1000)
    priority: Optional[CommentPriorityEnum] = None


class CommentCreate(CommentBase):
    pass


class CommentReply(BaseModel):
    content: str = Field(..., min_length=10, max_length=1000)


class CommentUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=10, max_length=1000)
    priority: Optional[CommentPriorityEnum] = None


class CommentResponse(CommentBase):
    comment_id: int
    syllabus_id: int
    user_id: int
    author_name: Optional[str] = None
    parent_comment_id: Optional[int] = None
    is_resolved: bool
    resolved_by: Optional[int] = None
    resolver_name: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    replies: list["CommentResponse"] = []

    class Config:
        from_attributes = True


# ==================== Message Schemas ====================

class MessageBase(BaseModel):
    recipient_id: int
    subject: str = Field(..., max_length=200)
    body: str = Field(..., max_length=5000)
    syllabus_id: Optional[int] = None


class MessageCreate(MessageBase):
    pass


class MessageReply(BaseModel):
    body: str = Field(..., max_length=5000)


class MessageResponse(BaseModel):
    message_id: int
    sender_id: int
    sender_name: Optional[str] = None
    recipient_id: int
    recipient_name: Optional[str] = None
    subject: str
    body: str
    syllabus_id: Optional[int] = None
    syllabus_title: Optional[str] = None
    parent_message_id: Optional[int] = None
    is_read: bool
    read_at: Optional[datetime] = None
    sent_at: datetime
    attachments: list[dict] = []

    class Config:
        from_attributes = True


class MessageListResponse(BaseModel):
    message_id: int
    sender_id: int
    sender_name: Optional[str] = None
    recipient_id: int
    recipient_name: Optional[str] = None
    subject: str
    is_read: bool
    sent_at: datetime
    has_attachments: bool = False

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    user_id: int
    user_name: str
    last_message: str
    last_message_at: datetime
    unread_count: int


# ==================== Peer Evaluation Schemas ====================

class PeerEvaluationScoreCreate(BaseModel):
    criteria_id: int
    score: float = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=500)


class PeerEvaluationCreate(BaseModel):
    template_id: Optional[int] = None
    scores: list[PeerEvaluationScoreCreate] = []
    summary_comments: Optional[str] = Field(None, min_length=50)
    recommendation: Optional[PeerRecommendationEnum] = None


class PeerEvaluationUpdate(BaseModel):
    scores: Optional[list[PeerEvaluationScoreCreate]] = None
    summary_comments: Optional[str] = None
    recommendation: Optional[PeerRecommendationEnum] = None


class PeerEvaluationScoreResponse(BaseModel):
    score_id: int
    criteria_id: int
    criteria_name: Optional[str] = None
    score: float
    comment: Optional[str] = None

    class Config:
        from_attributes = True


class PeerEvaluationResponse(BaseModel):
    evaluation_id: int
    syllabus_id: int
    evaluator_id: int
    evaluator_name: Optional[str] = None
    template_id: Optional[int] = None
    overall_score: Optional[float] = None
    recommendation: Optional[PeerRecommendationEnum] = None
    summary_comments: Optional[str] = None
    is_draft: bool
    submitted_at: Optional[datetime] = None
    created_at: datetime
    scores: list[PeerEvaluationScoreResponse] = []

    class Config:
        from_attributes = True


# ==================== Dashboard Schemas ====================

class LecturerDashboard(BaseModel):
    total_courses: int
    draft_syllabi: int
    pending_review: int
    approved_syllabi: int
    revision_required: int
    pending_peer_reviews: int
    unread_messages: int
    upcoming_deadlines: list[dict]
    recent_notifications: list[dict]


class LecturerCourseResponse(BaseModel):
    course_id: int
    code: str
    name: str
    credits: int
    program_id: Optional[int] = None
    department_name: Optional[str] = None
    has_syllabus: bool
    syllabus_status: Optional[str] = None
    syllabus_id: Optional[int] = None

    class Config:
        from_attributes = True


class SubmissionStatusResponse(BaseModel):
    syllabus_id: int
    status: str
    current_stage: str
    submitted_at: Optional[datetime] = None
    review_level: int
    reviewer_name: Optional[str] = None
    last_action: Optional[str] = None
    last_action_at: Optional[datetime] = None
    feedback: list[dict] = []


# Fix forward reference
CommentResponse.model_rebuild()
