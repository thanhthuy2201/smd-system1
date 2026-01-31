"""Peer Evaluation models for syllabus review"""
from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime, Enum, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class PeerRecommendation(str, enum.Enum):
    APPROVE = "Approve"
    NEEDS_REVISION = "Needs Revision"
    REJECT = "Reject"


class PeerEvaluation(Base):
    """
    PEER_EVALUATION Table - Peer review evaluations of syllabi
    """
    __tablename__ = "peer_evaluations"

    evaluation_id = Column(Integer, primary_key=True, autoincrement=True)
    syllabus_id = Column(Integer, ForeignKey("syllabi.syllabus_id", ondelete="CASCADE"), nullable=False)
    evaluator_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    template_id = Column(Integer, ForeignKey("evaluation_templates.template_id"), nullable=True)
    overall_score = Column(Float, nullable=True)
    recommendation = Column(Enum(PeerRecommendation), nullable=True)
    summary_comments = Column(Text, nullable=True)
    is_draft = Column(Boolean, default=True)
    submitted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    syllabus = relationship("Syllabus", backref="peer_evaluations")
    evaluator = relationship("User", backref="peer_evaluations_given")
    template = relationship("EvaluationTemplate")
    scores = relationship("PeerEvaluationScore", back_populates="evaluation", cascade="all, delete-orphan")


class PeerEvaluationScore(Base):
    """
    PEER_EVALUATION_SCORE Table - Individual criterion scores for peer evaluation
    """
    __tablename__ = "peer_evaluation_scores"

    score_id = Column(Integer, primary_key=True, autoincrement=True)
    evaluation_id = Column(Integer, ForeignKey("peer_evaluations.evaluation_id", ondelete="CASCADE"), nullable=False)
    criteria_id = Column(Integer, ForeignKey("evaluation_criteria.criteria_id"), nullable=False)
    score = Column(Float, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    evaluation = relationship("PeerEvaluation", back_populates="scores")
    criteria = relationship("EvaluationCriteria")
