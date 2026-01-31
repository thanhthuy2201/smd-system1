"""Syllabus Version schemas for request/response validation"""
from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime, date


class SyllabusVersionBase(BaseModel):
    """Base syllabus version schema"""
    changes_summary: str = Field(..., description="Description of changes from previous version")
    content_json: dict[str, Any] = Field(..., description="Full syllabus content in structured format")
    effective_date: Optional[date] = Field(None, description="Date this version becomes effective")
    expiry_date: Optional[date] = Field(None, description="Date this version expires")


class SyllabusVersionCreate(SyllabusVersionBase):
    """Schema for creating a new syllabus version"""

    model_config = {
        "json_schema_extra": {
            "example": {
                "changes_summary": "Updated learning outcomes to align with new curriculum standards",
                "content_json": {
                    "learning_outcomes": ["CLO1: Updated outcome 1", "CLO2: Updated outcome 2"],
                    "assessment_methods": {"midterm": 30, "final": 40, "assignments": 30},
                    "textbooks": ["Book 1", "Book 2"]
                },
                "effective_date": "2025-01-01",
                "expiry_date": "2025-12-31"
            }
        }
    }


class SyllabusVersionResponse(SyllabusVersionBase):
    """Schema for syllabus version response"""
    version_id: int
    syllabus_id: int
    version_number: int
    created_by: int
    created_date: datetime
    is_current: bool

    model_config = {"from_attributes": True}


class SyllabusVersionList(BaseModel):
    """Schema for syllabus version list"""
    total: int
    items: list[SyllabusVersionResponse]


class VersionCompare(BaseModel):
    """Schema for version comparison result"""
    version1_id: int
    version2_id: int
    version1_number: int
    version2_number: int
    differences: dict[str, Any] = Field(..., description="Differences between two versions")
    added_fields: list[str] = Field(default_factory=list, description="Fields added in version 2")
    removed_fields: list[str] = Field(default_factory=list, description="Fields removed in version 2")
    modified_fields: list[str] = Field(default_factory=list, description="Fields modified between versions")
