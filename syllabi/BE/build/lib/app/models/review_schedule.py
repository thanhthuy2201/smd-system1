"""Review Schedule and Reviewer Assignment models"""
from sqlalchemy import Column, Integer, String, Date, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class ReviewSchedule(Base):
    """
    REVIEW_SCHEDULE Table - Store review cycle information
    """
    __tablename__ = "review_schedules"

    schedule_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.semester_id"), nullable=False)
    review_start = Column(Date, nullable=False)
    l1_deadline = Column(Date, nullable=False)  # HoD review deadline
    l2_deadline = Column(Date, nullable=False)  # AA review deadline
    final_approval = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    semester = relationship("Semester", back_populates="review_schedules")
    creator = relationship("User", foreign_keys=[created_by])
    assignments = relationship("ReviewerAssignment", back_populates="schedule", cascade="all, delete-orphan")


class ReviewerAssignment(Base):
    """
    REVIEWER_ASSIGNMENT Table - Link reviewers to schedules and departments
    """
    __tablename__ = "reviewer_assignments"

    assignment_id = Column(Integer, primary_key=True, autoincrement=True)
    schedule_id = Column(Integer, ForeignKey("review_schedules.schedule_id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.dept_id"), nullable=True)
    review_level = Column(Integer, nullable=False, default=1)  # 1=HoD, 2=AA
    is_primary = Column(Boolean, default=False)
    assigned_at = Column(DateTime, server_default=func.now())
    assigned_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)

    # Relationships
    schedule = relationship("ReviewSchedule", back_populates="assignments")
    reviewer = relationship("User", foreign_keys=[reviewer_id])
    department = relationship("Department")
    assigner = relationship("User", foreign_keys=[assigned_by])
