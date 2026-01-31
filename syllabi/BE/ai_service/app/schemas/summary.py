"""Schemas for AI Summarization"""
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class SummaryLength(str, Enum):
    SHORT = "short"      # ~100 words
    MEDIUM = "medium"    # ~250 words
    DETAILED = "detailed"  # ~500 words


class SummaryLanguage(str, Enum):
    EN = "en"
    VI = "vi"
    BOTH = "both"


class SummarizeRequest(BaseModel):
    """Request to summarize a syllabus"""
    syllabus_id: int
    version_id: Optional[int] = Field(None, description="Specific version (latest if not provided)")
    length: SummaryLength = Field(SummaryLength.MEDIUM)
    language: SummaryLanguage = Field(SummaryLanguage.EN)
    include_sections: Optional[list[str]] = Field(
        None,
        description="Sections to include in summary"
    )
    target_audience: Optional[str] = Field(
        "student",
        description="Target audience: student, instructor, reviewer"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "syllabus_id": 1,
                "length": "medium",
                "language": "en",
                "target_audience": "student"
            }
        }


class SyllabusHighlight(BaseModel):
    """Key highlight from syllabus"""
    category: str  # prerequisites, skills, assessment, etc.
    content: str
    importance: str  # high, medium, low


class SummarizeResult(BaseModel):
    """Summarization result"""
    syllabus_id: int
    version_id: Optional[int]
    course_code: str
    course_name: str
    summary: str
    summary_vi: Optional[str] = None
    key_highlights: list[SyllabusHighlight]
    prerequisites_summary: Optional[str] = None
    learning_outcomes_summary: str
    assessment_summary: str
    recommended_for: list[str] = Field(..., description="Who should take this course")
    difficulty_level: Optional[str] = None
    estimated_workload: Optional[str] = None


class SummarizeResponse(BaseModel):
    """API response for summarization"""
    task_id: str
    status: str
    message: str
    result: Optional[SummarizeResult] = None


class KeywordExtractionRequest(BaseModel):
    """Request to extract keywords from syllabus"""
    syllabus_id: int
    top_k: int = Field(10, ge=1, le=50)
    include_phrases: bool = Field(True, description="Include multi-word phrases")


class Keyword(BaseModel):
    """Extracted keyword"""
    term: str
    score: float
    frequency: int
    category: Optional[str] = None  # topic, skill, tool, etc.


class KeywordExtractionResult(BaseModel):
    """Keyword extraction result"""
    syllabus_id: int
    keywords: list[Keyword]
    topics: list[str]
    skills: list[str]
    tools_technologies: list[str]
