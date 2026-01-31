"""Schemas for Data Import (FE07)"""
from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime
from enum import Enum


class ImportTypeEnum(str, Enum):
    SYLLABUS = "Syllabus"
    COURSE = "Course"
    PROGRAM = "Program"
    USER = "User"


class ImportStatusEnum(str, Enum):
    PENDING = "Pending"
    VALIDATING = "Validating"
    PROCESSING = "Processing"
    COMPLETED = "Completed"
    FAILED = "Failed"
    PARTIAL = "Partial"


class ImportErrorSeverityEnum(str, Enum):
    WARNING = "Warning"
    ERROR = "Error"
    CRITICAL = "Critical"


# ==================== Import Error ====================

class ImportErrorBase(BaseModel):
    row_number: Optional[int] = None
    column_name: Optional[str] = None
    error_type: str
    error_message: str
    severity: ImportErrorSeverityEnum = ImportErrorSeverityEnum.ERROR
    raw_value: Optional[str] = None


class ImportErrorResponse(ImportErrorBase):
    error_id: int
    import_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== Import Log ====================

class ImportLogBase(BaseModel):
    import_type: ImportTypeEnum
    file_name: str = Field(..., max_length=255)


class ImportLogCreate(ImportLogBase):
    pass


class ImportLogResponse(ImportLogBase):
    import_id: int
    status: ImportStatusEnum
    total_rows: int
    successful_rows: int
    failed_rows: int
    imported_by: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    error_summary: Optional[str] = None
    errors: list[ImportErrorResponse] = []
    importer_name: Optional[str] = None

    class Config:
        from_attributes = True


class ImportLogListResponse(BaseModel):
    import_id: int
    import_type: ImportTypeEnum
    file_name: str
    status: ImportStatusEnum
    total_rows: int
    successful_rows: int
    failed_rows: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    importer_name: Optional[str] = None

    class Config:
        from_attributes = True


# ==================== Import Request/Response ====================

class ImportRequest(BaseModel):
    """Request to import data from file"""
    import_type: ImportTypeEnum
    validate_only: bool = False
    skip_duplicates: bool = True
    update_existing: bool = False


class ImportValidationResult(BaseModel):
    """Result of import validation"""
    is_valid: bool
    total_rows: int
    valid_rows: int
    invalid_rows: int
    errors: list[ImportErrorBase]
    warnings: list[ImportErrorBase]
    preview_data: Optional[list[dict[str, Any]]] = None


class ImportProgressResponse(BaseModel):
    """Import progress status"""
    import_id: int
    status: ImportStatusEnum
    progress_percentage: float
    processed_rows: int
    total_rows: int
    successful_rows: int
    failed_rows: int
    current_operation: Optional[str] = None
    estimated_time_remaining: Optional[int] = None  # seconds


class ImportSummaryResponse(BaseModel):
    """Summary after import completion"""
    import_id: int
    status: ImportStatusEnum
    total_rows: int
    successful_rows: int
    failed_rows: int
    skipped_rows: int
    duration_seconds: int
    errors: list[ImportErrorResponse]
    created_entities: list[dict[str, Any]] = []
    updated_entities: list[dict[str, Any]] = []


# ==================== Template ====================

class ImportTemplateResponse(BaseModel):
    """Template information for import"""
    import_type: ImportTypeEnum
    required_columns: list[str]
    optional_columns: list[str]
    column_descriptions: dict[str, str]
    sample_data: list[dict[str, Any]]
    file_formats: list[str] = ["xlsx", "csv"]


# ==================== Bulk Operations ====================

class BulkDeleteRequest(BaseModel):
    """Request to delete imported records"""
    import_id: int
    confirm: bool = False


class BulkDeleteResponse(BaseModel):
    """Response after bulk delete"""
    import_id: int
    deleted_count: int
    failed_count: int
    errors: list[str] = []
