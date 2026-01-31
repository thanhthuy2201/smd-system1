"""Syllabus Version model - SYLLABUS_VERSION Table"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class SyllabusVersion(Base):
    """
    SYLLABUS_VERSION Table - Tracks different versions of a syllabus throughout its lifecycle.
    """
    __tablename__ = "syllabus_versions"

    version_id = Column(Integer, primary_key=True, autoincrement=True)
    syllabus_id = Column(Integer, ForeignKey("syllabi.syllabus_id"), nullable=False)
    version_number = Column(Integer, nullable=False)  # Sequential: 1, 2, 3...
    changes_summary = Column(Text, nullable=False)
    content_json = Column(JSON, nullable=False)  # Full syllabus content in structured format
    created_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    created_date = Column(DateTime, server_default=func.now())
    effective_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=True)
    is_current = Column(Boolean, default=False)

    # Relationships
    syllabus = relationship("Syllabus", back_populates="versions", foreign_keys=[syllabus_id])
    creator = relationship("User", foreign_keys=[created_by])
    approvals = relationship("ApprovalHistory", back_populates="version")
