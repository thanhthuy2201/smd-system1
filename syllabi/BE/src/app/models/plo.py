"""Program Learning Outcomes (PLO) model"""
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class ProgramLearningOutcome(Base):
    """
    PROGRAM_LEARNING_OUTCOME Table - Stores PLOs for academic programs.
    Used for CLO-PLO mapping in syllabus creation.
    """
    __tablename__ = "program_learning_outcomes"

    plo_id = Column(Integer, primary_key=True, autoincrement=True)
    program_id = Column(Integer, ForeignKey("programs.program_id", ondelete="CASCADE"), nullable=False)
    code = Column(String(20), nullable=False)  # PLO1, PLO2, etc.
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=True)  # Knowledge, Skills, Attitudes, etc.
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    program = relationship("Program", back_populates="plos")

    def __repr__(self):
        return f"<PLO {self.code}: {self.description[:50]}...>"
