"""Course schemas for request/response validation"""
from pydantic import BaseModel, Field
from typing import Optional


class CourseBase(BaseModel):
    """Base course schema"""
    course_code: str = Field(..., min_length=2, max_length=20, description="Course code (e.g., 'CS101')")
    course_name: str = Field(..., min_length=1, max_length=255, description="Full course name")
    course_name_vn: Optional[str] = Field(None, max_length=255, description="Course name in Vietnamese")
    description: Optional[str] = Field(None, description="Course description")
    is_elective: bool = Field(False, description="Whether the course is elective")
    min_students: int = Field(10, ge=1, description="Minimum students to run the course")
    max_students: int = Field(50, ge=1, description="Maximum enrollment capacity")


class CourseCreate(CourseBase):
    """Schema for creating a new course"""
    department_id: Optional[int] = Field(None, description="Owning department ID")
    program_id: Optional[int] = Field(None, description="Associated academic program ID")

    model_config = {
        "json_schema_extra": {
            "example": {
                "course_code": "CS101",
                "course_name": "Introduction to Programming",
                "course_name_vn": "Nhập môn Lập trình",
                "description": "Fundamentals of programming using Python",
                "department_id": 1,
                "program_id": 1,
                "is_elective": False,
                "min_students": 15,
                "max_students": 40
            }
        }
    }


class CourseUpdate(BaseModel):
    """Schema for updating a course"""
    course_name: Optional[str] = Field(None, min_length=1, max_length=255)
    course_name_vn: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    department_id: Optional[int] = None
    program_id: Optional[int] = None
    is_elective: Optional[bool] = None
    min_students: Optional[int] = Field(None, ge=1)
    max_students: Optional[int] = Field(None, ge=1)
    is_active: Optional[bool] = None


class CourseResponse(CourseBase):
    """Schema for course response"""
    course_id: int
    department_id: Optional[int] = None
    program_id: Optional[int] = None
    is_active: bool

    model_config = {"from_attributes": True}


class CourseList(BaseModel):
    """Schema for paginated course list"""
    total: int
    page: int
    pageSize: int
    totalPages: int
    items: list[CourseResponse]
