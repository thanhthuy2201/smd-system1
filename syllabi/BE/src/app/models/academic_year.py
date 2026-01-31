"""Academic Year and Semester models"""
from sqlalchemy import Column, Integer, String, Date, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class AcademicYear(Base):
    """
    ACADEMIC_YEAR Table - Store academic year information
    """
    __tablename__ = "academic_years"

    academic_year_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(9), unique=True, nullable=False, index=True)  # e.g., 2024-2025
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    semesters = relationship("Semester", back_populates="academic_year", cascade="all, delete-orphan")


class Semester(Base):
    """
    SEMESTER Table - Store semester details within academic years
    """
    __tablename__ = "semesters"

    semester_id = Column(Integer, primary_key=True, autoincrement=True)
    academic_year_id = Column(Integer, ForeignKey("academic_years.academic_year_id"), nullable=False)
    name = Column(String(20), nullable=False)  # Fall, Spring, Summer
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    academic_year = relationship("AcademicYear", back_populates="semesters")
    submission_periods = relationship("SubmissionPeriod", back_populates="semester", cascade="all, delete-orphan")
    review_schedules = relationship("ReviewSchedule", back_populates="semester")


class SubmissionPeriod(Base):
    """
    SUBMISSION_PERIOD Table - Store syllabus submission windows
    """
    __tablename__ = "submission_periods"

    period_id = Column(Integer, primary_key=True, autoincrement=True)
    semester_id = Column(Integer, ForeignKey("semesters.semester_id"), nullable=False)
    submission_start = Column(Date, nullable=False)
    submission_end = Column(Date, nullable=False)
    description = Column(String(255), nullable=True)
    is_open = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    semester = relationship("Semester", back_populates="submission_periods")
