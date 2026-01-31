"""Approval schemas for request/response validation"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date
from app.models.approval_history import ApprovalAction


class ApprovalBase(BaseModel):
    """Base approval schema"""
    comments: Optional[str] = Field(None, description="Comments from approver")
    deadline: Optional[date] = Field(None, description="Deadline for next action")


class ApprovalCreate(ApprovalBase):
    """Schema for creating an approval record"""
    syllabus_id: int = Field(..., description="Syllabus being approved")
    version_id: Optional[int] = Field(None, description="Specific version being approved")
    action: ApprovalAction = Field(..., description="Action taken")
    next_approver_id: Optional[int] = Field(None, description="Next person in approval chain")


class ApproveRequest(BaseModel):
    """Schema for approving a syllabus"""
    comments: Optional[str] = Field(None, description="Approval comments")
    next_approver_id: Optional[int] = Field(None, description="Next approver (for multi-level approval)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "comments": "Approved. Good alignment with program learning outcomes.",
                "next_approver_id": 3
            }
        }
    }


class RejectRequest(BaseModel):
    """Schema for rejecting a syllabus"""
    comments: str = Field(..., min_length=10, description="Rejection reason (required)")
    deadline: Optional[date] = Field(None, description="Deadline for revision submission")

    model_config = {
        "json_schema_extra": {
            "example": {
                "comments": "Please revise the assessment methods to include more formative assessments.",
                "deadline": "2025-02-15"
            }
        }
    }


class ApprovalResponse(BaseModel):
    """Schema for approval response"""
    approval_id: int
    syllabus_id: int
    version_id: Optional[int] = None
    approver_id: int
    approver_role: str
    action: ApprovalAction
    comments: Optional[str] = None
    review_date: datetime
    deadline: Optional[date] = None
    next_approver_id: Optional[int] = None
    is_completed: bool

    model_config = {"from_attributes": True}


class ApprovalHistoryList(BaseModel):
    """Schema for approval history list"""
    total: int
    items: list[ApprovalResponse]


class PendingApproval(BaseModel):
    """Schema for pending approval item"""
    syllabus_id: int
    syllabus_title: str
    course_code: str
    course_name: str
    submitted_by: str
    submitted_date: datetime
    current_status: str
    deadline: Optional[date] = None
