"""Department schemas for request/response validation"""
from pydantic import BaseModel, Field
from typing import Optional


class DepartmentBase(BaseModel):
    """Base department schema"""
    dept_code: str = Field(..., min_length=2, max_length=10, description="Department code (e.g., 'CS')")
    dept_name: str = Field(..., min_length=1, max_length=255, description="Department full name")
    dept_name_vn: Optional[str] = Field(None, max_length=255, description="Department name in Vietnamese")
    email: Optional[str] = Field(None, max_length=100, description="Department contact email")
    phone: Optional[str] = Field(None, max_length=20, description="Department phone")
    office_location: Optional[str] = Field(None, max_length=255, description="Physical office location")
    established_year: Optional[int] = Field(None, ge=1900, le=2100, description="Year established")


class DepartmentCreate(DepartmentBase):
    """Schema for creating a new department"""
    dean_id: Optional[int] = Field(None, description="Department head/Dean user ID")

    model_config = {
        "json_schema_extra": {
            "example": {
                "dept_code": "CS",
                "dept_name": "Computer Science",
                "dept_name_vn": "Khoa Công nghệ Thông tin",
                "dean_id": 1,
                "email": "cs@university.edu.vn",
                "phone": "028-1234567",
                "office_location": "Building A, Room 301",
                "established_year": 2000
            }
        }
    }


class DepartmentUpdate(BaseModel):
    """Schema for updating a department"""
    dept_name: Optional[str] = Field(None, min_length=1, max_length=255)
    dept_name_vn: Optional[str] = Field(None, max_length=255)
    dean_id: Optional[int] = None
    email: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    office_location: Optional[str] = Field(None, max_length=255)
    established_year: Optional[int] = Field(None, ge=1900, le=2100)


class DepartmentResponse(DepartmentBase):
    """Schema for department response"""
    dept_id: int
    dean_id: Optional[int] = None

    model_config = {"from_attributes": True}


class DepartmentList(BaseModel):
    """Schema for paginated department list"""
    total: int
    page: int
    pageSize: int
    totalPages: int
    items: list[DepartmentResponse]
