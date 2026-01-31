"""Syllabus schemas for request/response validation"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.syllabus import SyllabusStatus


class SyllabusBase(BaseModel):
    """Base syllabus schema"""
    course_id: int = Field(..., description="Associated course ID")
    academic_year: str = Field(..., min_length=9, max_length=9, pattern=r"^\d{4}-\d{4}$", description="Academic year (e.g., '2024-2025')")
    semester: str = Field(..., max_length=20, description="Semester (Fall, Spring, Summer)")
    credits: int = Field(..., ge=1, description="Number of credits")
    total_hours: int = Field(..., ge=1, description="Total contact hours")
    learning_outcomes: str = Field(..., description="Course learning outcomes (CLO)")
    assessment_methods: str = Field(..., description="Grading breakdown and assessment methods")
    textbooks: Optional[str] = Field(None, description="Required and recommended textbooks")
    teaching_methods: Optional[str] = Field(None, description="Instructional approaches")
    prerequisites: Optional[str] = Field(None, description="Course prerequisites")
    materials: Optional[str] = Field(None, description="Additional learning materials")


class SyllabusCreate(SyllabusBase):
    """Schema for creating a new syllabus"""

    model_config = {
        "json_schema_extra": {
            "example": {
                "course_id": 1,
                "academic_year": "2024-2025",
                "semester": "Fall",
                "credits": 3,
                "total_hours": 45,
                "learning_outcomes": "CLO1: Understand programming fundamentals\nCLO2: Apply problem-solving techniques\nCLO3: Write clean, maintainable code",
                "assessment_methods": "Midterm Exam: 30%\nFinal Exam: 40%\nAssignments: 20%\nParticipation: 10%",
                "textbooks": "1. Introduction to Algorithms (CLRS)\n2. Clean Code by Robert Martin",
                "teaching_methods": "Lectures, Lab sessions, Group projects",
                "prerequisites": "None",
                "materials": "Online resources, Video tutorials"
            }
        }
    }


class SyllabusUpdate(BaseModel):
    """Schema for updating a syllabus"""
    academic_year: Optional[str] = Field(None, min_length=9, max_length=9, pattern=r"^\d{4}-\d{4}$")
    semester: Optional[str] = Field(None, max_length=20)
    credits: Optional[int] = Field(None, ge=1)
    total_hours: Optional[int] = Field(None, ge=1)
    learning_outcomes: Optional[str] = None
    assessment_methods: Optional[str] = None
    textbooks: Optional[str] = None
    teaching_methods: Optional[str] = None
    prerequisites: Optional[str] = None
    materials: Optional[str] = None


class SyllabusResponse(SyllabusBase):
    """Schema for syllabus response"""
    syllabus_id: int
    version_id: Optional[int] = None
    created_by: int
    created_date: datetime
    status: SyllabusStatus
    # File info
    original_file_name: Optional[str] = None
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    file_type: Optional[str] = None

    model_config = {"from_attributes": True}


class SyllabusList(BaseModel):
    """Schema for paginated syllabus list"""
    total: int
    page: int
    pageSize: int
    totalPages: int
    items: list[SyllabusResponse]


class SyllabusSearch(BaseModel):
    """Schema for syllabus search parameters"""
    course_code: Optional[str] = Field(None, description="Filter by course code")
    course_name: Optional[str] = Field(None, description="Filter by course name (partial match)")
    academic_year: Optional[str] = Field(None, description="Filter by academic year")
    semester: Optional[str] = Field(None, description="Filter by semester")
    department_id: Optional[int] = Field(None, description="Filter by department")
    status: Optional[SyllabusStatus] = Field(None, description="Filter by status")
    created_by: Optional[int] = Field(None, description="Filter by creator")
