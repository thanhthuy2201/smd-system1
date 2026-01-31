"""Schemas for Program Learning Outcomes (PLO)"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PLOBase(BaseModel):
    code: str = Field(..., max_length=20, description="PLO code, e.g., PLO1, PLO2")
    description: str = Field(..., min_length=10, description="PLO description")
    category: Optional[str] = Field(None, max_length=100, description="Category: Knowledge, Skills, Attitudes")
    display_order: int = Field(0, ge=0)
    is_active: bool = True


class PLOCreate(PLOBase):
    pass


class PLOUpdate(BaseModel):
    code: Optional[str] = Field(None, max_length=20)
    description: Optional[str] = Field(None, min_length=10)
    category: Optional[str] = Field(None, max_length=100)
    display_order: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class PLOResponse(PLOBase):
    plo_id: int
    program_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PLOListResponse(BaseModel):
    total: int
    items: list[PLOResponse]
