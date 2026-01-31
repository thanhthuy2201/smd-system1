"""User model - USER Table"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    LECTURER = "LECTURER"
    HOD = "HOD"  # Head of Department
    ACADEMIC_AFFAIRS = "ACADEMIC_AFFAIRS"
    PRINCIPAL = "PRINCIPAL"
    STUDENT = "STUDENT"


class User(Base):
    """
    USER Table - Stores information about all system users.
    """
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)  # Nullable for Firebase-only users
    email = Column(String(100), unique=True, nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.dept_id"), nullable=True)
    faculty_position = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    last_login = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_date = Column(DateTime, server_default=func.now())

    # Firebase authentication
    firebase_uid = Column(String(128), unique=True, nullable=True, index=True)

    # Relationships
    department = relationship("Department", back_populates="users", foreign_keys=[department_id])
    created_syllabi = relationship("Syllabus", back_populates="creator", foreign_keys="Syllabus.created_by")
    approval_actions = relationship("ApprovalHistory", back_populates="approver", foreign_keys="ApprovalHistory.approver_id")

    @property
    def full_name(self) -> str:
        """Return full name combining first and last name"""
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def hashed_password(self) -> str:
        """Alias for password_hash for compatibility"""
        return self.password_hash

    @hashed_password.setter
    def hashed_password(self, value: str):
        """Setter for hashed_password alias"""
        self.password_hash = value
