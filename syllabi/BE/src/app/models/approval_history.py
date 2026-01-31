"""Approval History model - APPROVAL_HISTORY Table"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, Text, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class ApprovalAction(str, enum.Enum):
    SUBMITTED = "Submitted"
    REVIEWED = "Reviewed"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    RETURNED_FOR_REVISION = "Returned for Revision"
    PUBLISHED = "Published"
    WITHDRAWN = "Withdrawn"


class ApprovalHistory(Base):
    """
    APPROVAL_HISTORY Table - Tracks the approval workflow for syllabi.
    """
    __tablename__ = "approval_history"

    approval_id = Column(Integer, primary_key=True, autoincrement=True)
    syllabus_id = Column(Integer, ForeignKey("syllabi.syllabus_id"), nullable=False)
    version_id = Column(Integer, ForeignKey("syllabus_versions.version_id"), nullable=True)
    approver_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    approver_role = Column(String(50), nullable=False)
    action = Column(Enum(ApprovalAction), nullable=False)
    comments = Column(Text, nullable=True)
    review_date = Column(DateTime, server_default=func.now())
    deadline = Column(Date, nullable=True)
    next_approver_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    is_completed = Column(Boolean, default=False)

    # Relationships
    syllabus = relationship("Syllabus", back_populates="approval_history")
    version = relationship("SyllabusVersion", back_populates="approvals")
    approver = relationship("User", back_populates="approval_actions", foreign_keys=[approver_id])
    next_approver = relationship("User", foreign_keys=[next_approver_id])
