"""Semantic Diff API endpoints"""
from fastapi import APIRouter, HTTPException
from celery.result import AsyncResult

from app.schemas import (
    SemanticDiffRequest, SemanticDiffResponse, SemanticDiffResult,
    QuickDiffRequest, QuickDiffResult, TaskStatusResponse
)
from app.tasks import compare_syllabus_versions, quick_semantic_diff
from app.services.nlp import get_semantic_diff_service

router = APIRouter(prefix="/semantic", tags=["Semantic Analysis"])


@router.post("/diff", response_model=SemanticDiffResponse)
async def compare_versions(request: SemanticDiffRequest):
    """
    Compare two syllabus versions semantically.

    This endpoint submits an async task to analyze differences between
    two versions of a syllabus. It detects:
    - Added/removed/modified sections
    - Semantic significance of changes
    - AI-generated change summaries

    Requires content from both versions to be provided separately
    (fetch from main API first).
    """
    # Note: In real implementation, we'd fetch content from main API
    # For now, return error asking for content
    raise HTTPException(
        400,
        "Please use /diff/with-content endpoint and provide both version contents"
    )


@router.post("/diff/with-content", response_model=SemanticDiffResponse)
async def compare_versions_with_content(
    syllabus_id: int,
    version_old: int,
    version_new: int,
    old_content: dict,
    new_content: dict,
    sections: list[str] = None
):
    """
    Compare two syllabus versions with provided content.

    Args:
        syllabus_id: The syllabus ID
        version_old: Old version number
        version_new: New version number
        old_content: Dict with old version content by section
        new_content: Dict with new version content by section
        sections: Optional list of specific sections to compare
    """
    task = compare_syllabus_versions.delay(
        syllabus_id=syllabus_id,
        version_old=version_old,
        version_new=version_new,
        old_content=old_content,
        new_content=new_content,
        sections=sections
    )

    return SemanticDiffResponse(
        task_id=task.id,
        status="processing",
        message="Semantic diff started. Use /tasks/{task_id} to check status."
    )


@router.post("/diff/sync", response_model=SemanticDiffResult)
async def compare_versions_sync(
    syllabus_id: int,
    version_old: int,
    version_new: int,
    old_content: dict,
    new_content: dict,
    sections: list[str] = None
):
    """
    Synchronously compare two syllabus versions.

    Returns immediate results. Use async endpoint for large content.
    """
    service = get_semantic_diff_service()
    result = await service.compare_versions(
        syllabus_id=syllabus_id,
        version_old=version_old,
        version_new=version_new,
        old_content=old_content,
        new_content=new_content,
        sections=sections
    )
    return result


@router.post("/quick-diff", response_model=QuickDiffResult)
async def quick_diff(request: QuickDiffRequest):
    """
    Quick semantic comparison between two text strings.

    Useful for:
    - Comparing individual sections
    - Checking similarity between CLOs
    - Quick content validation
    """
    service = get_semantic_diff_service()
    result = await service.quick_diff(request.text_old, request.text_new)

    return QuickDiffResult(
        similarity_score=result["similarity_score"],
        significance=result["significance"],
        changes_detected=[],  # Quick diff doesn't detail changes
        summary=f"Texts are {result['similarity_score']*100:.1f}% similar"
    )


@router.get("/tasks/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    """Get status of a semantic diff task."""
    result = AsyncResult(task_id)

    if result.ready():
        if result.successful():
            return TaskStatusResponse(
                task_id=task_id,
                status="completed",
                task_type="semantic_diff",
                created_at=None,
                result=result.result
            )
        else:
            return TaskStatusResponse(
                task_id=task_id,
                status="failed",
                task_type="semantic_diff",
                created_at=None,
                error=str(result.result)
            )
    else:
        return TaskStatusResponse(
            task_id=task_id,
            status=result.status.lower(),
            task_type="semantic_diff",
            created_at=None
        )
