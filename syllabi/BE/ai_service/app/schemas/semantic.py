"""Schemas for Semantic Diff"""
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class ChangeType(str, Enum):
    ADDED = "added"
    REMOVED = "removed"
    MODIFIED = "modified"
    UNCHANGED = "unchanged"


class ChangeSignificance(str, Enum):
    MAJOR = "major"      # Significant semantic change
    MINOR = "minor"      # Small refinement
    COSMETIC = "cosmetic"  # Formatting/wording only
    NONE = "none"


class SemanticDiffRequest(BaseModel):
    """Request to compare two syllabus versions"""
    syllabus_id: int
    version_id_old: int = Field(..., description="Previous version ID")
    version_id_new: int = Field(..., description="New version ID")
    sections: Optional[list[str]] = Field(
        None,
        description="Specific sections to compare (all if not provided)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "syllabus_id": 1,
                "version_id_old": 1,
                "version_id_new": 2,
                "sections": ["learning_outcomes", "assessment_methods"]
            }
        }


class SectionChange(BaseModel):
    """Change detected in a section"""
    section: str
    change_type: ChangeType
    significance: ChangeSignificance
    old_content: Optional[str] = None
    new_content: Optional[str] = None
    semantic_similarity: float = Field(..., ge=0, le=1)
    change_summary: str = Field(..., description="AI-generated summary of what changed")


class SemanticDiffResult(BaseModel):
    """Result of semantic comparison"""
    syllabus_id: int
    version_old: int
    version_new: int
    overall_similarity: float = Field(..., ge=0, le=1)
    overall_significance: ChangeSignificance
    section_changes: list[SectionChange]
    change_summary: str = Field(..., description="Overall AI-generated change summary")
    key_changes: list[str] = Field(..., description="Bullet points of key changes")
    impact_analysis: Optional[str] = Field(None, description="Potential impact of changes")


class SemanticDiffResponse(BaseModel):
    """API response for semantic diff"""
    task_id: str
    status: str
    message: str
    result: Optional[SemanticDiffResult] = None


class QuickDiffRequest(BaseModel):
    """Quick diff between two text contents"""
    text_old: str
    text_new: str
    context: Optional[str] = Field(None, description="Context for better analysis")


class QuickDiffResult(BaseModel):
    """Quick diff result"""
    similarity_score: float
    significance: ChangeSignificance
    changes_detected: list[str]
    summary: str
