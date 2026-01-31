"""Program schemas for request/response validation"""
from pydantic import BaseModel, Field
from typing import Optional
from app.models.program import DegreeType


class ProgramBase(BaseModel):
    """Base program schema"""
    program_code: str = Field(..., min_length=2, max_length=20, description="Program code (e.g., 'BSCS')")
    program_name: str = Field(..., min_length=1, max_length=255, description="Program full name")
    program_name_vn: Optional[str] = Field(None, max_length=255, description="Program name in Vietnamese")
    degree_type: DegreeType = Field(..., description="Type of degree")
    duration_years: int = Field(4, ge=1, le=10, description="Program duration in years")
    total_credits: int = Field(..., ge=1, description="Credits required for completion")
    description: Optional[str] = Field(None, description="Program description")


class ProgramCreate(ProgramBase):
    """Schema for creating a new program"""
    department_id: Optional[int] = Field(None, description="Administering department ID")
    coordinator_id: Optional[int] = Field(None, description="Program coordinator user ID")

    model_config = {
        "json_schema_extra": {
            "example": {
                "program_code": "BSCS",
                "program_name": "Bachelor of Science in Computer Science",
                "program_name_vn": "Cử nhân Khoa học Máy tính",
                "degree_type": "Bachelor",
                "duration_years": 4,
                "total_credits": 140,
                "department_id": 1,
                "coordinator_id": 2,
                "description": "A comprehensive program covering software engineering, algorithms, and systems."
            }
        }
    }


class ProgramUpdate(BaseModel):
    """Schema for updating a program"""
    program_name: Optional[str] = Field(None, min_length=1, max_length=255)
    program_name_vn: Optional[str] = Field(None, max_length=255)
    degree_type: Optional[DegreeType] = None
    duration_years: Optional[int] = Field(None, ge=1, le=10)
    total_credits: Optional[int] = Field(None, ge=1)
    department_id: Optional[int] = None
    coordinator_id: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ProgramResponse(ProgramBase):
    """Schema for program response"""
    program_id: int
    department_id: Optional[int] = None
    coordinator_id: Optional[int] = None
    is_active: bool

    model_config = {"from_attributes": True}


class ProgramList(BaseModel):
    """Schema for paginated program list"""
    total: int
    page: int
    pageSize: int
    totalPages: int
    items: list[ProgramResponse]
