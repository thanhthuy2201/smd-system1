"""Syllabus Reference (Textbooks and Materials) models"""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class ReferenceType(str, enum.Enum):
    REQUIRED = "Required"
    RECOMMENDED = "Recommended"
    ONLINE = "Online Resource"
    JOURNAL = "Journal Article"
    OTHER = "Other"


class SyllabusReference(Base):
    """
    SYLLABUS_REFERENCE Table - Textbooks and reference materials
    """
    __tablename__ = "syllabus_references"

    reference_id = Column(Integer, primary_key=True, autoincrement=True)
    syllabus_id = Column(Integer, ForeignKey("syllabi.syllabus_id", ondelete="CASCADE"), nullable=False)
    reference_type = Column(Enum(ReferenceType), nullable=False)
    title = Column(String(300), nullable=False)
    authors = Column(String(200), nullable=True)
    publisher = Column(String(100), nullable=True)
    year = Column(Integer, nullable=True)
    isbn = Column(String(20), nullable=True)
    url = Column(String(500), nullable=True)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    syllabus = relationship("Syllabus", back_populates="references")
