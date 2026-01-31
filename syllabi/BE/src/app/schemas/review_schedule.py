"""Schemas for Review Schedule (FE03)"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import date, datetime


# ==================== Reviewer Assignment ====================

class ReviewerAssignmentBase(BaseModel):
    reviewer_id: int
    department_id: Optional[int] = None
    review_level: int = Field(1, ge=1, le=2, description="1=HoD, 2=AA")
    is_primary: bool = False


class ReviewerAssignmentCreate(ReviewerAssignmentBase):
    pass


class ReviewerAssignmentResponse(ReviewerAssignmentBase):
    assignment_id: int
    schedule_id: int
    assigned_at: datetime
    reviewer_name: Optional[str] = None
    department_name: Optional[str] = None

    class Config:
        from_attributes = True


# ==================== Review Schedule ====================

class ReviewScheduleBase(BaseModel):
    name: str = Field(..., max_length=100)
    semester_id: int
    review_start: date
    l1_deadline: date = Field(..., description="HoD review deadline")
    l2_deadline: date = Field(..., description="AA review deadline")
    final_approval: date

    @field_validator('l1_deadline')
    @classmethod
    def l1_after_start(cls, v, info):
        if 'review_start' in info.data and v <= info.data['review_start']:
            raise ValueError('l1_deadline must be after review_start')
        return v

    @field_validator('l2_deadline')
    @classmethod
    def l2_after_l1(cls, v, info):
        if 'l1_deadline' in info.data and v <= info.data['l1_deadline']:
            raise ValueError('l2_deadline must be after l1_deadline')
        return v

    @field_validator('final_approval')
    @classmethod
    def final_after_l2(cls, v, info):
        if 'l2_deadline' in info.data and v <= info.data['l2_deadline']:
            raise ValueError('final_approval must be after l2_deadline')
        return v


class ReviewScheduleCreate(ReviewScheduleBase):
    is_active: bool = True
    assignments: Optional[list[ReviewerAssignmentCreate]] = None


class ReviewScheduleUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    review_start: Optional[date] = None
    l1_deadline: Optional[date] = None
    l2_deadline: Optional[date] = None
    final_approval: Optional[date] = None
    is_active: Optional[bool] = None


class ReviewScheduleResponse(ReviewScheduleBase):
    schedule_id: int
    is_active: bool
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    assignments: list[ReviewerAssignmentResponse] = []
    semester_name: Optional[str] = None
    academic_year: Optional[str] = None

    class Config:
        from_attributes = True


class ReviewScheduleListResponse(BaseModel):
    schedule_id: int
    name: str
    semester_name: str
    academic_year: str
    review_start: date
    l1_deadline: date
    l2_deadline: date
    final_approval: date
    is_active: bool
    assignment_count: int = 0

    class Config:
        from_attributes = True


class ReviewScheduleListPaginated(BaseModel):
    """Paginated response for review schedules"""
    total: int
    page: int
    pageSize: int
    totalPages: int
    items: list[ReviewScheduleListResponse]


# ==================== Progress Tracking ====================

class ReviewProgressResponse(BaseModel):
    schedule_id: int
    schedule_name: str
    total_syllabi: int
    pending_submission: int
    pending_l1_review: int
    pending_l2_review: int
    approved: int
    rejected: int
    completion_percentage: float


class AvailableReviewerResponse(BaseModel):
    user_id: int
    username: str
    full_name: str
    role: str
    department_id: Optional[int] = None
    department_name: Optional[str] = None

    class Config:
        from_attributes = True
