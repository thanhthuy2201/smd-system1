"""Schemas for CLO-PLO checking"""
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class AlignmentLevel(str, Enum):
    STRONG = "strong"      # >= 0.85 similarity
    MODERATE = "moderate"  # >= 0.70 similarity
    WEAK = "weak"          # >= 0.50 similarity
    NONE = "none"          # < 0.50 similarity


class CLOInput(BaseModel):
    """Single CLO input"""
    index: int = Field(..., description="CLO number (1, 2, 3...)")
    text: str = Field(..., description="CLO description text")


class PLOInput(BaseModel):
    """Single PLO input"""
    index: int = Field(..., description="PLO number (1, 2, 3...)")
    text: str = Field(..., description="PLO description text")


class CLOPLOCheckRequest(BaseModel):
    """Request to check CLO-PLO alignment"""
    syllabus_id: int = Field(..., description="Syllabus ID from main system")
    program_id: int = Field(..., description="Program ID for PLO lookup")
    clos: list[CLOInput] = Field(..., description="List of Course Learning Outcomes")
    plos: Optional[list[PLOInput]] = Field(None, description="Optional PLO list (will fetch from DB if not provided)")

    class Config:
        json_schema_extra = {
            "example": {
                "syllabus_id": 1,
                "program_id": 1,
                "clos": [
                    {"index": 1, "text": "Understand fundamental programming concepts"},
                    {"index": 2, "text": "Write basic Python programs"},
                    {"index": 3, "text": "Apply problem-solving techniques"}
                ],
                "plos": [
                    {"index": 1, "text": "Apply knowledge of computing fundamentals"},
                    {"index": 2, "text": "Analyze complex computing problems"}
                ]
            }
        }


class CLOPLOMapping(BaseModel):
    """Single CLO to PLO mapping result"""
    clo_index: int
    clo_text: str
    plo_index: int
    plo_text: str
    similarity_score: float = Field(..., ge=0, le=1)
    alignment_level: AlignmentLevel


class CLOPLOCheckResult(BaseModel):
    """Result of CLO-PLO alignment check"""
    syllabus_id: int
    program_id: int
    total_clos: int
    total_plos: int
    mappings: list[CLOPLOMapping]
    coverage_score: float = Field(..., description="Percentage of CLOs with strong/moderate alignment")
    unmapped_clos: list[int] = Field(..., description="CLO indices with weak or no alignment")
    suggestions: list[str] = Field(..., description="AI-generated suggestions for improvement")


class CLOPLOCheckResponse(BaseModel):
    """API response for CLO-PLO check"""
    task_id: str
    status: str
    message: str
    result: Optional[CLOPLOCheckResult] = None


class SimilarCLORequest(BaseModel):
    """Request to find similar CLOs"""
    clo_text: str = Field(..., description="CLO text to find similar ones")
    top_k: int = Field(5, ge=1, le=20, description="Number of similar CLOs to return")
    department_id: Optional[int] = Field(None, description="Filter by department")


class SimilarCLOResult(BaseModel):
    """Similar CLO result"""
    syllabus_id: int
    course_code: str
    course_name: str
    clo_index: int
    clo_text: str
    similarity_score: float
