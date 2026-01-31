"""Department model - DEPARTMENT Table"""
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Department(Base):
    """
    DEPARTMENT Table - Represents academic departments within the university.
    """
    __tablename__ = "departments"

    dept_id = Column(Integer, primary_key=True, autoincrement=True)
    dept_code = Column(String(10), unique=True, nullable=False, index=True)
    dept_name = Column(String(255), nullable=False)
    dept_name_vn = Column(String(255), nullable=True)
    dean_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    email = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    office_location = Column(String(255), nullable=True)
    established_year = Column(Integer, nullable=True)

    # Relationships
    users = relationship("User", back_populates="department", foreign_keys="User.department_id")
    dean = relationship("User", foreign_keys=[dean_id])
    programs = relationship("Program", back_populates="department")
    courses = relationship("Course", back_populates="department")
