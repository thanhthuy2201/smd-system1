"""Program model - PROGRAM Table"""
from sqlalchemy import Column, Integer, String, Boolean, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class DegreeType(str, enum.Enum):
    BACHELOR = "Bachelor"
    MASTER = "Master"
    PHD = "PhD"
    CERTIFICATE = "Certificate"


class Program(Base):
    """
    PROGRAM Table - Stores academic programs/degrees offered.
    """
    __tablename__ = "programs"

    program_id = Column(Integer, primary_key=True, autoincrement=True)
    program_code = Column(String(20), unique=True, nullable=False, index=True)
    program_name = Column(String(255), nullable=False)
    program_name_vn = Column(String(255), nullable=True)
    degree_type = Column(Enum(DegreeType), nullable=False)
    duration_years = Column(Integer, default=4)
    total_credits = Column(Integer, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.dept_id"), nullable=True)
    coordinator_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

    # Relationships
    department = relationship("Department", back_populates="programs")
    courses = relationship("Course", back_populates="program")
    plos = relationship("ProgramLearningOutcome", back_populates="program", cascade="all, delete-orphan")
