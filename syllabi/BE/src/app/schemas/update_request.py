"""Schemas for Update Requests and Evaluation Results (FE05)"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from enum import Enum


class UpdateRequestStatusEnum(str, Enum):
    PENDING = "Pending"
    UNDER_REVIEW = "Under Review"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    REVISION_REQUIRED = "Revision Required"
    CANCELLED = "Cancelled"


class DecisionEnum(str, Enum):
    APPROVED = "Approved"
    REJECTED = "Rejected"
    REVISION_REQUIRED = "Revision Required"


# ==================== Evaluation Result ====================

class EvaluationScoreBase(BaseModel):
    criteria_id: int
    score: float = Field(..., ge=0)
    comment: Optional[str] = Field(None, max_length=500)


class EvaluationScoreCreate(EvaluationScoreBase):
    pass


class EvaluationResultResponse(EvaluationScoreBase):
    result_id: int
    request_id: int
    evaluator_id: int
    evaluated_at: datetime
    criteria_name: Optional[str] = None
    max_score: Optional[int] = None
    is_passing: Optional[bool] = None

    class Config:
        from_attributes = True


# ==================== Update Request ====================

class UpdateRequestBase(BaseModel):
    syllabus_id: int
    reason: str = Field(..., min_length=10)


class UpdateRequestCreate(UpdateRequestBase):
    pass


class UpdateRequestUpdate(BaseModel):
    reason: Optional[str] = None


class UpdateRequestResponse(UpdateRequestBase):
    request_id: int
    old_version_id: Optional[int] = None
    new_version_id: Optional[int] = None
    requested_by: int
    status: UpdateRequestStatusEnum
    current_reviewer_id: Optional[int] = None
    review_level: int
    decision_by: Optional[int] = None
    decision_comments: Optional[str] = None
    decision_date: Optional[datetime] = None
    revision_deadline: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    # Computed fields
    requester_name: Optional[str] = None
    syllabus_title: Optional[str] = None
    course_code: Optional[str] = None
    current_reviewer_name: Optional[str] = None

    class Config:
        from_attributes = True


class UpdateRequestListResponse(BaseModel):
    request_id: int
    syllabus_id: int
    course_code: str
    course_name: str
    requester_name: str
    status: UpdateRequestStatusEnum
    review_level: int
    created_at: datetime
    days_pending: int = 0

    class Config:
        from_attributes = True


# ==================== Evaluation Submission ====================

class EvaluationSubmission(BaseModel):
    """Submit evaluation scores for a request"""
    scores: list[EvaluationScoreCreate]
    overall_comment: Optional[str] = None


# ==================== Decision ====================

class DecisionRequest(BaseModel):
    """Make decision on update request"""
    decision: DecisionEnum
    comments: str = Field(..., min_length=20)
    revision_deadline: Optional[date] = None  # Required if decision is REVISION_REQUIRED


class DecisionResponse(BaseModel):
    request_id: int
    decision: DecisionEnum
    comments: str
    decision_by: int
    decision_date: datetime
    revision_deadline: Optional[date] = None


# ==================== Version Diff ====================

class VersionDiffRequest(BaseModel):
    request_id: int


class SectionDiff(BaseModel):
    section: str
    old_content: Optional[str] = None
    new_content: Optional[str] = None
    change_type: str  # added, removed, modified, unchanged
    similarity_score: Optional[float] = None


class VersionDiffResponse(BaseModel):
    request_id: int
    old_version: int
    new_version: int
    sections: list[SectionDiff]
    overall_summary: Optional[str] = None
    ai_generated: bool = False


# ==================== Draft Changes ====================

class DraftChangesRequest(BaseModel):
    """Save proposed changes for an update request"""
    description: Optional[str] = Field(None, description="Updated course description")
    learning_outcomes: Optional[str] = Field(None, description="Updated learning outcomes")
    assessment_methods: Optional[str] = Field(None, description="Updated assessment methods")
    teaching_methods: Optional[str] = Field(None, description="Updated teaching methods")
    textbooks: Optional[str] = Field(None, description="Updated textbooks")
    materials: Optional[str] = Field(None, description="Updated materials")
    prerequisites: Optional[str] = Field(None, description="Updated prerequisites")
    content_json: Optional[dict] = Field(None, description="Full content as JSON for detailed changes")
    changes_summary: Optional[str] = Field(None, description="Summary of changes made")


class DraftChangesResponse(BaseModel):
    request_id: int
    new_version_id: int
    version_number: int
    message: str
    saved_at: datetime
