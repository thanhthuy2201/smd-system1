"""Evaluation Template and Criteria models"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class CriteriaCategory(str, enum.Enum):
    CONTENT = "Content"
    FORMAT = "Format"
    COMPLIANCE = "Compliance"
    QUALITY = "Quality"


class EvaluationTemplate(Base):
    """
    EVALUATION_TEMPLATE Table - Store evaluation template metadata
    """
    __tablename__ = "evaluation_templates"

    template_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    criteria = relationship("EvaluationCriteria", back_populates="template", cascade="all, delete-orphan")
    programs = relationship("TemplateProgram", back_populates="template", cascade="all, delete-orphan")


class EvaluationCriteria(Base):
    """
    EVALUATION_CRITERIA Table - Store individual evaluation criteria
    """
    __tablename__ = "evaluation_criteria"

    criteria_id = Column(Integer, primary_key=True, autoincrement=True)
    template_id = Column(Integer, ForeignKey("evaluation_templates.template_id"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(Enum(CriteriaCategory), nullable=False)
    weight = Column(Float, nullable=False)  # Percentage weight (0-100)
    max_score = Column(Integer, nullable=False, default=10)
    passing_score = Column(Integer, nullable=True)  # Minimum score to pass
    is_mandatory = Column(Boolean, default=False)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    template = relationship("EvaluationTemplate", back_populates="criteria")
    plo_mappings = relationship("CriteriaPLOMapping", back_populates="criteria", cascade="all, delete-orphan")


class CriteriaPLOMapping(Base):
    """
    CRITERIA_PLO_MAPPING Table - Link criteria to Program Learning Outcomes
    """
    __tablename__ = "criteria_plo_mappings"

    mapping_id = Column(Integer, primary_key=True, autoincrement=True)
    criteria_id = Column(Integer, ForeignKey("evaluation_criteria.criteria_id"), nullable=False)
    program_id = Column(Integer, ForeignKey("programs.program_id"), nullable=False)
    plo_code = Column(String(20), nullable=False)  # e.g., PLO1, PLO2
    plo_description = Column(Text, nullable=True)

    # Relationships
    criteria = relationship("EvaluationCriteria", back_populates="plo_mappings")
    program = relationship("Program")


class TemplateProgram(Base):
    """
    TEMPLATE_PROGRAM Table - Link templates to applicable programs
    """
    __tablename__ = "template_programs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    template_id = Column(Integer, ForeignKey("evaluation_templates.template_id"), nullable=False)
    program_id = Column(Integer, ForeignKey("programs.program_id"), nullable=False)

    # Relationships
    template = relationship("EvaluationTemplate", back_populates="programs")
    program = relationship("Program")
