"""Update Request and Evaluation Result models"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float, Enum, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class UpdateRequestStatus(str, enum.Enum):
    PENDING = "Pending"
    UNDER_REVIEW = "Under Review"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    REVISION_REQUIRED = "Revision Required"
    CANCELLED = "Cancelled"


class UpdateRequest(Base):
    """
    UPDATE_REQUEST Table - Syllabus update request management
    """
    __tablename__ = "update_requests"

    request_id = Column(Integer, primary_key=True, autoincrement=True)
    syllabus_id = Column(Integer, ForeignKey("syllabi.syllabus_id"), nullable=False)
    old_version_id = Column(Integer, ForeignKey("syllabus_versions.version_id"), nullable=True)
    new_version_id = Column(Integer, ForeignKey("syllabus_versions.version_id"), nullable=True)
    requested_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(Enum(UpdateRequestStatus), default=UpdateRequestStatus.PENDING)

    # Review tracking
    current_reviewer_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    review_level = Column(Integer, default=1)  # 1=HoD, 2=AA

    # Decision
    decision_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    decision_comments = Column(Text, nullable=True)
    decision_date = Column(DateTime, nullable=True)
    revision_deadline = Column(Date, nullable=True)

    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    syllabus = relationship("Syllabus")
    old_version = relationship("SyllabusVersion", foreign_keys=[old_version_id])
    new_version = relationship("SyllabusVersion", foreign_keys=[new_version_id])
    requester = relationship("User", foreign_keys=[requested_by])
    current_reviewer = relationship("User", foreign_keys=[current_reviewer_id])
    decision_maker = relationship("User", foreign_keys=[decision_by])
    evaluation_results = relationship("EvaluationResult", back_populates="update_request", cascade="all, delete-orphan")


class EvaluationResult(Base):
    """
    EVALUATION_RESULT Table - Store evaluation scores for update requests
    """
    __tablename__ = "evaluation_results"

    result_id = Column(Integer, primary_key=True, autoincrement=True)
    request_id = Column(Integer, ForeignKey("update_requests.request_id"), nullable=False)
    criteria_id = Column(Integer, ForeignKey("evaluation_criteria.criteria_id"), nullable=False)
    evaluator_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    score = Column(Float, nullable=False)
    comment = Column(Text, nullable=True)
    evaluated_at = Column(DateTime, server_default=func.now())

    # Relationships
    update_request = relationship("UpdateRequest", back_populates="evaluation_results")
    criteria = relationship("EvaluationCriteria")
    evaluator = relationship("User")
