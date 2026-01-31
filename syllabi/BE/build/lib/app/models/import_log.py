"""Import Log models for bulk data import"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class ImportStatus(str, enum.Enum):
    PENDING = "Pending"
    VALIDATING = "Validating"
    VALIDATED = "Validated"
    IMPORTING = "Importing"
    COMPLETED = "Completed"
    FAILED = "Failed"
    CANCELLED = "Cancelled"


class ImportType(str, enum.Enum):
    LECTURER = "Lecturer"
    STAFF = "Staff"
    STUDENT = "Student"
    COURSE = "Course"
    PROGRAM = "Program"


class ImportLog(Base):
    """
    IMPORT_LOG Table - Log import operations
    """
    __tablename__ = "import_logs"

    import_id = Column(Integer, primary_key=True, autoincrement=True)
    import_type = Column(Enum(ImportType), nullable=False)
    filename = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=True)  # bytes
    status = Column(Enum(ImportStatus), default=ImportStatus.PENDING)

    # Statistics
    total_rows = Column(Integer, default=0)
    valid_rows = Column(Integer, default=0)
    invalid_rows = Column(Integer, default=0)
    imported_rows = Column(Integer, default=0)
    skipped_rows = Column(Integer, default=0)

    # Processing info
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)

    # Metadata
    imported_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    importer = relationship("User")
    errors = relationship("ImportError", back_populates="import_log", cascade="all, delete-orphan")


class ImportError(Base):
    """
    IMPORT_ERROR Table - Store validation errors for review
    """
    __tablename__ = "import_errors"

    error_id = Column(Integer, primary_key=True, autoincrement=True)
    import_id = Column(Integer, ForeignKey("import_logs.import_id"), nullable=False)
    row_number = Column(Integer, nullable=False)
    column_name = Column(String(100), nullable=True)
    value = Column(String(500), nullable=True)
    error_type = Column(String(50), nullable=False)  # validation, duplicate, format, etc.
    error_message = Column(Text, nullable=False)
    row_data = Column(JSON, nullable=True)  # Full row data for reference
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    import_log = relationship("ImportLog", back_populates="errors")
