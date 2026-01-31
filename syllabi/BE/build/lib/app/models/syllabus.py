"""Syllabus model - SYLLABUS Table"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class SyllabusStatus(str, enum.Enum):
    DRAFT = "Draft"
    PENDING_REVIEW = "Pending Review"
    REVISION_REQUIRED = "Revision Required"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    ARCHIVED = "Archived"


class Syllabus(Base):
    """
    SYLLABUS Table - Stores the core syllabus content for each course offering.
    """
    __tablename__ = "syllabi"

    syllabus_id = Column(Integer, primary_key=True, autoincrement=True)
    course_id = Column(Integer, ForeignKey("courses.course_id"), nullable=False)
    version_id = Column(Integer, ForeignKey("syllabus_versions.version_id"), nullable=True)
    academic_year = Column(String(9), nullable=False)  # e.g., "2024-2025"
    semester = Column(String(20), nullable=False)  # Fall, Spring, Summer
    credits = Column(Integer, nullable=False)
    total_hours = Column(Integer, nullable=False)
    learning_outcomes = Column(Text, nullable=False)
    assessment_methods = Column(Text, nullable=False)
    textbooks = Column(Text, nullable=True)
    teaching_methods = Column(Text, nullable=True)
    prerequisites = Column(Text, nullable=True)
    materials = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    created_date = Column(DateTime, server_default=func.now())
    status = Column(Enum(SyllabusStatus), default=SyllabusStatus.DRAFT)

    # Additional fields for lecturer module
    description = Column(Text, nullable=True)
    title = Column(String(200), nullable=True)
    submission_notes = Column(Text, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # File attachment fields
    original_file_name = Column(String(255), nullable=True)  # Original uploaded filename
    file_path = Column(String(500), nullable=True)  # Storage path (Supabase/S3/local)
    file_size = Column(Integer, nullable=True)  # File size in bytes
    file_type = Column(String(50), nullable=True)  # MIME type (application/pdf, etc.)

    # Relationships
    course = relationship("Course", back_populates="syllabi")
    creator = relationship("User", back_populates="created_syllabi", foreign_keys=[created_by])
    versions = relationship("SyllabusVersion", back_populates="syllabus", foreign_keys="SyllabusVersion.syllabus_id")
    approval_history = relationship("ApprovalHistory", back_populates="syllabus")

    # Lecturer module relationships
    clos = relationship("SyllabusCLO", back_populates="syllabus", cascade="all, delete-orphan")
    contents = relationship("SyllabusContent", back_populates="syllabus", cascade="all, delete-orphan")
    assessments = relationship("SyllabusAssessment", back_populates="syllabus", cascade="all, delete-orphan")
    references = relationship("SyllabusReference", back_populates="syllabus", cascade="all, delete-orphan")
    comments = relationship("SyllabusComment", back_populates="syllabus", cascade="all, delete-orphan")
