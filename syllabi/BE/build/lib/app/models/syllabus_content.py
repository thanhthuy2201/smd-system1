"""Syllabus Content (Course Topics/Weekly Outline) models"""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


# Association table for Content-CLO mapping
content_clo_mapping = Table(
    'content_clo_mappings',
    Base.metadata,
    Column('id', Integer, primary_key=True, autoincrement=True),
    Column('content_id', Integer, ForeignKey('syllabus_contents.content_id', ondelete='CASCADE'), nullable=False),
    Column('clo_id', Integer, ForeignKey('syllabus_clos.clo_id', ondelete='CASCADE'), nullable=False)
)


class SyllabusContent(Base):
    """
    SYLLABUS_CONTENT Table - Course topics and weekly outline
    """
    __tablename__ = "syllabus_contents"

    content_id = Column(Integer, primary_key=True, autoincrement=True)
    syllabus_id = Column(Integer, ForeignKey("syllabi.syllabus_id", ondelete="CASCADE"), nullable=False)
    week_number = Column(Integer, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    lecture_hours = Column(Integer, default=0)
    lab_hours = Column(Integer, default=0)
    teaching_methods = Column(Text, nullable=True)  # JSON array stored as text
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    syllabus = relationship("Syllabus", back_populates="contents")
    related_clos = relationship("SyllabusCLO", secondary="content_clo_mappings", back_populates="content_mappings")
