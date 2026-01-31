"""Schemas for Academic Year and Semester (FE02)"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import date, datetime
import re


# ==================== Submission Period ====================

class SubmissionPeriodBase(BaseModel):
    submission_start: date
    submission_end: date
    description: Optional[str] = None

    @field_validator('submission_end')
    @classmethod
    def end_after_start(cls, v, info):
        if 'submission_start' in info.data and v <= info.data['submission_start']:
            raise ValueError('submission_end must be after submission_start')
        return v


class SubmissionPeriodCreate(SubmissionPeriodBase):
    pass


class SubmissionPeriodUpdate(BaseModel):
    submission_start: Optional[date] = None
    submission_end: Optional[date] = None
    description: Optional[str] = None
    is_open: Optional[bool] = None


class SubmissionPeriodResponse(SubmissionPeriodBase):
    period_id: int
    semester_id: int
    is_open: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== Semester ====================

class SemesterBase(BaseModel):
    name: str = Field(..., max_length=20, description="Fall, Spring, Summer")
    start_date: date
    end_date: date

    @field_validator('end_date')
    @classmethod
    def end_after_start(cls, v, info):
        if 'start_date' in info.data and v <= info.data['start_date']:
            raise ValueError('end_date must be after start_date')
        return v


class SemesterCreate(SemesterBase):
    submission_start: Optional[date] = None
    submission_end: Optional[date] = None


class SemesterUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=20)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None


class SemesterResponse(SemesterBase):
    semester_id: int
    academic_year_id: int
    is_active: bool
    created_at: datetime
    submission_periods: list[SubmissionPeriodResponse] = []

    class Config:
        from_attributes = True


# ==================== Academic Year ====================

class AcademicYearBase(BaseModel):
    name: str = Field(..., max_length=9, description="Format: YYYY-YYYY (e.g., 2024-2025)")
    start_date: date
    end_date: date

    @field_validator('name')
    @classmethod
    def validate_name_format(cls, v):
        if not re.match(r'^\d{4}-\d{4}$', v):
            raise ValueError('name must be in format YYYY-YYYY (e.g., 2024-2025)')
        years = v.split('-')
        if int(years[1]) != int(years[0]) + 1:
            raise ValueError('second year must be one more than first year')
        return v

    @field_validator('end_date')
    @classmethod
    def end_after_start(cls, v, info):
        if 'start_date' in info.data and v <= info.data['start_date']:
            raise ValueError('end_date must be after start_date')
        return v


class AcademicYearCreate(AcademicYearBase):
    is_active: bool = False
    semesters: Optional[list[SemesterCreate]] = None


class AcademicYearUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=9)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None


class AcademicYearResponse(AcademicYearBase):
    academic_year_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    semesters: list[SemesterResponse] = []

    class Config:
        from_attributes = True


class AcademicYearListResponse(BaseModel):
    academic_year_id: int
    name: str
    start_date: date
    end_date: date
    is_active: bool
    semester_count: int = 0

    class Config:
        from_attributes = True


class AcademicYearListPaginated(BaseModel):
    """Paginated response for academic years"""
    total: int
    page: int
    pageSize: int
    totalPages: int
    items: list[AcademicYearListResponse]
