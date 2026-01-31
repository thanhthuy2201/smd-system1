"""User schemas for request/response validation"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from app.models.user import UserRole


class UserBase(BaseModel):
    """Base user schema"""
    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    email: EmailStr = Field(..., description="User email address")
    first_name: str = Field(..., min_length=1, max_length=100, description="First name")
    last_name: str = Field(..., min_length=1, max_length=100, description="Last name")
    role: UserRole = Field(..., description="User role in the system")
    department_id: Optional[int] = Field(None, description="Associated department ID")
    faculty_position: Optional[str] = Field(None, max_length=100, description="Academic position")
    phone: Optional[str] = Field(None, max_length=20, description="Contact phone number")


class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: str = Field(..., min_length=8, description="User password (min 8 characters)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "username": "lecturer01",
                "email": "lecturer01@university.edu.vn",
                "password": "securepassword123",
                "first_name": "Nguyen",
                "last_name": "Van A",
                "role": "Lecturer",
                "department_id": 1,
                "faculty_position": "Senior Lecturer",
                "phone": "0901234567"
            }
        }
    }


class UserUpdate(BaseModel):
    """Schema for updating a user"""
    email: Optional[EmailStr] = None
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    role: Optional[UserRole] = None
    department_id: Optional[int] = None
    faculty_position: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    """Schema for user response"""
    user_id: int
    is_active: bool
    last_login: Optional[datetime] = None
    created_date: datetime
    firebase_uid: Optional[str] = None

    model_config = {"from_attributes": True}


class UserList(BaseModel):
    """Schema for paginated user list"""
    total: int
    page: int
    pageSize: int
    totalPages: int
    items: list[UserResponse]


class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for token payload data"""
    user_id: Optional[int] = None


class LoginRequest(BaseModel):
    """Schema for login request"""
    username: str = Field(..., description="Username or email")
    password: str = Field(..., description="User password")

    model_config = {
        "json_schema_extra": {
            "example": {
                "username": "lecturer01",
                "password": "securepassword123"
            }
        }
    }
