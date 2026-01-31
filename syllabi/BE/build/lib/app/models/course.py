"""Course model - COURSE Table"""
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Course(Base):
    """
    COURSE Table - Contains information about courses offered by the university.
    """
    __tablename__ = "courses"

    course_id = Column(Integer, primary_key=True, autoincrement=True)
    course_code = Column(String(20), unique=True, nullable=False, index=True)
    course_name = Column(String(255), nullable=False)
    course_name_vn = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    department_id = Column(Integer, ForeignKey("departments.dept_id"), nullable=True)
    program_id = Column(Integer, ForeignKey("programs.program_id"), nullable=True)
    is_elective = Column(Boolean, default=False)
    min_students = Column(Integer, default=10)
    max_students = Column(Integer, default=50)
    is_active = Column(Boolean, default=True)
    credits = Column(Integer, default=3)

    # Relationships
    department = relationship("Department", back_populates="courses")
    program = relationship("Program", back_populates="courses")
    syllabi = relationship("Syllabus", back_populates="course")
