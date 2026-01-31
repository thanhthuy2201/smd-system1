"""Schemas for Evaluation Templates and Criteria (FE04)"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from enum import Enum


class CriteriaCategoryEnum(str, Enum):
    CONTENT = "Content"
    FORMAT = "Format"
    COMPLIANCE = "Compliance"
    QUALITY = "Quality"


# ==================== PLO Mapping ====================

class CriteriaPLOMappingBase(BaseModel):
    program_id: int
    plo_code: str = Field(..., max_length=20, description="e.g., PLO1, PLO2")
    plo_description: Optional[str] = None


class CriteriaPLOMappingCreate(CriteriaPLOMappingBase):
    pass


class CriteriaPLOMappingResponse(CriteriaPLOMappingBase):
    mapping_id: int
    criteria_id: int
    program_name: Optional[str] = None

    class Config:
        from_attributes = True


# ==================== Evaluation Criteria ====================

class EvaluationCriteriaBase(BaseModel):
    name: str = Field(..., max_length=200)
    description: str
    category: CriteriaCategoryEnum
    weight: float = Field(..., ge=0, le=100, description="Percentage weight")
    max_score: int = Field(10, ge=1, le=100)
    passing_score: Optional[int] = None
    is_mandatory: bool = False
    display_order: int = 0


class EvaluationCriteriaCreate(EvaluationCriteriaBase):
    plo_mappings: Optional[list[CriteriaPLOMappingCreate]] = None


class EvaluationCriteriaUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    category: Optional[CriteriaCategoryEnum] = None
    weight: Optional[float] = Field(None, ge=0, le=100)
    max_score: Optional[int] = Field(None, ge=1, le=100)
    passing_score: Optional[int] = None
    is_mandatory: Optional[bool] = None
    display_order: Optional[int] = None


class EvaluationCriteriaResponse(EvaluationCriteriaBase):
    criteria_id: int
    template_id: int
    created_at: datetime
    plo_mappings: list[CriteriaPLOMappingResponse] = []

    class Config:
        from_attributes = True


# ==================== Template Program ====================

class TemplateProgramBase(BaseModel):
    program_id: int


class TemplateProgramResponse(TemplateProgramBase):
    id: int
    template_id: int
    program_name: Optional[str] = None
    program_code: Optional[str] = None

    class Config:
        from_attributes = True


# ==================== Evaluation Template ====================

class EvaluationTemplateBase(BaseModel):
    name: str = Field(..., max_length=200)
    description: Optional[str] = Field(None, max_length=1000)


class EvaluationTemplateCreate(EvaluationTemplateBase):
    is_default: bool = False
    program_ids: Optional[list[int]] = None
    criteria: Optional[list[EvaluationCriteriaCreate]] = None


class EvaluationTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None


class EvaluationTemplateResponse(EvaluationTemplateBase):
    template_id: int
    is_default: bool
    is_active: bool
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    criteria: list[EvaluationCriteriaResponse] = []
    programs: list[TemplateProgramResponse] = []

    class Config:
        from_attributes = True


class EvaluationTemplateListResponse(BaseModel):
    template_id: int
    name: str
    description: Optional[str] = None
    is_default: bool
    is_active: bool
    criteria_count: int = 0
    program_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== Validation ====================

class TemplateValidationResponse(BaseModel):
    is_valid: bool
    total_weight: float
    errors: list[str] = []
    warnings: list[str] = []
