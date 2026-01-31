"""Syllabus Assessment models"""
from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime, Table, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class AssessmentType(str, enum.Enum):
    QUIZ = "Quiz"
    ASSIGNMENT = "Assignment"
    MIDTERM = "Midterm"
    FINAL = "Final"
    PROJECT = "Project"
    PRESENTATION = "Presentation"
    LAB_REPORT = "Lab Report"
    PARTICIPATION = "Participation"
    OTHER = "Other"


# Association table for Assessment-CLO mapping
assessment_clo_mapping = Table(
    'assessment_clo_mappings',
    Base.metadata,
    Column('id', Integer, primary_key=True, autoincrement=True),
    Column('assessment_id', Integer, ForeignKey('syllabus_assessments.assessment_id', ondelete='CASCADE'), nullable=False),
    Column('clo_id', Integer, ForeignKey('syllabus_clos.clo_id', ondelete='CASCADE'), nullable=False)
)


class SyllabusAssessment(Base):
    """
    SYLLABUS_ASSESSMENT Table - Assessment methods for a syllabus
    """
    __tablename__ = "syllabus_assessments"

    assessment_id = Column(Integer, primary_key=True, autoincrement=True)
    syllabus_id = Column(Integer, ForeignKey("syllabi.syllabus_id", ondelete="CASCADE"), nullable=False)
    assessment_type = Column(Enum(AssessmentType), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    weight = Column(Float, nullable=False)  # Percentage weight
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    syllabus = relationship("Syllabus", back_populates="assessments")
    related_clos = relationship("SyllabusCLO", secondary="assessment_clo_mappings", back_populates="assessment_mappings")
