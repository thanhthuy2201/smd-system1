"""Syllabus CLO (Course Learning Outcomes) models"""
from sqlalchemy import Column, Integer, String, Text, Enum, ForeignKey, DateTime, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class BloomLevel(str, enum.Enum):
    REMEMBER = "Remember"
    UNDERSTAND = "Understand"
    APPLY = "Apply"
    ANALYZE = "Analyze"
    EVALUATE = "Evaluate"
    CREATE = "Create"


# Association table for CLO-PLO mapping
clo_plo_mapping = Table(
    'clo_plo_mappings',
    Base.metadata,
    Column('mapping_id', Integer, primary_key=True, autoincrement=True),
    Column('clo_id', Integer, ForeignKey('syllabus_clos.clo_id', ondelete='CASCADE'), nullable=False),
    Column('plo_code', String(20), nullable=False),
    Column('program_id', Integer, ForeignKey('programs.program_id'), nullable=True),
    Column('created_at', DateTime, server_default=func.now())
)


class SyllabusCLO(Base):
    """
    SYLLABUS_CLO Table - Course Learning Outcomes for a syllabus
    """
    __tablename__ = "syllabus_clos"

    clo_id = Column(Integer, primary_key=True, autoincrement=True)
    syllabus_id = Column(Integer, ForeignKey("syllabi.syllabus_id", ondelete="CASCADE"), nullable=False)
    code = Column(String(10), nullable=False)  # CLO1, CLO2, etc.
    description = Column(Text, nullable=False)
    bloom_level = Column(Enum(BloomLevel), nullable=False)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    syllabus = relationship("Syllabus", back_populates="clos")
    content_mappings = relationship("SyllabusContent", secondary="content_clo_mappings", back_populates="related_clos")
    assessment_mappings = relationship("SyllabusAssessment", secondary="assessment_clo_mappings", back_populates="related_clos")
